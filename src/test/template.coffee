
{ Template } = require '../async-xml'

module.exports =

    simple: (æ) ->
        xml = new Template ->
            do @$tag('test')
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal "<test/>", tag


    html5: (æ) ->
        content = ["a", "b", "c"]
        xml = new Template schema:'html5', ->
            @$html ->
                @$body ->
                    @$div class:'test', "lala"
                    @ul ->
                        content.forEach (data) =>
                            @$li.end null, data
                        @end()

        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<html>'
            '<body>'
            '<div class="test">'
            'lala'
            '</div>'
            '<ul>'
            '<li>'
            'a'
            '</li>'
            '<li>'
            'b'
            '</li>'
            '<li>'
            'c'
            '</li>'
            '</ul>'
            '</body>'
            '</html>'
        ]
