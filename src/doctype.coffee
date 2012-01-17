
doctype =
    'xml': ({encoding}) -> "<?xml version=\"1.0\" encoding=\"#{encoding}\" ?>"
    'html' : -> "<!DOCTYPE html>"
    'html5': -> "#{do doctype.html}"
    'mobile' : ->
        '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD '+
        'XHTML Mobile 1.2//EN" '+
        '"http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">'
    'html-ce': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Transitional//EN" '+
        '"ce-html-1.0-transitional.dtd">'
    'strict'  : ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Strict//EN" '+
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
    'xhtml1.1': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.1//EN" '+
        '"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
    'xhtml'   : ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML Basic 1.1//EN" '+
        '"http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">'
    'frameset': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Frameset//EN" '+
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">'
    'transitional': ->
        '<!DOCTYPE html PUBLIC '+
        '"-//W3C//DTD XHTML 1.0 Transitional//EN" '+
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

# exports

module.exports = {
    doctype,
}
