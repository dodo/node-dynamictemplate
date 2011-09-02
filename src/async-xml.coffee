uglify = require 'uglify-js'

# CoffeeScript-generated JavaScript may contain anyone of these; but when we
# take a function to string form to manipulate it, and then recreate it through
# the `Function()` constructor, it loses access to its parent scope and
# consequently to any helpers it might need. So we need to reintroduce these
# inside any "rewritten" function.
coffeescript_helpers = """
  var __slice = Array.prototype.slice;
  var __hasProp = Object.prototype.hasOwnProperty;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  var __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype;
    return child; };
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    } return -1; };
"""


skeleton = ->
    { EventEmitter } = require 'events'

    # helper

    indent = ({level, opts:{pretty}}) ->
        return "" unless pretty
        pretty = "  " if pretty is on
        output = ""
        for i in [0...level]
            output += pretty
        return output


    new_attrs = (attrs) ->
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
        @pending.push tag = new Tag name, opts
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

    # classes

    class Tag extends EventEmitter
        constructor: (@name, {@level, @opts}) ->
            @buffer = [] # after this tag all children emitted data
            @pending = [] # no open child tag
            @attrs.self = this
            @attrs.end = (attrs) => @attrs(attrs).end()
            return @attrs

        attrs: (attrs = {}) =>
            @headers = "<#{@name}#{new_attrs attrs}"
            return this

        tag: (name) =>
            if @headers
                @emit 'data', "#{indent this}#{@headers}>"
                delete @headers
            new_tag.call this, name, opts:@opts, level:@level+1


        end: () =>
            if @headers
                data = "#{indent this}#{@headers}/>"
            else
                data = "#{indent this}</#{@name}>"
            @emit 'end', data


    class Builder extends EventEmitter
        constructor: (@opts = {}) ->
            @buffer = [] # for child output
            @pending = [] # no open child tag
            @opts.pretty ?= off
            @level = @opts.level ? 0

        tag: (name) =>
            new_tag.call this, name, opts:@opts, level:@level

        end: () =>
            @emit 'end' unless @pending.length


    # exports

    module?.exports? { Tag, Builder }
    null


# load skeleton code as module
module.exports = (exports) -> module.exports = exports
do skeleton # bootstrap

# Stringify the skeleton and unwrap it from its enclosing `function(){}`, then
# add the CoffeeScript helpers.
module.exports.skeleton = uglify coffeescript_helpers + String(skeleton)
    .replace(/function\s*\(.*\)\s*\{/, '')
    .replace(/return null;\s*\}$/, '')

