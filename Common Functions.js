/**
 * Get Script property by name
 * @param name string - property name
 * @returns any
 */
function getScriptProperty(name = '') {
  return PropertiesService.getScriptProperties().getProperty(name)
}




/**
 * lowercase and remove all special characters, spaces, accent
 * @param str string
 * @return string
 */
function toRawText(str = '', {
  removeSpecialChar = true,
  removeSpace = true,
  lowerCase = true
} = {}){
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
  if(lowerCase)
    str = str.toLowerCase();
  if(removeSpace)
    str = str.replace(/\s/g, "");
  if(removeSpecialChar)
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, "");
  str = str.trim();
  return str;
}




/**
 *
 * @param {(string|Bytes[])} input The value to hash.
 * @param {boolean} isShortMode Set true for 4 digit shortened hash, else returns usual MD5 hash.
 * @return {string} The hashed input
 * @customfunction
 *
 */
function MD5( input, isShortMode ){
    var txtHash = '';
    var rawHash = Utilities.computeDigest(
                      Utilities.DigestAlgorithm.MD5,
                      input );

    var isShortMode = ( isShortMode == true ) ? true : false;
 
    if ( ! isShortMode ) {
        for ( i = 0; i < rawHash.length; i++ ) {

            var hashVal = rawHash[i];

            if ( hashVal < 0 ) {
                hashVal += 256;
            };
            if ( hashVal.toString( 16 ).length == 1 ) {
                txtHash += '0';
            };
            txtHash += hashVal.toString( 16 );
        };
    } else {
        for ( j = 0; j < 16; j += 8 ) {

            hashVal = ( rawHash[j]   + rawHash[j+1] + rawHash[j+2] + rawHash[j+3] )
                    ^ ( rawHash[j+4] + rawHash[j+5] + rawHash[j+6] + rawHash[j+7] );

            if ( hashVal < 0 ) {
                hashVal += 1024;
            };
            if ( hashVal.toString( 36 ).length == 1 ) {
                txtHash += "0";
            };

            txtHash += hashVal.toString( 36 );
        };
    };

    // change below to "txtHash.toUpperCase()" if needed
    return txtHash;

}



function getRanNum(len = 6){
  let num = Math.floor(Math.random()*(10**len))
  while(num/(10**(len-1)) < 1){
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
function smartCompare(a, b, type = ''){
  let output = false
  try{
    // Date Object
    if( a && b &&
        a.getTime && b.getTime &&
        typeof a.getTime === 'function' &&
        typeof b.getTime === 'function'){
          return a.getTime() === b.getTime()
    }

    // Special case
    if(a === undefined && b === undefined) return true
    if(a === null && b === null) return true
    if(a === '' && b === '') return true
    
    // Number
    if((typeof a === 'number' && typeof b === 'number') || type === 'number'){
      a = parseFloat(a)
      b = parseFloat(b)
      if(isNaN(a) && isNaN(b)) return true
    }

    // Object
    if(typeof a === 'object' && typeof b === 'object'){
      const aIsArray = Array.isArray(a)
      const bIsArray = Array.isArray(b)
      const aLength = a.length || Object.keys(a).length
      const bLength = b.length || Object.keys(b).length
      if(aIsArray && !bIsArray) return false
      if(!aIsArray && bIsArray) return false
      if(!aLength && !bLength) return true
      if(aLength !== bLength) return false
      output = true
      for(const i in a){
        if(b[i] === undefined) return false
        output = output && smartCompare(a[i], b[i])
        if(!output) return false
      }
      return true
    }

    output = a == b

  }catch(e){console.error('Error at [smartCompare]', e)}
  return output
}


/**
 * Compare 2 objects with custom map
 * @param{[]|{}} a
 * @param{[]|{}} b
 * @param{[]} map list of key to compare. If empty, it compares all
 */
function compareObject(a, b, map = [], {ignoreEmpty = false, ignoreType = false} = {}){
  let output = true
  if(!isValidArray(map)) return smartCompare(a, b)
  if(!ignoreEmpty && isEmptyVariable(a)) return false
  if(!ignoreEmpty && isEmptyVariable(b)) return false
  if(!ignoreType && (Array.isArray(a) && !Array.isArray(b))) return false
  if(!ignoreType && (!Array.isArray(a) && Array.isArray(b))) return false
  for(const i in map){
    const key = map[i]
    if(a[key] !== undefined && b[key] !== undefined){
      output = output && smartCompare(a[key], b[key])
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
function isEmptyVariable(a, {allowZero = true, allowEmtyString = false, evenString = false} = {}){
  if(a === undefined || a === null || (typeof a === 'number' && isNaN(a))){
    return true
  }
  if(Array.isArray(a) && a.length === 0) return true
  if(typeof a === 'object' && Object.keys(a).length === 0) return true
  if(evenString){
    if(a === 'undefined' || a === 'null' || a === 'NaN')
      return true
  }
  if(!allowZero && a === 0){
    return true
  }
  if(!allowEmtyString && a === ''){
    return true
  }
  return false
}



/**
 * Check if object is object type and empty or not
 * @param{object} obj
 * @return{boolean} true if valid
 */
function isValidObject(obj = {}){
  if(obj && typeof obj == 'object' && !Array.isArray(obj)){
    return Object.keys(obj).length > 0
  }
  return false
}

/**
 * Check if array is array type and empty or not
 * @param{array} arr
 * @return{boolean} true if valid
 */
function isValidArray(arr = []){
  if(arr && Array.isArray(arr) && arr.length){
    return true
  }
  return false
}