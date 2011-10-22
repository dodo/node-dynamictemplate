BufferStream = require 'bufferstream'


##
# useful for rendering a template directly into a response:
#   render(new Template(schema:'html5', body).pipe(res))
render = (template) ->
    buffer = new BufferStream size:'flexible', disabled:yes

    template.on 'data', buffer.write
    template.on 'end' , buffer.end

    return buffer

# exports

module.exports = render
