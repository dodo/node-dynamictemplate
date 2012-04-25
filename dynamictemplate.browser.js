;(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        var y = cwd || '.';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = Object_keys(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) { return require(file, dirname) };
    require_.resolve = function (name) {
      return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = function (fn) {
    setTimeout(fn, 0);
};

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

require.define("path", function (require, module, exports, __dirname, __filename) {
    function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/dynamictemplate.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Builder, Tag, Template, _ref;

  _ref = require('asyncxml'), Tag = _ref.Tag, Builder = _ref.Builder;

  Template = require('./template');

  module.exports = {
    Tag: Tag,
    Builder: Builder,
    Template: Template
  };

  if (process.title === 'browser') {
    (function() {
      if (this.dynamictemplate != null) {
        this.dynamictemplate.Template = Template;
        this.dynamictemplate.Builder = Builder;
        return this.dynamictemplate.Tag = Tag;
      } else {
        return this.dynamictemplate = module.exports;
      }
    }).call(window);
  }

}).call(this);

});

require.define("/node_modules/asyncxml/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"asyncxml","description":"async xml builder and generator","version":"0.4.0","homepage":"https://github.com/dodo/node-asyncxml","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/node-asyncxml.git"},"main":"asyncxml.js","engines":{"node":">= 0.4.x"},"keywords":["async","xml","generation","stream","browser"],"scripts":{"test":"cake build && nodeunit test","prepublish":"cake build"},"devDependencies":{"coffee-script":">= 1.1.2","muffin":">= 0.2.6","browserify":"1.6.1","scopify":">= 0.1.0","dt-stream":">= 0.1.1","nodeunit":">= 0.7.4"},"licenses":[{"type":"MIT","url":"http://github.com/dodo/node-asyncxml/raw/master/LICENSE"}]}
});

require.define("/node_modules/asyncxml/asyncxml.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/asyncxml')

});

require.define("/node_modules/asyncxml/lib/asyncxml.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Builder, Tag, _ref;

  _ref = require('./xml'), Tag = _ref.Tag, Builder = _ref.Builder;

  this.asyncxml = module.exports = {
    Tag: Tag,
    Builder: Builder
  };

}).call(this);

});

require.define("/node_modules/asyncxml/lib/xml.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Builder, EVENTS, EventEmitter, Tag, add_tag, connect_tags, deep_merge, new_attrs, new_tag, parse_args, safe, sync_tag, _ref;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  _ref = require('./util'), deep_merge = _ref.deep_merge, new_attrs = _ref.new_attrs, safe = _ref.safe;

  EVENTS = ['add', 'attr', 'data', 'text', 'raw', 'show', 'hide', 'remove', 'replace', 'close'];

  parse_args = function(name, attrs, children, opts) {
    var _ref2;
    if (typeof attrs !== 'object') {
      _ref2 = [children, attrs, {}], opts = _ref2[0], children = _ref2[1], attrs = _ref2[2];
    } else {
      if (attrs == null) attrs = {};
    }
    if (opts == null) opts = {};
    return [name, attrs, children, opts];
  };

  connect_tags = function(parent, child) {
    var dispose, listeners, pipe, remove, replace, wire;
    listeners = {};
    pipe = function(event) {
      return typeof child.on === "function" ? child.on(event, listeners[event] = function() {
        return parent.emit.apply(parent, [event].concat(__slice.call(arguments)));
      }) : void 0;
    };
    wire = function() {
      var event, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = EVENTS.length; _i < _len; _i++) {
        event = EVENTS[_i];
        _results.push(pipe(event));
      }
      return _results;
    };
    dispose = function() {
      var event, listener, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = EVENTS.length; _i < _len; _i++) {
        event = EVENTS[_i];
        if ((listener = listeners[event]) != null) {
          if (typeof child.removeListener === "function") {
            child.removeListener(event, listener);
          }
          _results.push(listeners[event] = void 0);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    remove = function() {
      dispose();
      if (this === child) {
        parent.removeListener('removed', remove);
      } else {
        child.removeListener('removed', remove);
      }
      parent.removeListener('replaced', replace);
      return child.removeListener('replaced', replace);
    };
    replace = function(tag) {
      if (this === child) {
        remove.call(parent);
        child = tag;
        wire();
      } else {
        parent.removeListener('removed', remove);
        parent = tag;
      }
      tag.once('replaced', replace);
      return tag.once('removed', remove);
    };
    wire();
    child.once('removed', remove);
    parent.once('removed', remove);
    child.once('replaced', replace);
    return parent.once('replaced', replace);
  };

  add_tag = function(newtag, callback) {
    var wire_tag;
    var _this = this;
    if (newtag == null) return callback != null ? callback.call(this) : void 0;
    wire_tag = function(_, tag) {
      var _ref2, _ref3;
      if ((_ref2 = tag.builder) == null) tag.builder = _this.builder;
      if ((_ref3 = tag.parent) == null) tag.parent = _this;
      connect_tags(_this, tag);
      _this.emit('add', _this, tag);
      _this.emit('new', tag);
      _this.isempty = false;
      if (tag.closed) if (typeof tag.emit === "function") tag.emit('close', tag);
      return callback != null ? callback.call(_this, tag) : void 0;
    };
    if (this.builder != null) {
      return this.builder.approve('new', this, newtag, wire_tag);
    } else {
      return wire_tag(this, newtag);
    }
  };

  new_tag = function() {
    var TagInstance, attrs, children, name, newtag, opts, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    _ref2 = parse_args.apply(null, arguments), name = _ref2[0], attrs = _ref2[1], children = _ref2[2], opts = _ref2[3];
    if ((_ref3 = opts.level) == null) opts.level = this.level + 1;
    opts = deep_merge((_ref4 = (_ref5 = this.builder) != null ? _ref5.opts : void 0) != null ? _ref4 : {}, opts);
    opts.builder = this.builder;
    TagInstance = (_ref6 = (_ref7 = this.builder) != null ? _ref7.Tag : void 0) != null ? _ref6 : Tag;
    newtag = new TagInstance(name, attrs, null, opts);
    newtag.parent = this;
    add_tag.call(this, newtag, function(tag) {
      if (children != null) return tag.children(children, opts);
    });
    return newtag;
  };

  sync_tag = function() {
    var attrs, children, name, opts, self_ending_children_scope, _ref2;
    _ref2 = parse_args.apply(null, arguments), name = _ref2[0], attrs = _ref2[1], children = _ref2[2], opts = _ref2[3];
    self_ending_children_scope = function() {
      this.children(children);
      return this.end();
    };
    return new_tag.call(this, name, attrs, self_ending_children_scope, opts);
  };

  Tag = (function() {

    __extends(Tag, EventEmitter);

    function Tag() {
      this.ready = __bind(this.ready, this);
      this.remove = __bind(this.remove, this);
      this.replace = __bind(this.replace, this);
      this.add = __bind(this.add, this);
      this.toString = __bind(this.toString, this);
      this.end = __bind(this.end, this);
      this.hide = __bind(this.hide, this);
      this.show = __bind(this.show, this);
      this.up = __bind(this.up, this);
      this.write = __bind(this.write, this);
      this.raw = __bind(this.raw, this);
      this.text = __bind(this.text, this);
      this.children = __bind(this.children, this);
      this.removeAttr = __bind(this.removeAttr, this);
      this.attr = __bind(this.attr, this);
      var children, opts, _ref2, _ref3, _ref4;
      _ref2 = parse_args.apply(null, arguments), this.name = _ref2[0], this.attrs = _ref2[1], children = _ref2[2], opts = _ref2[3];
      this.pretty = (_ref3 = opts.pretty) != null ? _ref3 : false;
      this.level = (_ref4 = opts.level) != null ? _ref4 : 0;
      this.builder = opts.builder;
      this.setMaxListeners(0);
      this.parent = this.builder;
      this.closed = false;
      this.writable = true;
      this.hidden = false;
      this.isready = false;
      this.isempty = true;
      this.content = "";
      this.children(children, opts);
      this.$tag = sync_tag;
      this.tag = new_tag;
    }

    Tag.prototype.attr = function(key, value) {
      var attr, k, v, _ref2;
      if (typeof key === 'string') {
        if (!(value != null) && ((attr = (_ref2 = this.builder) != null ? _ref2.query('attr', this, key) : void 0) != null)) {
          if (attr !== void 0) this.attrs[key] = attr;
          return attr;
        }
        this.attrs[key] = value;
        this.emit('attr', this, key, value);
      } else {
        for (k in key) {
          if (!__hasProp.call(key, k)) continue;
          v = key[k];
          if (v !== void 0) {
            this.attrs[k] = v;
          } else {
            delete this.attr[key];
          }
          this.emit('attr', this, k, v);
        }
      }
      return this;
    };

    Tag.prototype.removeAttr = function() {
      var key, keys, _i, _len;
      keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        delete this.attrs[key];
        this.emit('attr', this, key, void 0);
      }
      return this;
    };

    Tag.prototype.children = function(children) {
      if (children == null) return this;
      if (typeof children === 'function') {
        children.call(this);
      } else {
        this.text(children);
      }
      return this;
    };

    Tag.prototype.text = function(content, opts) {
      var _ref2;
      if (opts == null) opts = {};
      if (content == null) {
        return this.content = (_ref2 = this.builder) != null ? _ref2.query('text', this) : void 0;
      }
      if (opts.escape) content = safe(content);
      if (opts.append) {
        this.content += content;
      } else {
        this.content = content;
      }
      this.emit('text', this, content);
      this.isempty = false;
      return this;
    };

    Tag.prototype.raw = function(html, opts) {
      if (opts == null) opts = {};
      this.emit('raw', this, html);
      this.isempty = false;
      return this;
    };

    Tag.prototype.write = function(content, _arg) {
      var append, escape, _ref2;
      _ref2 = _arg != null ? _arg : {}, escape = _ref2.escape, append = _ref2.append;
      if (escape) content = safe(content);
      if (content) this.emit('data', this, "" + content);
      if (append != null ? append : true) {
        this.content += content;
      } else {
        this.content = content;
      }
      this.isempty = false;
      return true;
    };

    Tag.prototype.up = function(opts) {
      var _ref2;
      if (opts == null) opts = {};
      if ((_ref2 = opts.end) == null) opts.end = true;
      if (opts.end) this.end.apply(this, arguments);
      return this.parent;
    };

    Tag.prototype.show = function() {
      this.hidden = false;
      this.emit('show', this);
      return this;
    };

    Tag.prototype.hide = function() {
      this.hidden = true;
      this.emit('hide', this);
      return this;
    };

    Tag.prototype.end = function() {
      var close_tag;
      var _this = this;
      if (!this.closed) {
        this.closed = 'approving';
        close_tag = function() {
          var set_ready;
          if (_this.isempty) {
            _this.closed = 'self';
          } else {
            _this.closed = true;
          }
          _this.emit('close', _this);
          _this.emit('end');
          _this.writable = false;
          set_ready = function() {
            _this.isready = true;
            return _this.emit('ready');
          };
          if (_this.builder != null) {
            return _this.builder.approve('ready', _this, set_ready);
          } else {
            return set_ready();
          }
        };
        if (this.builder != null) {
          this.builder.approve('end', this, close_tag);
        } else {
          close_tag(this, this);
        }
      } else if (this.closed === 'approving') {} else if (this.closed === 'removed') {
        this.emit('end');
        this.writable = false;
      } else {
        this.closed = true;
        this.writable = false;
      }
      return this;
    };

    Tag.prototype.toString = function() {
      return ("<" + this.name + (new_attrs(this.attrs))) + (this.closed === 'self' ? "/>" : this.closed ? ">" + this.content + "</" + this.name + ">" : ">" + this.content);
    };

    Tag.prototype.add = function(rawtag, callback) {
      var tag, _ref2;
      tag = (_ref2 = this.builder) != null ? _ref2.query('tag', this, rawtag) : void 0;
      if (!((tag != null) || (this.builder != null))) tag = rawtag;
      add_tag.call(this, tag, callback);
      return this;
    };

    Tag.prototype.replace = function(rawtag) {
      var tag, _ref2, _ref3, _ref4;
      tag = (_ref2 = this.builder) != null ? _ref2.query('tag', this, rawtag) : void 0;
      if (!((tag != null) || (this.builder != null))) tag = rawtag;
      if (this === tag) return this;
      if ((_ref3 = tag.parent) == null) tag.parent = this.parent;
      if ((_ref4 = tag.builder) == null) tag.builder = this.builder;
      this.emit('replace', this, tag);
      if (this.builder === tag.builder) this.builder = null;
      this.parent = null;
      this.emit('replaced', tag);
      return tag;
    };

    Tag.prototype.remove = function() {
      if (!this.closed) this.closed = 'removed';
      this.emit('remove', this);
      this.emit('removed');
      this.removeAllListeners();
      return this;
    };

    Tag.prototype.ready = function(callback) {
      if (this.isready) {
        if (callback != null) callback.call(this);
        return this;
      }
      this.once('ready', callback);
      return this;
    };

    return Tag;

  })();

  Builder = (function() {

    __extends(Builder, EventEmitter);

    function Builder(opts) {
      var _base, _ref2, _ref3;
      this.opts = opts != null ? opts : {};
      this.ready = __bind(this.ready, this);
      this.end = __bind(this.end, this);
      this.add = __bind(this.add, this);
      this.builder = this;
      this.checkers = {};
      this.closed = false;
      if ((_ref2 = (_base = this.opts).pretty) == null) _base.pretty = false;
      this.level = (_ref3 = this.opts.level) != null ? _ref3 : -1;
      this.setMaxListeners(0);
      this.Tag = Tag;
      this.tag = new_tag;
      this.$tag = sync_tag;
    }

    Builder.prototype.show = Tag.prototype.show;

    Builder.prototype.hide = Tag.prototype.hide;

    Builder.prototype.toString = function() {
      return "[object AsyncXMLBuilder]";
    };

    Builder.prototype.add = function(rawtag, callback) {
      var tag;
      tag = this.query('tag', this, rawtag);
      if (tag == null) tag = rawtag;
      add_tag.call(this, tag, callback);
      return this;
    };

    Builder.prototype.end = function() {
      this.closed = true;
      this.emit('close', this);
      this.emit('end');
      return this;
    };

    Builder.prototype.ready = function(callback) {
      if (this.closed === true) {
        return callback != null ? callback.call(this) : void 0;
      }
      return this.once('end', callback);
    };

    Builder.prototype.query = function(type, tag, key) {
      if (type === 'attr') {
        return tag.attrs[key];
      } else if (type === 'text') {
        return tag.content;
      } else if (type === 'tag') {
        return key;
      }
    };

    Builder.prototype.register = function(type, checker) {
      var _base, _ref2;
      if (!(type === 'new' || type === 'end' || type === 'ready')) {
        throw new Error("only type 'ready', 'new' or 'end' allowed.");
      }
      if ((_ref2 = (_base = this.checkers)[type]) == null) _base[type] = [];
      return this.checkers[type].push(checker);
    };

    Builder.prototype.approve = function(type, parent, tag, callback) {
      var checkers, next, _ref2, _ref3, _ref4;
      checkers = (_ref2 = (_ref3 = this.checkers[type]) != null ? typeof _ref3.slice === "function" ? _ref3.slice() : void 0 : void 0) != null ? _ref2 : [];
      switch (type) {
        case 'new':
          next = function(tag) {
            var checker, _ref4;
            checker = (_ref4 = checkers.shift()) != null ? _ref4 : callback;
            return checker(parent, tag, next);
          };
          break;
        case 'ready':
        case 'end':
          _ref4 = [tag, parent], callback = _ref4[0], tag = _ref4[1];
          next = function(tag) {
            var checker, _ref5;
            checker = (_ref5 = checkers.shift()) != null ? _ref5 : callback;
            return checker(tag, next);
          };
          break;
        default:
          throw new Error("type '" + type + "' not supported.");
      }
      return next(tag);
    };

    return Builder;

  })();

  module.exports = {
    Tag: Tag,
    Builder: Builder
  };

}).call(this);

});

require.define("events", function (require, module, exports, __dirname, __filename) {
    if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.toString.call(xs) === '[object Array]'
    }
;

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = list.indexOf(listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

});

require.define("/node_modules/asyncxml/lib/util.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var breakline, deep_merge, indent, isArray, new_attrs, prettify, safe;
  var __slice = Array.prototype.slice;

  isArray = Array.isArray;

  deep_merge = function() {
    var k, obj, objs, res, v, _i, _len;
    objs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (isArray(objs[0])) objs = objs[0];
    res = {};
    for (_i = 0, _len = objs.length; _i < _len; _i++) {
      obj = objs[_i];
      for (k in obj) {
        v = obj[k];
        if (typeof v === 'object' && !isArray(v)) {
          res[k] = deep_merge(res[k] || {}, v);
        } else {
          res[k] = v;
        }
      }
    }
    return res;
  };

  indent = function(_arg) {
    var level, pretty;
    level = _arg.level, pretty = _arg.pretty;
    if (!pretty || level === 0) return "";
    if (pretty === true) pretty = "  ";
    return pretty;
  };

  breakline = function(_arg, data) {
    var level, pretty;
    level = _arg.level, pretty = _arg.pretty;
    if (!pretty) return data;
    if ((data != null ? data[(data != null ? data.length : void 0) - 1] : void 0) === "\n") {
      return data;
    } else {
      return "" + data + "\n";
    }
  };

  prettify = function(el, data) {
    if (!(el != null ? el.pretty : void 0)) {
      return data;
    } else {
      return "" + (indent(el)) + (breakline(el, data));
    }
  };

  new_attrs = function(attrs) {
    var k, strattrs, v;
    if (attrs == null) attrs = {};
    strattrs = (function() {
      var _results;
      _results = [];
      for (k in attrs) {
        v = attrs[k];
        if (v != null) {
          if (typeof v !== 'number') v = "\"" + v + "\"";
          _results.push("" + k + "=" + v);
        } else {
          _results.push("" + k);
        }
      }
      return _results;
    })();
    if (strattrs.length) strattrs.unshift('');
    return strattrs.join(' ');
  };

  safe = function(text) {
    return String(text).replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  module.exports = {
    deep_merge: deep_merge,
    prettify: prettify,
    indent: indent,
    new_attrs: new_attrs,
    safe: safe
  };

}).call(this);

});

require.define("/template.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var DefaultBuilder, EVENTS, EventEmitter, Template, aliases, doctype, ff, pp, schema, self_closing, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __slice = Array.prototype.slice;

  EventEmitter = require('events').EventEmitter;

  DefaultBuilder = require('asyncxml').Builder;

  _ref = require('./schema'), schema = _ref.schema, self_closing = _ref.self_closing;

  doctype = require('./doctype').doctype;

  aliases = require('./alias').aliases;

  EVENTS = ['new', 'add', 'show', 'hide', 'attr', 'text', 'raw', 'remove', 'replace', 'data', 'close', 'end'];

  pp = function(proto, name) {
    proto[name] = function() {
      var _ref2;
      return this.tag.apply(this, (_ref2 = [name]).concat.apply(_ref2, arguments));
    };
    return proto["$" + name] = function() {
      var _ref2;
      return this.$tag.apply(this, (_ref2 = [name]).concat.apply(_ref2, arguments));
    };
  };

  ff = function(proto, tags) {
    var tagname, _i, _len;
    for (_i = 0, _len = tags.length; _i < _len; _i++) {
      tagname = tags[_i];
      if (tagname) pp(proto, tagname);
    }
  };

  Template = (function() {

    __extends(Template, EventEmitter);

    function Template(opts, template) {
      var Builder, ExtendedBuilder, ExtendedTag, Tag, old_query, s, schema_input, _ref2, _ref3, _ref4, _ref5, _ref6;
      var _this = this;
      if (opts == null) opts = {};
      this.ready = __bind(this.ready, this);
      this.end = __bind(this.end, this);
      this.register = __bind(this.register, this);
      if (typeof opts === 'function') {
        _ref2 = [opts, {}], template = _ref2[0], opts = _ref2[1];
      }
      if ((_ref3 = opts.encoding) == null) opts.encoding = 'utf-8';
      if ((_ref4 = opts.doctype) == null) opts.doctype = false;
      if ((_ref5 = opts.end) == null) opts.end = true;
      schema_input = opts.schema;
      s = aliases[schema_input] || schema_input || 'xml';
      opts.self_closing = typeof self_closing[s] === "function" ? self_closing[s](opts) : void 0;
      opts.schema = typeof schema[s] === "function" ? schema[s](opts).split(' ') : void 0;
      Builder = (_ref6 = opts.Builder) != null ? _ref6 : DefaultBuilder;
      ExtendedBuilder = (function() {

        __extends(ExtendedBuilder, Builder);

        function ExtendedBuilder() {
          ExtendedBuilder.__super__.constructor.apply(this, arguments);
        }

        return ExtendedBuilder;

      })();
      ff(ExtendedBuilder.prototype, opts.schema);
      this.xml = new ExtendedBuilder(opts);
      this.xml.template = this;
      old_query = this.xml.query;
      this.xml.query = function(type, tag, key) {
        var _ref7;
        if (type === 'tag') {
          return (_ref7 = key.xml) != null ? _ref7 : key;
        } else {
          return old_query.call(this, type, tag, key);
        }
      };
      Tag = this.xml.Tag;
      ExtendedTag = (function() {

        __extends(ExtendedTag, Tag);

        function ExtendedTag() {
          ExtendedTag.__super__.constructor.apply(this, arguments);
        }

        return ExtendedTag;

      })();
      ff(ExtendedTag.prototype, opts.schema);
      this.xml.Tag = this.xml.opts.Tag = ExtendedTag;
      this.xml.register('end', function(tag, next) {
        if (!(opts.self_closing === true || opts.self_closing.match(tag.name))) {
          tag.isempty = false;
        }
        return next(tag);
      });
      EVENTS.forEach(function(event) {
        return _this.xml.on(event, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return _this.emit.apply(_this, [event].concat(__slice.call(args)));
        });
      });
      process.nextTick(function() {
        var d, dt, _ref7, _ref8;
        if (opts.doctype === true) opts.doctype = 'html';
        d = aliases[opts.doctype] || opts.doctype;
        if (opts.doctype && (dt = typeof doctype[d] === "function" ? doctype[d](opts) : void 0)) {
          if (opts.pretty) dt += "\n";
          _this.xml.emit('data', _this.xml, dt);
        }
        if (typeof template === 'function') {
          if ((_ref7 = _this.xml) != null ? _ref7._debug : void 0) {
            console.error("RUN", _this.xml._view.cid);
          }
          template.call(_this.xml);
          if (opts.end) return _this.end();
        } else {
          if ((_ref8 = _this.xml) != null ? _ref8._debug : void 0) {
            console.error("PASS", _this.xml._view.cid);
          }
          return _this.end(template);
        }
      });
    }

    Template.prototype.toString = function() {
      return "[object Template]";
    };

    Template.prototype.register = function() {
      var _ref2;
      return (_ref2 = this.xml).register.apply(_ref2, arguments);
    };

    Template.prototype.end = function() {
      var _ref2;
      return (_ref2 = this.xml).end.apply(_ref2, arguments);
    };

    Template.prototype.ready = function() {
      var _ref2;
      return (_ref2 = this.xml).ready.apply(_ref2, arguments);
    };

    return Template;

  })();

  Template.schema = schema;

  Template.doctype = doctype;

  Template.self_closing = self_closing;

  Template.aliases = aliases;

  module.exports = Template;

}).call(this);

});

require.define("/schema.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var schema, self_closing;

  schema = {
    'xml': function() {
      return "";
    },
    'html': function() {
      return ("" + (schema.xml()) + " " + (schema['html-obsolete']()) + " iframe label legend ") + ("" + (self_closing.html()) + " html body div ul li a b body button colgroup ") + "dfn div dl dt em dd del form h1 h2 h3 h4 h5 h6 head hgroup html ins " + "li map i mark menu meter nav noscript object ol optgroup option p " + "pre script select small span strong style sub sup table tbody tfoot " + "td textarea th thead title tr u ul";
    },
    'html5': function() {
      return ("" + (schema.html()) + " " + (self_closing.html5()) + " section article video q s ") + "audio abbr address aside bdi bdo blockquote canvas caption cite code " + "datalist details fieldset figcaption figure footer header kbd output " + "progress rp rt ruby samp summary time";
    },
    'strict': function() {
      return "" + (schema.html());
    },
    'xhtml': function() {
      return "" + (schema.html());
    },
    'xhtml1.1': function() {
      return "" + (schema.xhtml());
    },
    'frameset': function() {
      return "" + (schema.xhtml());
    },
    'transitional': function() {
      return "" + (schema.xhtml());
    },
    'mobile': function() {
      return "" + (schema.xhtml());
    },
    'html-ce': function() {
      return "" + (schema.xhtml());
    },
    'html-obsolete': function() {
      return "applet acronym bgsound dir frameset noframes isindex listing nextid " + "noembed plaintext rb strike xmp big blink center font marquee nobr " + "multicol spacer tt";
    },
    "svg1.1": function() {
      return "altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion" + "a animateTransform circle clipPath color-profile cursor defs desc" + "ellipse feBlend feColorMatrix feComponentTransfer feComposite" + "feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight" + "feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage" + "feMerge feMergeNode feMorphology feOffset fePointLight feSpotLight" + "feSpecularLighting feTile feTurbulence linearGradient polyline" + "filter font font-face font-face-format font-face-name font-face-src" + "font-face-uri foreignObject g glyph glyphRef hkern image line" + "marker mask metadata missing-glyph mpath path pattern polygon" + "radialGradient rect script set stop style svg switch symbol text" + "textPath title tref tspan use view vkern";
    }
  };

  self_closing = {
    'xml': function() {
      return true;
    },
    'svg1.1': function() {
      return true;
    },
    'html': function() {
      return "area br col embed hr img input link meta param";
    },
    'html5': function() {
      return "" + (self_closing.html()) + " base command keygen source track wbr";
    },
    'mobile': function() {
      return "" + (self_closing.xhtml());
    },
    'html-ce': function() {
      return "" + (self_closing.xhtml());
    },
    'strict': function() {
      return "" + (self_closing.xhtml());
    },
    'xhtml1.1': function() {
      return "" + (self_closing.xhtml());
    },
    'xhtml': function() {
      return "" + (self_closing.html());
    },
    'frameset': function() {
      return "" + (self_closing.xhtml());
    },
    'transitional': function() {
      return "" + (self_closing.xhtml());
    }
  };

  module.exports = {
    self_closing: self_closing,
    schema: schema
  };

}).call(this);

});

require.define("/doctype.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var doctype;

  doctype = {
    'xml': function(_arg) {
      var encoding;
      encoding = _arg.encoding;
      return "<?xml version=\"1.0\" encoding=\"" + encoding + "\" ?>";
    },
    'html': function() {
      return "<!DOCTYPE html>";
    },
    'html5': function() {
      return "" + (doctype.html());
    },
    'mobile': function() {
      return '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD ' + 'XHTML Mobile 1.2//EN" ' + '"http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">';
    },
    'html-ce': function() {
      return '<!DOCTYPE html PUBLIC ' + '"-//W3C//DTD XHTML 1.0 Transitional//EN" ' + '"ce-html-1.0-transitional.dtd">';
    },
    'strict': function() {
      return '<!DOCTYPE html PUBLIC ' + '"-//W3C//DTD XHTML 1.0 Strict//EN" ' + '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
    },
    'xhtml1.1': function() {
      return '<!DOCTYPE html PUBLIC ' + '"-//W3C//DTD XHTML 1.1//EN" ' + '"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
    },
    'xhtml': function() {
      return '<!DOCTYPE html PUBLIC ' + '"-//W3C//DTD XHTML Basic 1.1//EN" ' + '"http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">';
    },
    'frameset': function() {
      return '<!DOCTYPE html PUBLIC ' + '"-//W3C//DTD XHTML 1.0 Frameset//EN" ' + '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">';
    },
    'transitional': function() {
      return '<!DOCTYPE html PUBLIC ' + '"-//W3C//DTD XHTML 1.0 Transitional//EN" ' + '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
    }
  };

  module.exports = {
    doctype: doctype
  };

}).call(this);

});

require.define("/alias.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var aliases;

  aliases = {
    'default': 'xml',
    '5': 'html5',
    5: 'html5',
    'ce': 'html-ce',
    '1.1': 'xhtml1.1',
    'html11': 'xhtml1.1',
    'basic': 'xhtml',
    'xhtml1': 'xhtml',
    'xhtml-basic': 'xhtml',
    'xhtml-strict': 'strict',
    'xhtml-mobile': 'mobile',
    'xhtml-frameset': 'frameset',
    'xhtml-trasitional': 'transitional',
    'svg': 'svg1.1'
  };

  module.exports = {
    aliases: aliases
  };

}).call(this);

});
;require('./dynamictemplate');}).call(this);