srcdirurl = "https://github.com/dodo/node-dynamictemplate/blob/master/example"
{ Template, domify } = window.dynamictemplate
{ abs } = Math
running = yes

button = (tag, id, value) ->
    tag.$input
        class:'button'
        type:'button'
        id:id
        value:value
        title:id

svgns = "http://www.w3.org/2000/svg"

svg = domify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "start", "▸"
        button this, "stop",  "■"
        @$a href:"#{srcdirurl}/svg.coffee", "Source Code"
    @$div class:'canvas', ->
        @add new Template schema:'svg', ->
            @$svg {
                xmlns:svgns
                version:"1.1"
                height:"100px"
                width:"100px"
                preserveAspectRatio:"none"
                viewBox:"0 0 100 100"
                }, ->
                    @$path {
                        xmlns:svgns # is this really necessary ?
                        d:"M0,50 Q20,0 50,50 T100,50"
                        fill:"none"
                        stroke:"red"
                    }, ->
                        i = 0
                        setInterval =>
                            return unless running
                            i = (i+5)%200
                            @attr 'd', "M0,50 Q20,#{abs i-100} 50,50 T100,50"
                        , 60


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

