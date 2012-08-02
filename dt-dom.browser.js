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

require.define("/dt-dom.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var $fyBuilder, BrowserAdapter, DOMAdapter, defaultfn, domify;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  BrowserAdapter = require('dt-browser').Adapter;

  defaultfn = require('./fn');

  $fyBuilder = function(builder) {
    var $builder;
    $builder = builder._dom;
    builder.dom = $builder;
    builder.template.dom = $builder;
    return builder.template._dom = $builder;
  };

  DOMAdapter = (function() {

    __extends(DOMAdapter, BrowserAdapter);

    function DOMAdapter(template, opts) {
      var f, n, _base, _ref, _ref2;
      this.template = template;
      if (opts == null) opts = {};
      if ((_ref = this.fn) == null) this.fn = {};
      for (n in defaultfn) {
        f = defaultfn[n];
        if ((_ref2 = (_base = this.fn)[n]) == null) _base[n] = f.bind(this);
      }
      DOMAdapter.__super__.constructor.apply(this, arguments);
    }

    DOMAdapter.prototype.initialize = function() {
      var old_query;
      DOMAdapter.__super__.initialize.apply(this, arguments);
      old_query = this.builder.query;
      return this.builder.query = function(type, tag, key) {
        var attr, attrs, name, _i, _len, _ref, _ref2, _ref3;
        if (tag._dom == null) return old_query.call(this, type, tag, key);
        if (type === 'attr') {
          return tag._dom.getAttribute(key);
        } else if (type === 'text') {
          return tag._dom.text || tag._dom.textContent || tag._dom.innerHTML || "";
        } else if (type === 'tag') {
          if (key._dom != null) {
            return key;
          } else {
            if (typeof (key != null ? key.nodeType : void 0) === 'number') {
              attrs = {};
              _ref2 = (_ref = key.attributes) != null ? _ref : [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                attr = _ref2[_i];
                attrs[attr.name] = attr.value;
              }
              name = ((_ref3 = key.nodeName) != null ? _ref3 : "").toLowerCase();
              return new this.builder.Tag(name, attrs, function() {
                this._dom = key;
                return this.end();
              });
            } else {
              return old_query.call(this, type, tag, key);
            }
          }
        }
      };
    };

    DOMAdapter.prototype.make = function(el) {
      var key, value, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      el.namespace = (_ref = el.attrs) != null ? _ref['xmlns'] : void 0;
      if (el === el.builder) {
        if ((_ref2 = el._dom) == null) el._dom = [];
        $fyBuilder(el);
      } else {
        if (el.namespace != null) {
          if ((_ref3 = el._dom) == null) {
            el._dom = document.createElementNS(el.namespace, el.name);
          }
        } else {
          if ((_ref4 = el._dom) == null) el._dom = document.createElement(el.name);
        }
      }
      _ref6 = (_ref5 = el.attrs) != null ? _ref5 : {};
      for (key in _ref6) {
        value = _ref6[key];
        el._dom.setAttribute(key, value);
      }
      return el;
    };

    DOMAdapter.prototype.createPlaceholder = function(el) {
      el._jquery = document.createElement('placeholder');
      if (el === el.builder) return $fyBuilder(el);
    };

    DOMAdapter.prototype.removePlaceholder = function(el) {
      var _ref;
      if ((_ref = el._dom.parentElement) != null) _ref.removeChild(el._dom);
      return el._dom = [];
    };

    DOMAdapter.prototype.onshow = function(el) {
      if (el._dom != null) {
        return DOMAdapter.__super__.onshow.apply(this, arguments);
      }
    };

    DOMAdapter.prototype.onhide = function(el) {
      if (el._dom != null) {
        return DOMAdapter.__super__.onhide.apply(this, arguments);
      }
    };

    DOMAdapter.prototype.onremove = function(el, opts) {
      if (el._dom != null) DOMAdapter.__super__.onremove.apply(this, arguments);
      if (!opts.soft) return delete el._dom;
    };

    DOMAdapter.prototype.onend = function() {
      return $fyBuilder(this.builder);
    };

    DOMAdapter.prototype.replace_callback = function(oldtag, newtag) {
      DOMAdapter.__super__.replace_callback.apply(this, arguments);
      if (newtag === newtag.builder) return $fyBuilder(newtag);
    };

    return DOMAdapter;

  })();

  domify = function(opts, tpl) {
    var _ref;
    if (tpl == null) _ref = [opts, null], tpl = _ref[0], opts = _ref[1];
    new DOMAdapter(tpl, opts);
    return tpl;
  };

  domify.fn = defaultfn;

  domify.Adapter = DOMAdapter;

  module.exports = domify;

  if (process.title === 'browser') {
    (function() {
      if (this.dynamictemplate != null) {
        return this.dynamictemplate.domify = domify;
      } else {
        return this.dynamictemplate = {
          domify: domify
        };
      }
    }).call(window);
  }

}).call(this);

});

require.define("/node_modules/dt-browser/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"dt-browser","description":"Δt browser render logic for adapters - async & dynamic templating engine","version":"0.0.4","homepage":"https://github.com/dodo/node-dt-browser","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/node-dt-browser.git"},"main":"dt-browser.js","engines":{"node":">= 0.4.x"},"keywords":["dt","async","dynamic","event","template","generation","stream","browser","shared","lib"],"scripts":{"test":"cake build","prepublish":"cake build"},"dependencies":{"animation":">= 0.0.2"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.3"},"licenses":[{"type":"MIT","url":"http://github.com/dodo/node-dt-browser/raw/master/LICENSE"}]}
});

require.define("/node_modules/dt-browser/dt-browser.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/browser')

});

require.define("/node_modules/dt-browser/lib/browser.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Animation, BrowserAdapter, BrowserState, Callback, CancelableCallbacks, DeferredCallbacks, EVENTS, SHARED, defaultfn, isArray, prepare_cancelable_manip, prepare_deferred_done, removed, _ref;

  Animation = require('animation').Animation;

  _ref = require('./util'), Callback = _ref.Callback, CancelableCallbacks = _ref.CancelableCallbacks, DeferredCallbacks = _ref.DeferredCallbacks, removed = _ref.removed;

  isArray = Array.isArray;

  SHARED = ['parent_done', 'insert', 'replace', 'done'];

  EVENTS = ['add', 'end', 'show', 'hide', 'attr', 'text', 'raw', 'remove', 'replace'];

  defaultfn = {};

  EVENTS.forEach(function(e) {
    return defaultfn[e] = function() {
      throw new Error("no specific fn for " + e + " defined");
    };
  });

  prepare_deferred_done = function(el) {
    var _base, _ref2, _ref3;
    return (_ref2 = (_base = ((_ref3 = el._browser) != null ? _ref3 : el._browser = new BrowserState)).done) != null ? _ref2 : _base.done = new DeferredCallbacks;
  };

  prepare_cancelable_manip = function(el, canceled) {
    var _base, _ref2, _ref3;
    return (_ref2 = (_base = ((_ref3 = el._browser) != null ? _ref3 : el._browser = new BrowserState)).manip) != null ? _ref2 : _base.manip = new CancelableCallbacks(canceled);
  };

  BrowserState = (function() {

    function BrowserState() {}

    BrowserState.prototype.initialize = function(prev) {
      var _ref2, _ref3, _ref4, _ref5;
      if ((_ref2 = this.parent_done) == null) this.parent_done = new Callback;
      if ((_ref3 = this.insert) == null) this.insert = new Callback;
      if ((_ref4 = this.manip) == null) this.manip = new CancelableCallbacks;
      if ((_ref5 = this.done) == null) this.done = new DeferredCallbacks;
      this.manip.reset();
      return this;
    };

    BrowserState.prototype.mergeInto = function(state) {
      var key, _i, _len, _ref2;
      for (_i = 0, _len = SHARED.length; _i < _len; _i++) {
        key = SHARED[_i];
        if ((_ref2 = state[key]) == null) state[key] = this[key];
        this[key] = null;
      }
      return state;
    };

    BrowserState.prototype.destroy = function(opts) {
      var key, _i, _j, _len, _len2, _ref2, _ref3;
      if ((_ref2 = this.manip) != null) _ref2.cancel();
      if ((_ref3 = this.done) != null) _ref3.reset();
      if (opts.soft) {
        for (_i = 0, _len = SHARED.length; _i < _len; _i++) {
          key = SHARED[_i];
          this[key] = null;
        }
      } else {
        for (_j = 0, _len2 = SHARED.length; _j < _len2; _j++) {
          key = SHARED[_j];
          delete this[key];
        }
        delete manip;
      }
      return this;
    };

    return BrowserState;

  })();

  BrowserAdapter = (function() {

    function BrowserAdapter(template, opts) {
      var f, n, plugin, _base, _i, _len, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      this.template = template;
      if (opts == null) opts = {};
      this.builder = (_ref2 = this.template.xml) != null ? _ref2 : this.template;
      if ((_ref3 = opts.timeoutexecution) == null) opts.timeoutexecution = '32ms';
      if ((_ref4 = opts.execution) == null) opts.execution = '8ms';
      if ((_ref5 = opts.timeout) == null) opts.timeout = '120ms';
      if ((_ref6 = opts.toggle) == null) opts.toggle = true;
      this.animation = new Animation(opts);
      this.animation.start();
      if ((_ref7 = this.fn) == null) this.fn = {};
      for (n in defaultfn) {
        f = defaultfn[n];
        if ((_ref8 = (_base = this.fn)[n]) == null) _base[n] = f.bind(this);
      }
      this.initialize();
      if ((_ref9 = opts.use) == null) opts.use = [];
      if (!isArray(opts.use)) opts.use = [opts.use];
      _ref10 = opts.use;
      for (_i = 0, _len = _ref10.length; _i < _len; _i++) {
        plugin = _ref10[_i];
        this.use(plugin);
      }
    }

    BrowserAdapter.prototype.initialize = function() {
      this.listen();
      this.make(this.builder);
      prepare_deferred_done(this.builder).callback()();
      this.template.register('ready', function(tag, next) {
        var _ref2;
        if ((_ref2 = tag._browser) == null) tag._browser = new BrowserState;
        if (tag._browser.ready === true) {
          return next(tag);
        } else {
          return tag._browser.ready = next;
        }
      });
      return this;
    };

    BrowserAdapter.prototype.use = function(plugin) {
      if (plugin != null) plugin.call(this, this);
      return this;
    };

    BrowserAdapter.prototype.listen = function() {
      var event, listener, _i, _len;
      for (_i = 0, _len = EVENTS.length; _i < _len; _i++) {
        event = EVENTS[_i];
        if ((listener = this["on" + event]) != null) {
          this.template.on(event, listener.bind(this));
        }
      }
      return this;
    };

    BrowserAdapter.prototype.make = function() {
      throw new Error("Adapter::make not defined.");
    };

    BrowserAdapter.prototype.createPlaceholder = function() {
      throw new Error("Adapter::createPlaceholder not defined.");
    };

    BrowserAdapter.prototype.removePlaceholder = function() {
      throw new Error("Adapter::removePlaceholder not defined.");
    };

    BrowserAdapter.prototype.onadd = function(parent, el) {
      var cb, ecb, pcb, that, _base, _base2, _base3, _base4, _ref2, _ref3, _ref4;
      if (removed(el)) return;
      this.make(el);
      that = this;
      ((_ref2 = el._browser) != null ? _ref2 : el._browser = new BrowserState).initialize();
      while ((cb = el._browser.manip.callbacks.shift()) != null) {
        this.animation.push(cb);
      }
      ecb = el._browser.done.callback();
      pcb = prepare_deferred_done(parent).callback();
      if (el === el.builder) {
        ecb();
      } else {
        el.ready(ecb);
      }
      if (parent === parent.builder) {
        pcb();
      } else {
        parent.ready(pcb);
      }
      if (typeof (_base = el._browser.insert).replace === "function") {
        if ((_ref3 = (_base2 = _base.replace(el)).callback) == null) {
          _base2.callback = function() {
            if (removed(this) || removed(this.parent)) return;
            return that.insert_callback(this);
          };
        }
      }
      if (typeof (_base3 = el._browser.parent_done).replace === "function") {
        if ((_ref4 = (_base4 = _base3.replace(el)).callback) == null) {
          _base4.callback = function() {
            if (removed(this) || removed(this.parent)) return;
            return that.parent_done_callback(this);
          };
        }
      }
      return parent._browser.done.call(el._browser.parent_done.call);
    };

    BrowserAdapter.prototype.onreplace = function(oldtag, newtag) {
      var cb, oldreplacerequest, that, _base, _base2, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (removed(oldtag) || removed(newtag)) return;
      if ((_ref2 = newtag._browser) == null) newtag._browser = new BrowserState;
      if ((_ref3 = oldtag._browser) != null) _ref3.mergeInto(newtag._browser);
      this.onadd(oldtag.parent, newtag);
      if ((_ref4 = oldtag._browser) != null) {
        _ref4.destroy({
          soft: true
        });
      }
      newtag._browser.manip.reset();
      while ((cb = newtag._browser.manip.callbacks.shift()) != null) {
        this.animation.push(cb);
      }
      if (newtag._browser.insert === true) {
        that = this;
        oldreplacerequest = ((_ref5 = newtag._browser.replace) != null ? _ref5.callback : void 0) != null;
        if ((_ref6 = (_base = newtag._browser).replace) == null) {
          _base.replace = new Callback;
        }
        if ((_ref7 = (_base2 = newtag._browser.replace.replace(newtag)).callback) == null) {
          _base2.callback = function() {
            if (removed(this) || removed(this.parent)) return;
            return that.replace_callback(oldtag, this);
          };
        }
        if (!oldreplacerequest) {
          return this.animation.push(newtag._browser.replace.call);
        }
      }
    };

    BrowserAdapter.prototype.ontext = function(el, text) {
      var _this = this;
      return this.animation.push(prepare_cancelable_manip(el, true).call(function() {
        return _this.fn.text(el, text);
      }));
    };

    BrowserAdapter.prototype.onraw = function(el, html) {
      var _this = this;
      return this.animation.push(prepare_cancelable_manip(el, true).call(function() {
        return _this.fn.raw(el, html);
      }));
    };

    BrowserAdapter.prototype.onattr = function(el, key, value) {
      var _this = this;
      return this.animation.push(prepare_cancelable_manip(el, true).call(function() {
        return _this.fn.attr(el, key, value);
      }));
    };

    BrowserAdapter.prototype.onshow = function(el) {
      return this.fn.show(el);
    };

    BrowserAdapter.prototype.onhide = function(el) {
      return this.fn.hide(el);
    };

    BrowserAdapter.prototype.onremove = function(el, opts) {
      var _ref2;
      this.fn.remove(el, opts);
      if ((_ref2 = el._browser) != null) _ref2.destroy(opts);
      if (!opts.soft) return delete el._browser;
    };

    BrowserAdapter.prototype.insert_callback = function(el) {
      var _base;
      if (el === el.builder && el.isempty) {
        el._browser.wrapped = true;
        this.createPlaceholder(el);
      }
      this.fn.add(el.parent, el);
      if (el.parent._browser.wrapped) {
        el.parent._browser.wrapped = false;
        this.removePlaceholder(el.parent);
      }
      if (typeof (_base = el._browser).ready === "function") _base.ready(el);
      el._browser.ready = true;
      return el._browser.insert = true;
    };

    BrowserAdapter.prototype.parent_done_callback = function(el) {
      var bool, _base, _ref2, _ref3, _ref4, _ref5;
      if (el.parent === el.parent.builder) {
        bool = !(el.parent.parent != null) || (el.parent.parent === ((_ref2 = el.parent.parent) != null ? _ref2.builder : void 0) && ((_ref3 = el.parent.parent) != null ? (_ref4 = _ref3._browser) != null ? _ref4.insert : void 0 : void 0) === true);
        if (bool && ((_ref5 = el.parent._browser) != null ? _ref5.insert : void 0) === true) {
          this.animation.push(el._browser.insert.call);
        } else {
          if (typeof (_base = el._browser.insert).call === "function") {
            _base.call();
          }
        }
      } else {
        this.animation.push(el._browser.insert.call);
      }
      return el._browser.parent_done = true;
    };

    BrowserAdapter.prototype.replace_callback = function(oldtag, newtag) {
      if (newtag === newtag.builder && newtag.isempty) {
        newtag._browser.wrapped = true;
        this.createPlaceholder(newtag);
      }
      this.fn.replace(oldtag, newtag);
      return newtag._browser.replace = null;
    };

    return BrowserAdapter;

  })();

  module.exports = {
    Adapter: BrowserAdapter,
    fn: defaultfn
  };

}).call(this);

});

require.define("/node_modules/dt-browser/node_modules/animation/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"animation","description":"animation timing & handling","version":"0.1.2","homepage":"https://github.com/dodo/node-animation","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/node-animation.git"},"main":"animation.js","engines":{"node":">= 0.4.x"},"keywords":["request","animation","frame","interval","node","browser"],"scripts":{"prepublish":"cake build"},"dependencies":{"ms":">= 0.1.0","request-animation-frame":">= 0.1.0"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.2"}}
});

require.define("/node_modules/dt-browser/node_modules/animation/animation.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/animation')

});

require.define("/node_modules/dt-browser/node_modules/animation/lib/animation.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var EventEmitter, cancelAnimationFrame, ms, now, requestAnimationFrame, _ref, _ref2;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  _ref = require('request-animation-frame'), requestAnimationFrame = _ref.requestAnimationFrame, cancelAnimationFrame = _ref.cancelAnimationFrame;

  ms = require('ms');

  now = (_ref2 = Date.now) != null ? _ref2 : function() {
    return new Date().getTime();
  };

  this.Animation = (function() {

    __extends(Animation, EventEmitter);

    function Animation(opts) {
      var _ref3, _ref4, _ref5;
      if (opts == null) opts = {};
      this.nextTick = __bind(this.nextTick, this);
      this.timoutexecutiontime = ms((_ref3 = opts.timeoutexecution) != null ? _ref3 : '32ms');
      this.executiontime = ms((_ref4 = opts.execution) != null ? _ref4 : '8ms');
      this.timeouttime = opts.timeout;
      if (this.timeouttime != null) this.timeouttime = ms(this.timeouttime);
      this.autotoggle = (_ref5 = opts.toggle) != null ? _ref5 : false;
      this.frametime = opts.frame;
      if (this.frametime != null) this.frametime = ms(this.frametime);
      this.queue = [];
      this.running = false;
      this.paused = false;
      Animation.__super__.constructor.apply(this, arguments);
    }

    Animation.prototype.need_next_tick = function() {
      return this.running && !this.paused && (this.queue.length || !this.autotoggle);
    };

    Animation.prototype.work_queue = function(started, dt, executiontime) {
      var t, _base, _results;
      t = now();
      _results = [];
      while (this.queue.length && t - started < executiontime) {
        if (typeof (_base = this.queue.shift()) === "function") _base(dt);
        _results.push(t = now());
      }
      return _results;
    };

    Animation.prototype.push = function(callback) {
      this.queue.push(callback);
      if (this.running && this.autotoggle) return this.resume();
    };

    Animation.prototype.nextTick = function(callback) {
      var request, t, tick, timeout, _ref3;
      _ref3 = [null, null], timeout = _ref3[0], request = _ref3[1];
      t = now();
      tick = function(success) {
        var dt, executiontime, nextid, started;
        if (this.need_next_tick()) nextid = this.nextTick();
        started = now();
        dt = started - t;
        executiontime = success ? this.executiontime : this.timoutexecutiontime;
        if (success) {
          clearTimeout(timeout);
        } else {
          cancelAnimationFrame(request);
        }
        this.emit('tick', dt);
        if (typeof callback === "function") callback(dt);
        this.work_queue(started, dt, executiontime);
        if (nextid == null) return;
        if (!this.need_next_tick()) {
          if (this.timeouttime != null) clearTimeout(nextid.timeout);
          cancelAnimationFrame(nextid);
          this.pause();
        }
      };
      request = requestAnimationFrame(tick.bind(this, true), this.frametime);
      if (this.timeouttime != null) {
        timeout = setTimeout(tick.bind(this, false), this.timeouttime);
        request.timeout = timeout;
      }
      return request;
    };

    Animation.prototype.start = function() {
      if (this.running) return;
      this.running = true;
      this.emit('start');
      if (!this.paused && this.autotoggle && !this.queue.length) {
        return this.pause();
      } else {
        return this.nextTick();
      }
    };

    Animation.prototype.stop = function() {
      if (!this.running) return;
      this.running = false;
      return this.emit('stop');
    };

    Animation.prototype.pause = function() {
      if (this.paused) return;
      this.paused = true;
      return this.emit('pause');
    };

    Animation.prototype.resume = function() {
      if (!this.paused) return;
      this.paused = false;
      this.emit('resume');
      if (this.running && (!this.autotoggle || this.queue.length === 1)) {
        return this.nextTick();
      }
    };

    return Animation;

  })();

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

require.define("/node_modules/dt-browser/node_modules/animation/node_modules/request-animation-frame/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"request-animation-frame","description":"requestAnimationFrame shim","version":"0.1.1","homepage":"https://github.com/dodo/requestAnimationFrame.js","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/requestAnimationFrame.js.git"},"main":"shim.js","engines":{"node":">= 0.4.x"},"keywords":["request","animation","frame","shim","browser","polyfill"],"scripts":{"prepublish":"cake build"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.2"}}
});

require.define("/node_modules/dt-browser/node_modules/animation/node_modules/request-animation-frame/shim.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/shim')

});

require.define("/node_modules/dt-browser/node_modules/animation/node_modules/request-animation-frame/lib/shim.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var max, now, _ref, _ref2;

  now = (_ref = Date.now) != null ? _ref : function() {
    return new Date().getTime();
  };

  max = Math.max;

  _ref2 = (function() {
    var cancel, isNative, last, request, vendor, _i, _len, _ref2;
    last = 0;
    request = typeof window !== "undefined" && window !== null ? window.requestAnimationFrame : void 0;
    cancel = typeof window !== "undefined" && window !== null ? window.cancelAnimationFrame : void 0;
    _ref2 = ["webkit", "moz", "o", "ms"];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      vendor = _ref2[_i];
      if (cancel == null) {
        cancel = (typeof window !== "undefined" && window !== null ? window["" + vendor + "cancelAnimationFrame"] : void 0) || (typeof window !== "undefined" && window !== null ? window["" + vendor + "cancelRequestAnimationFrame"] : void 0);
      }
      if ((request != null ? request : request = typeof window !== "undefined" && window !== null ? window["" + vendor + "RequestAnimationFrame"] : void 0)) {
        break;
      }
    }
    isNative = request != null;
    request = request != null ? request : function(callback, timeout) {
      var cur, id, time;
      if (timeout == null) timeout = 16;
      cur = now();
      time = max(0, timeout + last - cur);
      id = setTimeout(function() {
        return typeof callback === "function" ? callback(cur + time) : void 0;
      }, time);
      last = cur + time;
      return id;
    };
    request.isNative = isNative;
    isNative = cancel != null;
    cancel = cancel != null ? cancel : function(id) {
      return clearTimeout(id);
    };
    cancel.isNative = isNative;
    return [request, cancel];
  })(), this.requestAnimationFrame = _ref2[0], this.cancelAnimationFrame = _ref2[1];

}).call(this);

});

require.define("/node_modules/dt-browser/node_modules/animation/node_modules/ms/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"ms","version":"0.1.0","description":"Tiny ms conversion utility","main":"./ms","devDependencies":{"mocha":"*","expect.js":"*","serve":"*"}}
});

require.define("/node_modules/dt-browser/node_modules/animation/node_modules/ms/ms.js", function (require, module, exports, __dirname, __filename) {
    /**

# ms.js

No more painful `setTimeout(fn, 60 * 4 * 3 * 2 * 1 * Infinity * NaN * '☃')`.

    ms('2d')      // 172800000
    ms('1.5h')    // 5400000
    ms('1h')      // 3600000
    ms('1m')      // 60000
    ms('5s')      // 5000
    ms('500ms')    // 500
    ms('100')     // '100'
    ms(100)       // 100

**/

(function (g) {
  var r = /(\d*.?\d+)([mshd]+)/
    , _ = {}

  _.ms = 1;
  _.s = 1000;
  _.m = _.s * 60;
  _.h = _.m * 60;
  _.d = _.h * 24;

  function ms (s) {
    if (s == Number(s)) return Number(s);
    r.exec(s.toLowerCase());
    return RegExp.$1 * _[RegExp.$2];
  }

  g.top ? g.ms = ms : module.exports = ms;
})(this);

});

require.define("/node_modules/dt-browser/lib/util.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Callback, CancelableCallbacks, DeferredCallbacks, removed;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Callback = (function() {

    function Callback() {
      this.call = __bind(this.call, this);      this.callback = null;
      this.that = null;
    }

    Callback.prototype.use = function(callback) {
      this.callback = callback;
      return this;
    };

    Callback.prototype.replace = function(that) {
      this.that = that;
      return this;
    };

    Callback.prototype.call = function() {
      var _ref;
      if (this.that != null) {
        return (_ref = this.callback) != null ? _ref.apply(this.that, arguments) : void 0;
      }
    };

    return Callback;

  })();

  CancelableCallbacks = (function() {

    function CancelableCallbacks(canceled) {
      this.canceled = canceled != null ? canceled : false;
      this.call = __bind(this.call, this);
      this.callbacks = [];
    }

    CancelableCallbacks.prototype.cancel = function() {
      return this.canceled = true;
    };

    CancelableCallbacks.prototype.reset = function() {
      return this.canceled = false;
    };

    CancelableCallbacks.prototype.call = function(callback) {
      var _this = this;
      return function() {
        if (_this.canceled) {
          return _this.callbacks.push(callback);
        } else {
          return typeof callback === "function" ? callback.apply(null, arguments) : void 0;
        }
      };
    };

    return CancelableCallbacks;

  })();

  DeferredCallbacks = (function() {

    function DeferredCallbacks() {
      this.call = __bind(this.call, this);      this.reset();
    }

    DeferredCallbacks.prototype.reset = function() {
      this.callbacks = [];
      this.allowed = null;
      return this.done = false;
    };

    DeferredCallbacks.prototype.complete = function() {
      this.callbacks = null;
      this.allowed = null;
      return this.done = true;
    };

    DeferredCallbacks.prototype.callback = function() {
      var callback;
      var _this = this;
      if (this.done) return (function() {});
      callback = function() {
        var cb;
        if (callback === _this.allowed) {
          while ((cb = _this.callbacks.shift()) != null) {
            if (typeof cb === "function") cb.apply(null, arguments);
          }
          return _this.complete();
        }
      };
      this.allowed = callback;
      return callback;
    };

    DeferredCallbacks.prototype.call = function(callback) {
      if (this.done) return typeof callback === "function" ? callback() : void 0;
      return this.callbacks.push(callback);
    };

    return DeferredCallbacks;

  })();

  removed = function(el) {
    return el.closed === "removed";
  };

  module.exports = {
    Callback: Callback,
    CancelableCallbacks: CancelableCallbacks,
    DeferredCallbacks: DeferredCallbacks,
    removed: removed
  };

}).call(this);

});

require.define("/fn.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var isArray;
  var __slice = Array.prototype.slice;

  isArray = Array.isArray;

  module.exports = {
    add: function(parent, el) {
      var $el, $par, $parpar, e, i, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _ref5, _results, _results2, _results3, _results4;
      console.log("----------------------------", parent._browser.insert === true);
      $par = parent._dom;
      $el = el._dom;
      if (parent === parent.builder) {
        console.log("par builder", parent.toString(), el.toString());
        $par.push($el);
        i = $par.length - 1;
        if (parent._browser.wrapped) {
          parent._browser.wrapped = false;
          console.log("wrapped");
          if ((_ref = $par[0].parentElement) != null) {
            _ref.replaceWith($el, $par[0]);
          }
          if (parent.parent === ((_ref2 = parent.parent) != null ? _ref2.builder : void 0)) {
            console.log("parpar builder", parent.parent);
            $parpar = (_ref3 = parent.parent) != null ? _ref3._dom : void 0;
            return $parpar != null ? $parpar.splice.apply($parpar, [$parpar.indexOf($par), i + 1].concat(__slice.call($par))) : void 0;
          } else {
            console.log("shift", $par);
            _results = [];
            for (_i = 0, _len = $el.length; _i < _len; _i++) {
              e = $el[_i];
              _results.push($par.appendChild(e));
            }
            return _results;
          }
        } else if (parent._browser.insert === true) {
          console.log("insert is true", i, parent.toString(), el.toString());
          if (parent.parent === ((_ref4 = parent.parent) != null ? _ref4.builder : void 0)) {
            $parpar = (_ref5 = parent.parent) != null ? _ref5._dom : void 0;
            i = $par.length - 1;
            if (isArray($el)) {
              _results2 = [];
              for (_j = 0, _len2 = $el.length; _j < _len2; _j++) {
                e = $el[_j];
                _results2.push($parpar[0].parentElement.insertBefore(e, $parpar[i]));
              }
              return _results2;
            } else {
              return $parpar[0].parentElement.insertBefore($el, $parpar[i]);
            }
          } else {
            if (isArray($el)) {
              _results3 = [];
              for (_k = 0, _len3 = $el.length; _k < _len3; _k++) {
                e = $el[_k];
                _results3.push($par[0].parentElement.insertBefore(e, $par[i]));
              }
              return _results3;
            } else {
              return $par[0].parentElement.insertBefore($el, $par[i]);
            }
          }
        }
      } else {
        console.log("append", parent.toString(), el.toString(), $el.length, $el, isArray($el));
        if (isArray($el)) {
          _results4 = [];
          for (_l = 0, _len4 = $el.length; _l < _len4; _l++) {
            e = $el[_l];
            _results4.push($par.appendChild(e));
          }
          return _results4;
        } else {
          return $par.appendChild($el);
        }
      }
    },
    replace: function(oldtag, newtag) {
      var $new, $old, $par, parent;
      parent = newtag.parent;
      $new = newtag._jquery;
      $old = oldtag._jquery;
      $par = parent._jquery;
      if (parent === parent.builder) {
        return $par.splice($par.indexOf($old), 1, $new);
      } else {
        return $par.replaceChild($new, $old);
      }
    },
    remove: function(el, opts) {
      var $el, $par, parent;
      parent = el.parent;
      $par = parent._dom;
      $el = el._dom;
      if (parent === parent.builder) {
        return $par.splice($par.indexOf($el), 1);
      } else {
        return $par.removeChild($el);
      }
    },
    text: function(el, text) {
      return el._dom.textContent = text;
    },
    raw: function(el, html) {
      return el._dom.innerHTML = raw;
    },
    attr: function(el, key, value) {
      if (value === void 0) {
        return el._dom.removeAttribute(key);
      } else {
        return el._dom.setAttribute(key, value);
      }
    },
    show: function(el) {},
    hide: function(el) {}
  };

}).call(this);

});
;require('./dt-dom');}).call(this);