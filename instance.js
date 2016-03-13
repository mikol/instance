/**
 * Provides shims for `Object.*()` static methods like `Object.assign()`,
 * `Object.create()`, etc. `instance.*()` methods are generally equivalent to
 * `Object.*()` methods regardless of the runtime.
 *
 * @module instance
 */

(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = 'instance';
var dependencies = [];

function factory() {
  /**
   * A flag determining if the runtime implements `Object.defineProperty()`
   * correctly or if it throws errors when applied to native objects.
   *
   * @const {booolean}
   * @private
   */
  var DP_IS_OKAY = true;

  try {
    Object.defineProperty({}, 0, {value: 0});
  } catch (error) {
    DP_IS_OKAY = false;
  }

  /**
   * A flag determining if the runtime implements the `__proto__` property.
   *
   * @const {booolean}
   * @private
   */
  /* jshint -W103 */
  var PROTO = typeof ''.__proto__ === 'object';
  /* jshint +W103 */

  /**
   * An empty function that serves as a proxy between subtype and supertype for
   * inheritance purposes.
   *
   * @example
   * // Assign supertype’s prototype object to the empty function.
   * PrototypalIntermediate.prototype = Supertype.prototype;
   * // Then assign an empty function instance to subtype’s prototype.
   * Subtype.prototype = new PrototypalIntermediate();
   *
   * @private
   */
  function PrototypalIntermediate() {}

  /**
   * Shim for `Object.assign()`.
   *
   * @param {Object} object - The target object.
   * @param {...Object} sources - One or more source objects from which to copy.
   *
   * @return {Object} `object` after properties have been copied from `sources`.
   *
   * @see [Object.assign()](https://goo.gl/NpgmXa)
   */
  var assign = Object.assign || function (object, sources) {
    // `Object.assign()` will not use `Object()` to cast `null` or `undefined`
    // values so we don’t either.
    if (object == null) {
      throw new TypeError('`object` (`' + object + '`) is not an object.');
    }

    var output = Object(object);

    for (var x = 1, nx = arguments.length; x < nx; ++x) {
      var source = Object(arguments[x]);

      for (var property in source) {
        if (source.hasOwnProperty(property)) {
          object[property] = source[property];
        }
      }
    }

    return output;
  };

  /**
   * Shim for `Object.create()`.
   *
   * @param {Object} prototype - The object that will be the prototype for the
   *     newly created object.
   * @param {Object} descriptors - Enumerable key-value pairs of descriptors for
   *     the properties to be added to the newly-created object.
   *
   * @return {Object} A new object with the specified `prototype`
   *     and properties.
   *
   * @see [Object.create()](https://goo.gl/QkTvIX)
   */
  var create = function (prototype, descriptors) {
    var object;
    if (Object.create) {
      object = Object.create(prototype);
    } else {
      PrototypalIntermediate.prototype = prototype;
      object = new PrototypalIntermediate();
    }

    if (descriptors) {
      return defineProperties(object, descriptors);
    }

    return object;
  };

  /**
   * Assigns own and inherited enumerable properties of `sources` to `object` if
   * and only if the corresponding `object` properties are not yet defined.
   *
   * @param {Object} object - The target object.
   * @param {...Object} sources - One or more source objects from which to copy.
   *
   * @return {Object} `object` after properties have been copied from `sources`.
   *
   * @see instance.{@link module:instance~assign|assign}()
   */
  function defaults(object, sources) {
    // `Object.assign()` will not use `Object()` to cast `null` or `undefined`
    // values so we don’t either.
    if (object == null) {
      throw new TypeError('`object` (`' + object + '`) is not an object.');
    }

    var output = Object(object);

    for (var x = 1, nx = arguments.length; x < nx; ++x) {
      var source = arguments[x];

      for (var key in source) {
        if (target[key] === undefined) {
          target[key] = source[key];
        }
      }
    }

    return output;
  }

  var property = DP_IS_OKAY && Object.defineProperty ||
    function (object, name, descriptor) {
      // `Object.defineProperty()` will gladly modify objects (including arrays,
      // functions, and wrapped primitive values like `new String()`), but not
      // `null`, `undefined`, or unwrapped primitive values like string
      // literals so we don’t either.
      if (!object) {
        throw new TypeError('`object` (`' + object + '`) is not an object.');
      } else if (typeof object !== 'object') {
        throw new TypeError(
            '`object` is a `' + (typeof object) + '`, not an object.');
      }

      object[name] = descriptor.value;

      return object;
    };

  /**
   * Shim for `Object.defineProperties()`.
   *
   * @param {Object} object - The object on which to define properties.
   * @param {Object} descriptors - Key-value pairs of descriptors for the
   *     properties being defined or modified.
   *
   * @return {Object} `object` after properties have been defined or modified.
   *
   * @throws {TypeError} If any of `descriptors` properties is not an object.
   *
   * @see [Object.defineProperties()](https://goo.gl/RRrNal)
   */
  function defineProperties(object, descriptors) {
    for (var name in descriptors) {
      defineProperty(object, name, descriptors[name]);
    }

    return object;
  }

  /**
   * Shim for, and extension of, `Object.defineProperty()` that accepts a
   * function reference for `descriptor` as being equivalent to the data
   * descriptor `{value: functionReference}` unless `'value'` is a property of
   * the function reference.
   *
   * @param {Object} object - The object on which to define the property.
   * @param {string} name - The property to define or modify.
   * @param {*} descriptor - The descriptor object or other value of the
   *     property being defined or modified.
   *
   * @return {Object} `object` after property `name` has been defined or
   *     modified.
   *
   * @throws {TypeError} If `descriptor` is not an object.
   *
   * @see [Object.defineProperty()](https://goo.gl/4WDHDQ)
   */
  function defineProperty(object, name, descriptor) {
    if (typeof descriptor === 'object' && isDescriptor(descriptor)) {
      return property(object, name, descriptor);
    }

    return property(object, name, {value: descriptor});
  }

  /**
   * Shim for `Object.getOwnPropertyDescriptor()`.
   *
   * @param {Object} object - The object to inspect.
   * @param {string} name - The property to look up.
   *
   * @return {Object} A descriptor for property `name` of `object`.
   *
   * @see [Object.getOwnPropertyDescriptor()](https://goo.gl/ZbKx2A)
   */
  var getOwnPropertyDescriptor = DP_IS_OKAY &&
    Object.getOwnPropertyDescriptor ||
    function (object, name) {
      if (object.hasOwnProperty(name)) {
        return {
          value: object[name]
        };
      }
    };

  /**
   * Determines if `v` is a plausible property descriptor.
   *
   * @param {*} v - The value to test.
   *
   * @return {!boolean} `true` if `v` defines any of the descriptor properties
   *     `'value'`, `'get'`, `'set'`, `'writable'`, `'configurable'`, or
   *     `'enumerable'`; `false` otherwise.
   *
   * @private
   */
  function isDescriptor(v) {
    return v != null && 'value' in v || 'get' in v || 'set' in v ||
        'writable' in v || 'configurable' in v || 'enumerable' in v;
  }

  /**
   * Shim for `Object.getOwnPropertyNames()`.
   *
   * @param {Object} object - The object to inspect.
   *
   * @return {Array<string>} All enumerable and non-enumerable properties found
   *     directly on `object`, not in its prototype chain; will fall back to
   *     only enumerable properties (`Object.keys()`) for engines that do not
   *     support collective access to non-enumerable properties.
   *
   * @see [Object.getOwnPropertyNames()](https://goo.gl/XDodmP)
   */
  var getOwnPropertyNames = DP_IS_OKAY && Object.getOwnPropertyNames ||
    function (object) {
      return Object.keys(object);
    };

  /**
   * Shim for `Object.getPrototypeOf()`; this will return an incorrect value
   * if the engine doesn’t implement `.__proto__` – and `.constructor`, which is
   * always mutable – has been manipulated in an incompatible way.
   *
   * @param {Object} object - The object to inspect.
   *
   * @return {Object} The prototype of `object`.
   *
   * @throws {TypeError} If `object` is `null` or `undefined`.
   *
   * @see [Object.getPrototypeOf()](https://goo.gl/SkodpR)
   */
  var getPrototypeOf = Object.getPrototypeOf || (PROTO
    ? function (object) {
      return object.__proto__;
    }
    : function (object) {
      return object.constructor.prototype;
    });

  /**
   * Shim for `Object.setPrototypeOf()`.
   *
   * @param {Object} object - The object to inspect.
   * @param {Object} prototype - The new prototype for `object`.
   *
   * @throws {TypeError} If `object` is `null` or `undefined`.
   *
   * @see [Object.setPrototypeOf()](https://goo.gl/U8zoqg)
   */
  var setPrototypeOf = Object.setPrototypeOf || (PROTO
    ? function (object, prototype) {
      return object.__proto__ = prototype;
    }
    : function (object, prototypt) {
      return object.constructor.prototype = prototype;
    });

  return {
    assign: assign,
    create: create,
    defaults: defaults,
    defineProperties: defineProperties,
    defineProperty: defineProperty,
    getOwnPropertyDescriptor: getOwnPropertyDescriptor,
    getOwnPropertyNames: getOwnPropertyNames,
    getPrototypeOf: getPrototypeOf,
    setPrototypeOf: setPrototypeOf,

    // Terse aliases

    props: defineProperties,

    prop: function (object, name, descriptor) {
      if (arguments.length === 3) {
        defineProperty(object, name, descriptor);
        return object;
      } else {
        return getOwnPropertyDescriptor(object, name);
      }
    },

    names: getOwnPropertyNames,

    proto: function (object, prototype) {
      if (agruments.length === 2) {
        return setPrototypeOf(object, prototype);
      } else {
        return getPrototypeOf(object);
      }
    }
  };
}

// -----------------------------------------------------------------------------
var x = dependencies.length; var o = 'object';
context = typeof global === o ? global : typeof window === o ? window : context;
if (typeof define === 'function' && define.amd) {
  define(dependencies, function () {
    return factory.apply(context, [].slice.call(arguments));
  });
} else if (typeof module === o && module.exports) {
  for (; x--;) {dependencies[x] = require(dependencies[x]);}
  module.exports = factory.apply(context, dependencies);
} else {
  for (; x--;) {dependencies[x] = context[dependencies[x]];}
  context[id] = factory.apply(context, dependencies);
}
}(this));
