require 'colors'
util = require('util')
util.orginspect = util.inspect
util.inspect = require('eyes').inspector(stream: null, hexy:{format:'fours'})


{ Tag, Builder } = require '../async-xml'


module.exports =
    simple: (æ) ->
        xml = new Builder
        xml.once 'data', (tag) -> æ.equal "<test/>", tag
        xml.tag('test')
        do æ.done

    attributes: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.once 'data', (tag) -> æ.equal "<test a=1 b=\"b\" c/>", tag
        xml.tag('test').end a:1, b:'b', c:null
        do æ.done

    'default pretty': (æ) ->
        xml = new Builder pretty:on
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<apple>'
            '  <wurm/>'
            '</apple>'
        ]
        apple = xml.tag('apple')()
        apple.tag('wurm').end()
        apple.end()
        do æ.done

    'opts pretty': (æ) ->
        xml = new Builder pretty:"→ → →"
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<apple>'
            '→ → →<wurm/>'
            '</apple>'
        ]
        apple = xml.tag('apple')()
        wurm = apple.tag('wurm')()
        apple.end()
        wurm.end()

    complex: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<global>'
            '<test version=3 alt="info" border=0>'
            '<top center="true"/>'
            '<foo bar="moo" border=0>'
            '<first/>'
            '<bar x=2/>'
            '<center args="true"/>'
            '<last/>'
            '<xxx ccc="true">'
            '<pok/>'
            '<asd/>'
            '<happy dodo/>'
            '</xxx>'
            '</foo>'
            '</test>'
            '</global>'
        ]

        global = xml.tag('global')()
        test = global.tag('test') version:3, alt:"info", border:0
        test.tag('top').end center:yes
        foo = test.tag('foo')(bar:'moo', border:0)

        global.end()
        xml.end()

        foo.tag('first').end()
        bar = foo.tag('bar') x:2
        foo.tag('center').end args:true
        foo.tag('last').end()
        xxx = foo.tag('xxx') ccc:yes

        bar.end()
        xxx.tag('pok').end()
        foo.end()

        xxx.tag('asd').end()

        xxx.tag('happy').end dodo:null
        test.end()

        xxx.end()

