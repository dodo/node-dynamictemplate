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

require.define("/list.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var List, Order, mark;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __slice = Array.prototype.slice;

  Order = require('order').Order;

  mark = function(el) {
    var _ref;
    el = (_ref = el.xml) != null ? _ref : el;
    return function(done) {
      el._list_ready = done;
      return el;
    };
  };

  List = (function() {

    __extends(List, Order);

    function List() {
      List.__super__.constructor.call(this, function(_arg) {
        var after, before, idx;
        idx = _arg.idx, before = _arg.before, after = _arg.after;
        return this[idx]._list = {
          idx: idx,
          before: before,
          after: after,
          list: this
        };
      });
    }

    List.prototype.push = function(el) {
      return List.__super__.push.call(this, mark(el));
    };

    List.prototype.unshift = function(el) {
      return List.__super__.unshift.call(this, mark(el));
    };

    List.prototype.insert = function(i, el) {
      return List.__super__.insert.call(this, i, mark(el));
    };

    List.prototype.splice = function() {
      var d, el, els, i;
      i = arguments[0], d = arguments[1], els = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      return List.__super__.splice.apply(this, [i, d].concat(__slice.call((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = els.length; _i < _len; _i++) {
          el = els[_i];
          _results.push(mark(el));
        }
        return _results;
      })())));
    };

    return List;

  })();

  List.List = List;

  module.exports = List;

  if (process.title === 'browser') {
    (function() {
      if (this.dynamictemplate != null) {
        return this.dynamictemplate.List = List;
      } else {
        return this.dynamictemplate = {
          List: List
        };
      }
    }).call(window);
  }

}).call(this);

});

require.define("/node_modules/order/package.json", function (require, module, exports, __dirname, __filename) {
    module.exports = {"name":"order","description":"handle ordered async lists","version":"0.1.0","homepage":"https://github.com/dodo/node-order","author":"dodo (https://github.com/dodo)","repository":{"type":"git","url":"git://github.com/dodo/node-order.git"},"main":"order.js","engines":{"node":">= 0.4.x"},"keywords":["order","list","array","collection","sequence","async","control","flow"],"scripts":{"test":"cake build && nodeunit test","prepublish":"cake build"},"devDependencies":{"nodeunit":">= 0.5.4","muffin":">= 0.2.6","coffee-script":">= 1.1.3"}}
});

require.define("/node_modules/order/order.js", function (require, module, exports, __dirname, __filename) {
    
module.exports = require('./lib/order')

});

require.define("/node_modules/order/lib/order.js", function (require, module, exports, __dirname, __filename) {
    (function() {
  var Order, delay, mark, ready, release, splice;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  splice = Array.prototype.splice;

  mark = function(list) {
    list._sync = true;
    return list;
  };

  release = function(list, result) {
    if (typeof list._sync === "function") list._sync();
    delete list._sync;
    return result;
  };

  delay = function(list, callback) {
    if (list._sync) {
      return list._sync = callback;
    } else {
      return callback();
    }
  };

  ready = function() {
    var after, args, before, i, _arg;
    var _this = this;
    _arg = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    i = _arg.i;
    if (isNaN(i)) return;
    if (this.done[i]) return;
    this.done[i] = true;
    after = i + 1;
    while (this.done[after] === false) {
      after++;
    }
    if (this.done[after] === void 0) after = -1;
    before = i - 1;
    while (this.done[before] === false) {
      before--;
    }
    if (this.done[before] === void 0) before = -1;
    return delay(this, function() {
      var _ref;
      return (_ref = _this.callback) != null ? _ref.call.apply(_ref, [_this, {
        idx: i,
        before: before,
        after: after
      }].concat(__slice.call(args))) : void 0;
    });
  };

  Order = (function() {

    __extends(Order, Array);

    function Order(callback) {
      this.callback = callback;
      this.splice = __bind(this.splice, this);
      this.remove = __bind(this.remove, this);
      this.insert = __bind(this.insert, this);
      this.shift = __bind(this.shift, this);
      this.pop = __bind(this.pop, this);
      this.unshift = __bind(this.unshift, this);
      this.push = __bind(this.push, this);
      this.keys = [];
      this.done = [];
      Order.__super__.constructor.apply(this, arguments);
    }

    Order.prototype.push = function(entry) {
      var idx;
      if (entry == null) return;
      idx = {
        i: this.length
      };
      this.done.push(false);
      this.keys.push(idx);
      return release(this, Order.__super__.push.call(this, entry(ready.bind(mark(this), idx))));
    };

    Order.prototype.unshift = function(entry) {
      var e, idx, _i, _len, _ref;
      if (entry == null) return;
      idx = {
        i: 0
      };
      _ref = this.keys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        e.i++;
      }
      this.done.unshift(false);
      this.keys.unshift(idx);
      return release(this, Order.__super__.unshift.call(this, entry(ready.bind(mark(this), idx))));
    };

    Order.prototype.pop = function() {
      var _ref;
      if ((_ref = this.keys[this.keys.length - 1]) != null) _ref.i = NaN;
      this.done.pop();
      this.keys.pop();
      return Order.__super__.pop.apply(this, arguments);
    };

    Order.prototype.shift = function() {
      var e, _i, _len, _ref, _ref2;
      if ((_ref = this.keys[0]) != null) _ref.i = NaN;
      this.done.shift();
      this.keys.shift();
      _ref2 = this.keys;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        e = _ref2[_i];
        e.i--;
      }
      return Order.__super__.shift.apply(this, arguments);
    };

    Order.prototype.insert = function(i, entry) {
      var e, idx, _i, _len, _ref;
      idx = {
        i: i
      };
      _ref = this.keys.slice(i);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        e.i++;
      }
      this.keys.splice(i, 0, idx);
      this.done.splice(i, 0, false);
      return release(this, splice.call(this, i, 0, entry(ready.bind(mark(this), idx))));
    };

    Order.prototype.remove = function(i) {
      var e, _i, _len, _ref, _ref2, _ref3;
      if ((_ref = this.keys[i]) != null) _ref.i = NaN;
      this.done.splice(i, 1);
      this.keys.splice(i, 1);
      _ref2 = this.keys.slice(i);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        e = _ref2[_i];
        e.i--;
      }
      return (_ref3 = splice.call(this, i, 1)) != null ? _ref3[0] : void 0;
    };

    Order.prototype.splice = function() {
      var del, dones, e, entries, entry, i, idxs, index, len, result, sync, syncs, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4;
      index = arguments[0], del = arguments[1], entries = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (index == null) return Order.__super__.splice.apply(this, arguments);
      len = entries.length;
      _ref = this.keys.slice(index, (index + del));
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        e.i = NaN;
      }
      idxs = (function() {
        var _results;
        _results = [];
        for (i = 0; 0 <= len ? i < len : i > len; 0 <= len ? i++ : i--) {
          _results.push({
            i: i + index
          });
        }
        return _results;
      })();
      dones = (function() {
        var _results;
        _results = [];
        for (i = 0; 0 <= len ? i < len : i > len; 0 <= len ? i++ : i--) {
          _results.push(false);
        }
        return _results;
      })();
      (_ref2 = this.done).splice.apply(_ref2, [index, del].concat(__slice.call(dones)));
      (_ref3 = this.keys).splice.apply(_ref3, [index, del].concat(__slice.call(idxs)));
      _ref4 = this.keys.slice(index + len);
      for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
        e = _ref4[_j];
        e.i = e.i - del + len;
      }
      syncs = [];
      for (i = 0, _len3 = entries.length; i < _len3; i++) {
        entry = entries[i];
        mark(this);
        entries[i] = entry(ready.bind(this, idxs[i]));
        syncs.push(this._sync);
      }
      mark(this);
      result = Order.__super__.splice.apply(this, [index, del].concat(__slice.call(entries)));
      for (_k = 0, _len4 = syncs.length; _k < _len4; _k++) {
        sync = syncs[_k];
        if (typeof sync === "function") sync();
      }
      release(this);
      return result;
    };

    return Order;

  })();

  Order.Order = Order;

  module.exports = Order;

}).call(this);

});
;require('./list');}).call(this);