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
  var Animation, DOMAdapter, EVENTS, delay, domify, isArray, release, removed;

  Animation = require('animation').Animation;

  isArray = Array.isArray;

  EVENTS = ['add', 'close', 'end', 'show', 'hide', 'attr', 'text', 'raw', 'remove', 'replace'];

  removed = function(el) {
    return el.closed === "removed";
  };

  delay = function(job) {
    var _ref;
    if (removed(this)) return;
    if (this._dom != null) {
      return job();
    } else {
      if ((_ref = this._dom_delay) == null) this._dom_delay = [];
      return this._dom_delay.push(job);
    }
  };

  release = function() {
    var job, _i, _len, _ref;
    if (this._dom_delay != null) {
      _ref = this._dom_delay;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        job = _ref[_i];
        job();
      }
      return delete this._dom_delay;
    }
  };

  DOMAdapter = (function() {

    function DOMAdapter(template, opts) {
      var _ref, _ref2, _ref3, _ref4, _ref5;
      this.template = template;
      if (opts == null) opts = {};
      this.builder = (_ref = this.template.xml) != null ? _ref : this.template;
      if ((_ref2 = opts.timeoutexecution) == null) opts.timeoutexecution = '20ms';
      if ((_ref3 = opts.execution) == null) opts.execution = '4ms';
      if ((_ref4 = opts.timeout) == null) opts.timeout = '120ms';
      if ((_ref5 = opts.toggle) == null) opts.toggle = true;
      this.animation = new Animation(opts);
      this.animation.start();
      this.initialize();
    }

    DOMAdapter.prototype.initialize = function() {
      var old_query;
      this.listen();
      old_query = this.builder.query;
      this.builder.query = function(type, tag, key) {
        if (tag._dom == null) return old_query.call(this, type, tag, key);
        if (type === 'attr') {
          return tag._dom.getAttribute(key);
        } else if (type === 'text') {
          return tag._dom.text || tag._dom.textContent || tag._dom.innerHTML || "";
        } else if (type === 'tag') {
          if (key._dom != null) {
            return key;
          } else {
            return {
              _dom: key
            };
          }
        }
      };
      return this.template.register('ready', function(tag, next) {
        if (tag._dom_ready === true) {
          return next(tag);
        } else {
          return tag._dom_ready = function() {
            return next(tag);
          };
        }
      });
    };

    DOMAdapter.prototype.listen = function() {
      var _this = this;
      return EVENTS.forEach(function(event) {
        return _this.template.on(event, _this["on" + event].bind(_this));
      });
    };

    DOMAdapter.prototype.onadd = function(parent, el) {
      var _this = this;
      return delay.call(parent, function() {
        var done;
        if (parent === parent.builder) {
          parent._dom.push(el._dom);
          if (typeof el._dom_ready === "function") el._dom_ready();
          return el._dom_ready = true;
        } else {
          done = function() {
            return _this.animation.push(function() {
              var e, pardom, _i, _len, _ref;
              pardom = parent._dom;
              if (isArray(el._dom)) {
                _ref = el._dom;
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  e = _ref[_i];
                  if (pardom != null) pardom.appendChild(e);
                }
              } else {
                if (pardom != null) pardom.appendChild(el._dom);
              }
              if (typeof el._dom_ready === "function") el._dom_ready();
              return el._dom_ready = true;
            });
          };
          if (el === el.builder) {
            return el.ready(done);
          } else {
            return done();
          }
        }
      });
    };

    DOMAdapter.prototype.onclose = function(el) {
      var key, value, _ref, _ref2, _ref3;
      if (el === el.builder) {
        el._dom = [];
        return release.call(el);
      }
      el._namespace = el.attrs['xmlns'];
      if (el._namespace != null) {
        if ((_ref = el._dom) == null) {
          el._dom = document.createElementNS(el._namespace, el.name);
        }
      } else {
        if ((_ref2 = el._dom) == null) el._dom = document.createElement(el.name);
      }
      _ref3 = el.attrs;
      for (key in _ref3) {
        value = _ref3[key];
        el._dom.setAttribute(key, value);
      }
      return release.call(el);
    };

    DOMAdapter.prototype.ontext = function(el, text) {
      return delay.call(el, function() {
        return el._dom.textContent = text;
      });
    };

    DOMAdapter.prototype.onraw = function(el, html) {
      var _this = this;
      return delay.call(el, function() {
        return _this.animation.push(function() {
          var _ref;
          return (_ref = el._dom) != null ? _ref.innerHTML = html : void 0;
        });
      });
    };

    DOMAdapter.prototype.onshow = function(el) {
      return delay.call(el, function() {});
    };

    DOMAdapter.prototype.onhide = function(el) {
      return delay.call(el, function() {});
    };

    DOMAdapter.prototype.onattr = function(el, key, value) {
      return delay.call(el, function() {
        if (value === void 0) {
          return el._dom.removeAttribute(key);
        } else {
          return el._dom.setAttribute(key, value);
        }
      });
    };

    DOMAdapter.prototype.onreplace = function(el, tag) {
      var _this = this;
      return delay.call(el, function() {
        return _this.animation.push(function() {
          var _dom, _ref, _ref2, _ref3;
          if (removed(el)) return;
          _dom = (_ref = tag._dom) != null ? _ref : tag;
          if (!((_dom != null ? _dom.length : void 0) > 0)) return;
          if ((_ref2 = el.parent) != null) {
            if ((_ref3 = _ref2._dom) != null) _ref3.replaceChild(_dom);
          }
          el._dom = _dom;
          if (el === _this.builder) return el.dom = _dom;
        });
      });
    };

    DOMAdapter.prototype.onremove = function(el) {
      return delay.call(el.parent, function() {
        var _ref, _ref2;
        if (el._dom != null) {
          if ((_ref = el.parent) != null) {
            if ((_ref2 = _ref._dom) != null) _ref2.removeChild(el._dom);
          }
        }
        return delete el._dom;
      });
    };

    DOMAdapter.prototype.onend = function() {
      return this.template.dom = this.builder._dom;
    };

    return DOMAdapter;

  })();

  domify = function(tpl, opts) {
    new DOMAdapter(tpl, opts);
    return tpl;
  };

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

require.define("/node_modules/animation/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"animation","description":"animation timing & handling","version":"0.1.0","homepage":"https://github.com/dodo/node-animation","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/node-animation.git"},"main":"animation.js","engines":{"node":">= 0.4.x"},"keywords":["request","animation","frame","interval","node","browser"],"scripts":{"prepublish":"cake build"},"dependencies":{"ms":">= 0.1.0","request-animation-frame":">= 0.1.0"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.2"}}
});

require.define("/node_modules/animation/animation.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/animation')

});

require.define("/node_modules/animation/lib/animation.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var EventEmitter, cancelAnimationFrame, ms, now, requestAnimationFrame, _ref;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  _ref = require('request-animation-frame'), requestAnimationFrame = _ref.requestAnimationFrame, cancelAnimationFrame = _ref.cancelAnimationFrame;

  ms = require('ms');

  now = function() {
    return new Date().getTime();
  };

  this.Animation = (function() {

    __extends(Animation, EventEmitter);

    function Animation(opts) {
      var _ref2, _ref3, _ref4;
      if (opts == null) opts = {};
      this.nextTick = __bind(this.nextTick, this);
      this.timoutexecutiontime = ms((_ref2 = opts.timeoutexecution) != null ? _ref2 : 20);
      this.executiontime = ms((_ref3 = opts.execution) != null ? _ref3 : 5);
      this.timeouttime = opts.timeout;
      if (this.timeouttime != null) this.timeouttime = ms(this.timeouttime);
      this.autotoggle = (_ref4 = opts.toggle) != null ? _ref4 : false;
      this.frametime = opts.frame;
      if (this.frametime != null) this.frametime = ms(this.frametime);
      this.queue = [];
      this.running = false;
      this.paused = false;
      Animation.__super__.constructor.apply(this, arguments);
    }

    Animation.prototype.work_queue = function(started, dt, executiontime) {
      var t, _base, _results;
      t = now();
      _results = [];
      while (this.queue.length && t - started < executiontime) {
        if (typeof (_base = this.queue.shift()) === "function") _base();
        _results.push(t = now());
      }
      return _results;
    };

    Animation.prototype.push = function(callback) {
      this.queue.push(callback);
      if (this.running && this.autotoggle) return this.resume();
    };

    Animation.prototype.nextTick = function(callback) {
      var request, t, tick, timeout, _ref2;
      _ref2 = [null, null], timeout = _ref2[0], request = _ref2[1];
      t = now();
      tick = function(success) {
        var dt, executiontime, started;
        started = now();
        dt = started - t;
        if (success) {
          executiontime = this.executiontime;
        } else {
          executiontime = this.timoutexecutiontime;
        }
        if (success) {
          clearTimeout(timeout);
        } else {
          cancelAnimationFrame(request);
        }
        this.emit('tick', dt);
        if (typeof callback === "function") callback(dt);
        this.work_queue(started, dt, executiontime);
        if (this.running && !this.paused) {
          if (this.queue.length) {
            return this.nextTick();
          } else {
            if (this.autotoggle) {
              return this.pause();
            } else {
              return this.nextTick();
            }
          }
        }
      };
      request = requestAnimationFrame(tick.bind(this, true), this.frametime);
      if (this.timeouttime != null) {
        return timeout = setTimeout(tick.bind(this, false), this.timeouttime);
      }
    };

    Animation.prototype.start = function() {
      if (this.running) return;
      this.running = true;
      this.emit('start');
      if (!this.paused) {
        if (this.autotoggle) {
          if (this.queue.length) {
            return this.nextTick();
          } else {
            return this.pause();
          }
        } else {
          return this.nextTick();
        }
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

require.define("/node_modules/animation/node_modules/request-animation-frame/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"request-animation-frame","description":"requestAnimationFrame shim","version":"0.1.0","homepage":"https://github.com/dodo/requestAnimationFrame.js","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/requestAnimationFrame.js.git"},"main":"shim.js","engines":{"node":">= 0.4.x"},"keywords":["request","animation","frame","shim","browser","polyfill"],"scripts":{"prepublish":"cake build"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.2"}}
});

require.define("/node_modules/animation/node_modules/request-animation-frame/shim.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/shim')

});

require.define("/node_modules/animation/node_modules/request-animation-frame/lib/shim.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var _ref;

  _ref = (function() {
    var cancel, isNative, last, request, vendor, _i, _len, _ref;
    last = 0;
    request = typeof window !== "undefined" && window !== null ? window.requestAnimationFrame : void 0;
    cancel = typeof window !== "undefined" && window !== null ? window.cancelAnimationFrame : void 0;
    _ref = ["webkit", "moz", "o", "ms"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vendor = _ref[_i];
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
      cur = new Date().getTime();
      time = Math.max(0, timeout + last - cur);
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
  })(), this.requestAnimationFrame = _ref[0], this.cancelAnimationFrame = _ref[1];

}).call(this);

});

require.define("/node_modules/animation/node_modules/ms/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"ms","version":"0.1.0","description":"Tiny ms conversion utility","main":"./ms","devDependencies":{"mocha":"*","expect.js":"*","serve":"*"}}
});

require.define("/node_modules/animation/node_modules/ms/ms.js", function (require, module, exports, __dirname, __filename) {
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
;require('./dt-dom');}).call(this);