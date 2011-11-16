{ Template, jquerify } = window.dynamictemplate
EventEmitter = Template.__super__.constructor # i prefer nodejs eventemitter

# the templates

button = (tag, id, value) ->
    tag.$input class:'button', type:'button', id:id, value:value

items = [] # all our list entries
tplapi = new EventEmitter # every other event system should be suitable as well
list = jquerify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "add",    "add random entry"
        button this, "remove", "remove random entry"

    @$ul class:'list', ->
        tplapi.on 'add', =>
            console.log "add entry"
            items.push @$li ->
                @$p "#{Math.random()}"
    @end()

# initialize

list.once 'end', ->
    # and again :/
    for el in list.jquery
        $('body').append el

    $('#add').on 'click', ->
        tplapi.emit 'add' # tell the template to add a new entry

    $('#remove').on 'click', ->
        items.shift()?.remove()



console.log 'coffeescript loaded.'


