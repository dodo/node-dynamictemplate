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



class ListExample extends Backbone.View

    # embbeded template

    template: (view) -> jqueryify new Template schema:5, ->
        @$div class:'controls', ->

            input this, 'button', "add",    "list.push(Math.random())",
                title:"add to bottom"
            input this, 'button', "remove", "list.shift()",
                title:"remove from top"
            @$br()
            input this, 'button', "insert", "list.insert(i, text)",
                title:"insert at position"
            @span " where "
            @$label for:'nmb', ->
                @text " i="
                input this, 'number','nmb', "0"
            @$label for:'text', ->
                @text " text="
                input this, 'text',  'text', "", placeholder:"try me!"

        @$ul class:'list', ->
            view.items = new List
            view.on 'click:add', =>
                console.log "add entry"
                view.items.push @$li -> @$p "#{Math.random()}"
            view.on 'click:insert', (i, text) =>
                console.log "insert entry"
                view.items.insert i, @$li -> @$p "#{text}"
            view.on 'click:remove', ->
                view.items.shift()?.remove()

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
        'click #remove': "on_remove"
        'click #insert': "on_insert"

    on_add: EventHandler (ev) ->
        @trigger 'click:add'

    on_remove: EventHandler (ev) ->
        @trigger 'click:remove'

    on_insert: EventHandler (ev) ->
        i = parseInt($('#nmb').val())
        return if i > @items.length
        @trigger 'click:insert', i, $('#text').val()

    # some logic

    initialize: ->
        @items = null # HACK gets set by the template



# initialize

$(document).ready ->
    example = new ListExample
    window.example = example
    example.render ($el) ->
        $('body').append($el)


console.log 'coffeescript loaded.'


