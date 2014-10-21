
var theclarative = (function(require) {
  'use strict';

  var global = this;

  function augment(object) {
    return {
      'with': function (augmenter) {
        var augmenterArguments = Array.prototype.slice.call(arguments, 1);
        var newObject = Object.create(object);
        the(newObject).mix(augmenter.prototype);
        augmenter.apply(newObject, augmenterArguments);
        newObject.__augmenters = newObject.__augmenters || [];
        newObject.__augmenters.push(augmenter);
        return newObject;
      }
    };
  }

  function the(object) {
    return {
      has: function(a1, a2) {
        var value, name;
        if (typeof a1 === 'function') {
          value = a1;
          name = value.name;
        }
        else if (typeof a1 === 'string' && typeof a2 !== 'undefined') {
          name = a1;
          value = a2;
        }
        else if (typeof a2 === 'undefined') {
          throw new Error('provide a `name` for values');
        }
        Object.defineProperty(object, name, { value: value });
        return this;
      },

      hasGetter: function(a1, a2) {
        var getter, name;
        if (typeof a1 === 'function') {
          getter = a1;
          name = getter.name;
        }
        else if (typeof a1 === 'string') {
          name = a1;
          getter = a2;
        }
        Object.defineProperty(object, name, { get: getter });
        return this;
      },

      hasSetter: function(a1, a2) {
        var setter, name;
        if (typeof a1 === 'function') {
          setter = a1;
          name = setter.name;
        }
        else if (typeof a1 === 'string') {
          name = a1;
          setter = a2;
        }
        Object.defineProperty(object, name, { set: setter });
        return this;
      },

      mix: function (other) {
        for (var property in other) {
          object[property] = other[property];
        }
        return this;
      },

      wasAugmentedBy: function (augmenter) {
        var augmenters = object.__augmenters || [];
        for (var i = 0, l = augmenters.length; i < l; i++) {
          if (augmenters[i] === augmenter) { return true; }
        }
        return false;
      }
    };
  }

  function theClass(klass) {
    var theKlassPrototype = the(klass.prototype);
    return {
      has: function() {
        theKlassPrototype.has.apply(theKlassPrototype, arguments);
        return this;
      },

      inheritsFrom: function(base) {
        klass.prototype = Object.create(base.prototype);
        klass.prototype.constructor = klass;
        return this;
      },

      mix: function (other) {
        var mixin = other.prototype;
        theKlassPrototype.mix(mixin);
        return this;
      }
    };
  }

  function install() {
    for (var utility in declarative) {
      if (declarative.hasOwnProperty(utility) && utility !== 'install') {
        global[utility] = declarative[utility];
      }
    }
  }

  var declarative = {
    the: the,
    theObject: the,
    augment: augment,
    theClass: theClass,
    install: install
  };

  return declarative;

}.call(this));
