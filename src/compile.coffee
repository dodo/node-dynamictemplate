fs = require 'fs'
jQuery = require 'jquery'
{ isArray } = Array
#{ trim, extend:merge } = jQuery
#deep_merge (objs...) -> merge true, {}, objs...

# /** PrivateConstants: DOM Element Type Constants
#  *  DOM element types.
#  *
#  *  ElementType.NORMAL - Normal element.
#  *  ElementType.TEXT - Text data element.
#  *  ElementType.FRAGMENT - XHTML fragment element.
#  */
DOMElementType =
    NORMAL:   1
    TEXT:     3
    CDATA:    4
    FRAGMENT: 11

##
# copy many objects into one
deep_merge = (objs...) ->
    objs = objs[0] if isArray(objs[0])
    res = {}
    for obj in objs
        for k, v of obj
            if typeof(v) is 'object' and not isArray(v)
                res[k] = deep_merge(res[k] or {}, v)
            else
                res[k] = v
    res

##
# slice off spaces
trim = (str) ->
    str.replace /^\s+|\s+$/g, ""

##
# dom attributes to object
slim_attrs = (el) ->
    attrs = {}
    for attr in el.attributes ? []
        attrs[attr.name] = attr.value
    attrs

##
# dom element to object
slim = (el) ->
    name:     el.nodeName.toLowerCase()
    attrs:    slim_attrs(el)
    children: traverse(el.childNodes)

##
# build children list
traverse = (elems) ->
    return [] unless elems?
    res = []
    for el in elems
        if el.nodeType is DOMElementType.NORMAL
            res.push slim el
        else if el.nodeType is DOMElementType.TEXT
            if trim(el.value).length
                res.push el.value
        else continue
    return res

##
# build an object (json-able) from dom
jsonify = (elems) ->
    slim el for el in elems ? []

##
# copy only structure and reuse objects
# except for the dom element objects (because of the children)
copy_structure = (tree) ->
    res = []
    for el in tree ? []
        if typeof el is 'string' or typeof el is 'number'
            res.push el
            continue
        res.push
            name:     el.name
            attrs:    el.attrs
            children: copy_structure(el.children)
    return res

##
# tests a tag against the dom information from jsonify
match = (tag, el) ->
    return yes unless el? # nothing to test against
    return no if tag.name isnt el.name
    for key, value of tag.attrs
        return no if el.attrs[key] isnt value
    return yes

##
# create a new tag (and children) from data structure
new_tag = (parent, el, callback) ->
    attrs = deep_merge el.attrs # copy data
    parent.tag el.name, attrs, ->
        for child in el.children.slice() ? []
            if typeof child is 'string' or typeof child is 'number'
                @text "#{child}", append:on
            else
                new_tag this, child, ->
                    callback?()
                    callback = null
        @end()
        # call back some delayed work
        callback?()

##
# apply possible additions from the data structure on the tag
mask = (tag, el) ->
    return unless el?
    # no need to set tag.name because its the most important trigger for a match
    tag.attr el.attrs # object
    tag._elems = el.children

##
# this hooks on new instanziated templates and tries to
# complete the structure with the given html design
hook = (tpl) ->
    tpl.xml.use (parent, tag, next) ->
        elems = parent._elems

        # when this is a tag created from data structure
        return next(tag) unless elems?

        repeat = ->
            el = elems[0]

            if typeof el is 'string' or typeof el is 'number'
                console.log "text".blue, el
                elems.shift() # rm text
                parent.text? el, append:on
                do repeat

            else if match tag, el
                console.log "match".yellow, el?.name, el?.attrs
                elems.shift() # rm el
                mask tag, el # apply
                next(tag)

            else # create new tag
                console.log "new".green, el?.name, el?.attrs, "(",tag.name, tag.attrs,")"
                # get the last pending tag out cuz we want to insert a new one in front
                #last = parent.pending.pop()
                # create and insert the new tag from el and delay work
                console.log "WTF WTF WTF WTF".bold.red, tag.name, tag.attrs
                new_tag parent, el, ->
                    console.log "repeat".red, tag.name, tag.attrs, "(",el?.name, el?.attrs,")"
                    do repeat
                # put it back
                #parent.pending.push(last) if last?
        do repeat

##
# this add the data structure to the new instanziated template and hooks it
suitup = (rawtemplate, tree) ->
    return (args...) ->
        tpl = rawtemplate args...
        # local copy of the data structure
        elems = copy_structure tree
        # nest the data tree in the root
        tpl.xml._elems = elems
        # we need to get between the events from the builder and
        # the output to change to events bahavior (inserting events before others)
        hook tpl
        # done
        return tpl


class HTMLCompiler
    constructor: ->
        # new jquery context
        @$ = jQuery.create()
        #aliases
        @loadSync = @open

    read: (filename, callback) ->
        fs.readFile filename, (err, data) =>
            callback?.call(this, err, data?.toString())

    readSync: (filename) ->
        fs.readFileSync(filename)?.toString()

    parse: (data) ->
        @el = @$(data)

    select: (from, to) ->
        # selector
        el = @el.find(from)
        # dont touch origin
        el = el.clone()
        # deselector
        el.find(to).remove()
        # rest
        return el

    use: (data) ->
        @loaded = yes
        @parse data

    load: (filename, callback) ->
        @read filename, (err, data) ->
            return callback.call(this, err) if err
            @use data
            callback(null, @el)

    open: (filename) ->
        data = @readSync filename
        return @use data

    compile: (rawtemplate, el) ->
        throw new Error "no html file loaded or html string used." unless @loaded
        console.log "building data structure ..."
        el ?= @el
        # get only the important information
        tree = jsonify el
        console.log "design is ready loaded. suiting up the template ..."
        r = suitup rawtemplate, tree
        r.tree = tree
        console.log "done."
        r




      ###`<div id="channels" class="antiscroll-wrap">
        <div class="antiscroll-inner scrollHolder">
          <div class="channel selected">
            <div class="avatar" style="background-image: url(public/avatars/user2.jpg)">
              <span class="channelpost counter">2</span>
            </div>
            <div class="info">
              <span class="owner">vera<span class="domain">@buddycloud.com</span></span>
              <span class="status">What a wonderful day</span>
            </div>
          </div>`###



require 'colors'
util = require('util')
util.orginspect = util.inspect
util.inspect = require('eyes').inspector(stream: null, hexy:{format:'fours'})
{ Template, Tag } = require './dynamictemplate'
#$ = jQuery
#select=(e,from,to)->el=e.find(from).clone();el.find(to).remove();el
#el=jQuery(require('fs').readFileSync('/home/dodo/code/arbyt/buddycloud/webclient/brunch/build/streams.html').toString())
#x = select el, '#channels', '.channel'

#(t = (T = (C = require('./src/compile')).example2())()).on 'data', console.log

example = ->
    design = new HTMLCompiler
    console.log "* loading html ..."
    streamshtml = design.open '/home/dodo/code/arbyt/buddycloud/webclient/brunch/build/streams.html'#"streams.html"

    console.log "* selecting part of the html ..."
    channelsdesign = streamshtml.select('#channels','.channel')
    console.log "S", streamshtml.select('.channel')?.length
        #.append(streamshtml.select('.channel')?.get(0).clone())

    rawtemplate = (ee) ->
        return new Template schema:5, ->
            @$div id:'channels', ->
                @$div ->
                    ee?.on 'new:channel', (channel) =>
                        @$div class:'channel', ->
                            @$div class:'avatar', style:"background-image:url(#{channel.avatar})", ->
                                @$span class:'counter', (channel.counter) # channelpost class should autofill
                            @$div class:'info', ->
                                @$span class:'owner', ->
                                    jid = channel.get('jid')?.split('@') or []
                                    @text "#{jid[0]}"
                                    @$span class:'domain', "#{jid[1]}"
                                @$span class:'status', (channel.nodes.get('status')?.last() or "")

    console.log "* start compiling ..."
    template = design.compile rawtemplate, channelsdesign # the rawtemplate gets autfilled with the selected designstuff


example2  = ->
    design = new HTMLCompiler
    console.log "* using html ..."
    design.use """
        <div id="main">
            <div class="logo" id="big">some <a href="#">linked</a> logo</div>
            <div class="list" id="zwiebel">
                <div class="entry">some random entry</div>
            </div>
        </div>
    """

    rawtemplate = () ->
        return new Template schema:5, ->
            @$div id:'main', ->
                # skipping logo, because that should be automagically added
                @$div class:'list', ->
                    @$div class:'entry', "specific text"

    console.log "* start compiling ..."
    template = design.compile rawtemplate
    template.design = design
    template

#module.exports = {select, slim, slim_attrs, el, x, $, example, HTMLCompiler}
module.exports = {example, example2, HTMLCompiler, copy_structure}

