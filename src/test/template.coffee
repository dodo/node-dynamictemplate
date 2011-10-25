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
        xml = new Template schema:5, ->
            @$html ->
                @body ->
                    file = path.join(__dirname,"..","..","..","filename")
                    readFile file, (err, filedata) =>
                        @$div class:'test', (filedata or err)
                        @$ul ->
                            content.forEach (data) =>
                                li = @$li({'data-content':data}, data)
                        @end()


        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<!DOCTYPE html>'
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

    'layout': (æ) ->

        layout = ({title}, callback) ->
            new Template schema:'html5', ->
                @$html ->
                    @$head ->
                        @$title title
                    @$body ->
                        @div class:'body', ->
                            callback?.call(this)

        template = (data) ->
            layout data, ->
                @$p data.content
                @end()


        xml = template data =
            title:'test'
            content:'..'

        xml.on 'end', æ.done
        xml.on 'data', (tag) -> æ.equal results.shift(), tag
        results = [
            '<!DOCTYPE html>'
            '<html>'
            '<head>'
            '<title>'
            data.title
            '</title>'
            '</head>'
            '<body>'
            '<div class="body">'
            '<p>'
            data.content
            '</p>'
            '</div>'
            '</body>'
            '</html>'
        ]

