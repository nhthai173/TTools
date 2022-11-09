/**
 * Get Script property by name
 * @param name string - property name
 * @returns any
 */
function getScriptProperty(name = '') {
  return PropertiesService.getScriptProperties().getProperty(name)
}




/**
 *
 * @param {(string|Bytes[])} input The value to hash.
 * @param {boolean} isShortMode Set true for 4 digit shortened hash, else returns usual MD5 hash.
 * @return {string} The hashed input
 * @customfunction
 *
 */
function MD5(input, isShortMode) {
  var txtHash = '';
  var rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    input);

  var isShortMode = (isShortMode == true) ? true : false;

  if (!isShortMode) {
    for (i = 0; i < rawHash.length; i++) {

      var hashVal = rawHash[ i ];

      if (hashVal < 0) {
        hashVal += 256;
      };
      if (hashVal.toString(16).length == 1) {
        txtHash += '0';
      };
      txtHash += hashVal.toString(16);
    };
  } else {
    for (j = 0; j < 16; j += 8) {

      hashVal = (rawHash[ j ] + rawHash[ j + 1 ] + rawHash[ j + 2 ] + rawHash[ j + 3 ])
        ^ (rawHash[ j + 4 ] + rawHash[ j + 5 ] + rawHash[ j + 6 ] + rawHash[ j + 7 ]);

      if (hashVal < 0) {
        hashVal += 1024;
      };
      if (hashVal.toString(36).length == 1) {
        txtHash += "0";
      };

      txtHash += hashVal.toString(36);
    };
  };

  // change below to "txtHash.toUpperCase()" if needed
  return txtHash;

}



function getRanNum(len = 6) {
  let num = Math.floor(Math.random() * (10 ** len))
  while (num / (10 ** (len - 1)) < 1) {
    num *= 10
  }
  return num
}


/**
 * Smart compare two values, support string, number, date. Return `true` if equal.
 * @param{any} a
 * @param{any} b
 * @param{string} type optional 'number' | 'date'
 * @return{boolean} true if equal
 */
function smartCompare(a, b, type = '') {
  let output = false
  try {
    // Date Object
    if (a && b &&
      a.getTime && b.getTime &&
      typeof a.getTime === 'function' &&
      typeof b.getTime === 'function') {
      return a.getTime() === b.getTime()
    }

    // Special case
    if (a === undefined && b === undefined) return true
    if (a === null && b === null) return true
    if (a === '' && b === '') return true
    const isaEmpty = isEmptyVariable(a, {
      allowEmptyArray: true,
      allowEmptyObject: true,
    })
    const isbEmpty = isEmptyVariable(b, {
      allowEmptyArray: true,
      allowEmptyObject: true,
    })
    if (isaEmpty && !isbEmpty) return false
    if (!isaEmpty && isbEmpty) return false

    // Number
    if ((typeof a === 'number' && typeof b === 'number') || type === 'number') {
      a = parseFloat(a)
      b = parseFloat(b)
      if (isNaN(a) && isNaN(b)) return true
    }

    // Object
    if (typeof a === 'object' && typeof b === 'object') {
      const aIsArray = Array.isArray(a)
      const bIsArray = Array.isArray(b)
      const aLength = a.length || Object.keys(a).length
      const bLength = b.length || Object.keys(b).length
      if (aIsArray && !bIsArray) return false
      if (!aIsArray && bIsArray) return false
      if (!aLength && !bLength) {
        if (a.toString() !== b.toString()) return false
        return true
      }
      if (aLength !== bLength) return false
      output = true
      for (const i in a) {
        if (b[ i ] === undefined) return false
        output = output && smartCompare(a[ i ], b[ i ])
        if (!output) return false
      }
      return true
    }

    output = a == b

  } catch (e) { console.error('Error at [smartCompare]', e) }
  return output
}


/**
 * Compare 2 objects with custom map
 * @param{[]|{}} a
 * @param{[]|{}} b
 * @param{[]} map list of key to compare. If empty, it compares all
 */
function compareObject(a, b, map = [], { ignoreEmpty = false, ignoreType = false } = {}) {
  let output = true
  if (!isValidArray(map)) return smartCompare(a, b)
  if (!ignoreEmpty && isEmptyVariable(a)) return false
  if (!ignoreEmpty && isEmptyVariable(b)) return false
  if (!ignoreType && (Array.isArray(a) && !Array.isArray(b))) return false
  if (!ignoreType && (!Array.isArray(a) && Array.isArray(b))) return false
  for (const i in map) {
    const key = map[ i ]
    if (a[ key ] !== undefined && b[ key ] !== undefined) {
      output = output && smartCompare(a[ key ], b[ key ])
    }
  }
  return output
}





/**
 * 
 * @param {*} a 
 * @param {Object} options 
 * @returns 
 */
function isEmptyVariable(a, { 
  allowZero = true,
  allowEmtyString = false,
  evenString = false ,
  allowEmptyArray = false,
  allowEmptyObject = false,
} = {}) {
  if (a === undefined || a === null || (typeof a === 'number' && isNaN(a))) {
    return true
  }
  if (!allowEmptyArray && Array.isArray(a) && a.length === 0) return true
  if (!allowEmptyObject && typeof a === 'object' && Object.keys(a).length === 0) {
    let emptyObj = {}
    emptyObj = emptyObj.toString()
    if (a.toString() === emptyObj) return true
  }
  if (evenString) {
    if (a === 'undefined' || a === 'null' || a === 'NaN')
      return true
  }
  if (!allowZero && a === 0) {
    return true
  }
  if (!allowEmtyString && a === '') {
    return true
  }
  return false
}



/**
 * Check if object is object type and empty or not
 * @param{object} obj
 * @return{boolean} true if valid
 */
function isValidObject(obj = {}) {
  if (obj && typeof obj == 'object' && !Array.isArray(obj)) {
    return Object.keys(obj).length > 0
  }
  return false
}

/**
 * Check if array is array type and empty or not
 * @param{array} arr
 * @return{boolean} true if valid
 */
function isValidArray(arr = []) {
  if (arr && Array.isArray(arr) && arr.length) {
    return true
  }
  return false
}