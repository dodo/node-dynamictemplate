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

require.define("/dt-jquery.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var $fyBuilder, Animation, EVENTS, JQueryAdapter, cancelable_and_retrivable_callbacks, createSpaceholder, defaultfn, deferred_callbacks, defineJQueryAPI, isArray, jqueryify, removed, singlton_callback, _ref;

  Animation = require('animation').Animation;

  _ref = require('./util'), singlton_callback = _ref.singlton_callback, deferred_callbacks = _ref.deferred_callbacks, cancelable_and_retrivable_callbacks = _ref.cancelable_and_retrivable_callbacks, defineJQueryAPI = _ref.defineJQueryAPI, $fyBuilder = _ref.$fyBuilder, createSpaceholder = _ref.createSpaceholder, removed = _ref.removed;

  defaultfn = require('./fn');

  isArray = Array.isArray;

  EVENTS = ['add', 'end', 'show', 'hide', 'attr', 'text', 'raw', 'remove', 'replace'];

  JQueryAdapter = (function() {

    function JQueryAdapter(template, opts) {
      var f, n, plugin, _base, _i, _len, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      this.template = template;
      if (opts == null) opts = {};
      this.builder = (_ref2 = this.template.xml) != null ? _ref2 : this.template;
      if ((_ref3 = opts.timeoutexecution) == null) opts.timeoutexecution = '32ms';
      if ((_ref4 = opts.execution) == null) opts.execution = '8ms';
      if ((_ref5 = opts.timeout) == null) opts.timeout = '120ms';
      if ((_ref6 = opts.toggle) == null) opts.toggle = true;
      if ((_ref7 = this.$) == null) {
        this.$ = (_ref8 = (_ref9 = opts.jquery) != null ? _ref9 : opts.$) != null ? _ref8 : typeof window !== "undefined" && window !== null ? window.$ : void 0;
      }
      this.animation = new Animation(opts);
      this.animation.start();
      this.fn = {};
      for (n in defaultfn) {
        f = defaultfn[n];
        if ((_ref10 = (_base = this.fn)[n]) == null) _base[n] = f.bind(this);
      }
      this.initialize();
      if ((_ref11 = opts.use) == null) opts.use = [];
      if (!isArray(opts.use)) opts.use = [opts.use];
      _ref12 = opts.use;
      for (_i = 0, _len = _ref12.length; _i < _len; _i++) {
        plugin = _ref12[_i];
        this.use(plugin);
      }
    }

    JQueryAdapter.prototype.initialize = function() {
      var old_query;
      this.listen();
      this.builder._jquery = this.$([]);
      this.builder._jquery_done = deferred_callbacks();
      this.builder._jquery_done.callback()();
      old_query = this.builder.query;
      this.builder.query = function(type, tag, key) {
        var attr, attrs, domel, _i, _len, _ref2;
        if (tag._jquery == null) return old_query.call(this, type, tag, key);
        if (type === 'attr') {
          return tag._jquery.attr(key);
        } else if (type === 'text') {
          return tag._jquery.text();
        } else if (type === 'tag') {
          if (key._jquery != null) {
            return key;
          } else {
            if ((domel = key[0]) != null) {
              attrs = {};
              _ref2 = domel.attributes;
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                attr = _ref2[_i];
                attrs[attr.name] = attr.value;
              }
              return new this.builder.Tag(domel.nodeName.toLowerCase(), attrs, function() {
                this._jquery = key;
                return this.end();
              });
            } else {
              return old_query.call(this, type, tag, key);
            }
          }
        }
      };
      return this.template.register('ready', function(tag, next) {
        if (tag._jquery_ready === true) {
          return next(tag);
        } else {
          return tag._jquery_ready = function() {
            return next(tag);
          };
        }
      });
    };

    JQueryAdapter.prototype.use = function(plugin) {
      if (plugin != null) plugin.call(this, this);
      return this;
    };

    JQueryAdapter.prototype.listen = function() {
      var _this = this;
      return EVENTS.forEach(function(event) {
        return _this.template.on(event, _this["on" + event].bind(_this));
      });
    };

    JQueryAdapter.prototype.onadd = function(parent, el) {
      var ecb, pcb, that, _base, _base2, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      if (removed(el)) return;
      if (el === el.builder) {
        if ((_ref2 = el._jquery) == null) {
          el._jquery = this.$([], (_ref3 = el.parent) != null ? _ref3._jquery : void 0);
        }
        $fyBuilder(el);
      } else {
        if ((_ref4 = el._jquery) == null) {
          el._jquery = this.$(el.toString(), el.parent._jquery);
        }
        defineJQueryAPI(el);
      }
      that = this;
      if ((_ref5 = el._jquery_manip) == null) {
        el._jquery_manip = cancelable_and_retrivable_callbacks();
      }
      if ((_ref6 = el._jquery_done) == null) {
        el._jquery_done = deferred_callbacks();
      }
      if ((_ref7 = parent._jquery_done) == null) {
        parent._jquery_done = deferred_callbacks();
      }
      ecb = el._jquery_done.callback();
      pcb = parent._jquery_done.callback();
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
      if ((_ref8 = el._jquery_insert) == null) {
        el._jquery_insert = singlton_callback(el, function() {
          if (this._jquery.length === 0) {
            createSpaceholder.call(that, this, this.parent._jquery);
          }
          that.fn.add(this.parent, this);
          if (this.parent._jquery_wrapped) {
            this.parent._jquery_wrapped = false;
            this.parent._jquery = this.parent._jquery.not(':first');
          }
          if (this.parent === this.parent.builder) $fyBuilder(this.parent);
          if (typeof this._jquery_ready === "function") this._jquery_ready();
          this._jquery_ready = true;
          return this._jquery_insert = true;
        });
      }
      if (typeof (_base = el._jquery_insert).replace === "function") {
        _base.replace(el);
      }
      if ((_ref9 = el._jquery_parent_done) == null) {
        el._jquery_parent_done = singlton_callback(el, function() {
          var bool, _ref10, _ref11;
          if (removed(this)) return;
          if (this.parent === this.parent.builder) {
            bool = !(this.parent.parent != null) || (this.parent.parent === ((_ref10 = this.parent.parent) != null ? _ref10.builder : void 0) && ((_ref11 = this.parent.parent) != null ? _ref11._jquery_done : void 0) === true);
            if (bool && this.parent._jquery_insert === true) {
              return that.animation.push(this._jquery_insert);
            } else {
              return typeof this._jquery_insert === "function" ? this._jquery_insert() : void 0;
            }
          } else {
            return that.animation.push(this._jquery_insert);
          }
        });
      }
      if (typeof (_base2 = el._jquery_parent_done).replace === "function") {
        _base2.replace(el);
      }
      return parent._jquery_done(el._jquery_parent_done);
    };

    JQueryAdapter.prototype.onreplace = function(oldtag, newtag) {
      var cb, oldreplacerequest, that, _base, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (removed(oldtag) || removed(newtag)) return;
      if ((_ref2 = newtag._jquery_parent_done) == null) {
        newtag._jquery_parent_done = oldtag._jquery_parent_done;
      }
      if ((_ref3 = newtag._jquery_insert) == null) {
        newtag._jquery_insert = oldtag._jquery_insert;
      }
      if ((_ref4 = newtag._jquery_done) == null) {
        newtag._jquery_done = oldtag._jquery_done;
      }
      oldtag._jquery_parent_done = null;
      oldtag._jquery_insert = null;
      oldtag._jquery_done = null;
      this.onadd(oldtag.parent, newtag);
      if ((_ref5 = oldtag._jquery_manip) != null) {
        if (typeof _ref5.cancel === "function") _ref5.cancel();
      }
      newtag._jquery_manip.reset();
      while ((cb = newtag._jquery_manip.callbacks.shift()) != null) {
        this.animation.push(cb);
      }
      if (newtag._jquery_insert === true) {
        that = this;
        if ((_ref6 = newtag._jquery_replace) == null) {
          newtag._jquery_replace = oldtag._jquery_replace;
        }
        oldreplacerequest = newtag._jquery_replace != null;
        if ((_ref7 = newtag._jquery_replace) == null) {
          newtag._jquery_replace = singlton_callback(newtag, function() {
            if (this._jquery.length === 0) {
              createSpaceholder.call(that, this, this.parent._jquery);
            }
            that.fn.replace(oldtag, this);
            if (this === this.builder) return $fyBuilder(this);
          });
        }
        if (typeof (_base = newtag._jquery_replace).replace === "function") {
          _base.replace(newtag);
        }
        oldtag._jquery_replace = null;
        if (!oldreplacerequest) return this.animation.push(newtag._jquery_replace);
      }
    };

    JQueryAdapter.prototype.ontext = function(el, text) {
      var _this = this;
      return this.animation.push(el._jquery_manip(function() {
        return _this.fn.text(el, text);
      }));
    };

    JQueryAdapter.prototype.onraw = function(el, html) {
      var _this = this;
      return this.animation.push(el._jquery_manip(function() {
        return _this.fn.raw(el, html);
      }));
    };

    JQueryAdapter.prototype.onattr = function(el, key, value) {
      var _this = this;
      return this.animation.push(el._jquery_manip(function() {
        return _this.fn.attr(el, key, value);
      }));
    };

    JQueryAdapter.prototype.onshow = function(el) {
      return this.fn.show(el);
    };

    JQueryAdapter.prototype.onhide = function(el) {
      return this.fn.hide(el);
    };

    JQueryAdapter.prototype.onremove = function(el) {
      var _ref2;
      if (el._jquery == null) return;
      this.fn.remove(el);
      el._jquery_done.reset();
      if ((_ref2 = el._jquery_manip) != null) _ref2.cancel();
      delete el._jquery_manip;
      delete el._jquery_done;
      return delete el._jquery;
    };

    JQueryAdapter.prototype.onend = function() {
      this.template.jquery = this.template._jquery = this.builder._jquery;
      return defineJQueryAPI(this.template);
    };

    return JQueryAdapter;

  })();

  jqueryify = function(opts, tpl) {
    var _ref2;
    if (tpl == null) _ref2 = [opts, null], tpl = _ref2[0], opts = _ref2[1];
    new JQueryAdapter(tpl, opts);
    return tpl;
  };

  jqueryify.fn = defaultfn;

  jqueryify.Adapter = JQueryAdapter;

  module.exports = jqueryify;

  if (process.title === 'browser') {
    (function() {
      if (this.dynamictemplate != null) {
        return this.dynamictemplate.jqueryify = jqueryify;
      } else {
        return this.dynamictemplate = {
          jqueryify: jqueryify
        };
      }
    }).call(window);
  }

}).call(this);

});

require.define("/node_modules/animation/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"animation","description":"animation timing & handling","version":"0.1.1","homepage":"https://github.com/dodo/node-animation","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/node-animation.git"},"main":"animation.js","engines":{"node":">= 0.4.x"},"keywords":["request","animation","frame","interval","node","browser"],"scripts":{"prepublish":"cake build"},"dependencies":{"ms":">= 0.1.0","request-animation-frame":">= 0.1.0"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.2"}}
});

require.define("/node_modules/animation/animation.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/animation')

});

require.define("/node_modules/animation/lib/animation.js", function (require, module, exports, __dirname, __filename) {
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
        if (requestAnimationFrame.isNative) {
          if (this.need_next_tick()) nextid = this.nextTick();
        }
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
        if (nextid == null) {
          if (this.need_next_tick()) nextid = this.nextTick();
          return;
        }
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

require.define("/util.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var $fyBuilder, cancelable_and_retrivable_callbacks, createSpaceholder, deferred_callbacks, defineJQueryAPI, removed, singlton_callback;

  singlton_callback = function(that, callback) {
    var req;
    req = function() {
      return callback != null ? callback.apply(that, arguments) : void 0;
    };
    req.replace = function(replacement) {
      return that = replacement;
    };
    return req;
  };

  deferred_callbacks = function() {
    var allowed, callbacks, done, res;
    done = false;
    callbacks = [];
    res = function(cb) {
      if (done) return typeof cb === "function" ? cb() : void 0;
      return callbacks.push(cb);
    };
    allowed = null;
    res.callback = function() {
      var callback;
      if (done) return (function() {});
      callback = function() {
        var cb;
        if (callback === allowed) {
          while ((cb = callbacks.shift()) != null) {
            if (typeof cb === "function") cb.apply(null, arguments);
          }
          callbacks = null;
          allowed = null;
          return done = true;
        }
      };
      allowed = callback;
      return callback;
    };
    res.reset = function() {
      allowed = null;
      callbacks = [];
      return done = false;
    };
    return res;
  };

  cancelable_and_retrivable_callbacks = function() {
    var canceled, res;
    canceled = false;
    res = function(cb) {
      return function() {
        if (canceled) {
          return res.callbacks.push(cb);
        } else {
          return typeof cb === "function" ? cb.apply(null, arguments) : void 0;
        }
      };
    };
    res.cancel = function() {
      return canceled = true;
    };
    res.reset = function() {
      return canceled = false;
    };
    res.callbacks = [];
    return res;
  };

  defineJQueryAPI = function(el) {
    el.__defineGetter__('selector', function() {
      return el._jquery.selector;
    });
    return el.__defineGetter__('context', function() {
      return el._jquery.context;
    });
  };

  $fyBuilder = function(builder) {
    var $builder;
    $builder = builder._jquery;
    builder.jquery = $builder;
    builder.template.jquery = $builder;
    builder.template._jquery = $builder;
    defineJQueryAPI(builder.template);
    return defineJQueryAPI(builder);
  };

  createSpaceholder = function(el, $par) {
    el._jquery = this.$('<spaceholder>', $par);
    el._jquery_wrapped = true;
    if (el === el.builder) {
      return $fyBuilder(el);
    } else {
      return defineJQueryAPI(el);
    }
  };

  removed = function(el) {
    return el.closed === "removed";
  };

  module.exports = {
    singlton_callback: singlton_callback,
    deferred_callbacks: deferred_callbacks,
    cancelable_and_retrivable_callbacks: cancelable_and_retrivable_callbacks,
    createSpaceholder: createSpaceholder,
    defineJQueryAPI: defineJQueryAPI,
    $fyBuilder: $fyBuilder,
    removed: removed
  };

}).call(this);

});

require.define("/fn.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var __slice = Array.prototype.slice;

  module.exports = {
    add: function(parent, el) {
      var $el, $par, $parpar, i, _ref, _ref2;
      $el = el._jquery;
      $par = parent._jquery;
      if (parent === parent.builder) {
        i = $par.length - 1;
        $par = $par.add($el);
        if (parent._jquery_wrapped) {
          $par.first().replaceWith($el);
          if (parent.parent === ((_ref = parent.parent) != null ? _ref.builder : void 0)) {
            $parpar = (_ref2 = parent.parent) != null ? _ref2._jquery : void 0;
            parent._jquery_wrapped = false;
            $par = $par.not(':first');
            if ($parpar != null) {
              $parpar.splice.apply($parpar, [$parpar.index($par), i + 1].concat(__slice.call($par)));
            }
          }
        } else if ($par.parent().length > 0) {
          $el.insertAfter($par[i]);
        }
      } else {
        $par.append($el);
      }
      return parent._jquery = $par;
    },
    replace: function(oldtag, newtag) {
      var $new, $old, $par, parent;
      parent = newtag.parent;
      $new = newtag._jquery;
      $old = oldtag._jquery;
      $par = parent._jquery;
      if (parent === parent.builder) {
        $par.splice.apply($par, [$par.index($old), $old.length].concat(__slice.call($new)));
      }
      if ($old.parent().length > 0) $old.replaceWith($new);
      return newtag._jquery = $new;
    },
    text: function(el, text) {
      return el._jquery.text(text);
    },
    raw: function(el, html) {
      return el._jquery.html(html);
    },
    attr: function(el, key, value) {
      if (value === void 0) {
        return el._jquery.removeAttr(key);
      } else {
        return el._jquery.attr(key, value);
      }
    },
    show: function(el) {
      return el._jquery.show();
    },
    hide: function(el) {
      return el._jquery.hide();
    },
    remove: function(el) {
      return el._jquery.remove();
    }
  };

}).call(this);

});
;require('./dt-jquery');}).call(this);