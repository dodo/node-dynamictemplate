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
    tag.up = => # set parent
        tag.end.apply tag, arguments
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
                    tag.removeListener 'data', pipe
                    tag.removeListener 'end', on_end
                    return
            throw new Error("this shouldn't happen D:")
    return tag


execute_children_scope = (children, {direct} = {}) ->
        if typeof children is 'function'
            if direct
                children.call this
            else
                process.nextTick =>
                    children.call this
        else if children isnt undefined
            @text children


sync_tag = (name, attrs, children, opts) ->
    unless typeof attrs is 'object'
        [opts, children, attrs] = [children, attrs, {}]
    else
        attrs ?= {}
    opts ?= {}
    self_ending_children_scope = ->
        execute_children_scope.call this, children, direct:yes
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
        @headers = "<#{@name}#{new_attrs @attrs}"
        execute_children_scope.call this, children

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
        else
            @attrs[k] = v for own k, v of key
        @headers = "<#{@name}#{new_attrs @attrs}" if @headers
        this

    text: (content, {force, escape} = {}) =>
        return unless content or force
        if escape
            content = String(content)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
        this

        if @headers
            @emit 'data', "#{indent this}#{@headers}>"
            delete @headers
        @emit 'data', "#{indent this}#{content}" if content
        this

    up: -> null # this node has no parent

    end: () =>
        if @headers
            data = "#{indent this}#{@headers}/>"
        else
            data = "#{indent this}</#{@name}>"
        @emit 'end', data
        this


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



