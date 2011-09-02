uglify = require 'uglify-js'
coffee = require 'coffee-script'
{ skeleton, Builder } = require './xml'



tag_expose = -> # this is compiled function code
    builder = new Builder data.opts?

    tag_scope = (current) -> (name) ->
        create = (attrs, children) ->
            preevious = current
            current = tag_scope(new_tag(attrs))
            do children # invoke the children scope
            stack.pop()
            currrent.end()
            current = preevious
        new_tag = create.self = current.tag(name)
        create.end = (attrs) -> create(attrs).end()
    tag = tag_scope builder

    null


# Stringify the tag_expose and unwrap it from its enclosing `function(){}`
tag_expose = uglify String(tag_expose)
    .replace(/function\s*\(.*\)\s*\{/, '')
    .replace(/return null;\s*\}$/, '')

class Generator
    constructor: ->

    compile: (template, opts = {}) ->
        # The template can be provided as either a function or a CoffeeScript string
        # (in the latter case, the CoffeeScript compiler must be available).
        if typeof template is 'function' then template = String(template)
        else if typeof template is 'string' and coffee?
            template = coffee.compile template, bare: yes
            template = "function(){#{template}}"

        # If an object `hardcode` is provided, insert the stringified value
        # of each variable directly in the function body. This is a less flexible but
        # faster alternative to the standard method of using `with` (see below).
        hardcoded_locals = ''

        if opts.hardcode
            for k, v of opts.hardcode
                if typeof v is 'function'
                    # Make sure these functions have access to `data` as `@/this`.
                    hardcoded_locals += "var #{k} = function(){return (#{v}).apply(data, arguments);};"
                else hardcoded_locals += "var #{k} = #{JSON.stringify v};"

        # Main function assembly.
        code = skeleton + tag_expose + hardcoded_locals

        # If `locals` is set, wrap the template inside a `with` block. This is the
        # most flexible but slower approach to specifying local variables.
        code += 'with(data.locals){' if opts.locals
        code += "(#{template}).call(data);"
        code += '}' if opts.locals
        code += "return __ck.buffer.join('');"

        new Function('data', code)



    render: (opts) ->


# exports

module.exports = { tag_expose, Generator }
