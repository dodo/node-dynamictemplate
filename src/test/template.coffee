path = require 'path'
{ readFile } = require 'fs'
{ Template } = require '../dynamictemplate'

module.exports =

    simple: (æ) ->
        xml = new Template ->
            @$tag('test')
        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal "<test/>", tag


    html5: (æ) ->
        content = ["a", "b", "c"]
        xml = new Template schema:'html5', ->
            @$html ->
                @body ->
                    readFile path.join(__dirname,"filename"), (err, filedata) =>
                        @$div class:'test', filedata
                        @$ul ->
                            content.forEach (data) =>
                                li = @$li({'data-content':data}, data)
                        @end()


        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<html>'
            '<body>'
            '<div class="test">'
            'hello world\n'
            '</div>'
            '<ul>'
            '<li data-content="a">'
            'a'
            '</li>'
            '<li data-content="b">'
            'b'
            '</li>'
            '<li data-content="c">'
            'c'
            '</li>'
            '</ul>'
            '</body>'
            '</html>'
        ]
