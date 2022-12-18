/**
 * Trim a string
 *
 * @param {string} str input string
 * @param {Object} [options]
 * @param {boolean} [options.includeSpecialChar=true] pass true if you want remove special characters stand at begin and end of the text
 * @return {string} 
 */
function trimText(str = '', { includeSpecialChar = true } = {}) {
  if (!str) return str
  function rms() {
    str = str.replace(/\s+/g, ' ')
      .replace(/^\s+/g, '')
      .replace(/\s+$/g, '')
  }
  rms()
  if (includeSpecialChar) {
    str = str.replace(/^(!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\)/g, '')
    str = str.replace(/(!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\)$/g, '')
    rms()
  }
  return str
}



/**
 * Lowercase and remove all special characters, spaces, accent
 *
 * @param {string} str
 * @param {Object} [options]
 * @param {boolean} [options.removeSpecialChar=true]
 * @param {boolean} [options.removeSpace=true]
 * @param {boolean} [options.lowerCase=true]
 * @return {string}
 */
function toRawText(str = '', {
  removeSpecialChar = true,
  removeSpace = true,
  lowerCase = true
} = {}) {
  if(isEmptyVariable(str)) return ''
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  if (lowerCase)
    str = str.toLowerCase();
  if (removeSpace)
    str = str.replace(/\s/g, "");
  if (removeSpecialChar)
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, "");
  str = str.trim();
  return str;
}


/**
 * @param {any} a
 * @return {boolean} 
 */
function parseBoolean(a) {
  if (isEmptyVariable(a)) return false
  if (typeof a === 'boolean') return a
  else if (typeof a === 'string') {
    a = a.toLowerCase()
    if (a === "false") return false
    if (a === "true") return true
  }
  return false
}



/**
 * @typedef {Object} MatchFunctionOutput
 * @property {string} name function name
 * @property {string[]} parameters function parameters
 */

/**
 * Match function in a text
 * 
 * @param {string} str
 * @param {Object} [options]
 * @param {boolean} [options.removeParamQuote=true] remove " | ' | ` in function parameters
 * @return {MatchFunctionOutput[]|null}
 */
function matchFunction(str = '', { removeParamQuote = true } = {}) {
  let output = []
  if (!str) return null
  let functions = str.split(';')
  if (!functions.length) functions = [ functions ]
  functions.forEach(fn => {
    const matchParams = fn.match(/(?<=\().*(?=\))/g)
    if (matchParams) {
      const fnd = { name: '', parameters: [] }
      fn = fn.replace('(' + matchParams[ 0 ] + ')', '')
      fnd.name = fn.trim()
      matchParams[ 0 ].split(',').forEach(p => {
        if (removeParamQuote) p = p.replace(/\'|\"|\`/g, '')
        fnd.parameters.push(p.trim())
      })
      output.push(fnd)
    }
  })
  return output
}






/**
 * Get timestamp
 * @param {Date|string|number} date
 * @return {number|null} timestamp
 */
function toTimestamp(date) {
  if (!date) return null
  const moment = Moment.load()
  if (date.getTime) {
    try {
      date = date.getTime()
      if (isNaN(date)) return null
      return date
    } catch (e) { }
  } else if (typeof date === 'string') {
    const match1 = date.match(/\-/g)
    const match2 = date.match(/\//g)
    let dateMoment = null
    if (match1 && match1.length === 2 && !match2) {
      dateMoment = moment(date, 'YYYY-MM-DD')
    } else if (match2 && match2.length === 2 && !match1) {
      dateMoment = moment(date, 'DD/MM/YYYY')
    }
    if (dateMoment && dateMoment.isValid()) {
      return dateMoment.toDate().getTime()
    } else {
      date = parseFloat(date)
    }
  }
  if (typeof date === 'number') {
    if (date > 1000000000000)
      return date
    else if (date > 1000000000)
      return date * 1000
  }
  return null
}








/**
 * Parse currency to number with thousandSeparator and decimalSeparator provided
 * @param {string} str
 * @param {string} thousandSeparator
 * @param {string} decimalSeparator
 * @return {number}
 */
function parseCurrency(str = '', thousandSeparator = '.', decimalSeparator = ',') {
  let num = 0
  let isNegativeNum = false
  if (!str) return num
  if (thousandSeparator && decimalSeparator) {
    const a = '\\-*\\d+\\'
      + thousandSeparator + '*\\d*\\'
      + thousandSeparator + '*\\d*\\'
      + thousandSeparator + '*\\d*\\'
      + thousandSeparator + '*\\d*\\'
      + thousandSeparator + '*\\d*\\'
      + thousandSeparator + '*\\d*\\'
      + decimalSeparator + '*\\d*'
    const reg = new RegExp(a, 'g')
    let matched = str.match(reg)
    if (matched) {
      matched = matched[ 0 ]
      let [ n, d ] = matched.split(decimalSeparator)
      if (n) {
        const matchNum = n.match(/\d/g)
        if (matchNum) num = parseInt(matchNum.join(''))
        if (n.startsWith('-')) {
          num *= -1
          isNegativeNum = true
        }
      }
      if (d) {
        const matchNum = d.match(/\d/g)
        if (matchNum) d = parseInt(matchNum.join(''))
        while (d > 1) d /= 10
        if (isNegativeNum) d *= -1
        num += d
      }
    }
  }
  return num
}





/**
 * Split string by a pair of separator
 * @param {string} str string to split
 * @param {string} start start separator
 * @param {string} end end separator
 * @returns {string[]}
 */
function splitBySepPair(str = '', start = '', end = '') {
  if (!start || !end) return str
  let result = []
  let temp = ''
  let cnt = 0
  for (let i = 0; i < str.length; i++) {
    if (str[ i ] === start) cnt++
    if (cnt > 0) temp += str[ i ]
    if (str[ i ] === end) cnt--
    if (cnt === 0 && temp) {
      result.push(temp)
      temp = ''
    }
  }
  return result
}