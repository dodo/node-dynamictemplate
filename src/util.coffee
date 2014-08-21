
# add class to the list of classes in attribute 'class'
exports.addClass = (tag, classes...) ->
    return unless tag?.attr
    tagclass = tag.attr('class') ? ""
    for cls in classes
        unless new RegExp(cls).test tagclass
            tagclass = "#{cls} #{tagclass}"
    tag.attr 'class', tagclass.replace(/\s\s/g, " ")

# remove class from the list of classes in attribute 'class'
exports.removeClass = (tag, classes...) ->
    return unless tag?.attr
    tagclass = tag.attr('class') ? ""
    for cls in classes
        if new RegExp(cls).test tagclass
            tagclass = tagclass.replace(cls, "")
    tag.attr 'class', tagclass

# run multiple functions in a row with the same this context
exports.compose = (functions...) ->
    if functions.length is 1 and Array.isArray(functions[0])
        functions = functions[0]
    return (args...) ->
        for fun in functions
            fun.apply this, args
        this

# takes a function to create a clojure to call partial on an element
exports.partialize = (partial, moargs...) ->
    return (args...) ->
        @partial partial.call(this, moargs..., args...)
