BufferStream = require 'bufferstream'
streamify = require 'dt-stream'


##
# useful for rendering a template directly into a response:
#   render(new Template(schema:'html5', body).pipe(res))
render = (template) ->
    buffer = new BufferStream
        encoding:'utf-8' # FIXME use template.options.encoding
        size:'flexible'
        disabled:yes
    streamify(template).stream.pipe(buffer).once 'close', ->
        template.remove() # prevent memory leak
    return buffer

# exports

module.exports = render
