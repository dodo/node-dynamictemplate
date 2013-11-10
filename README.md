# ![Δt](https://s3.amazonaws.com/cloud.ohloh.net/attachments/49947/%CE%94t_med.png)[dynamictemplate](http://dodo.github.com/node-dynamictemplate/)



[dynamictemplate](http://dodo.github.com/node-dynamictemplate/) is yet
another template engine, but this time loaded with full async support
and capable of being changed even after the template was rendered.

It works in browsers too.

→ [Check out the demo!](http://dodo.github.com/node-dynamictemplate/example/circles.html)

## Installation

```bash
$ npm install dynamictemplate
```

## Solutions

if any of this problems are familiar to you, you should skip the tl;dr and read the documentation:

 * building a real-time user interface
 * updating large chunks of DOM
 * manipulating nested DOM structures
 * working with a designer
 * isomorph code
 * html streaming


## TL;DR

Convenient DOM manipulation in template style for real-time user interfaces.

 * async & dynamic → changeable even after template was rendered
 * pure javascript with a hugh event based api → modular & extendable
 * runs on server and browser side
 * different approach than dom: don't get your elements out of the black box. keep only those which you need.
 * minimalistic (all the other stuff is hidden in modules :P)

## Documentation


Writing and maintaining user interfaces can be hard.

Δt is this new event based way of writing and maintaining user interfaces in javascript.

DOM has growen old. It's one of the legacies from the last millenium each browser caries with it.
Like nearly every browser API, the DOM has an ,opinionated, ugly interface to work with:
the fastest way to fill a DOM is `innerHTML`, the way to get stuff back once its parsed is by querying it, the convenient way to manipulate it is by changing, creating and removing nodes. so WTF.
These are the reasons why jquery and mootools are still the most used js libraries. but seriously, have you every tried to write an large userinterface with it?

So let's try something new:

```javascript
var Template = require('dynamictemplate').Template;
var tpl = new Template({schema:'html5'}, function () {
    this.div(function () {
        this.text("hello world");
        this.end();
    });
});
```

```coffeescript
{ Template } = require 'dynamictemplate'
tpl = new Template schema:'html5', ->
    @div ->
        @text "hello world"
        @end()
```

That was easy. We created a new template instance and with it a new `<div>` element with some text and closed it.

Let's try something more complex:

```javascript
function template(view) {
    return new Template({schema:5}, function () {
        this.$div(function () {
            view.on('set title', this.text);
        });
        this.$a(function () {
            this.text("back");
            view.on('navigate', function (url) {
                this.attr('href', url);
            }.bind(this));
        });
    });
}
```

```coffeescript
template = (view) ->
     new Template schema:'5', ->
        @$div ->
            view.on('set title', @text)
        @$a href:'/', ->
            @text "back"
            view.on('navigate', (url) => @attr(href:url))
```

Ok. let me explain: we created a div which text changes on every 'set title' event the view object will emit and we created an anchor element which `href` attribute will change on every 'navigate' event. that's it.
note that the div element will be empty at the beginning.
if you play a while with it you might hit some known problems from nodejs: flow control. how convenient that it seems that nearly everybody has writting her own library. **Use your own flow control library!**
if you don't know any, [async](https://github.com/caolan/async#readme) might be a good fit.

if you already started playing around with it you might found out that nothing is happing. Its because each `this.div` call doesn't produce a div tag but a `new` and a `add` event with the object representation of the div tag as argument. Doesn't sound very useful to you? how about you use one of the many adapters? An Adapter is little modules that listens for these events and act accordingly on its domain. This means if you use dt-jquery or dt-dom it will create a dom element. in the case of dt-stream it will create a nodejs stream instance that emits html strings as data.

```javascript
var jqueryify = require('dt-jquery');
tpl = jqueryify(template(view));
// or
var domify = require('dt-dom');
tpl = domify(template(view));
// or
var streamify = require('dt-stream');
tpl = streamify(template(view));
```
For more information on the events look at [asyncxml](http://dodo.github.com/node-asyncxml/) which generates them.

Let's have another example:

```javascript
function template(view) {
    return new Template({schema:5}, function () {
        this.$div({class:'user'}, function () {
            var name = this.a({class:'name'});
            var about = this.span({class:'about'});
            view.on('set user', function setUser(user) {
                name.text(user.name);
                name.attr('href', user.url);
                about.text(user.description);
            });
            setUser(view.currentUser);
            about.end();
            name.end();
        });
    });
}
```

```coffeescript
template = (view) ->
    new Template schema:5, ->
        @$div class:'user', ->
            name = @a(class:'name')
            about = @span(class:'about')
            setUser = (user) ->
                name.text(user.name)
                name.attr(href:user.url)
                about.text(user.description)
            view.on('set user', setUser)
            setUser(view.currentUser)
            about.end()
            name.end()

```

Alright. here is the trick: unlike the DOM where you normally have to query most elements, which feels mostly like grabbing into a black box with spiders and snakes, with Δt you already created the tags, so store them in variables, scopes and/or closures when you need them.

For more information look at the various examples and plugins supporting Δt:

### Plugins

 * [Δt compiler](http://dodo.github.com/node-dt-compiler) - this compiles static HTML (like mockup files from a designer) to template masks.
 * [Δt stream adapter](http://dodo.github.com/node-dt-stream) - this lets you use node's beloved Stream to get static HTML from the templates.
 * [Δt jquery adapter](http://dodo.github.com/node-dt-jquery) - this lets you insert the template into dom with the help of [jQuery](http://jquery.com/).
 * [Δt list](http://dodo.github.com/node-dt-list) - this gives all you need to handle an ordered list of tags.
 * [Δt selector](http://dodo.github.com/node-dt-selector) - this gives you specific selected tags without modifing the template.


[![Build Status](https://secure.travis-ci.org/dodo/node-dynamictemplate.png)](http://travis-ci.org/dodo/node-dynamictemplate)



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/dodo/node-dynamictemplate/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

