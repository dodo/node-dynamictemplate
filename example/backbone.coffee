{ Template, List, jqueryify } = window.dynamictemplate
{ random, floor } = Math
{ isArray } = Array

# use an even simpler equals comparator for adiff

adiff = window.adiff({ # npm i adiff - https://github.com/dominictarr/adiff
    equal: (a, b) ->
        return no if a and not b
        return no if isArray(a) and a.length isnt b.length
        return a is b
}, window.adiff)

# helpers

EventHandler = (handler) ->
    return (ev) ->
        ev?.preventDefault?()
        handler.apply(this, arguments)
        no

input = (tag, type, id, value, opts = {}) ->
    tag.$input(_.extend({class:type, name:id, type, id, value}, opts))

sync = (items, collection, options) ->
    # now its gonna get dirty!
    bycid = {}
    removed = []
    old_models = []
    # rebuild old collection state
    for item in items
        bycid[item.cid] = item
        old_models.push collection.getByCid(item.cid)
    # apply diff patches on items list
    for patch in adiff.diff(old_models, collection.models)
        # remove all items from dom before splicing them in
        for i in [(patch[0]) ... (patch[0]+patch[1])]
            removed.push items[i].remove(soft:yes)
        # replace models with items
        for i in [2 ... patch.length]
            patch[i] = bycid[patch[i].cid]
        # apply patch!
        items.splice.apply(items, patch)
    # read all removed items - this only works in the assumption,
    #   that the collection doesn't change its size
    for item in removed
        @add(item)

# different comparators

ascending = (model) ->
    parseFloat(model.get 'value')

descending = (model) ->
    - ascending(model)


class BackboneExample extends Backbone.View

    # embbeded template

    template: (view) -> jqueryify use:List.jqueryify, new Template schema:5, ->
        @$div class:'controls', ->

            input this, 'button', "add", "collection.add({value:Math.random()})"
            input this, 'button', "desc", "▲", title:"descending"
            input this, 'button', "asc",  "▼", title:"ascending"

        @$ul class:'list', ->
            items = new List
            view.model.on 'reset', sync.bind(this, items)
            view.model.on 'remove', (entry, collection, options) ->
                items.remove(options.index)?.remove()
            view.model.on 'add', (entry, collection, options) =>
                [r,g,b] = (floor(255 * entry.get(k)) for k in ['r','g','b'])
                style = "background:rgba(#{r},#{g},#{b}, 0.3)"
                items.insert options.index, @$li {style}, ->
                    @cid = entry.cid # mark it to find its model again (on reset)
                    @$input
                        type:'button'
                        class:"remove control"
                        'data-cid':entry.cid
                        value:"✖"
                        title:"delete"
                    @$p "#{entry.get 'value'}"

    # patch some backbone internals

    make: -> # do nothing
    delegateEvents:   -> super if @$el?
    undelegateEvents: -> super if @$el?

    setElement: (element, delegate, callback) ->
        return unless element?
        @el = element
        @el.ready =>
            console.log "ready"
            do @undelegateEvents if @$el
            @$el = @el.jquery
            do @delegateEvents if delegate isnt off
            callback?(@$el)
        this

    render: (callback) ->
        @setElement(@template(this), null, callback)

    # user input handling

    events:
        'click #add':    "on_add"
        'click .remove': "on_remove"
        'click #desc':   "on_desc"
        'click #asc':    "on_asc"

    on_add: EventHandler (ev) ->
        @model.add value:"#{random()}", r:random(), g:random(), b:random()
        console.log "add", @model.length

    on_remove: EventHandler (ev) ->
        if(entry = @model.getByCid($(ev.target).data('cid')))?
            @model.remove(entry)
        console.log "remove", @model.length

    on_desc: EventHandler (ev) ->
        @model.comparator = descending
        @model.sort()

    on_asc: EventHandler (ev) ->
        @model.comparator = ascending
        @model.sort()


# initialize

$(document).ready ->
    example = new BackboneExample
        model:new Backbone.Collection
    window.example = example
    example.render ($el) ->
        $('body').append($el)


console.log 'coffeescript loaded.'


