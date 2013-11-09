{ Template } = require '../dynamictemplate'
{ render, pipe } = require '../render'


module.exports =

    pipe: (æ) ->
        output = pipe new Template schema:5, doctype:on, ->
            @$html ->
                @$head ->
                    @$title "holla"
                @$body ->
                    @$p "hello world"


        output.on 'data', (tag) -> æ.equal results.shift(), tag.toString()
        output.on 'end', ->
            æ.equal 0, results.length
            æ.done()
        results = [
            '<!DOCTYPE html>'
            '<html>'
            '<head>'
            '<title>'
            'holla'
            '</title>'
            '</head>'
            '<body>'
            '<p>'
            'hello world'
            '</p>'
            '</body>'
            '</html>'
        ]


    simple: (æ) ->
        output = render new Template schema:5, doctype:on, ->
            @$html ->
                @$head ->
                    @$title "holla"
                @$body ->
                    @$p "hello world"


        output.on 'data', (tag) -> æ.equal results.shift(), tag.toString()
        output.on 'end', ->
            æ.equal 0, results.length
            æ.done()
        results = [
            '<!DOCTYPE html>'
            '<html>'
            '<head>'
            '<title>'
            'holla'
            '</title>'
            '</head>'
            '<body>'
            '<p>'
            'hello world'
            '</p>'
            '</body>'
            '</html>'
        ]
