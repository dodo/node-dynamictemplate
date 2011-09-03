{ EventEmitter } = require 'events'

# helper

indent = ({level, opts:{pretty}}) ->
    return "" unless pretty
    pretty = "  " if pretty is on
    output = ""
    for i in [0...level]
        output += pretty
    return output


new_attrs = (attrs = {}) ->
    strattrs = for k, v of attrs
        if v?
            v = "\"#{v}\"" unless typeof v is 'number'
            "#{k}=#{v}"
        else "#{k}"
    strattrs.unshift '' if strattrs.length
    strattrs.join ' '

# main logic

new_tag = (name, opts) ->
    buffer = []
    @pending.push tag = new @Tag name, opts
    tag.self.Tag = @Tag
    tag.self.on 'data', pipe = (data) =>
        if @pending[0] is tag
            @emit 'data', data
        else
            buffer.push data

    tag.self.on 'end', on_end = (data) =>
        buffer.push data unless data is undefined
        if @pending[0] is tag
            if tag.self.pending.length
                (pender = tag.self.pending[0].self).once 'end', =>
                    on_end()
                    @emit 'end' unless @pending.length
            else
                if tag.self.buffer.length
                    buffer = buffer.concat tag.self.buffer
                    tag.self.buffer = []
                @pending = @pending.slice(1)
                tag.self.removeListener 'data', pipe
                tag.self.removeListener 'end', on_end
                for data in buffer
                    @emit 'data', data
        else
            for known, i in @pending
                if tag is known
                    @pending = @pending.slice(0,i).concat @pending.slice i+1
                    before = @pending[i-1].self
                    before.buffer = before.buffer.concat buffer
                    tag.self.removeListener 'data', pipe
                    tag.self.removeListener 'end', on_end
                    return
            throw new Error("this shouldn't happen D:")
    return tag


sync_tag = (name) ->
    tag = @tag(name)
    get_attrs = (attrs, children) ->
        [children, attrs] = [attrs, {}] if typeof attrs is 'function'
        if typeof children is 'function'
            return tag attrs, ->
                children.call this
                tag.self.end()
        else
            return tag attrs, ->
                @text children
                tag.self.end()
    get_attrs.self = tag.self
    get_attrs.end = get_attrs

# classes

class Tag extends EventEmitter
    constructor: (@name, {@level, @opts}) ->
        @Tag = Tag
        @buffer = [] # after this tag all children emitted data
        @pending = [] # no open child tag
        @attrs.self = this
        @attrs.end = (args...) => @attrs(args...).end()
        return @attrs

    attrs: (attrs, children) =>
        [children, attrs] = [attrs, {}] if typeof attrs is 'function'
        @headers = "<#{@name}#{new_attrs attrs}"
        if typeof children is 'function'
            process.nextTick =>
                children.call this
        else if children isnt undefined
            @text children
        return this

    tag: (name) =>
        if @headers
            @emit 'data', "#{indent this}#{@headers}>"
            delete @headers
        new_tag.call this, name, opts:@opts, level:@level+1

    $tag: (name) =>
        sync_tag.call this, name

    text: (content, {force, escape} = {}) =>
        return unless content or force
        if escape
            content = String(content)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')

        if @headers
            @emit 'data', "#{indent this}#{@headers}>"
            delete @headers
        @emit 'data', "#{indent this}#{content}" if content

    end: () =>
        if @headers
            data = "#{indent this}#{@headers}/>"
        else
            data = "#{indent this}</#{@name}>"
        @emit 'end', data


class Builder extends EventEmitter
    constructor: (@opts = {}) ->
        @Tag = Tag
        @buffer = [] # for child output
        @pending = [] # no open child tag
        @opts.pretty ?= off
        @level = @opts.level ? 0

    tag: (name) =>
        new_tag.call this, name, opts:@opts, level:@level

    $tag: (name) =>
        sync_tag.call this, name

    end: (data) =>
        if @pending.length
            @pending[0].self.once 'end', => @end(data)
        else
            @emit 'data', "#{indent this}#{data}" if data
            @emit 'end'


# exports

module.exports = { Tag, Builder }



