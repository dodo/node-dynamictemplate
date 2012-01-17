{ EventEmitter } = require 'events'
{ Builder:DefaultBuilder } = require 'asyncxml'
{ schema, self_closing } = require './schema'

EVENTS = [
    'new','add'
    'show', 'hide'
    'attr','attr:remove','text', 'raw'
    'remove', 'replace'
    'data','close','end'
]

doctype =
    'xml': ({encoding}) -> "<?xml version=\"1.0\" encoding=\"#{encoding}\" ?>"
    'html' : -> "<!DOCTYPE html>"
    'html5': -> "#{do doctype.html}"
    'mobile' : ->
        '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD '+
        'XHTML Mobile 1.2//EN" '+
        '"http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">'
    'html-ce': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Transitional//EN" '+
        '"ce-html-1.0-transitional.dtd">'
    'strict'  : ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Strict//EN" '+
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
    'xhtml1.1': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.1//EN" '+
        '"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
    'xhtml'   : ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML Basic 1.1//EN" '+
        '"http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">'
    'frameset': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Frameset//EN" '+
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">'
    'transitional': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Transitional//EN" '+
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

# schema aliases
aliases =
    'default':'xml'
    '5':'html5'
    5:'html5'
    'ce':'html-ce'
    '1.1':'xhtml1.1'
    'html11':'xhtml1.1'
    'basic':'xhtml'
    'xhtml1':'xhtml'
    'xhtml-basic':'xhtml'
    'xhtml-strict':'strict'
    'xhtml-mobile':'mobile'
    'xhtml-frameset':'frameset'
    'xhtml-trasitional':'transitional'

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

        # tag class is defined by builder
        Tag = @xml.Tag
        # create new tag class to extend it with a schema
        class ExtendedTag extends Tag
        # create tag method shortcuts defined by schema
        ff ExtendedTag::, opts.schema
        # write it back so builder can use it to instantiate a new tag
        @xml.Tag = @xml.opts.Tag = ExtendedTag

        ## FIXME replace this with new checker middleware api when possible
        # add self closing tag behavior
        # some of the html tags dont need a closing tag
        end_tag = Tag::end
        @xml.Tag::end = ->
            if opts.self_closing is on or opts.self_closing.match @name
                end_tag.call this, arguments...
            else
                @text("", force:yes) if @isempty
                end_tag.call this, arguments...

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
                @xml.emit 'data', dt
            # templating process ...
            if typeof template is 'function'
                template.call @xml
                @end() if opts.end
            else
                @end(template)

    register: =>
        @xml.register arguments...

    end: =>
        @xml.end arguments...

    ready: (callback) =>
        if @xml.closed is yes
            callback()
        else
            @xml.once('end', callback)


# exports

Template.schema = schema
Template.doctype = doctype
module.exports = Template
Template.self_closing = self_closing
