# [dynamictemplate](http://dodo.github.com/node-dynamictemplate/)

Yet another template engine, but this time loaded with full async support and
capable of being changed even after the template was rendered.

workz in browser too (but requires jquery).

→ [check out the demo](http://dodo.github.com/node-dynamictemplate/example/list.html)

## installation

```bash
$ npm install dynamictemplate
```

## documentation

### Template

```coffeescript
tpl = new Template schema:'xml', doctype:off, pretty:off, encoding:'utf-8', end:on, -> # default settings
    @$tag 'xml', ->
        @$tag 'child', "content"
```

this actually allows you to write real template with [asyncxml](https://github.com/dodo/node-asyncxml).
normally asyncxml just gives you the ability to write asyncronious xml generation.

### how to write tags

maybe the main difference to some other template engines is that all the tags are asyncronious.
this has the side effect that every tag has to be closed manually. this can get a little bit anoying when you write very large templates. that's  why i added a little shortcut which ivokes the end for you at the and of the children scope:

```coffeescript
@html ->
    @body("content").end()
    @end()

# is the exact same

@$html 'xml', ->
    @$body "content"
```

just add a `$` infront of the tag method and it is a little bit more sync again.

### adapters

dynamictemplate has a similar approach like [backbone.js](http://documentcloud.github.com/backbone/) where you can choose your own backend of your models, collections or in this case templates.


currently only the [jquery adapter](https://github.com/dodo/node-dynamictemplate/blob/master/src/dynamictemplate-jquery.coffee) is available:

```html
<script src="dynamictemplate-jquery.browser.js"></script>
<scipt>
    var jquerify = window.dynamictemplate.jquerify; // get the jquery adapter
</script>
```

just throw your template in it and add it to the DOM when it's ready:

```javascript
var tpl = jquerify(template(mydata));
tpl.on('end', function () {
    $('.container').append(tpl.jquery);
});
```

### the dynamic part

    TODO i couldnt find the time to build an example
    that's works best with dynamictemplate, so please stand by.


#### just fyi
this is not finished yet.
but please, make yourself comfortable, take a cookie and **start contributing**!


## example

if you are familiar with [coffeekup](http://coffeekup.org), you should recognize this:

```coffeescript
stringify = (func) -> func.toString()
shoutify = (s) -> s.toUpperCase() + "!"
template = ({title, desc, path, user, max}) ->
    new Template schema:5, doctype:on, ->
        @$html ->
            @$head ->
                @$meta charset:'utf-8'
                @$title "#{title or 'Untitled'} | My awesome website"
                if desc?
                    @$meta name:'description', content:desc
                @$link rel:'stylesheet', href:'/stylesheets/app.css'
                @$script src:'/javascripts/jquery.js'
                @$script stringify -> # browser code
                    $ ->
                        alert "Alerts are so annoying..."
        @$body ->
            @$header ->
                @$h1 title or 'Untitled'
                @$nav ->
                    @$ul ->
                        unless path is '/'
                            @$li -> @$a href:'/', "Home"
                        @$li -> @$a href:'/chunky', "Bacon!"
                        switch user.role
                            when 'owner', 'admin'
                                @$li -> @$a href:'/admin', "Secret Stuff"
                            when 'vip'
                                @$li -> @$a href:'/vip', "Exclusive Stuff"
                            else
                                @$li -> @$a href:'/commoners', "Just Stuff"
            @$section ->
                @$h2 "Let's count to #{max}:"
                @$p "#{i}" for i in [1..max]
            @$footer ->
                @$p shoutify "bye"
```
