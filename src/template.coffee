{ EventEmitter } = require 'events'
{ Tag, Builder } = require './xml'


schema =
    'xml'  : -> "" # allready includes tag
    'html' : -> "#{do schema.xml } html body div ul li a"
    'html5': -> "#{do schema.html} section article video audio"



fill_with_tags = (tag, tags) ->
    tags.split(' ').forEach (name) ->
        return unless name
        tag[    name] = (args...) -> tag.tag( name).call tag, args...
        tag["$"+name] = (args...) -> tag.$tag(name).call tag, args...

        tag[    name].end = (args...) -> tag.tag( name).end args...
        tag["$"+name].end = (args...) -> tag.$tag(name).end args...

        tag["$"+name].self = tag[name].self = tag

    return tag


class Template extends EventEmitter
    constructor: (opts = {}, template) ->
        [template, opts] = [opts, {}] if typeof opts is 'function'
        opts.schema = schema[opts.schema ? 'xml']?()
        opts.end ?= on

        ExtendedBuilder = ->
            fill_with_tags this, opts.schema
            b = Builder.apply this, arguments
            b
        for name, method of Builder::
            ExtendedBuilder::[name] = method

        @xml = new ExtendedBuilder
        @end = @xml.end
        Tag = @xml.Tag
        @xml.Tag = ->
            fill_with_tags this, opts.schema
            t = Tag.apply this, arguments
            t
        for name, method of Tag::
            @xml.Tag::[name] = method

        @xml.on 'data', (args...) =>
            @emit 'data', args...
        @xml.on 'end', (args...) =>
            @emit 'end', args...

        process.nextTick =>
            if typeof template is 'function'
                template.call @xml
                @end() if opts.end
            else
                @xml.end(template)


# exports

Template.schema = schema
module.exports = Template
