/**
 AsyncMap usage:

 // do something to a list of things
 asyncMap(myListOfStuff, function (thing, cb) { doSomething(thing.foo, cb) }, cb)
 // do more than one thing to each item
 asyncMap(list, fooFn, barFn, cb)
 // call a function that needs to go in and call the cb 3 times
 asyncMap(list, callsMoreThanOnce, 3, cb)
*/
/* globals i18n */

module.exports = asyncMap;

function asyncMap() {
  var steps = Array.prototype.slice.call(arguments);
  var list = steps.shift() || [];
  var cb_ = steps.pop();

  if (typeof cb_ !== "function") {
    throw new Error(i18n._("No callback provided to asyncMap"));
  }
  if (!list) {
    return cb_(null, []);
  }
  if (!Array.isArray(list)) {
    list = [list];
  }

  var n = steps.length;
  // actually a 2d array
  var data = [];
  var errState = null;
  var l = list.length;
  var a = l * n;

  if (!a) return cb_(null, []);
  function cb(er) {
    if (errState) {
      return;
    }
    var argLen = arguments.length;
    for (var i = 1; i < argLen; i++) {
      if (arguments[i] !== undefined) {
        data[i - 1] = (data[i - 1] || []).concat(arguments[i]);
      }
    }
    // see if any new things have been added.
    if (list.length > l) {
      var newList = list.slice(l);
      a += (list.length - l) * n;
      l = list.length;
      process.nextTick(function () {
        newList.forEach(function (ar) {
          steps.forEach(function (fn) {
            fn(ar, cb);
          });
        });
      });
    }
    // allow the callback to return boolean "false" to indicate
    // that an error should not tank the process.
    if (er || --a === 0) {
      errState = er;
      cb_.apply(null, [errState].concat(data));
    }
  }

  // expect the supplied cb function to be called
  // "n" times for each thing in the array.
  list.forEach(function (ar) {
    steps.forEach(function (fn) {
      fn(ar, cb);
    });
  });
}
