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



presentation = domify new Template schema:5, ->
    @step = step.bind(this)


    ctx = id:'title', x:0, y:0
    @step ctx, "Δt"


    ctx = id:'what', class:'slide', x:-222, y:900, z:400, rotate:-90, rotateY:90
    @step ctx, -> @$h1 "template engine ?"
    delete ctx.id
    ctx.z -= 50; @step ctx, ->
        @$p "format data in a specific way"
        @$div class:'small django tab', ->
            @$pre -> @$code class:'django', '''
{% if articles|length %}
{% for article in articles %}

{# Striped table #}
<tr class="{% cycle odd,even %}">
  <td>{{ article|default:"Hi... "|escape }}</td>
  <td {% if article.today %}class="today"{% endif %}>
    {{ article.date|date:"d.m.Y" }}
  </td>
</tr>

{% endfor %}
{% endif %}

{% comment %}
Comments may be long and
multiline.
{% endcomment %}''' # http://softwaremaniacs.org/media/soft/highlight/test.html

    ctx.z -= 50; @step ctx, ->
        @$p "simplify html generation"
        @$div class:'haml erb tab', ->
            @$pre -> @$code class:'haml', '''
#profile
  .left.column
    #date= print_date
    #address= current_user.address
  .right.column
    #email= current_user.email
    #bio= current_user.bio''' # http://haml-lang.com/
            @$pre -> @$code class:'erb', '''
<div id="profile">
  <div class="left column">
    <div id="date"><%= print_date %></div>
    <div id="address"><%= current_user.address %></div>
  </div>
  <div class="right column">
    <div id="email"><%= current_user.email %></div>
    <div id="bio"><%= current_user.bio %></div>
  </div>
</div>''' # http://haml-lang.com/

    ctx.z -= 50; @step ctx, ->
        @$p "running on server and/or browser side"
        @$div class:'javascript tab', ->
            @$pre -> @$code class:'javascript', '''
var html = '<span class="name">User</span>'
      + '...<span class="name">User</span>';

var data = { "username": "John Smith" };
var map = plates.Map();

map.class('name').to('username');

console.log(plates.bind(html, data, map));''' # http://flatironjs.org/#templating
            @$pre -> @$code class:'javascript',  '''
var html = '<a href="/"></a>';

var data = { "newurl": "http://www.nodejitsu.com" };
var map = plates.Map();

map.where('href').is('/').insert('newurl');

console.log(plates.bind(html, data, map));''' # http://flatironjs.org/#templating
            @$pre -> @$code class:'javascript', "// flatiron.js' templating engine Plates"

    ctx.z -= 50; @step ctx, ->
        @$p ->
            @text "binding functionality to UI"
            @$small " (in browser)"
        # FIXME would be a better example: http://learn.knockoutjs.com/#/?tutorial=loadingsaving
        @$div class:'small html javascript tab', ->
            @$pre -> @$code class:'fine html', '''
<p>First name: <strong data-bind="text: firstName"></strong></p>
<p>Last name: <strong data-bind="text: lastName"></strong></p>''' # http://learn.knockoutjs.com/#/?tutorial=intro
            @$pre -> @$code class:'javascript', '''
function AppViewModel() {
    this.firstName = "Bert";
    this.lastName = "Bertington";
}

// Activates knockout.js
ko.applyBindings(new AppViewModel());''' # http://learn.knockoutjs.com/#/?tutorial=intro


    ctx = id:'problem', class:'slide', x:-222, y:900, z:ctx.z-600, rotate:-90, rotateY:90
    @step ctx, -> @$h1 "problem ?"
    problem_z = ctx.z
    delete ctx.id
    ctx.z -= 50; @step ctx, ->
        @$p "logic & markup mixed up"
        @$div class:'small eco tab', ->
            @$pre -> @$code class:'eco', '''
<% if @projects.length: %>
  <% for project in @projects: %>
    <a href="<%= project.url %>"><%= project.name %></a>
    <p><%= project.description %></p>
  <% end %>
<% else: %>
  No projects
<% end %>''' # https://github.com/sstephenson/eco#readme

    ctx.z -= 50; @step ctx, ->
        @$p "string concatination & eval"
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

    ctx.z -= 50; @step ctx, ->
        @$p "DSL (Domain Specific Language)"
        @$div class:'small haml mustache tab', ->
            @$p "haml"
            @$pre -> @$code class:'haml', '''
%p
  Date/Time:
  - now = DateTime.now
  %strong= now
  - if now > DateTime.parse(data.apocalyse.date)
    = "Hail Cthulhu"''' # http://haml-lang.com/docs/yardoc/
            @$p "mustache"
            @$pre -> @$code class:'mustache', '''
{{#repos}}<b>{{name}}</b>{{/repos}}
{{^repos}}No repos :({{/repos}}''' # https://github.com/janl/mustache.js/#inverted-sections

    ctx.z -= 20;
    ctx.z -= 50; @step ctx, ->
        @$p "DOM manipulation is heavy"
        @$div class:'fine hugh html tab', ->
            @$pre -> @$code class:'html', '''
<html>
<head>
<title>Traversing HTML Table with js and DOM</title>
<script>
function start() {
  // get the reference for the body
  var body = document.getElementsByTagName("body")[0];
  // creates a <table> element and a <tbody> element
  var tbl     = document.createElement("table");
  var tblBody = document.createElement("tbody");
  // creating all cells
  for (var j = 0; j < 2; j++) {
    // creates a table row
    var row = document.createElement("tr");
    for (var i = 0; i < 2; i++) {
      // Create a <td> element and a text node, make the text
      // node the contents of the <td>, and put the <td> at
      // the end of the table row
      var cell = document.createElement("td");
      var cellText = document.createTextNode("cell is row "+
        j+", column "+i);
      cell.appendChild(cellText);
      row.appendChild(cell);
    }
    // add the row to the end of the table body
    tblBody.appendChild(row);
  }
  // put the <tbody> in the <table>
  tbl.appendChild(tblBody);
  // appends <table> into <body>
  body.appendChild(tbl);
  // sets the border attribute of tbl to 2;
  tbl.setAttribute("border", "2");
}
</script>
</head>
<body onload="start()">
</body>
</html>''' # https://developer.mozilla.org/en/Traversing_an_HTML_table_with_JavaScript_and_DOM_Interfaces

    ctx.z -= 50; @step ctx, ->
        @$p "… and so is querying too"
        @$div class:'small fine javascript tab', ->
            @$pre -> @$code class:'javascript', '''
var WindowManager = (function() {
  // Hold Home key for 1 second to bring up the app switcher.
  // Should this be a setting?
  var kLongPressInterval = 1000;

  // Some document elements we use
  var screen = document.getElementById('screen');
  var statusbar = document.getElementById('statusbar');
  var windows = document.getElementById('windows');
  var taskManager = document.getElementById('taskManager');
  var taskList = taskManager.getElementsByTagName('ul')[0];
…''' # https://github.com/andreasgal/gaia/blob/8e690533cc3d7/apps/homescreen/js/window_manager.js#L45-55

    ctx.z -= 50; @step ctx, ->
        @$p ->
            @text "data binding"
            @$small " (it's ok, just don't overuse them)"
        @$div class:'small html tab', ->
            @$pre -> @$code class:'html', "<!--  data-* -->"
            @$pre -> @$code class:'html', '''
<div id="big" class="step"
  data-x="3500" data-y="2100"
  data-rotate="180" data-scale="6">

  <p>
    visualize your <b>big</b> <span
      class="thoughts">thoughts</span>
  </p>

</div>''' # https://github.com/bartaz/impress.js/blob/10b14ba7681d7ff1e/index.html#L224-226


    ctx = id:'dt', class:'slide', x:222, y:-900, z:900, rotate:90, rotateY:-90
    @step ctx, -> @$h1 ->
        @$strong "Δt"
        @$small " dynamictemplate"
    delete ctx.id
    ctx.z -= 50; @step ctx, ->
        @$p "event based"
        @$div class:'small list tab', ->
            @$ul ->
                @$li(event) for event in ['add', 'attr', 'text', 'raw', 'data', 'show', 'hide', 'remove', 'replace', 'close']

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
        @$p "async"
        @$div class:'small coffeescript tab', ->
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


    ctx = id:'solution', class:'right hidden slide', x:-222, y:844, z:problem_z, rotate:-90, rotateY:90
    @step ctx, -> @$h1 ""
    delete ctx.id
    ctx.z -= 50; @step ctx, ->
        @$p "Δt HTML Compiler"
        @$div class:'hugh left html javascript tab', ->
            @$p "compiles static HTML files to masks"
            @$pre -> @$code class:'fine html', '''
<div class="container">
    <ul class="list">
        <div class="controls">
            <a href="#">sort</a>
        </div>
        <li class="entry">
            blub blub
        </li>
        <li class="entry">
            foo bar
        </li>
    </ul>
</div>''' # https://github.com/dodo/node-dt-compiler#readme
            @$pre -> @$code class:'fine coffeescript', '''
compiler.build
  path:path.join(__dirname, "masks")
  dest: "list.js"
  select: ->
    # select ul tag and all children,
    #   but remove all li entries
    el = @select '.list', 'li'
    # set a static url
    el.find('.controls > a:first')
      .attr('href', '/sort')
    return el''' # https://github.com/dodo/node-dt-compiler#readme
            @$pre -> @$code class:'fine coffeescript', '''
design = require './mask/lists'
module.exports = design (view) ->
  return new Template schema:'html5', pretty:on, ->
    @$ul ->
      # append new entries to the list
      view.on('entry', @add)''' # https://github.com/dodo/node-dt-compiler#readme

    ctx.z -= 50; @step ctx, ->
        @$p "Δt Stream Adapter"
        @$div class:'hugh left html coffeescript tab', ->
            @$pre -> @$code class:'fine coffeescript', '''
BufferStream = require 'bufferstream'
streamify = require 'dt-stream'
##
# useful for rendering a template directly into a response:
#   render(new Template(schema:'html5', body).pipe(res))
render = (template) ->
    buffer = new BufferStream
        encoding:'utf-8'
        size:'flexible'
        disabled:yes
    streamify(template).stream.pipe(buffer)
    return buffer'''
            @$pre -> @$code class:'fine coffeescript', '''
output = render new Template schema:5, doctype:on, ->
    @$html ->
        @$head ->
            @$title "holla"
        @$body ->
            @$p "hello world"'''
            @$p "output:"
            @$pre -> @$code class:'fine html', '''
<!DOCTYPE html>'
<html>
  <head>
    <title>
      holla
    </title>
  </head>
  <body>
    <p>
      hello world
    </p>
  </body>
</html>'''

    ctx.z -= 50; @step ctx, ->
        @$p "it's coffeescript"
        @$p class:'small left javascript tab', ->
            @$pre -> @$code class:'fine javascript', '''
var tree = [{name:'div',
             attr:{class:'block'},
             children:[]}];
function traverse(tag, el) {
    if (typeof(el) === 'string')
        return tag.text(el);
    return tag.$tag(el.name, el.attr, function () {
        el.children.forEach(traverse.bind(0, this));
    });
}'''
    ctx.z -= 20;
    ctx.z -= 50; @step ctx, ->
        @$p "browser support"
        @$div class:'hugh left coffeescript tab', ->
            @$p "Δt DOM or JQuery Adapter"
            @$pre -> @$code class:'fine coffeescript', '''
button = (tag, id, value) ->
    tag.$input
        class:'button'
        type:'button'
        id:id
        value:value
        title:id

# every other event system should be suitable as well
tplapi = new EventEmitter
list = jqueryify new Template schema:5, ->
    @$div class:'controls', ->
        button this, "add",    "add random entry"
        button this, "remove", "remove random entry"

    @$ul class:'list', ->
        tplapi.on 'add', =>
            console.log "add entry"
            items.push @$li ->
                @$p "#{Math.random()}"

# initialize

list.ready ->
    for el in list.jquery
        $('body').append el

    $('#add').live 'click', ->
        tplapi.emit 'add' # tell the template to add a new entry

    $('#remove').live 'click', ->
        items.shift()?.remove()''' # http://dodo.github.com/node-dynamictemplate/example/list.coffee

    ctx.z -= 50; @step ctx, ->
        @$p "no queries"
    ctx.z -= 50; @step ctx, -> @$p "event listeners"


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

