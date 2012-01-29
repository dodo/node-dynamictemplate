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
  var delay, frame_queue, jqueryify, nextAnimationFrame, release, requestAnimationFrame, work_frame_queue;
  var __slice = Array.prototype.slice;

  requestAnimationFrame = require('request-animation-frame').requestAnimationFrame;

  frame_queue = [];

  nextAnimationFrame = function(cb) {
    var next;
    frame_queue.push(cb);
    next = function() {
      return requestAnimationFrame(function() {
        work_frame_queue();
        if (frame_queue.length) return next();
      });
    };
    if (frame_queue.length === 1) return next();
  };

  work_frame_queue = function() {
    var t1, t2, _base, _results;
    t1 = t2 = new Date().getTime();
    _results = [];
    while (frame_queue.length && t2 - t1 < 5) {
      if (typeof (_base = frame_queue.shift()) === "function") _base();
      _results.push(t2 = new Date().getTime());
    }
    return _results;
  };

  delay = function(job) {
    var _ref;
    if (this._jquery != null) {
      return job();
    } else {
      if ((_ref = this._jquery_delay) == null) this._jquery_delay = [];
      return this._jquery_delay.push(job);
    }
  };

  release = function() {
    var job, _i, _len, _ref;
    if (this._jquery_delay != null) {
      _ref = this._jquery_delay;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        job = _ref[_i];
        job();
      }
      return delete this._jquery_delay;
    }
  };

  jqueryify = function(tpl) {
    var old_query;
    tpl.on('add', function(parent, el) {
      return delay.call(parent, function() {
        if (parent === tpl.xml) {
          return parent._jquery = parent._jquery.add(el._jquery);
        } else {
          return nextAnimationFrame(function() {
            return parent._jquery.append(el._jquery);
          });
        }
      });
    });
    tpl.on('close', function(el) {
      var _ref;
      if ((_ref = el._jquery) == null) el._jquery = $(el.toString());
      release.call(el);
      return el.on('newListener', function(type) {
        var _ref2, _ref3;
        if ((_ref2 = el._events) != null ? (_ref3 = _ref2[type]) != null ? _ref3.length : void 0 : void 0) {
          return;
        }
        return el._jquery.bind(type, function() {
          el.emit.apply(el, [type, this].concat(__slice.call(arguments)));
        });
      });
    });
    tpl.on('text', function(el, text) {
      return delay.call(el, function() {
        return el._jquery.text(text);
      });
    });
    tpl.on('raw', function(el, html) {
      return delay.call(el, function() {
        return nextAnimationFrame(function() {
          return el._jquery.html(html);
        });
      });
    });
    tpl.on('show', function(el) {
      return delay.call(el, function() {
        return el._jquery.show();
      });
    });
    tpl.on('hide', function(el) {
      return delay.call(el, function() {
        return el._jquery.hide();
      });
    });
    tpl.on('attr', function(el, key, value) {
      return delay.call(el, function() {
        return el._jquery.attr(key, value);
      });
    });
    tpl.on('attr:remove', function(el, key) {
      return delay.call(el, function() {
        return el._jquery.removeAttr(key);
      });
    });
    tpl.on('replace', function(el, tag) {
      return delay.call(el, function() {
        return nextAnimationFrame(function() {
          var _jquery, _ref;
          _jquery = (_ref = tag._jquery) != null ? _ref : tag;
          if (!((_jquery != null ? _jquery.length : void 0) > 0)) return;
          el._jquery.replaceWith(_jquery);
          el._jquery = _jquery;
          if (el === tpl.xml) return el.jquery = _jquery;
        });
      });
    });
    tpl.on('remove', function(el) {
      var _ref;
      return (_ref = el._jquery) != null ? _ref.remove() : void 0;
    });
    tpl.on('end', function() {
      tpl.xml._jquery = $();
      release.call(tpl.xml);
      return tpl.jquery = tpl.xml._jquery;
    });
    old_query = tpl.xml.query;
    tpl.xml.query = function(type, tag, key) {
      if (tag._jquery == null) return old_query.call(this, type, tag, key);
      if (type === 'attr') {
        return tag._jquery.attr(key);
      } else if (type === 'text') {
        return tag._jquery.text();
      } else if (type === 'tag') {
        if (key._jquery != null) {
          return key;
        } else {
          return {
            _jquery: key
          };
        }
      }
    };
    return tpl;
  };

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

require.define("/node_modules/request-animation-frame/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"request-animation-frame","description":"requestAnimationFrame shim","version":"0.0.1","homepage":"https://github.com/dodo/requestAnimationFrame.js","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/requestAnimationFrame.js.git"},"main":"shim.js","engines":{"node":">= 0.4.x"},"keywords":["request","animation","frame","shim","browser","polyfill"],"scripts":{"prepublish":"cake build"},"devDependencies":{"muffin":">= 0.2.6","coffee-script":">= 1.1.2"}}
});

require.define("/node_modules/request-animation-frame/shim.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/shim')

});

require.define("/node_modules/request-animation-frame/lib/shim.js", function (require, module, exports, __dirname, __filename) {
    
  this.requestAnimationFrame = (function() {
    var last, request, vendor, _i, _len, _ref;
    last = 0;
    request = typeof window !== "undefined" && window !== null ? window.requestAnimationFrame : void 0;
    _ref = ["webkit", "moz", "o", "ms"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vendor = _ref[_i];
      if ((request != null ? request : request = typeof window !== "undefined" && window !== null ? window["" + vendor + "RequestAnimationFrame"] : void 0)) {
        break;
      }
    }
    return request != null ? request : function(callback) {
      var cur, time;
      cur = new Date().getTime();
      time = Math.max(0, 16 - cur + last);
      return setTimeout(callback, time);
    };
  })();

});
;require('./dt-jquery');}).call(this);