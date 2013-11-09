BufferStream = require 'bufferstream'
streamify = require 'dt-stream'

##
# useful to just pump out html data to a stream
pipe = (template, stream) ->
    return streamify(template, {stream}).stream.once 'close', ->
        template.remove() # prevent memory leak

##
# useful for rendering a template directly into a response:
#   use this to let template generation run and buffer the out when needed
#       render(new Template(schema:'html5', body)).pipe(res)
#   use this to let template geenration be paused by output stream
#       render(new Template(schema:'html5', body), res)
render = (template, stream) ->
    return pipe template, stream ? new BufferStream
        encoding:'utf-8' # FIXME use template.options.encoding
        size:'flexible'
        disabled:yes


# exports

module.exports = render
module.exports.render = render
module.exports.pipe = pipe
