# [Δt dynamictemplate](http://dodo.github.com/node-dynamictemplate/)

[dynamictemplate](http://dodo.github.com/node-dynamictemplate/) is yet
another template engine, but this time loaded with full async support
and capable of being changed even after the template was rendered.

It works in browsers too (requires JQuery).

→ [Check out the demo!](http://dodo.github.com/node-dynamictemplate/example/list.html)

## Installation

```bash
$ npm install dynamictemplate
```

## Documentation

### Writing templates

```coffeescript
tpl = new Template schema:'xml', doctype:off, pretty:off, encoding:'utf-8', end:on, -> # default settings
    @$tag 'xml', ->
        @$tag 'child', "content"
```

This actually allows you to write real templates with [asyncxml](https://github.com/dodo/node-asyncxml).
Normally, asyncxml just gives you the ability to write asynchronous XML-generating code.

### How to write tags

Maybe the main difference to some other template engines is that all the tags are asynchronous.
This has the side effect that every tag has to be closed manually. As this can get a little bit anoying when you write very large templates, I added a little shortcut which invokes the end for you at the and of the child scope:

```coffeescript
@html ->
    @body("content").end()
    @end()

# is the exactly same as

@$html 'xml', ->
    @$body "content"
```

Just add a dollar sign (`$`) in front of the tag method and it acts a little bit more synchronous again.

### Plugins

 * [Δt compiler](https://github.com/dodo/node-dt-compiler) - this compiles static HTML to template masks.
 * [Δt jquery adapter](https://github.com/dodo/node-dt-jquery) - this lets you insert the template into dom with the help of [jQuery](http://jquery.com/).

### The dynamic part

    TODO i couldnt find the time to build an example
    that's works best with dynamictemplate, so please stand by.


#### Just FYI

This is not finished yet.
But please, make yourself comfortable, take a cookie and **start contributing**!


## Example

If you are familiar with [coffeekup](http://coffeekup.org), you should recognize this:

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
