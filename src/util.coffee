
# add class to the list of classes in attribute 'class'
exports.addClass = (tag, classes...) ->
    return unless tag?.attr
    tagclasses = (tag.attr('class') ? "").split ' '
    for cls in classes when tagclasses.indexOf(cls) is -1
        tagclasses.push "#{cls}"
    tag.attr 'class', tagclasses.join(' ').trim().replace(/\s\s/g, " ")

# remove class from the list of classes in attribute 'class'
exports.removeClass = (tag, classes...) ->
    return unless tag?.attr
    tagclass = " #{tag.attr('class') ? ''} "
    tagclasses = tagclass.trim().split ' '
    for cls in classes
        i = tagclasses.indexOf(cls)
        unless i is -1
            tagclasses[i] = ''
            tagclass = tagclass.replace(" #{cls} ", " ")
    tag.attr 'class', tagclass.trim()

# run multiple functions in a row with the same this context
exports.compose = (functions...) ->
    if functions.length is 1 and Array.isArray(functions[0])
        functions = functions[0]
    return (args...) ->
        for fun in functions
            fun.apply this, args
        this

# takes a function to create a clojure to call partial on an element
exports.partialize = (create, moargs...) ->
    return (args...) ->
        partial = create.call(this, moargs..., args...)
        @partial partial
        return partial
