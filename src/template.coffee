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
        [template, opts] = [opts, {}] if typeof opts is 'function'
        opts.encoding ?= 'utf-8'
        opts.doctype ?= off
        schema_input = opts.schema
        s = aliases[schema_input] or schema_input or 'xml'
        opts.self_closing = self_closing[s]?(opts)
        opts.schema = schema[s]?(opts).split(' ')
        opts.end ?= on
        # get builder class from options
        Builder = opts.Builder ? DefaultBuilder

        class ExtendedBuilder extends Builder
        ff ExtendedBuilder::, opts.schema

        @xml = new ExtendedBuilder opts
        @end = @xml.end
        Tag = @xml.Tag
        class ExtendedTag extends Tag
        ff ExtendedTag::, opts.schema
        @xml.Tag = @xml.opts.Tag = ExtendedTag

        end_tag = Tag::end
        @xml.Tag::end = (args...) ->
            if opts.self_closing is on or opts.self_closing.match @name
                end_tag.call this, args...
            else
                @text "", force:yes if @isempty
                end_tag.call this, args...

        ##
        # pipe events through and add hooks to be able to alter event behavoir
        # (eg injecting events before others)
        # override method "on#{event}" to access the hook
        EVENTS.forEach (event) =>
            # build hook
            @["on#{event}"] = (args...) =>
                @emit event, args...
            # listen
            @xml.on event, (args...) =>
                @["on#{event}"](args...)

        process.nextTick =>
            if opts.doctype is on
                opts.doctype = 'html'
            d = aliases[opts.doctype] or opts.doctype
            if opts.doctype and (dt = doctype[d]?(opts))
                dt += "\n" if opts.pretty
                @xml.emit 'data', dt
            if typeof template is 'function'
                template.call @xml
                @end() if opts.end
            else
                @xml.end(template)


# exports

Template.schema = schema
module.exports = Template
Template.self_closing = self_closing
