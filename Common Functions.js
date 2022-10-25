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
function toRawText(str = ''){
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
  str = str.replace(/ + /g, "");
  str = str.replace(/\s/g, "");
  str = str.toLowerCase();
  str = str.trim();
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, "");
  return str;
}




/**
 *
 * @param {(string|Bytes[])} input The value to hash.
 * @param {boolean} isShortMode Set true for 4 digit shortend hash, else returns usual MD5 hash.
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
 * Compare 2 value
 * @param{any} a
 * @param{any} b
 * @param{string} type optional 'number' | 'date'
 * @return{boolean} true if equal
 */
function smartCompare(a, b, type = ''){
  let output = false
  try{
    if(a && b){
      if(type == 'number'){
        a = parseFloat(a)
        b = parseFloat(b)
      }
      if(type == 'date' || (a.getTime && b.getTime)){
        a = a.getTime()
        b = b.getTime()
      }
    }
    if(isEmptyVariable(a) && isEmptyVariable(b)){
      output = true
    }else{
      output = a == b
    }
  }catch(e){console.log(e)}
  return output
}



function isEmptyVariable(a){
  if(a === undefined || a === null || a === '' || a === NaN){
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