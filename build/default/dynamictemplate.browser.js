;(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

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
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
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

require.define("/node_modules/asyncxml/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"main":"asyncxml.js"}
});

require.define("/node_modules/asyncxml/asyncxml.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./build/default/asyncxml')

});

require.define("/node_modules/asyncxml/build/default/asyncxml.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Builder, Tag, _ref;
  _ref = require('./xml'), Tag = _ref.Tag, Builder = _ref.Builder;
  this.asyncxml = module.exports = {
    Tag: Tag,
    Builder: Builder
  };
}).call(this);

});

require.define("/node_modules/asyncxml/build/default/xml.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Builder, EVENTS, EventEmitter, Tag, deep_merge, flush, new_attrs, new_tag, parse_args, prettify, rmevents, safe, sync_tag, _ref;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  _ref = require('./util'), deep_merge = _ref.deep_merge, prettify = _ref.prettify, new_attrs = _ref.new_attrs, safe = _ref.safe;

  EVENTS = ['add', 'attr', 'attr:remove', 'text', 'remove', 'close'];

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

  flush = function() {
    var data, _i, _len, _ref2;
    if (this.buffer.length) {
      _ref2 = this.buffer;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        data = _ref2[_i];
        this.write(data);
      }
      return this.buffer = [];
    }
  };

  rmevents = function(events) {
    var event, _i, _len, _results;
    this.removeListener('data', events.data);
    _results = [];
    for (_i = 0, _len = EVENTS.length; _i < _len; _i++) {
      event = EVENTS[_i];
      _results.push(this.removeListener(event, events[event]));
    }
    return _results;
  };

  new_tag = function() {
    var attrs, children, events, name, newtag, opts, _ref2, _ref3;
    var _this = this;
    _ref2 = parse_args.apply(null, arguments), name = _ref2[0], attrs = _ref2[1], children = _ref2[2], opts = _ref2[3];
    events = {};
    if ((_ref3 = opts.level) == null) opts.level = this.level + 1;
    opts = deep_merge(this.builder.opts, opts);
    opts.builder = this.builder;
    newtag = new this.builder.Tag(name, attrs, null, opts);
    newtag.parent = this;
    this.builder.approve(this, newtag, function(_, tag) {
      var event, on_end, pipe, _i, _len;
      tag.on('data', events.data = function(data) {
        if (_this.pending[0] === tag) {
          return _this.write(data);
        } else {
          return _this.buffer.push(data);
        }
      });
      pipe = function(event) {
        return tag.on(event, events[event] = function() {
          return _this.emit.apply(_this, [event].concat(__slice.call(arguments)));
        });
      };
      for (_i = 0, _len = EVENTS.length; _i < _len; _i++) {
        event = EVENTS[_i];
        pipe(event);
      }
      tag.once('end', on_end = function() {
        var before, i, known, _len2, _ref4;
        if (_this.pending[0] === tag) {
          if (tag.pending.length) {
            tag.pending[0].once('end', on_end);
          } else {
            if (tag.buffer.length) {
              _this.buffer = _this.buffer.concat(tag.buffer);
              tag.buffer = [];
            }
            _this.pending = _this.pending.slice(1);
            rmevents.call(tag, events);
            flush.call(_this);
            if (_this.closed && _this.pending.length === 0) _this.end();
          }
        } else {
          _ref4 = _this.pending;
          for (i = 0, _len2 = _ref4.length; i < _len2; i++) {
            known = _ref4[i];
            if (tag === known) {
              _this.pending = _this.pending.slice(0, i).concat(_this.pending.slice(i + 1));
              if (_this.buffer.length) {
                before = _this.pending[i - 1];
                before.buffer = before.buffer.concat(_this.buffer);
                _this.buffer = [];
              }
              rmevents.call(tag, events);
              if (_this.closed === 'pending') {
                flush.call(_this);
                _this.end();
              }
              return;
            }
          }
          throw new Error("this shouldn't happen D:");
        }
      });
      _this.pending.push(tag);
      _this.emit('new', tag);
      _this.emit('add', tag);
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
      this.remove = __bind(this.remove, this);
      this.toString = __bind(this.toString, this);
      this.end = __bind(this.end, this);
      this.up = __bind(this.up, this);
      this.write = __bind(this.write, this);
      this.text = __bind(this.text, this);
      this.children = __bind(this.children, this);
      this.removeAttr = __bind(this.removeAttr, this);
      this.attr = __bind(this.attr, this);
      this.emit = __bind(this.emit, this);
      var children, opts, _ref2, _ref3;
      _ref2 = parse_args.apply(null, arguments), this.name = _ref2[0], this.attrs = _ref2[1], children = _ref2[2], opts = _ref2[3];
      this.pretty = (_ref3 = opts.pretty) != null ? _ref3 : false;
      this.level = opts.level;
      this.builder = opts.builder;
      this.buffer = [];
      this.pending = [];
      this.parent = this.builder;
      this.closed = false;
      this.writable = true;
      this.isempty = true;
      this.content = "";
      this.children(children, opts);
      this.$tag = sync_tag;
      this.tag = new_tag;
    }

    Tag.prototype.emit = function() {
      var _ref2;
      if (this.builder.closed === true && this.parent.closed === true) {
        return (_ref2 = this.builder).emit.apply(_ref2, arguments);
      } else {
        return Tag.__super__.emit.apply(this, arguments);
      }
    };

    Tag.prototype.attr = function(key, value) {
      var attr, k, v;
      if (typeof key === 'string') {
        if (!(value != null) && ((attr = this.builder.query('attr', this, key)) != null)) {
          this.attrs[key] = attr;
          return attr;
        }
        this.attrs[key] = value;
        this.emit('attr', this, key, value);
      } else {
        for (k in key) {
          if (!__hasProp.call(key, k)) continue;
          v = key[k];
          this.attrs[k] = v;
          this.emit('attr', this, k, v);
        }
      }
      return this;
    };

    Tag.prototype.removeAttr = function(key) {
      var k, v;
      if (typeof key === 'string') {
        delete this.attrs[key];
        this.emit('attr:remove', this, key);
      } else {
        for (k in key) {
          if (!__hasProp.call(key, k)) continue;
          v = key[k];
          delete this.attr[key];
          this.emit('attr:remove', this, key);
        }
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
      if (opts == null) opts = {};
      if (!((content != null) || opts.force)) {
        return this.content = this.builder.query('text', this);
      }
      if (opts.escape) content = safe(content);
      this.write(content, deep_merge(opts, {
        escape: false
      }));
      if (opts.append) {
        this.content += content;
      } else {
        this.content = content;
      }
      this.emit('text', this, this.content);
      return this;
    };

    Tag.prototype.write = function(content, _arg) {
      var escape;
      escape = (_arg != null ? _arg : {}).escape;
      if (escape) content = safe(content);
      if (this.isempty) {
        this.emit('data', prettify(this, "<" + this.name + (new_attrs(this.attrs)) + ">"));
        this.isempty = false;
      }
      if (content) this.emit('data', prettify(this, "" + content));
      return true;
    };

    Tag.prototype.up = function(opts) {
      var _ref2;
      if (opts == null) opts = {};
      if ((_ref2 = opts.end) == null) opts.end = true;
      if (opts.end) this.end.apply(this, arguments);
      return this.parent;
    };

    Tag.prototype.end = function() {
      var data;
      if (!this.closed || this.closed === 'pending') {
        if (this.pending.length) {
          this.closed = 'pending';
        } else {
          if (this.isempty) {
            data = "<" + this.name + (new_attrs(this.attrs)) + "/>";
            this.closed = 'self';
          } else {
            data = "</" + this.name + ">";
            this.closed = true;
          }
          this.emit('data', prettify(this, data));
          this.emit('close', this);
          this.emit('end');
        }
      } else if (this.closed === 'removed') {
        this.emit('end');
      } else {
        this.closed = true;
      }
      this.writable = false;
      return this;
    };

    Tag.prototype.toString = function() {
      return ("<" + this.name + (new_attrs(this.attrs))) + (this.closed === 'self' ? "/>" : this.closed ? ">" + this.content + "</" + this.name + ">" : void 0);
    };

    Tag.prototype.remove = function() {
      if (!this.closed) this.closed = 'removed';
      this.emit('remove', this);
      return this;
    };

    return Tag;

  })();

  Builder = (function() {

    __extends(Builder, EventEmitter);

    function Builder(opts) {
      var _base, _ref2, _ref3;
      this.opts = opts != null ? opts : {};
      this.end = __bind(this.end, this);
      this.write = __bind(this.write, this);
      this.builder = this;
      this.buffer = [];
      this.pending = [];
      this.checkers = [];
      this.closed = false;
      if ((_ref2 = (_base = this.opts).pretty) == null) _base.pretty = false;
      this.level = (_ref3 = this.opts.level) != null ? _ref3 : -1;
      this.Tag = Tag;
      this.tag = new_tag;
      this.$tag = sync_tag;
    }

    Builder.prototype.write = function(data) {
      return this.emit('data', data);
    };

    Builder.prototype.end = function() {
      if (this.pending.length) {
        this.closed = 'pending';
        this.pending[0].once('end', this.end);
      } else {
        if (!this.closed || this.closed === 'pending') this.emit('end');
        this.closed = true;
      }
      return this;
    };

    Builder.prototype.query = function(type, tag, key) {
      if (type === 'attr') {
        return tag.attrs[key];
      } else if (type === 'text') {
        return tag.content;
      }
    };

    Builder.prototype.use = function(checker) {
      return this.checkers.push(checker);
    };

    Builder.prototype.approve = function(parent, tag, callback) {
      var checkers, next;
      checkers = this.checkers.slice();
      next = function(tag) {
        var checker, _ref2;
        checker = (_ref2 = checkers.shift()) != null ? _ref2 : callback;
        return checker(parent, tag, next);
      };
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

require.define("/node_modules/asyncxml/build/default/util.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var breakline, deep_merge, indent, isArray, new_attrs, prettify, safe;
  var __slice = Array.prototype.slice;
  isArray = Array.isArray;
  deep_merge = function() {
    var k, obj, objs, res, v, _i, _len;
    objs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (isArray(objs[0])) {
      objs = objs[0];
    }
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
    if (!pretty || level === 0) {
      return "";
    }
    if (pretty === true) {
      pretty = "  ";
    }
    return pretty;
  };
  breakline = function(_arg, data) {
    var level, pretty;
    level = _arg.level, pretty = _arg.pretty;
    if (!pretty) {
      return data;
    }
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
    if (attrs == null) {
      attrs = {};
    }
    strattrs = (function() {
      var _results;
      _results = [];
      for (k in attrs) {
        v = attrs[k];
        _results.push(v != null ? (typeof v !== 'number' ? v = "\"" + v + "\"" : void 0, "" + k + "=" + v) : "" + k);
      }
      return _results;
    })();
    if (strattrs.length) {
      strattrs.unshift('');
    }
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

require.define("/template.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var DefaultBuilder, EVENTS, EventEmitter, Template, aliases, doctype, ff, pp, schema, self_closing;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __slice = Array.prototype.slice;

  EventEmitter = require('events').EventEmitter;

  DefaultBuilder = require('asyncxml').Builder;

  EVENTS = ['new', 'add', 'attr', 'attr:remove', 'text', 'remove', 'data', 'close', 'end'];

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
    'xhtml1.1': function() {
      return "" + (schema.xhtml());
    },
    'xhtml': function() {
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
    }
  };

  self_closing = {
    'xml': function() {
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
      return "" + (self_closing.xhtml());
    },
    'frameset': function() {
      return "" + (self_closing.xhtml());
    },
    'transitional': function() {
      return "" + (self_closing.xhtml());
    }
  };

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
    'xhtml-trasitional': 'transitional'
  };

  pp = function(proto, name) {
    proto[name] = function() {
      var _ref;
      return this.tag.apply(this, (_ref = [name]).concat.apply(_ref, arguments));
    };
    return proto["$" + name] = function() {
      var _ref;
      return this.$tag.apply(this, (_ref = [name]).concat.apply(_ref, arguments));
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
      var Builder, ExtendedBuilder, ExtendedTag, Tag, end_tag, s, schema_input, _ref, _ref2, _ref3, _ref4, _ref5;
      var _this = this;
      if (opts == null) opts = {};
      this.end = __bind(this.end, this);
      if (typeof opts === 'function') {
        _ref = [opts, {}], template = _ref[0], opts = _ref[1];
      }
      if ((_ref2 = opts.encoding) == null) opts.encoding = 'utf-8';
      if ((_ref3 = opts.doctype) == null) opts.doctype = false;
      if ((_ref4 = opts.end) == null) opts.end = true;
      schema_input = opts.schema;
      s = aliases[schema_input] || schema_input || 'xml';
      opts.self_closing = typeof self_closing[s] === "function" ? self_closing[s](opts) : void 0;
      opts.schema = typeof schema[s] === "function" ? schema[s](opts).split(' ') : void 0;
      Builder = (_ref5 = opts.Builder) != null ? _ref5 : DefaultBuilder;
      ExtendedBuilder = (function() {

        __extends(ExtendedBuilder, Builder);

        function ExtendedBuilder() {
          ExtendedBuilder.__super__.constructor.apply(this, arguments);
        }

        return ExtendedBuilder;

      })();
      ff(ExtendedBuilder.prototype, opts.schema);
      this.xml = new ExtendedBuilder(opts);
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
      end_tag = Tag.prototype.end;
      this.xml.Tag.prototype.end = function() {
        if (opts.self_closing === true || opts.self_closing.match(this.name)) {
          return end_tag.call.apply(end_tag, [this].concat(__slice.call(arguments)));
        } else {
          this.text("", {
            force: this.isempty ? true : void 0
          });
          return end_tag.call.apply(end_tag, [this].concat(__slice.call(arguments)));
        }
      };
      EVENTS.forEach(function(event) {
        return _this.xml.on(event, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return _this.emit.apply(_this, [event].concat(__slice.call(args)));
        });
      });
      process.nextTick(function() {
        var d, dt;
        if (opts.doctype === true) opts.doctype = 'html';
        d = aliases[opts.doctype] || opts.doctype;
        if (opts.doctype && (dt = typeof doctype[d] === "function" ? doctype[d](opts) : void 0)) {
          if (opts.pretty) dt += "\n";
          _this.xml.emit('data', dt);
        }
        if (typeof template === 'function') {
          template.call(_this.xml);
          if (opts.end) return _this.end();
        } else {
          return _this.end(template);
        }
      });
    }

    Template.prototype.end = function() {
      var _ref;
      return (_ref = this.xml).end.apply(_ref, arguments);
    };

    return Template;

  })();

  Template.schema = schema;

  module.exports = Template;

  Template.self_closing = self_closing;

}).call(this);

});

require.define("/dynamictemplate.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Builder, Tag, Template, _ref;

  _ref = require('asyncxml'), Tag = _ref.Tag, Builder = _ref.Builder;

  Template = require('./template');

  module.exports = {
    Tag: Tag,
    Builder: Builder,
    Template: Template
  };

  if (this.dynamictemplate != null) {
    this.dynamictemplate.Template = Template;
    this.dynamictemplate.Builder = Builder;
    this.dynamictemplate.Tag = Tag;
  } else {
    this.dynamictemplate = module.exports;
  }

}).call(this);

});
require("/dynamictemplate.coffee");
}).call(this);