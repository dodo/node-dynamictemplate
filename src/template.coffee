{ EventEmitter } = require 'events'
{ schema, self_closing } = require './schema'
{ doctype } = require './doctype'
{ aliases } = require './alias'
{ lookup, clear } = require './cache'

EVENTS = [
    'new','add'
    'show', 'hide'
    'attr','text', 'raw'
    'remove', 'replace'
    'data','close','end'
]


class Template extends EventEmitter
    constructor: (opts = {}, template) ->
        # options
        [template, opts] = [opts, {}] if typeof opts is 'function'
        # defaults
        opts.encoding ?= 'utf-8'
        opts.doctype ?= off
        opts.end ?= on
        # schema
        opts._schema = opts.schema
        # resolve schema name input
        s = aliases[opts._schema] or opts._schema or 'xml'
        # load self closing schema
        opts.self_closing = self_closing[s]?(opts)
        # load tag list (xml schema)
        opts.schema = schema[s]?(opts).split(' ')
        # instantiate
        # lookup the cache to get a builder (and Tag class) patched with schema
        @xml = lookup opts
        @xml.template = this
        # override query
        old_query = @xml.query
        @xml.query = (type, tag, key) ->
            if type is 'tag'
                key.xml ? key
            else
                old_query.call(this, type, tag, key)

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
        @run = @run.bind(this, template, opts)
        return if opts.run is off
        process.nextTick @run

    run: (template, opts) ->
        # load doctype if enabled
        if opts.doctype is on
            opts.doctype = opts._schema or 'html'
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
        @xml.template = null
        @xml = null

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
Template.clearCache = clear
module.exports = Template
