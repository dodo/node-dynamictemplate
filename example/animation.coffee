srcdirurl = "https://github.com/dodo/node-dynamictemplate/blob/master/example"
{ Template, jqueryify } = window.dynamictemplate
{ random, floor, pow } = Math
running = yes
maxsize = 100

rnd = (most) ->
    floor(most*random())

differ = (c) ->
    r = {}
    for t in ['r', 'g', 'b']
        r[t] = c[t] + 100 * random() - 50
        r[t] = 0   if c[t] < 0
        r[t] = 255 if c[t] > 255
        r[t] = floor(r[t])
    return r

rgb = (c) ->
    "background-color:rgb(#{c.r},#{c.g},#{c.b})"

createSquare = (tag, col) ->
    tag.$div ->
        interval = null
        sat = 255/@level
        size = 100/pow(2,@level)
        setTimeout(@remove, 600 + 5*sat) if col?
        col ?= r:rnd(sat), g:rnd(sat), b:rnd(sat)
        @attr style:"#{rgb(col)};width:#{size}px;height:#{size}px;display:inline-block;"
        interval = setInterval =>
            return unless running
            createSquare(this, differ(col))
            createSquare(this, differ(col))
            createSquare(this, differ(col))
            createSquare(this, differ(col))
        ,(300 + 4*sat)
        @once 'remove', ->
            clearInterval(interval)



button = (tag, id, value) ->
    tag.$input class:'button', type:'button', id:id, value:value

animation = jqueryify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "start", "▸"
        button this, "stop",  "■"
        @$a href:"#{srcdirurl}/animation.coffee", "Source Code"
    @$div class:'canvas', ->
        createSquare this
        createSquare this
        createSquare this
        createSquare this


# initialize

animation.ready ->
    for el in animation.jquery
        $('body').append el

    $('#start').live 'click', ->
        console.log "animation paused."
        running = yes

    $('#stop').live 'click', ->
        console.log "animation resumed."
        running = no

console.log 'coffeescript loaded.'
