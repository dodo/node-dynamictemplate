srcdirurl = "https://github.com/dodo/node-dynamictemplate/blob/master/example"
{ Template, domify } = window.dynamictemplate
{ random, floor, min, max } = Math
running = yes

svgns = "http://www.w3.org/2000/svg"

[test0, test1, test2] =  ["M5.5,5.5h20v20h-20z","M24.359,18.424l-2.326,1.215c0.708,1.174,1.384,2.281,1.844,3.033l2.043-1.066C25.538,20.822,24.966,19.652,24.359,18.424zM19.143,14.688c0.445,0.84,1.342,2.367,2.274,3.926l2.414-1.261c-0.872-1.769-1.72-3.458-2.087-4.122c-0.896-1.621-1.982-3.108-3.454-5.417c-1.673-2.625-3.462-5.492-4.052-4.947c-1.194,0.384,1.237,4.094,1.876,5.715C16.73,10.147,17.991,12.512,19.143,14.688zM26.457,22.673l-1.961,1.022l1.982,4.598c0,0,0.811,0.684,1.92,0.213c1.104-0.469,0.81-1.706,0.81-1.706L26.457,22.673zM24.35,15.711c0.168,0.339,2.924,5.93,2.924,5.93h1.983v-5.93H24.35zM18.34,15.704h-4.726l-3.424,5.935h11.66C21.559,21.159,18.771,16.479,18.34,15.704zM3.231,21.613l3.437-5.902H2.083v5.93h1.133L3.231,21.613zM15.048,10.145c0-0.93-0.754-1.685-1.685-1.685c-0.661,0-1.231,0.381-1.507,0.936l2.976,1.572C14.97,10.725,15.048,10.444,15.048,10.145zM14.343,12.06l-3.188-1.684L9.62,13.012l3.197,1.689L14.343,12.06zM3.192,26.886l-0.384,1.108v0.299l0.298-0.128l0.725-0.896l2.997-2.354l-3.137-1.651L3.192,26.886zM9.02,14.044l-4.757,8.17l3.23,1.706l4.728-8.186L9.02,14.044z" ,"M23.356,17.485c-0.004,0.007-0.007,0.013-0.01,0.021l0.162,0.005c0.107,0.004,0.218,0.01,0.33,0.016c-0.046-0.004-0.09-0.009-0.136-0.013L23.356,17.485zM15.5,1.249C7.629,1.25,1.25,7.629,1.249,15.5C1.25,23.371,7.629,29.75,15.5,29.751c7.871-0.001,14.25-6.38,14.251-14.251C29.75,7.629,23.371,1.25,15.5,1.249zM3.771,17.093c0.849-0.092,1.833-0.148,2.791-0.156c0.262,0,0.507-0.006,0.717-0.012c0.063,0.213,0.136,0.419,0.219,0.613H7.492c-0.918,0.031-2.047,0.152-3.134,0.335c-0.138,0.023-0.288,0.051-0.441,0.08C3.857,17.67,3.81,17.383,3.771,17.093zM12.196,22.224c-0.1,0.028-0.224,0.07-0.357,0.117c-0.479,0.169-0.665,0.206-1.15,0.206c-0.502,0.015-0.621-0.019-0.921-0.17C9.33,22.171,8.923,21.8,8.651,21.353c-0.453-0.746-1.236-1.275-1.889-1.275c-0.559,0-0.664,0.227-0.261,0.557c0.608,0.496,1.062,0.998,1.248,1.385c0.105,0.215,0.266,0.546,0.358,0.744c0.099,0.206,0.311,0.474,0.511,0.676c0.472,0.441,0.928,0.659,1.608,0.772c0.455,0.06,0.567,0.06,1.105-0.004c0.26-0.03,0.479-0.067,0.675-0.118v0.771c0,1.049-0.008,1.628-0.031,1.945c-1.852-0.576-3.507-1.595-4.848-2.934c-1.576-1.578-2.706-3.592-3.195-5.848c0.952-0.176,2.073-0.32,3.373-0.43l0.208-0.018c0.398,0.925,1.011,1.631,1.876,2.179c0.53,0.337,1.38,0.685,1.808,0.733c0.118,0.02,0.46,0.09,0.76,0.16c0.302,0.066,0.89,0.172,1.309,0.236h0.009c-0.007,0.018-0.014,0.02-0.022,0.02C12.747,21.169,12.418,21.579,12.196,22.224zM13.732,27.207c-0.168-0.025-0.335-0.056-0.5-0.087c0.024-0.286,0.038-0.785,0.054-1.723c0.028-1.767,0.041-1.94,0.156-2.189c0.069-0.15,0.17-0.32,0.226-0.357c0.095-0.078,0.101,0.076,0.101,2.188C13.769,26.143,13.763,26.786,13.732,27.207zM15.5,27.339c-0.148,0-0.296-0.006-0.443-0.012c0.086-0.562,0.104-1.428,0.106-2.871l0.003-1.82l0.197,0.019l0.199,0.02l0.032,2.365c0.017,1.21,0.027,1.878,0.075,2.296C15.613,27.335,15.558,27.339,15.5,27.339zM17.006,27.24c-0.039-0.485-0.037-1.243-0.027-2.553c0.019-1.866,0.019-1.866,0.131-1.769c0.246,0.246,0.305,0.623,0.305,2.373c0,0.928,0.011,1.497,0.082,1.876C17.334,27.196,17.17,27.22,17.006,27.24zM27.089,17.927c-0.155-0.029-0.307-0.057-0.446-0.08c-0.96-0.162-1.953-0.275-2.804-0.32c1.25,0.108,2.327,0.248,3.246,0.418c-0.479,2.289-1.618,4.33-3.214,5.928c-1.402,1.4-3.15,2.448-5.106,3.008c-0.034-0.335-0.058-1.048-0.066-2.212c-0.03-2.167-0.039-2.263-0.17-2.602c-0.181-0.458-0.47-0.811-0.811-1.055c-0.094-0.057-0.181-0.103-0.301-0.14c0.145-0.02,0.282-0.021,0.427-0.057c1.418-0.188,2.168-0.357,2.772-0.584c1.263-0.492,2.129-1.301,2.606-2.468c0.044-0.103,0.088-0.2,0.123-0.279l0.011,0.001c0.032-0.07,0.057-0.118,0.064-0.125c0.02-0.017,0.036-0.085,0.038-0.151c0-0.037,0.017-0.157,0.041-0.317c0.249,0.01,0.58,0.018,0.938,0.02c0.959,0.008,1.945,0.064,2.794,0.156C27.194,17.356,27.148,17.644,27.089,17.927zM25.823,16.87c-0.697-0.049-1.715-0.064-2.311-0.057c0.02-0.103,0.037-0.218,0.059-0.336c0.083-0.454,0.111-0.912,0.113-1.823c0.002-1.413-0.074-1.801-0.534-2.735c-0.188-0.381-0.399-0.705-0.655-0.998c0.225-0.659,0.207-1.68-0.02-2.575c-0.19-0.734-0.258-0.781-0.924-0.64c-0.563,0.12-1.016,0.283-1.598,0.576c-0.274,0.138-0.652,0.354-0.923,0.522c-0.715-0.251-1.451-0.419-2.242-0.508c-0.799-0.092-2.759-0.04-3.454,0.089c-0.681,0.126-1.293,0.28-1.848,0.462c-0.276-0.171-0.678-0.4-0.964-0.547C9.944,8.008,9.491,7.846,8.925,7.727c-0.664-0.144-0.732-0.095-0.922,0.64c-0.235,0.907-0.237,1.945-0.004,2.603c0.026,0.075,0.043,0.129,0.05,0.17c-0.942,1.187-1.25,2.515-1.046,4.367c0.053,0.482,0.136,0.926,0.251,1.333c-0.602-0.004-1.457,0.018-2.074,0.057c-0.454,0.031-0.957,0.076-1.418,0.129c-0.063-0.5-0.101-1.008-0.101-1.524c0-3.273,1.323-6.225,3.468-8.372c2.146-2.144,5.099-3.467,8.371-3.467c3.273,0,6.226,1.323,8.371,3.467c2.145,2.147,3.468,5.099,3.468,8.372c0,0.508-0.036,1.008-0.098,1.499C26.78,16.946,26.276,16.899,25.823,16.87z"]


button = (tag, id, value) ->
    tag.$input
        class:'button'
        type:'button'
        id:id
        value:value
        title:id

createRect = (tag, o) ->
    tag.$rect
        xmlns:svgns
        fill:  "rgba(#{o.r},#{o.g},#{o.b},#{o.a})"
        stroke:"none"
        height:"#{o.h}"
        width: "#{o.w}"
        x:     "#{o.x}"
        y:     "#{o.y}"

createBox = (tag, o) ->
    tag.$rect
        xmlns:svgns
        stroke:"rgba(#{o.r},#{o.g},#{o.b},#{o.a})"
        'stroke-width':"0.1"
        fill:  "none"
        height:"#{o.h}"
        width: "#{o.w}"
        x:     "#{o.x}"
        y:     "#{o.y}"

createCircle = (tag, o) ->
    tag.$circle
        xmlns:svgns
        fill:  "rgba(#{o.r},#{o.g},#{o.b},#{o.a})"
        stroke:"none"
        cx:    "#{o.x}"
        cy:    "#{o.y}"
        r:     "#{o.R}"

createPath = (tag, o) ->
    tag.$path
        xmlns:svgns
        style:    "pointer-events:visibileFill"
#         transform:"matrix(1,0,0,1,#{o.x},#{o.y})"
#         transform:"matrix(#{o.s},0,0,#{o.s},#{o.x},#{o.y})"
        fill:     "rgba(#{o.r},#{o.g},#{o.b},#{o.a})"
        stroke:   "none"
        d:        "#{o.p}"


calcRect = ({root, el, x, y, w, h}) ->
    p = root.createSVGPoint()
    [p.x, p.y] = [x, y]
    p = p.matrixTransform root.getCTM().inverse().multiply(el.getScreenCTM())
#     p = p.matrixTransform el.getCTM().multiply(el.getScreenCTM().inverse())
    return p unless w and h
    rec = root.createSVGRect()
    [rec.x, rec.y, rec.width, rec.height] = [p.x, p.y, w, h]
    return rec

convertScreenPos = (root, x, y) ->
    p = root.createSVGPoint()
    [p.x, p.y] = [x, y]
    p.matrixTransform root.getScreenCTM().inverse()

buildTree = (tag, path) -> return ->
    setTimeout -> # FIXME
        el = path._dom
        root = el.ownerSVGElement

        $(root).click (ev) ->
            p1 = convertScreenPos root, ev.clientX, ev.clientY
            p2 = calcRect {root, el, x:p1.x, y:p1.y}
            console.log p1.x, p1.y, p2.x, p2.y

        cs = 2
        cursor = createRect(tag, x:0, y:0, w:cs, h:cs, r:255, g:0, b:0, a:0.4)
        cursor.prev = 'miss'
        cursor.ready -> $(root).mousemove (ev) ->
            p = convertScreenPos root, ev.clientX, ev.clientY
            cursor.attr(x:p.x, y:p.y)

#             rec = calcRect {root, el, x:p.x, y:p.y, w:cs, h:cs}
            rec = root.createSVGRect()
            [rec.x, rec.y, rec.width, rec.height] = [ev.clientX, ev.clientY, cs, cs]
            if root.checkIntersection(el, rec)
                if cursor.prev is 'miss'
                    cursor.attr(fill:"rgba(0,255,0,0.4)")
                    cursor.prev = 'hit'
            else
                if cursor.prev is 'hit'
                    cursor.attr(fill:"rgba(255,0,0,0.4)")
                    cursor.prev = 'miss'

        [i, _max] = [0, 123]
        [_top, _bottom, _left, _right] = [600, 0, 600, 0]
        len = el.getTotalLength()

#         bbox = createBox(tag, x:0, y:0, w:0, h:0, r:200, g:10, b:5, a:0.7)
        interval = setInterval ->
            return unless running
            l = len * i / _max
            p = el.getPointAtLength(l)#.matrixTransform(el.getCTM())
#             _top    = min p.y, _top
#             _bottom = max p.y, _bottom
#             _left   = min p.x, _left
#             _right  = max p.x, _right
#             bbox.attr(x:_left, y:_top, width:_right-_left, height:_bottom-_top)
            createCircle(tag,  x:p.x, y:p.y, R:0.2, r:200, g:10, b:5, a:0.7)
            if i++ > _max
                clearInterval(interval)
#                 bbox.remove()

                jobs = []
                interval = setInterval ->
                    return unless running and jobs.length
#                     jobs.splice(floor(jobs.length*random()),1)[0]?()
                    jobs.shift()?()
                , 1

                cut = ({level, top, bottom, left, right}) ->
#                     b = x:left, y:top, w:(right-left)*2, h:(bottom-top)*2, r:10, b:200, g:5, a:0.3
                    b = x:left, y:top, w:right-left, h:bottom-top, r:10, b:200, g:5, a:0.3
#                     b = x:left, y:top, w:1, h:1, r:10, b:200, g:5, a:0.3
                    box = createBox(tag, b)
                    start = calcRect {root, el, x:left,  y:top}
                    stop  = calcRect {root, el, x:right, y:bottom}
                    rec = root.createSVGRect()
                    [rec.x, rec.y] = [start.x, start.y]
                    rec.width = rec.height = max stop.x-start.x, stop.y-start.y

#                     console.log "#{level} x:#{rec.x}\ty:#{rec.y}\tw:#{rec.width}\th:#{rec.height}"
#                     [rec.x, rec.y, rec.width, rec.height] = [b.x+b.w, b.y+b.h, b.w, b.h]
#                     [rec.x, rec.y, rec.width, rec.height] = [b.x*2, b.y*2, b.w, b.h]
#                     console.log root.getCTM()
#                     console.log "#{level} x:#{b.x}\ty:#{b.y}\tw:#{b.w}\th:#{b.h}\ttop:#{top}\tbot:#{bottom}\tlef:#{left}\trig:#{right}\t#{root.checkIntersection(el, rec) and 'INS' or '---'} #{root.checkEnclosure(el, rec) and 'ENC' or '---'} #{root.getIntersectionList(rec, el).length}"
                    if ++level < 7 and root.checkIntersection(el, rec)
#                         [hw, hh] = [b.w*0.5, b.h*0.5]
                        [hw, hh] = [(right-left)*0.5, (bottom-top)*0.5]
                        jobs.push -> cut {level, top,        bottom:bottom-hh, left,         right:right-hw}
                        jobs.push -> cut {level, top,        bottom:bottom-hh, left:left+hw, right}
                        jobs.push -> cut {level, top:top+hh, bottom,           left,         right:right-hw}
                        jobs.push -> cut {level, top:top+hh, bottom,           left:left+hw, right}
#                     else jobs.push -> clearInterval(interval)
#                 [_w, _h] = [_right-_left, _bottom-_top]
#                 _w = _h = max _w, _h
#                 _bottom = _top + _h
#                 _right = _left + _w

                bbox = el.getBBox()
#                 cut {level:0, top:bbox.y, bottom:bbox.y+bbox.height, left:bbox.x, right:bbox.x+bbox.width}
                [_top, _bottom, _left, _right] = [bbox.y, bbox.y+bbox.height, bbox.x, bbox.x+bbox.width]

                console.log "x:#{_left}\ty:#{_top}\tw:#{_right-_left}\th:#{_bottom-_top}"
                cut {level:0, top:_top, bottom:_bottom, left:_left, right:_right}
        , 5
    , 100


svg = domify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "start", "▸"
        button this, "stop",  "■"
        @$a href:"#{srcdirurl}/quadtree.coffee", "Source Code"
    @$div class:'canvas', ->
        @add new Template schema:'svg', ->
            @$svg {
                xmlns:svgns
                version:"1.1"
                height:"600px"
                width:"600px"
                preserveAspectRatio:"none"
                viewBox:"0 0 31 31"
                }, ->
                    path = createPath(this,
                        p:test2, x:0, y:0, r:0, b:0, g:0, a:1)
                    @ready(buildTree(this, path))


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

