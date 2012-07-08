srcdirurl = "https://github.com/dodo/node-dynamictemplate/blob/master/example"
{ Template, domify } = window.dynamictemplate
{ random, floor, min } = Math
running = yes

svgns = "http://www.w3.org/2000/svg"


button = (tag, id, value) ->
    tag.$input
        class:'button'
        type:'button'
        id:id
        value:value
        title:id


createCircle = (tag, o) ->
    tag.$circle {
        xmlns:svgns
        fill:"none"
        stroke:"rgba(#{o.r},#{o.g},#{o.b},#{o.a})"
        style:"stroke-width:#{o.size}"
        cx:"#{o.x}"
        cy:"#{o.y}"
        r:"#{o.radius}"
    }, step = ->
        setTimeout =>
            @attr 'r', "#{o.radius+=o['+']}"
            if --o.life then step.call(this) else @remove()
        ,60



svg = domify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "start", "▸"
        button this, "stop",  "■"
        @$a href:"#{srcdirurl}/circles.coffee", "Source Code"
    @$div class:'canvas', ->
        @add new Template schema:'svg', ->
            @$svg {
                xmlns:svgns
                version:"1.1"
                height:"600px"
                width:"600px"
                preserveAspectRatio:"none"
                viewBox:"0 0 600 600"
                }, ->
                    setInterval =>
                        return unless running
                        createCircle this,
                            '+':(0.00001 + 2 * random())
                            life:floor(5 + 42 * random())
                            radius:floor(3 + 20 * random())
                            size:floor(5 + 10 * random())
                            x:floor(600 * random())
                            y:floor(600 * random())
                            r:floor(255 * random())
                            g:floor(255 * random())
                            b:floor(255 * random())
                            a:min(0.8, 0.01 + random())
                    , 100


# initialize

svg.ready ->
    for el in svg.dom
        $('body').append el

    $('#start').live 'click', ->
        console.log "animation resumed."
        running = yes

    $('#stop').live 'click', ->
        console.log "animation paused."
        running = no

console.log 'coffeescript loaded.'

