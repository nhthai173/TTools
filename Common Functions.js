/**
 * Get Script property by name
 * @param {string} name property name
 * @returns {string} property value
 */
function getScriptProperty(name = '') {
  return PropertiesService.getScriptProperties().getProperty(name)
}





/**
 * 
 * @param {number} [len=6] number of digits
 * @return {number} random number
 */
function getRanNum(len = 6) {
  let num = Math.floor(Math.random() * (10 ** len))
  while (num / (10 ** (len - 1)) < 1) {
    num *= 10
  }
  return num
}

/**
 * Compare 2 dates
 * @param {Date|string|number} a First date
 * @param {Date|string|number} b Second date
 * @param {Object} options
 * @param {Boolean} [options.year=true] if true, it will compare year
 * @param {Boolean} [options.month=true] if true, it will compare month
 * @param {Boolean} [options.date=true] if true, it will compare date
 * @param {Boolean} [options.hour=true] if true, it will compare hour
 * @param {Boolean} [options.minute=true] if true, it will compare minute
 * @param {Boolean} [options.second=true] if true, it will compare second
 * @param {Boolean} [options.millisecond=true] if true, it will compare millisecond
 * @returns {Boolean} true if equal
 */
function compareDate(a, b, {
  year = true,
  month = true,
  date = true,
  hour = true,
  minute = true,
  second = true,
  millisecond = true
} = {}) {
  let result = false
  try {
    if (typeof a !== 'object') a = new Date(a)
    if (typeof b !== 'object') b = new Date(b)
    if (isDate(a) && isDate(b)) {
      const d = new Date()
      if (!year) {
        a.setFullYear(2020)
        b.setFullYear(2020)
      }
      if (!month) {
        a.setMonth(0)
        b.setMonth(0)
      }
      if (!date) {
        a.setDate(1)
        b.setDate(1)
      }
      if (!hour) {
        a.setHours(0)
        b.setHours(0)
      }
      if (!minute) {
        a.setMinutes(0)
        b.setMinutes(0)
      }
      if (!second) {
        a.setSeconds(0)
        b.setSeconds(0)
      }
      if (!millisecond) {
        a.setMilliseconds(0)
        b.setMilliseconds(0)
      }
      result = a.getTime() === b.getTime()
    }
  } catch (e) { }
  return result
}


/**
 * Smart compare two values, support string, number, date. Return `true` if equal.
 * @param {any} a
 * @param {any} b
 * @param {Object} options
 * @param {""|"number"|"contains"} [options.type] if "number", it will convert to number before compare. "Contains" will use "includes" function
 * @param {Boolean} [options.allowEmpty=false] if true, it will return true if both are empty
 * @param {Boolean} [options.ignoreOrder=false] if true, it will ignore order of array
 * @return {boolean} true if equal
 */
function smartCompare(a, b, {
  type = '',
  allowEmpty = true,
  ignoreOrder = false
} = {}) {
  let output = false
  try {
    // Date Object
    if (isDate(a) && isDate(b)) {
      return compareDate(a, b)
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
    if (allowEmpty && isaEmpty && isbEmpty) return true
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
      if (!allowEmpty && aLength !== bLength) return false
      output = true
      for (const i in a) {
        const aiIsEmpty = isEmptyVariable(a[ i ])
        if (b[ i ] === undefined) {
          if (allowEmpty && aiIsEmpty) continue
          return false
        }
        if (aIsArray && bIsArray && ignoreOrder && !aiIsEmpty && typeof a[ i ] !== 'object' && typeof b[ i ] !== 'object') {
          output = output && b.some(bi => {
            return smartCompare(a[ i ], bi, {
              allowEmpty, ignoreOrder
            })
          })
        } else {
          output = output && smartCompare(a[ i ], b[ i ], {
            allowEmpty, ignoreOrder
          })
        }
      }
      if (allowEmpty && output) {
        for (const i in b) {
          if (a[ i ] === undefined) {
            if (isEmptyVariable(b[ i ])) continue
            return false
          }
        }
      }
      return output
    }

    if (typeof a == 'string' && typeof b == 'string' && type == 'contains') {
      output = a.includes(b)
    } else {
      output = a == b
    }
  } catch (e) { console.error('Error at [smartCompare]', e) }
  return output
}


/**
 * Compare 2 objects with custom map
 * @param {[]|{}} a
 * @param {[]|{}} b
 * @param {[]} map list of key to compare. If empty, it compares all
 * @param {Object} options
 * @param {Boolean} [options.ignoreEmpty=false] if true, it will allow `a` and `b` to be empty
 * @param {Boolean} [options.ignoreType=false] if false, return false if a and b are different type
 * @param {Boolean} [options.ignoreOrder=false] if true, it will ignore order of array
 * @param {Boolean} [options.ignoreEmptyContent=true] if true, it will allow value of keys of a and b to be empty
 * @return {boolean} true if equal
 */
function compareObject(a, b, map = [], {
  ignoreEmpty = false,
  ignoreType = false,
  ignoreOrder = false,
  ignoreEmptyContent = true
} = {}) {
  let output = true
  if (!isValidArray(map)) return smartCompare(a, b, {
    allowEmpty: ignoreEmptyContent,
    ignoreOrder
  })
  if (!ignoreEmpty && isEmptyVariable(a)) return false
  if (!ignoreEmpty && isEmptyVariable(b)) return false
  if (!ignoreType && (Array.isArray(a) && !Array.isArray(b))) return false
  if (!ignoreType && (!Array.isArray(a) && Array.isArray(b))) return false
  for (const i in map) {
    const key = map[ i ]
    if (a[ key ] === undefined && b[ key ] === undefined) {
      continue
    }
    if (a[ key ] !== undefined && b[ key ] !== undefined) {
      output = output && smartCompare(a[ key ], b[ key ], {
        allowEmpty: ignoreEmptyContent,
        ignoreOrder
      })
    } else if (!ignoreEmptyContent) {
      return false
    }
  }
  return output
}



/**
 * Check if a variable is Date Object
 * @param {any} d
 * @returns {boolean} true if it is Date Object
 */
function isDate(d) {
  if (!d) return false
  if (d instanceof Date) return true
  if (d.getTime && typeof d.getTime == 'function' && !isNaN(d.getTime())) {
    d = new Date(d.getTime())
    return true
  }
  return false
}




/**
 * 
 * @param {*} a 
 * @param {Object} options 
 * @param {Boolean} [options.allowZero=true] if true, it will return true if `a` is `0`
 * @param {Boolean} [options.allowEmptyString=false] if true, it will return true if `a` is `""`
 * @param {Boolean} [options.evenString=false] if true, it will return true if `a` is `"null"`, `"undefined"`, `"false"`, `"NaN"`, `"0"` (if not allowZero)
 * @param {Boolean} [options.allowEmptyArray=false] if true, it will return true if `a` is `[]`
 * @param {Boolean} [options.allowEmptyObject=false] if true, it will return true if `a` is `{}` or `new Object()`
 * @returns 
 */
function isEmptyVariable(a, {
  allowZero = true,
  allowEmtyString = false,
  evenString = false,
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
    if (a === 'NaN' || (!allowZero && a === '0'))
      return true
    const aLower = a.toLowerCase()
    if (aLower === 'null' || aLower === 'undefined' || aLower === 'false')
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
 * Return true if object is Object type (not Array) and has at least 1 key
 * @param {any} obj
 * @return {Boolean}
 */
function isValidObject(obj = {}) {
  if (obj && typeof obj == 'object' && !Array.isArray(obj)) {
    return Object.keys(obj).length > 0
  }
  return false
}

/**
 * Return true if object is Array type and has at least 1 item
 * @param {any} arr
 * @return {Boolean}
 */
function isValidArray(arr = []) {
  if (arr && Array.isArray(arr) && arr.length) {
    return true
  }
  return false
}





/**
 * Convert from Data URL to Blob
 * @param {string} url url to convert
 * @param {string} name Blob name
 * @return {null|Blob}
 */
function dataURLToBlob(url = '', name = '') {
  if (!url) return null
  const type = (url.split(";")[ 0 ]).replace('data:', '')
  const content = Utilities.base64Decode(url.split(",")[ 1 ])
  return Utilities.newBlob(content, type, name || Utilities.getUuid())
}