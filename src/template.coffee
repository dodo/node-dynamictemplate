{ EventEmitter } = require 'events'
{ Builder } = require 'asyncxml'


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



fill_with_tags = (tag, tags) ->
    tags.split(' ').forEach (name) ->
        return unless name
        tag[    name] = (args...) -> tag.tag( name, args...)
        tag["$"+name] = (args...) -> tag.$tag(name, args...)
    return tag


class Template extends EventEmitter
    constructor: (opts = {}, template) ->
        [template, opts] = [opts, {}] if typeof opts is 'function'
        s = aliases[opts.schema] or opts.schema or 'xml'
        opts.self_closing = self_closing[s]?(opts)
        opts.schema = schema[s]?(opts)
        opts.end ?= on

        class ExtendedBuilder
            constructor: ->
                fill_with_tags this, opts.schema
                Builder.apply this, arguments
        for name, method of Builder::
            ExtendedBuilder::[name] = method

        @xml = new ExtendedBuilder
        @end = @xml.end
        Tag = @xml.Tag
        class ExtendedTag
            constructor: ->
                fill_with_tags this, opts.schema
                Tag.apply this, arguments
        @xml.Tag = @xml.opts.Tag = ExtendedTag
        for name, method of Tag::
            ExtendedTag::[name] = method
        end_tag = Tag::end
        @xml.Tag::end = (args...) ->
            if opts.self_closing is on or opts.self_closing.match @name
                end_tag.call this, args...
            else
                @text "", force:yes if @headers
                end_tag.call this, args...

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
Template.self_closing = self_closing
