{ EventEmitter } = require 'events'
{ Builder:DefaultBuilder } = require 'asyncxml'
{ schema, self_closing } = require './schema'
{ doctype } = require './doctype'
{ aliases } = require './alias'

EVENTS = [
    'new','add'
    'show', 'hide'
    'attr','text', 'raw'
    'remove', 'replace'
    'data','close','end'
]


##
# i made these function name short ,
# because its a little bit faster than with long names

pp = (proto, name) -> # populate tag with specific child tag genertor
    proto[    name] = -> @tag.apply  this, [name].concat arguments...
    proto["$"+name] = -> @$tag.apply this, [name].concat arguments...

ff = (proto, tags) -> # fill with tags
    for tagname in tags
        pp proto, tagname if tagname
    return


class Template extends EventEmitter
    constructor: (opts = {}, template) ->
        # options
        [template, opts] = [opts, {}] if typeof opts is 'function'
        view = null
        if typeof(opts.view) is not "undefined"
            view = opts.view
            opts.view = null
        # defaults
        opts.encoding ?= 'utf-8'
        opts.doctype ?= off
        opts.end ?= on
        # schema
        schema_input = opts.schema
        # resolve schema name input
        s = aliases[schema_input] or schema_input or 'xml'
        # load self closing schema
        opts.self_closing = self_closing[s]?(opts)
        # load tag list (xml schema)
        opts.schema = schema[s]?(opts).split(' ')

        # get builder class from options
        Builder = opts.Builder ? DefaultBuilder
        # create new builder class to extend it with a schema
        class ExtendedBuilder extends Builder
        # create tag method shortcuts defined by schema
        ff ExtendedBuilder::, opts.schema
        # instantiate
        @xml = new ExtendedBuilder opts
        @xml.template = this
        @xml.view     = view 
        # override query
        old_query = @xml.query
        @xml.query = (type, tag, key) ->
            if type is 'tag'
                key.xml ? key
            else
                old_query.call(this, type, tag, key)

        # tag class is defined by builder
        Tag = @xml.Tag
        # create new tag class to extend it with a schema
        class ExtendedTag extends Tag
        # create tag method shortcuts defined by schema
        ff ExtendedTag::, opts.schema
        # write it back so builder can use it to instantiate a new tag
        @xml.Tag = @xml.opts.Tag = ExtendedTag

        # add self closing tag behavior
        # some of the html tags dont need a closing tag
        @xml.register 'end', (tag, next) ->
            unless opts.self_closing is on or opts.self_closing.match tag.name
                tag.isempty = no
            next(tag)

        # pipe events through
        EVENTS.forEach (event) =>
            @xml.on event, (args...) =>
                @emit event, args...

        ##
        # start the templating process after user listened for events
        process.nextTick =>
            # load doctype if enabled
            if opts.doctype is on
                opts.doctype = 'html'
            # resolve doctype name input
            d = aliases[opts.doctype] or opts.doctype
            # write doctype
            if opts.doctype and (dt = doctype[d]?(opts))
                dt += "\n" if opts.pretty
                @xml.emit 'data', @xml, dt
            # templating process ...
            if typeof template is 'function'
                template.call @xml
                @end() if opts.end
            else
                @end(template)

    toString: ->
        "[object Template]"

    register: =>
        @xml.register arguments...

    remove: =>
        @xml.remove arguments...

    end: =>
        @xml.end arguments...

    ready: =>
        @xml.ready arguments...

    show: =>
        @xml.show arguments...

    hide: =>
        @xml.hide arguments...


# exports

Template.schema = schema
Template.doctype = doctype
Template.self_closing = self_closing
Template.aliases = aliases
module.exports = Template
