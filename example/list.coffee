{ Template, List, jqueryify } = window.dynamictemplate
EventEmitter = Template.__super__.constructor # i prefer nodejs eventemitter

# the templates

input = (tag, type, id, value, opts) ->
    tag.$input(_.extend({class:type, name:id, type, id, value}, opts))

items = null # all our list entries
tplapi = new EventEmitter # every other event system should be suitable as well
list = jqueryify use:List.jqueryify, new Template schema:5, ->
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
        items = new List
        tplapi.on 'add', =>
            console.log "add entry"
            items.push @$li -> @$p "#{Math.random()}"
        tplapi.on 'insert', (i, text) =>
            console.log "insert entry"
            items.insert i, @$li -> @$p "#{text}"
        tplapi.on 'remove', ->
            items.shift()?.remove()

# initialize

list.ready ->
    window.test = list
    $('body').append(list.jquery)

    $('#add').live 'click', ->
        tplapi.emit 'add' # tell the template to add a new entry

    $('#remove').live 'click', ->
        tplapi.emit 'remove'

    $('#insert').live 'click', ->
        i = parseInt($('#nmb').val())
        return if i > items.length
        tplapi.emit 'insert', i, $('#text').val()


console.log 'coffeescript loaded.'


