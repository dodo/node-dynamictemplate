BufferStream = require 'bufferstream'
Stream = require 'stream'
streamify = require 'dt-stream'


##
# useful for rendering a template directly into a response:
#   render(new Template(schema:'html5', body).pipe(res))
render = (template) ->
    buffer = new BufferStream
        encoding:'utf-8'
        size:'flexible'
        disabled:yes
    streamify(template).stream.pipe(buffer)
    return buffer

# exports

module.exports = render
