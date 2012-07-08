{ Template, domify } = window.dynamictemplate
{ random, floor, min } = Math
running = no

svgns = "http://www.w3.org/2000/svg"

step = (attrs = {}, children) ->
    attrs = Object.create(attrs)
    attrs['class'] = "#{attrs['class'] ? ""} step"
    for attr in ['x', 'y', 'z', 'scale', 'rotate']
        if attrs[attr]?
            attrs["data-#{attr}"] = "#{attrs[attr]}"
            delete attrs[attr]
    for axe,attr of {x:'rotateX', y:'rotateY', z:'rotateZ'}
        if attrs[attr]?
            attrs["data-rotate-#{axe}"] = attrs[attr]
            delete attrs[attr]
    @$div(attrs, children)

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
    }, tick = ->
        setTimeout =>
            @attr 'r', "#{o.radius+=o['+']}"
            if --o.life then tick.call(this) else @remove()
        ,60


# ui == io → async
# good ux == juicy → do app as animation
# ux is sacred/holy
# ui is part of ux → people like to look at things
# modularity ftw
# function scope is necessary for async, so dont break it

presentation = domify new Template schema:5, ->
    @step = step.bind(this)


    ctx = id:'title', x:0, y:0
    @step ctx, "Δt"


    ctx = id:'what', class:'slide', x:-222, y:900, z:400, rotate:-90, rotateY:90
    @step ctx, -> @$h1 "template engine ?"
    delete ctx.id

    ctx.z -= 50; @step ctx, ->
        @$p "basics"
        @$div class:'fine hugh javascript tab', ->
            @$pre -> @$code class:'javascript', '''
// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
(function(){
  var cache = {};

  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :

      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        str
          .replace(/[\\r\\t\\n]/g, " ")
          .split("<%").join("\\t")
          .replace(/((^|%>)[^\\t]*)'/g, "$1\\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\\t").join("');")
          .split("%>").join("p.push('")
          .split("\\r").join("\\\\'")
      + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();''' # http://ejohn.org/blog/javascript-micro-templating/


    ctx = id:'problem', class:'slide', x:-222, y:900, z:ctx.z-900, rotate:-90, rotateY:90
    @step ctx, -> @$h1 "problem ?"
    delete ctx.id


    ctx.z -= 50; @step ctx, ->
        @$p "update"
        @$div class:'hugh html javascript tab', ->
            @$pre -> @$code class:'html', '''
<html>
  <body>
    <div id="clock"></div>
    <div id="body"></div>
  </body>
</html>'''
            @$pre -> @$code class:'javascript', '''
var tmpl1 = function (id, data) {
  var tpl = "<div>" + data + "</div>";
  document.getElementById(id).innerHTML(tpl);
};


var tmpl2 = function (id, data) {
  var tpl = "<div>"
    + "<span>" + data + "</span>"
    + '<input type="text" />'
    + "</div>";
  document.getElementById(id).innerHTML(tpl);
};


tmpl1("body", "foobar");

setInterval(function () {
  tmpl2("clock", Date.now());
}, 1000);'''


    ctx.z -= 50; @step ctx, ->
        @$p "recursion"
        @$div class:'hugh html javascript tab', ->
            @$pre -> @$code class:'html', '''
<html>
  <body>
    <div id="chat"></div>
  </body>
</html>'''
            @$pre -> @$code class:'javascript', '''
function chat(messages) {
  var tpl = '<div class="messages">';
  messages.forEach(function (message) {
    tpl += '<div class="message">'
        +  '<span class="name">'
        +  message.name
        +  '</span>'
        +  '<span class="content">'
        +  message.text
        +  '</span>'
        +  "</div>";
  });
  return tpl
    + '<div class="input">'
    +   '<input type="text" class="name" value="anonymous" />'
    +   '<input type="text" class="message" value="" />'
    + "</div>"
    + "</div>";
};


var tpl = chat([{name:"bot", text:"hello"}]);
document.getElementById("chat").innerHTML(tpl);'''


    ctx.z -= 50; @step ctx, ->
        @$p "query"
        @$div class:'hugh javascript tab', ->
            @$pre -> @$code class:'javascript', '''
function chat(messages) {
  var chat = $('<div>').addClass("messages");
  messages.forEach(function (message) {
    var msg =$('<div>').addClass("message");
    $('<span>')
      .addClass("name")
      .text(message.name)
      .appendTo(msg);
    $('<span>')
      .addClass("content")
      .text(message.text)
      .appendTo(msg);
    msg.appendTo(chat);
  });
  var input = $('<div>').addClass("input");
  $('<input>')
    .attr('type', "text")
    .addClass("name")
    .appendTo(input)
    .val("anonymous")
  $('<input>')
    .attr('type', "text")
    .addClass("message")
    .appendTo(input)
  input.appendTo(chat);
};'''


#     ctx.z -= 50; @step ctx, ->
#         @$p "animation"
#         @$div class:'javascript tab', ->
#             @$pre -> @$code class:'javascript', '''
# requestAnimationFrame foo'''


    ctx = id:'dt', class:'slide', x:222, y:-900, z:900, rotate:90, rotateY:-90
    @step ctx, -> @$h1 ->
        @$strong "Δt"
        @$small " dynamictemplate"
    delete ctx.id



    ctx.z -= 50; @step ctx, ->
        @$p "update"
        @$div class:'coffeescript tab', ->
            @$pre -> @$code class:'javascript', '''
chat = (view) ->
  new Template schema:5, ->
    @$div class:'messages', ->

      @$span class:'name', ->
        @text "anonymous"
        view.on('set name', @text)

      @$span class:'content', ->
        view.on('set content', @text)

      @$div class:'input', ->
        @$input type:'text', class:'name', "anonymous"
        @$input type:'text', class:'message' '''



    ctx.z -= 50; @step ctx, ->
        @$p "async"
        @$div class:'small coffeescript tab', ->
            @$h1 "UI === IO"
            @$pre -> @$code class:'coffeescript', '''
new Template schema:'html5', ->
    @$html ->
        @$head ->
            @title ->
                @text filename
                @end()
        @$body ->
            fs.createReadStream(filename).pipe @pre()'''



    ctx.z -= 50; @step ctx, ->
        @$p "modular"
        @$div class:'small list tab', ->
            @$p "as far as event based systems can be modular"
            @$p "Δt eco system:"
            @$ul ->
                @$li(mod) for mod in ['asyncxml', 'dynamictemplate', 'compiler with linker', 'adapters']
                @$li -> @$ul ->
                    @$li(adapter) for adapter in ['stream', 'DOM', 'JQuery']



    ctx.z -= 50; @step ctx, ->
        @$p ->
            @text "SVG support"
            @$span class:'svg controls', -> button this, "start", "▸"
        @$div class:'svg example tab', ->
            [w, h] = [400, 400]
            @$div class:'canvas', style:"width:#{w}px;height:#{h}px", ->
                @add new Template schema:'svg', ->
                    @$svg {
                        xmlns:svgns
                        version:"1.1"
                        height:"#{h}px"
                        width:"#{w}px"
                        preserveAspectRatio:"none"
                        viewBox:"0 0 #{w} #{h}"
                        }, ->
                            setInterval =>
                                return unless running
                                createCircle this,
                                    '+':(0.00001 + 2 * random())
                                    life:floor(5 + 42 * random())
                                    radius:floor(3 + 20 * random())
                                    size:floor(5 + 10 * random())
                                    x:floor(w * random())
                                    y:floor(h * random())
                                    r:floor(255 * random())
                                    g:floor(255 * random())
                                    b:floor(255 * random())
                                    a:min(0.8, 0.01 + random())
                            , 20
    ctx.z -= 50; @step ctx, ->
        @$p " "
        @$div class:'hugh fine coffeescript tab', ->
            @$pre -> @$code class:'coffeescript', '''
{ random, floor, min } = Math
svgns = "http://www.w3.org/2000/svg"
[w, h] = [400, 400]

createCircle = (tag, o) ->
    tag.$circle {
        xmlns:svgns
        fill:"none"
        stroke:"rgba(#{o.r},#{o.g},#{o.b},#{o.a})"
        style:"stroke-width:#{o.size}"
        cx:"#{o.x}"
        cy:"#{o.y}"
        r:"#{o.radius}"
    }, tick = ->
        setTimeout =>
            @attr 'r', "#{o.radius+=o['+']}"
            if --o.life then tick.call(this) else @remove()
        ,60

domify new Template schema:'svg', ->
    @$svg {
        xmlns:svgns
        version:"1.1"
        height:"#{h}px"
        width:"#{w}px"
        preserveAspectRatio:"none"
        viewBox:"0 0 #{w} #{h}"
        }, ->
            setInterval( =>
                return unless running
                createCircle this,
                    '+':(0.00001 + 2 * random())
                    life:floor(5 + 42 * random())
                    radius:floor(3 + 20 * random())
                    size:floor(5 + 10 * random())
                    x:floor(w * random())
                    y:floor(h * random())
                    r:floor(255 * random())
                    g:floor(255 * random())
                    b:floor(255 * random())
                    a:min(0.8, 0.01 + random())
            , 20)'''





    ctx = id:'end', class:'fine hidden slide', x:0, y:200
    @step ctx, ->
        @$p -> @$a href:"http://dodo.github.com/node-dynamictemplate/", "dodo.github.com/node-dynamictemplate"
        @$p -> @$a href:"https://identi.ca/dodothelast", "dodothelast@identi.ca"
        @$p ->
            @$a href:"https://twitter.com/dodothelast", "@dodothelast"
            @$small "twitter"
        @$p ->
            @$a href:"https://github.com/dodo", "@dodo"
            @$small "github"


# initialize

presentation.ready ->
    el = $('#impress')
    for child in presentation.dom
        el.append child


    $('.hidden').each((e) -> $(this).hide())
    setTimeout(hljs.initHighlighting, 1000) # fuuuu, Tag::ready is borken :(
    impress().init()

    $('#start').live 'click', ->
        $('.hidden').each((e) -> $(this).show())
        if running
            $(this).attr value:"▸"
            console.log "animation paused."
            running = no
        else
            $(this).attr value:"■"
            console.log "animation resumed."
            running = yes

window.mytoggle = ->
    $('#start').click()


console.log 'coffeescript loaded.'

