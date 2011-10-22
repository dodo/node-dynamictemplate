{ Tag, Builder } = require '../async-xml'


module.exports =

    simple: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.once 'data', (tag) -> æ.equal "<test/>", tag
        xml.tag('test').end()
        xml.end()

    'escape': (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<test>'
            '&lt;&quot;lind&quot;&amp;wurm&gt;'
            '</test>'
        ]
        test = xml.tag('test')
        test.text '<"lind"&wurm>', escape:yes
        test.end()
        do æ.done

    chain: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<test>'
            '<items>'
            '<item value="a"/>'
            '<item value="b"/>'
            '<item value="c"/>'
            '</items>'
            '</test>'
        ]
        xml
            .tag('test')
                .tag('items')
                    .tag('item', value:'a').up()
                    .tag('item', value:'b').up()
                    .tag('item', value:'c').up()
                .up()  # test
            .up()  # items
        .end() # xml

    attr: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<test>'
            '<item value="b" a=1 b=2 c=3/>'
            '</test>'
        ]
        test = xml.tag('test')
        item = test.tag('item', value:'a')
        æ.equal item.attr('value'), "a"
        item.attr(a:1, b:2, c:3)
            .attr('value', "b")
        æ.equal item.attr('value'), "b"
        item.up().up().end()

    toString: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<test>'
            'rofl'
            'lol'
            '<item value="a" a=1 b=2 c=3/>'
            '</test>'
        ]
        test = xml.tag('test')
        test.text("rofl")
        item = test.tag('item', value:'a', a:1, b:2, c:3)
        test.text("lol")
        item.up().up().end()
        æ.equal test.toString(), '<test>lol</test>'
        æ.equal item.toString(), '<item value="a" a=1 b=2 c=3/>'

    text: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<test>'
            'in here'
            '</test>'
        ]
        test = xml.tag('test')
        test.text "in here"
        æ.equal test.text(), "in here"
        test.end()
        xml.end()


    attributes: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.once 'data', (tag) -> æ.equal "<test a=1 b=\"b\" c/>", tag
        xml.tag('test', a:1, b:'b', c:null).end()
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
        apple = xml.tag('apple')
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
        apple = xml.tag('apple')
        wurm = apple.tag('wurm')
        apple.end()
        wurm.end()


    children: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<apple>'
            '<wurm color="red">'
            '<seed/>'
            '</wurm>'
            '</apple>'
        ]
        apple = xml.tag 'apple', ->
            @$tag 'wurm', color:'red', ->
                @tag('seed').end()
            apple.end()
        xml.end()


    'async children': (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<apple>'
            '<wurm color="red">'
            '<seed>'
            '<is dead="true"/>'
            '</seed>'
            '</wurm>'
            '</apple>'
        ]

        seed = null
        apple = xml.tag 'apple', ->
            @$tag 'wurm', color:'red', ->
                seed = @tag('seed')
            apple.end()

        setTimeout ( ->
            æ.notEqual seed, null
            return unless seed
            seed.tag('is', dead:yes).end()
            seed.end()
        ), 3

        xml.end()


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

        global = xml.tag('global')
        test = global.tag('test', version:3, alt:"info", border:0)
        test.tag('top', center:yes).end()
        foo = test.tag('foo', bar:'moo', border:0)

        global.end()
        xml.end()

        foo.tag('first').end()
        bar = foo.tag('bar', x:2)
        foo.tag('center', args:true).end()
        foo.tag('last').end()
        xxx = foo.tag('xxx', ccc:yes)

        bar.end()
        xxx.tag('pok').end()
        foo.end()

        xxx.tag('asd').end()

        xxx.tag('happy', dodo:null).end()
        test.end()

        xxx.end()


    delayed: (æ) ->
        xml = new Builder
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<grass>'
            '<dog/>'
            '<cat/>'
            '</grass>'
        ]
        dog = null
        grass = xml.tag('grass')
        setTimeout ( ->
            dog = grass.tag('dog')
        ), 2
        setTimeout ( ->
            grass.tag('cat').end()
            dog.end()
        ), 4
        setTimeout ( ->
            grass.end()
        ),3


