import { HttpStatus } from '@nestjs/common';
// import camelCase from 'camelcase';
import { execSync } from 'child_process';
// import { MyLogger } from './loggers/MyLogger';
import { TransformFnParams } from 'class-transformer';
import { BaseException } from './exceptions/BaseException';

export function isStrNumeric(str) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

/**
 * ref: https://stackoverflow.com/a/26215431/973425
 */
export function toCamel(o) {
  let newO, origKey, newKey, value;
  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === 'object') {
        value = toCamel(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        newKey = origKey; //camelCase(origKey);
        value = o[origKey];
        if (
          value instanceof Array ||
          (value !== null && value?.constructor === Object)
        ) {
          value = toCamel(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}

export function cmd(cmd_to_run) {
  return execSync(cmd_to_run, { encoding: 'utf-8' });
}

export function areEqual(args: any[]) {
  let i, l, leftChain, rightChain;

  function compare2Objects(x, y) {
    let p;

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (
      isNaN(x) &&
      isNaN(y) &&
      typeof x === 'number' &&
      typeof y === 'number'
    ) {
      return true;
    }

    // Compare primitives and functions.
    // Check if both args link to the same object.
    // Especially useful on the step where we compare prototypes
    if (x === y) {
      return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if (
      (typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)
    ) {
      return x.toString() === y.toString();
    }

    // At last checking prototypes as good as we can
    if (!(x instanceof Object && y instanceof Object)) {
      return false;
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      return false;
    }

    if (x.constructor !== y.constructor) {
      return false;
    }

    if (x.prototype !== y.prototype) {
      return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      return false;
    }

    // Quick checking of one object being a subset of another.
    // todo: cache the structure of args[0] for performance
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }
    }

    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        return false;
      } else if (typeof y[p] !== typeof x[p]) {
        return false;
      }

      switch (typeof x[p]) {
        case 'object':
        case 'function':
          leftChain.push(x);
          rightChain.push(y);

          if (!compare2Objects(x[p], y[p])) {
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if (x[p] !== y[p]) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  if (args.length < 1) {
    return true; //Die silently? Don't know how to handle such case, please help...
    // throw "Need two or more args to compare";
  }

  for (i = 1, l = args.length; i < l; i++) {
    leftChain = []; //Todo: this can be cached
    rightChain = [];

    if (!compare2Objects(args[0], args[i])) {
      return false;
    }
  }

  return true;
}

export const transformStringToObject =
  (errorStr) =>
  ({ value }: TransformFnParams) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch (e) {
      throw new BaseException(
        errorStr || `invalid JSON string: ${value}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  };

export const transformStringToInteger =
  (errorStr) =>
  ({ value }: TransformFnParams) => {
    if (isStrNumeric(value)) {
      return parseInt(value);
    } else {
      throw new BaseException(
        errorStr || `not an integer`,
        HttpStatus.BAD_REQUEST,
      );
    }
  };
