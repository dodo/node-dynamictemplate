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

tplops = schema:5
svg = domify new Template tplops, ->
    tplops.self_closing += " path"
    tplops.self_closing += " svg"

    @$div class:'controls', ->
        button this, "start", "▸"
        button this, "stop",  "■"
        @$a href:"./svg.coffee", "Source Code"
    @$div class:'canvas', ->
        @$tag 'svg', {
            xmlns:svgns
            version:"1.1"
            height:"100px"
            width:"100px"
            preserveAspectRatio:"none"
            viewBox:"0 0 100 100"
            }, ->
                @$tag 'path', {
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
        console.log "animation paused."
        running = yes

    $('#stop').live 'click', ->
        console.log "animation resumed."
        running = no

console.log 'coffeescript loaded.'

