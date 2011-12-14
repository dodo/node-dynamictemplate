
{ Tag, Builder } = require 'asyncxml'
Template = require './template'

module.exports = { Tag, Builder, Template }

# browser support

( ->
    if @dynamictemplate?
        @dynamictemplate.Template = Template
        @dynamictemplate.Builder  = Builder
        @dynamictemplate.Tag      = Tag
    else
        @dynamictemplate = module.exports
).call window if process.title is 'browser'

