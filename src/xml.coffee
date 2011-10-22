{ EventEmitter } = require 'events'
{ deep_merge, indent, new_attrs } = require './util'


new_tag = (name, attrs, children, opts) ->
    unless typeof attrs is 'object'
        [opts, children, attrs] = [children, attrs, {}]
    else
        # if attrs is an object and you want to use opts, make children null
        attrs ?= {}
    opts ?= {}
    buffer = []
    opts.level = @level+1
    opts = deep_merge @opts, opts # possibility to overwrite existing opts, like pretty
    @pending.push tag = new @Tag name, attrs, children, opts

    tag.up = (opts = {}) => # set parent
        opts.end ?= true
        tag.end.apply tag, arguments if opts.end
        this

    tag.on 'data', pipe = (data) =>
        if @pending[0] is tag
            @emit 'data', data
        else
            buffer.push data

    tag.on 'end', on_end = (data) =>
        buffer.push data unless data is undefined
        if @pending[0] is tag
            if tag.pending.length
                (pender = tag.pending[0]).once 'end', =>
                    on_end()
                    @emit 'end' unless @pending.length
            else
                if tag.buffer.length
                    buffer = buffer.concat tag.buffer
                    tag.buffer = []
                @pending = @pending.slice(1)
                tag.removeListener 'data', pipe
                tag.removeListener 'end', on_end
                for data in buffer
                    @emit 'data', data
        else
            for known, i in @pending
                if tag is known
                    @pending = @pending.slice(0,i).concat @pending.slice i+1
                    before = @pending[i-1]
                    before.buffer = before.buffer.concat buffer
                    tag.removeListener 'data', pipe.data
                    tag.removeListener 'end', on_end
                    for event in EVENTS
                        tag.removeListener event, pipe[event]
                    return
            throw new Error("this shouldn't happen D:")
    @emit 'add', tag
    return tag


sync_tag = (name, attrs, children, opts) ->
    unless typeof attrs is 'object'
        [opts, children, attrs] = [children, attrs, {}]
    else
        attrs ?= {}
    opts ?= {}
    self_ending_children_scope = ->
        @children children, direct:yes
        @end()
    @tag.call this, name, attrs, self_ending_children_scope, opts


class Tag extends EventEmitter
    constructor: (@name, @attrs, children, @opts) ->
        unless typeof attrs is 'object'
            [@opts, children, @attrs] = [children, @attrs, {}]
        else
            # if attrs is an object and you want to use opts, make children null
            @attrs ?= {}
            @opts ?= {}
        @level = @opts.level
        @Tag = @opts.Tag or Tag # inherit (maybe) extended tag class
        @buffer = [] # after this tag all children emitted data
        @pending = [] # no open child tag
        @closed = false
        @content = ""
        @headers = "<#{@name}#{new_attrs @attrs}"
        @children children

    $tag: =>
        # sync tag, - same as normal tag, but closes it automaticly
        sync_tag.apply this, arguments

    tag: =>
        if @headers
            @emit 'data', "#{indent this}#{@headers}>"
            delete @headers
        new_tag.apply this, arguments

    attr: (key, value) =>
        if typeof key is 'string'
            return @attrs[key] if @attrs[key] and not value
            @attrs[key] = value
            @emit 'attr', this, key, value
        else
            for own k, v of key
                @attrs[k] = v
                @emit 'attr', this, k, v
        @headers = "<#{@name}#{new_attrs @attrs}" if @headers
        this

    removeAttr: (key) =>
        if typeof key is 'string'
            delete @attrs[key]
            @emit 'attr:remove', this, key
        else
            for own k, v of key
                delete @attr[key]
                @emit 'attr:remove', this, key
        @headers = "<#{@name}#{new_attrs @attrs}" if @headers
        this

    children: (children, {direct} = {}) ->
        if typeof children is 'function'
            if direct
                children.call this
            else
                process.nextTick =>
                    children.call this
        else if children isnt undefined
            @text children
        this

    text: (content, opts = {}) =>
        return @content unless content? or opts.force
        @write(content, opts)
        @content = content
        @emit 'text', this, content
        this

    write: (content, {escape} = {}) =>
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
        @content += content
        true

    up: () -> null # this node has no parent

    end: () =>
        @closed = yes
        if @headers
            data = "#{indent this}#{@headers}/>"
            @closed = 'self'
        else
            data = "#{indent this}</#{@name}>"
        @emit 'end', data
        this

    toString: =>
        "<#{@name}#{new_attrs @attrs}" +
            if @closed is 'self'
                "/>"
            else if @closed
                ">#{@content}</#{@name}>" # FIXME children ?


class Builder extends EventEmitter
    constructor: (@opts = {}) ->
        @buffer = [] # for child output
        @pending = [] # no open child tag
        @opts.Tag ?= Tag
        @opts.pretty ?= off
        @level = @opts.level ? 0
        @Tag = @opts.Tag or Tag

    tag: =>
        @level--
        tag = new_tag.apply this, arguments
        @level++
        tag

    $tag: (args...) =>
        # sync tag, - same as normal tag, but closes it automaticly
        sync_tag.apply this, arguments

    end: (data) =>
        if @pending.length
            @pending[0].once 'end', => @end(data)
        else
            @emit 'data', "#{indent this}#{data}" if data
            @emit 'end'
        this


# exports

module.exports = { Tag, Builder }



