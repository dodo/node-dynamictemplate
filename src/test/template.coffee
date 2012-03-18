path = require 'path'
{ readFile } = require 'fs'
{ Template } = require '../dynamictemplate'
streamify = require 'dt-stream'

module.exports =

    simple: (æ) ->
        xml = streamify new Template ->
            @$tag('test')
        check = "no data"
        xml.stream.on 'data', (tag) ->
            æ.equal "<test/>", tag
            check = "got data"
        xml.stream.on 'end', ->
            æ.equal check, "got data"
            æ.done()


    html5: (æ) ->
        content = ["a", "b", "c"]
        xml = streamify new Template schema:5, doctype:on, ->
            @$html ->
                @body ->
                    file = path.join(__dirname,"..","filename")
                    readFile file, (err, filedata) =>
                        @$div class:'test', (filedata or err)
                        @$ul ->
                            content.forEach (data) =>
                                li = @$li({'data-content':data}, data)
                        @end()

        xml.stream.on 'data', (tag) -> æ.equal results.shift(), tag
        xml.stream.on 'end', ->
            æ.equal 0, results.length
            æ.done()
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


    pretty: (æ) ->
        xml = streamify new Template schema:5, pretty:" ", doctype:on, ->
            @$html ->
                @$head ->
                    @$title "holla"
                @$body ->
                    @$p "hello world"
#         xml.ready æ.done
        xml.stream.on 'data', (tag) -> æ.equal results.shift(), tag
        xml.stream.on 'end', ->
            æ.equal 0, results.length
            æ.done()
        results = [
            '<!DOCTYPE html>\n'
            '<html>\n'
            ' <head>\n'
            '  <title>\n'
            '  holla\n'
            '  </title>\n'
            ' </head>\n'
            ' <body>\n'
            '  <p>\n'
            '  hello world\n'
            '  </p>\n'
            ' </body>\n'
            '</html>\n'
        ]


    layout: (æ) ->

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


        xml = streamify template data =
            title:'test'
            content:'..'

        xml.stream.on 'data', (tag) -> æ.equal results.shift(), tag
        xml.stream.on 'end', ->
            æ.equal 0, results.length
            æ.done()
        results = [
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


    'self closing': (æ) ->
        xml = streamify new Template schema:5, pretty:" ", doctype:on, ->
            @$html ->
                @$body ->
                    @$div()
                    @$br()
        xml.stream.on 'data', (tag) -> æ.equal results.shift(), tag
        xml.stream.on 'end', ->
            æ.equal 0, results.length
            æ.done()
        results = [
            '<!DOCTYPE html>\n'
            '<html>\n'
            ' <body>\n'
            '  <div>\n'
            '  </div>\n'
            '  <br/>\n'
            ' </body>\n'
            '</html>\n'
        ]


