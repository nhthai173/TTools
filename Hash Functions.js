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








function Sha256Hash(value) {
  return BytesToHex(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, value));
}









function BytesToHex(bytes) {
  let hex = [];
  for (let i = 0; i < bytes.length; i++) {
    let b = parseInt(bytes[ i ]);
    if (b < 0) {
      c = (256 + b).toString(16);
    } else {
      c = b.toString(16);
    }
    if (c.length == 1) {
      hex.push("0" + c);
    } else {
      hex.push(c);
    }
  }
  return hex.join("");
}