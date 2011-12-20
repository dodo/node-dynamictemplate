{ EventEmitter } = require 'events'
{ Builder:DefaultBuilder } = require 'asyncxml'
EVENTS = ['new','add','attr','attr:remove','text','remove','data','close','end']

schema =
    'xml'  : -> "" # allready includes tag
    'html' : ->
        "#{do schema.xml } #{do schema['html-obsolete']} iframe label legend " +
        "#{do self_closing.html} html body div ul li a b body button colgroup "+
        "dfn div dl dt em dd del form h1 h2 h3 h4 h5 h6 head hgroup html ins " +
        "li map i mark menu meter nav noscript object ol optgroup option p "   +
        "pre script select small span strong style sub sup table tbody tfoot " +
        "td textarea th thead title tr u ul"
    'html5': ->
        "#{do schema.html} #{do self_closing.html5} section article video q s "+
        "audio abbr address aside bdi bdo blockquote canvas caption cite code "+
        "datalist details fieldset figcaption figure footer header kbd output "+
        "progress rp rt ruby samp summary time"
    'strict': -> # xhtml1
        "#{do schema.html}" # FIXME
    'xhtml1.1': ->
        "#{do schema.xhtml}" # FIXME
    'xhtml': ->
        "#{do schema.xhtml}" # FIXME
    'frameset': ->
        "#{do schema.xhtml}" # FIXME
    'transitional': ->
        "#{do schema.xhtml}" # FIXME
    'mobile': ->
        "#{do schema.xhtml}" # FIXME
    'html-ce': ->
        "#{do schema.xhtml}" # FIXME
    'html-obsolete': ->
        "applet acronym bgsound dir frameset noframes isindex listing nextid " +
        "noembed plaintext rb strike xmp big blink center font marquee nobr "  +
        "multicol spacer tt"

# Valid self-closing HTML 5 elements.
# set true when all tags are self closing
self_closing =
    'xml'  : -> on
    'html' : -> "area br col embed hr img input link meta param"
    'html5': -> "#{do self_closing.html} base command keygen source track wbr"
    'mobile' : ->  "#{do self_closing.xhtml}"
    'html-ce': ->  "#{do self_closing.xhtml}"
    'strict'  : -> "#{do self_closing.xhtml}"
    'xhtml1.1': -> "#{do self_closing.xhtml}"
    'xhtml'   : -> "#{do self_closing.xhtml}"
    'frameset': -> "#{do self_closing.xhtml}"
    'transitional': -> "#{do self_closing.xhtml}"

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
