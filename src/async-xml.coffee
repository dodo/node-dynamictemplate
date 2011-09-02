
util = require('util')
util.orginspect = util.inspect
util.inspect = require('eyes').inspector(stream: null, hexy:{format:'fours'})
{ EventEmitter } = require 'events'


indent = ({level, opts:{pretty}}) ->
    pretty = "  " if pretty is on
    output = ""
    for i in [0...level]
        output += pretty
    return output


new_attrs = (attrs) ->
    strattrs = ( "#{k}=\"#{v}\"" for k, v of attrs )
    strattrs.unshift('') if strattrs.length
    strattrs.join(' ')

new_tag = (name, opts, ff) ->
    tag = new Tag name, opts
    tag.self.on 'data',pipe = (data) =>
        @emit 'data', "#{data}"
    tag.self.once 'end', () ->
        tag.self.removeListener 'data', pipe
    return tag


class Tag extends EventEmitter
    constructor: (@name, {@level, @opts}) ->
        @attrs.self = this
        @attrs.end = () => @attrs().end()
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
            @emit 'data', "#{indent this}#{@headers}/>"
        else
            @emit 'data', "#{indent this}</#{@name}>"
        @emit 'end'


class Builder extends EventEmitter
    constructor: (@opts = {}) ->
        @opts.pretty ?= off
        @level = @opts.level ? 0

    tag: (name) =>
        new_tag.call this, name, opts:@opts, level:@level

    end: () =>
        @emit 'end'

    # classes
    Tag:Tag




#########################################################################


xml = new Builder pretty:'·'

xml.on 'data', console.log

a = xml.tag('test') version:3, alt:"info", border:0
a.tag('middle')(center:yes).end()
b = a.tag('foo')(bar:'moo', border:0)


b.tag('lol').end()
c = b.tag('bar') x:2

c.end()
b.end()
a.end()
xml.end()

# html template engine

# div = (args...) -> tag('div') args...
#
#
# d = div class:"foo",  ->
#     # do smth
#
# console.log d

