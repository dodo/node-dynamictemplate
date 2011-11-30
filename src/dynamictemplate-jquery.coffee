
# TODO i think this should work with asyncxml as well
# FIXME  this should be in an own package

jquerify = (tpl) ->
    tpl.xml._children = []
    tpl.on 'add', (el) ->
        el._children = [] unless el._jquery?

    tpl.on 'close', (el) ->
        el._jquery = $(el.toString())
        if el.parent._children?
            el.parent._children.push el._jquery
        else
            el.parent._jquery.append el._jquery
        if el._children
            # wtf? jquery's append doesnt eat a list???
            for child in el._children
                el._jquery.append child
            delete el._children

        el.on 'newListener', (type) ->
            return if el._events?[type]?.length # dont bind two times for the same type
            el._jquery.bind type, ->
                el.emit type, this, arguments...
                return # dont return emit result (which is either true or false)

    tpl.on 'attr', (el, key, value) ->
        el._jquery?.attr key, value

    tpl.on 'attr:remove', (el, key) ->
        el._jquery?.removeAttr key

    tpl.on 'remove', (el) ->
        el._jquery?.remove()

    tpl.on 'end', ->
        tpl.jquery = tpl.xml._jquery = $(tpl.xml._children)
        delete tpl.xml._children

    old_query = tpl.xml.query
    tpl.xml.query = (type, tag, key) ->
        return old_query.call(this, type, tag, key) unless tag._jquery?
        if type is 'attr'
            tag._jquery.attr(key)
        else if type is 'text'
            tag._jquery.text()

    return tpl

# exports

module.exports = jquerify

# browser support

if @dynamictemplate?
    @dynamictemplate.jquerify = jquerify
else
    @dynamictemplate = {jquerify}
