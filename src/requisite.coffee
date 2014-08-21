path = require 'path'

# optional require to lazy require template masks generated eg by dt-compiler
requisite = (dirs..., name) ->
    fullname = path.join(dirs..., name)
    mod = (x) -> x
    try
        mod = require(fullname)
    catch err
        console.warn "requisite #{name} went missing."
    finally
        return mod

# exports

requisite.requisite = requisite
module.exports = requisite
