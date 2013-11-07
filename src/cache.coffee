{ Builder:DefaultBuilder } = require 'asyncxml'

cache = {}


##
# i made these function name short ,
# because its a little bit faster than with long names

pp = (proto, name) -> # populate tag with specific child tag genertor
    proto[    name] = -> @tag.apply  this, [name].concat arguments...
    proto["$"+name] = -> @$tag.apply this, [name].concat arguments...
    return

ff = (proto, tags) -> # fill with tags
    for tagname in tags when tagname
        pp proto, tagname
    return


get = (key, opts) ->
    ExtendedBuilder = cache[key].Builder
    # instantiate
    xml = new ExtendedBuilder opts
    # set Tag class so we get the same results like create(…)
    xml.Tag = xml.opts.Tag = cache[key].Tag
    return xml


create = (key, opts) ->
    # get builder class from options
    Builder = opts.Builder ? DefaultBuilder
    # create new builder class to extend it with a schema
    class ExtendedBuilder extends Builder
    # create tag method shortcuts defined by schema
    ff ExtendedBuilder::, opts.schema
    # instantiate
    xml = new ExtendedBuilder opts
    # tag class is defined by builder
    Tag = xml.Tag
    # create new tag class to extend it with a schema
    class ExtendedTag extends Tag
    # create tag method shortcuts defined by schema
    ff ExtendedTag::, opts.schema
    # write it back so builder can use it to instantiate a new tag
    xml.Tag = xml.opts.Tag = ExtendedTag
    # fill cache
    cache[key] = {Builder:ExtendedBuilder, Tag:ExtendedTag}
    return xml


lookup = (opts) ->
    key = opts._schema ? opts.schema
    return if cache[key]?
        get key, opts
    else
        create key, opts


clear = () ->
    cache = {}


# exports

module.exports = {
    create,
    lookup,
    clear,
    get,
}
