
schema =
    'none' : -> "" # allready includes tag
    'xml'  : -> "#{do schema.none }"
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
    'xhtml': ->
        "#{do schema.html}" # FIXME
    'xhtml1.1': ->
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
    "svg1.1": ->
        "altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion" +
        "a animateTransform circle clipPath color-profile cursor defs desc"    +
        "ellipse feBlend feColorMatrix feComponentTransfer feComposite"        +
        "feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight"  +
        "feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage"       +
        "feMerge feMergeNode feMorphology feOffset fePointLight feSpotLight"   +
        "feSpecularLighting feTile feTurbulence linearGradient polyline"       +
        "filter font font-face font-face-format font-face-name font-face-src"  +
        "font-face-uri foreignObject g glyph glyphRef hkern image line"        +
        "marker mask metadata missing-glyph mpath path pattern polygon"        +
        "radialGradient rect script set stop style svg switch symbol text"     +
        "textPath title tref tspan use view vkern"


# Valid self-closing HTML 5 elements.
# set true when all tags are self closing
self_closing =
    'none': -> on
    'xml'  : -> off
    'svg1.1': -> on
    'html' : -> "area br col embed hr img input link meta param"
    'html5': -> "#{do self_closing.html} base command keygen source track wbr"
    'mobile' : ->  "#{do self_closing.xhtml}"
    'html-ce': ->  "#{do self_closing.xhtml}"
    'strict'  : -> "#{do self_closing.xhtml}"
    'xhtml1.1': -> "#{do self_closing.xhtml}"
    'xhtml'   : -> "#{do self_closing.html}"
    'frameset': -> "#{do self_closing.xhtml}"
    'transitional': -> "#{do self_closing.xhtml}"


# exports

module.exports = {
    self_closing,
    schema,
}
