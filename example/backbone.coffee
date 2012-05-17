{ Template, List, jqueryify } = window.dynamictemplate

# patch JQueryAdapter to use the list extension

JQueryAdapter = jqueryify.Adapter
jqueryify = (opts, tpl) ->
    [tpl, opts] = [opts, null] unless tpl?
    List.jqueryify new JQueryAdapter(tpl, opts)
    return tpl

# helpers

EventHandler = (handler) ->
    return (ev) ->
        ev?.preventDefault?()
        handler.apply(this, arguments)
        no

input = (tag, type, id, value, opts = {}) ->
    tag.$input(_.extend({class:type, name:id, type, id, value}, opts))



class BackboneExample extends Backbone.View

    # embbeded template

    template: (view) -> jqueryify new Template schema:5, ->
        @$div class:'controls', ->

            input this, 'button', "add","view.model.add({value:Math.random()})",
                title:"add to bottom"

        @$ul class:'list', ->
            items = new List
            view.model.on 'remove', (entry, collection, options) ->
                items.remove(options.index)?.remove()
            view.model.on 'add', (entry, collection, options) =>
                items.insert options.index, @$li ->
                    @$input
                        type:'button'
                        class:"remove control"
                        'data-cid':entry.cid
                        value:"✖"
                    @$p "#{entry.get 'value'}"

    # patch some backbone internals

    make: -> # do nothing
    delegateEvents:   -> super if @$el?
    undelegateEvents: -> super if @$el?

    setElement: (element, delegate, callback) ->
        return unless element?
        @el = element
        @el.ready =>
            do @undelegateEvents if @$el
            @$el = @el.jquery
            callback?(@$el)
            do @delegateEvents if delegate isnt off
        this

    render: (callback) ->
        @setElement(@template(this), null, callback)

    # user input handling

    events:
        'click #add':    "on_add"
        'click .remove': "on_remove"

    on_add: EventHandler (ev) ->
        @model.add value:"#{Math.random()}"

    on_remove: EventHandler (ev) ->
        if(entry = @model.getByCid($(ev.target).data('cid')))?
            @model.remove(entry)


# initialize

$(document).ready ->
    example = new BackboneExample
        model:new Backbone.Collection
    window.example = example
    example.render ($el) ->
        $('body').append($el)


console.log 'coffeescript loaded.'


