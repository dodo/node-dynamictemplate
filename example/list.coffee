{ Template, List, jqueryify } = window.dynamictemplate
EventEmitter = Template.__super__.constructor # i prefer nodejs eventemitter

JQueryAdapter = jqueryify.Adapter
jqueryify = (opts, tpl) ->
    [tpl, opts] = [opts, null] unless tpl?
    List.jqueryify new JQueryAdapter(tpl, opts)
    return tpl

# the templates

button = (tag, id, value) ->
    tag.$input class:'button', type:'button', id:id, value:value

items = null # all our list entries
tplapi = new EventEmitter # every other event system should be suitable as well
list = jqueryify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "add",    "add random entry"
        button this, "remove", "remove random entry"

        @$input class:'number', type:'number', id:'nmb', value:"0"
        @$input class:'text', type:'input', id:'text', placeholder:"try me!"
        button this, "insert", "insert"

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


