/**
  * Easiest way to interact with GSheet
  * 
  * @param {Object} options
  * @param {string} options.sheetId Google Sheet ID
  * @param {string} options.sheetName Google Sheet Name
  * @param {{}} options.path Pairs of key and column index
  * @param {string} [options.sortProp] Name of property to sort
  * @param {string} [options.sortType] sortProp type, "number" | "string"
  * @param {string[]} [options.emptyPropList] List of property name. If these properties of row are empty, the row will be removed
  * @param {string[]} [options.uniquePropList] List of property name. If there is more than one row with the same value of these properties, only the first row is kept, the rest will be removed.
  * @param {{}} [options.transform] A table containing functions whose input is the value of property of the same name and the output is saved to sheet. These functions will be executed before the data is saved to the sheet and before the beforeAppend function is executed.
  * @param {beforeAppendCB} [options.beforeAppend] A function that is called with the data of each row (as Object), before appending data to sheet.
  * @param {afterGetCB} [options.afterGet] A function that is called with the data of each row (as Object), after getting data from sheet. 
  * @param {Function} [options.fCustom] DEPRECATED
  */
function BillSheet({
  sheetId = '',
  sheetName = '',
  path = {},
  sortProp = '',
  sortType = '',
  emptyPropList = [],
  uniquePropList = [],
  transform = {},
  beforeAppend,
  afterGet,
  fCustom // deprecated
} = {}) {

  /** 
   * @deprecated Default variables
   */
  const D_SHEET_ID = '13P0_OQ_-AjOM2q2zNKsgCAzWuOkNRYw8Z9LV8m8qXcc'

  // Check options input
  if (isValidObject(transform)) {
    for (let prop in transform) {
      if (typeof transform[ prop ] !== 'function') {
        transform[ prop ] = null
      }
    }
  } else {
    transform = {}
  }

  if (typeof beforeAppend !== 'function') beforeAppend = null
  if (typeof afterGet !== 'function') afterGet = null


  /**
   * Return sheet object
   * 
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function _sheet() {
    if (sheetId && sheetName)
      return SpreadsheetApp.openById(sheetId).getSheetByName(sheetName)
    else if (sheetName && D_SHEET_ID)
      return SpreadsheetApp.openById(D_SHEET_ID).getSheetByName(sheetName)
    else
      return null
  }

  /**
   * Get a row data as an object
   * 
   * @param {[]} rowData
   * @param {Object} [options]
   * @param {Boolean} [options.ignoreEmpty=true] Pass false to get `null`. Otherwise return `{}`
   * @param {Boolean} [options.ignoreGetTransform=false] Pass true to ignore `afterGet` transform
   * @returns {{}|null}
   */
  function _toJSON(rowData = [], {
    ignoreEmpty = true,
    ignoreGetTransform = false
  } = {}) {
    let output = {}
    if (!Array.isArray(rowData)) return null
    if (!ignoreEmpty && rowData.length === 0) return null
    if (!isValidObject(path)) return null
    for (const prop in path) {
      output[ prop ] = rowData[ path[ prop ] ] || ''
    }
    if (!ignoreGetTransform) output = _transformGet(output)
    return output
  }

  /**
   * Transform row data by `transform` option
   * 
   * @param {{}} data rowData
   * @param {Boolean} [ignoreEmpty=false] Pass true to get transformed all properties (in `transform` option) even if the value is empty. Otherwise only transform non-empty properties in `rowData`.
   * @returns {{}} transformed data
   */
  function _transformData(data = {}, ignoreEmpty = false) {
    if (!ignoreEmpty && !isValidObject(data)) return {}
    function __transform(prop = '') {
      if (transform[ prop ]) {
        try {
          let tData = transform[ prop ](data[ prop ])
          if (tData !== undefined) data[ prop ] = tData
        } catch (e) { console.error(`Error at transfrom "${prop}"`, e) }
      }
    }
    if (!ignoreEmpty) {
      for (const i in data) __transform(i)
    } else if (transform) {
      for (const i in transform) __transform(i)
    }
    return data
  }

  /**
   * Transform row data by `beforeAppend` option. Only transform if `beforeAppend()` return valid Object. Otherwise return old `rowData`
   * 
   * @param {{}} data rowData
   * @param {Boolean} [ignoreEmpty=false] If true, return `{}` if `rowData` is empty.
   * @returns {{}} transformed data
   */
  function _transformAppend(data = {}, ignoreEmpty = false) {
    if (!ignoreEmpty && !isValidObject(data)) return {}
    if (beforeAppend) {
      try {
        let tData = beforeAppend(data)
        if (isValidObject(tData)) data = tData
      } catch (e) { console.error(`Error at beforeAppend`, e) }
    }
    return data
  }

  /**
   * Transform data by `afterGet` option. Only transform if `afterGet()` return valid Object. Otherwise return old `data`
   * 
   * @param {{}} data
   * @param {Boolean} [ignoreEmpty=false] If true, return `{}` if `rowData` is empty.
   * @returns {{}} transformed data
   */
  function _transformGet(data = {}, ignoreEmpty = false) {
    if (!ignoreEmpty && !isValidObject(data)) return {}
    if (afterGet) {
      try {
        let tData = afterGet(data)
        if (isValidObject(tData)) data = tData
      } catch (e) { console.error(`Error at afterGet`, e) }
    }
    return data
  }

  /**
   * @deprecated
   * @param {string} prop property name or "AND","OR"
   * @param {*} value property value or table of prop-value pairs
   * @param {Array} row row data
   * @return {Boolean} Return true if matched
   */
  function matchRow(prop, value, row = []) {
    if (!isEmptyVariable(prop) && !isEmptyVariable(value) && isValidArray(row)) {
      if (prop == 'AND') {
        let cnt = 0
        let pLen = Object.keys(value).length
        for (const i in value) {
          if (matchRow(i, value[ i ], row)) cnt++
        }
        if (cnt == pLen) return true
      } else if (prop == 'OR') {
        let cnt = 0
        for (const i in value) {
          if (matchRow(i, value[ i ], row)) cnt++
        }
        if (cnt > 0) return true
      } else if (path[ prop ] >= 0) {
        return row[ path[ prop ] ] == value
      }
    }
    return false
  }

  /**
   * @deprecated DEPRECATED: Use `update()` instead.
   * Find a row and update it
   * 
   * @param {{}} query property name or "AND","OR"
   * eg. query = {"name": "test"}
   * eg. query = {"AND": {"name": "foo", "type": "bar"}}
   * Available: "AND", "OR"
   * @param {{}} nData rowData
   * @return {Boolean} Return true if success update
   */
  function updateRow(query = {}, nData = {}) {
    if (isValidObject(query) && isValidObject(nData)) {
      let anyChange = false
      const ss = _sheet()

      if (ss === null) return false
      if (ss.getLastRow() < 2) return append(nData)

      const range = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
      let data = range.getValues()
      for (const i in data) {
        let cnt = 0
        for (const j in query) {
          if (matchRow(j, query[ j ], data[ i ]))
            cnt++
        }
        if (cnt == Object.keys(query).length) {
          for (const j in nData) {
            let id = path[ j ]
            if (id) {
              anyChange = true
              data[ i ][ id ] = nData[ j ] || ''
            }
          }
        }
      }
      if (anyChange) {
        range.setValues(data)
        prettify()
        return true
      } else {
        return append(nData)
      }

    }

    return false
  }


  /**
   * Update existing rows or append new rows if not exist.
   * 
   * @param {{}|{}[]} data rowData or sheetData (Object or Array of Objects)
   * @param {string[]} idProps List of properties to determine which rows to update. If not provided, append new rows.
   * @param {Object} [options]
   * @param {Boolean} [options.appendIfNotFound=true] Pass true to append new rows if not found.
   * @param {Boolean} [options.onlyUpdateOnChange=false] Pass true to update only if the value is changed.
   * @param {[]} [options.map=[]] Properties list. If provided, only compare and update these properties. If not provided, compare and update all properties in `data`.
   * @param {beforeAppendCB} [options.beforeAppend] Callback function to transform data before append. If provided, it will be ignored default `beforeAppend`. If this function returns non-valid Object, It will be continued with the old data. Only called if `appendIfNotFound` is true.
   * @param {beforeChangeCB} [options.beforeChange] Callback function to transform data before change. It will be called before default `beforeAppend` option. If this function returns non-valid Object, It will be continued with the old data.
   * @param {Boolean} [options.ignoreTransformOnChange] Pass true to ignore default `beforeAppend` option when update.
   * @return {Boolean} Return true if success update or append
   */
  function update(data, idProps = [], { appendIfNotFound = true, onlyUpdateOnChange = false, ignoreTransformOnChange = false, map = [], beforeAppend, beforeChange } = {}) {
    const isIdPropsValid = isValidArray(idProps)
    let newData = []
    let sheetRange = null
    let sheetData = null
    let appendList = [] // contains rows (as Object) to append
    let anyRowToUpdate = false
    let anyChange = false

    const isBeforeAppendAvailable = beforeAppend && typeof beforeAppend === 'function'
    const isBeforeChangeAvailable = beforeChange && typeof beforeChange === 'function'

    // If data is object, convert to array
    if (isValidArray(data)) {
      newData = data
    } else if (isValidObject(data)) {
      newData = [ data ]
    } else {
      return false
    }

    // If map is object, convert to array
    if (isValidObject(map)) {
      map = Object.keys(map).map(key => map[ key ])
    }

    // Get current sheet data
    const ss = _sheet()
    if (ss === null) return false
    if (ss.getLastRow() < 2) return append(newData)

    sheetRange = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
    sheetData = sheetRange.getValues()

    for (let sData of newData) {
      if (isValidObject(sData)) {
        sData = _transformData(sData)
        let found = false

        // Find in sheetData
        if (isValidArray(sheetData) && isIdPropsValid) {
          for (const i in sheetData) {
            let matchCnt = 0
            for (const idProp of idProps) {
              if (!isEmptyVariable(sData[ idProp ])) {
                const idindex = path[ idProp ]
                if (idindex >= 0 && smartCompare(sheetData[ i ][ idindex ], sData[ idProp ])) {
                  matchCnt++
                }
              }
            }
            if (matchCnt == idProps.length) {
              found = true
              const rData = _toJSON(sheetData[ i ])
              if (!onlyUpdateOnChange || !compareObject(sData, rData, map)) {
                if (isBeforeChangeAvailable) {
                  let cbData = beforeChange(rData, sData)
                  if (isValidObject(cbData)) sData = cbData
                }
                if (!ignoreTransformOnChange) {
                  sData = _transformAppend(sData)
                }
                function __updateRow(key) {
                  const id = path[ key ]
                  if (id >= 0) {
                    anyRowToUpdate = true
                    if (isEmptyVariable(sData[ key ])) sData[ key ] = ''
                    sheetData[ i ][ id ] = sData[ key ]
                  }
                }
                if (isValidArray(map)) {
                  for (const j in map) __updateRow(map[ j ])
                } else {
                  for (const j in sData) __updateRow(j)
                }
              }
            }
          }

        }

        // If can not match or found row, append new row
        if (!found && appendIfNotFound) {
          if (isBeforeAppendAvailable) {
            let aData = beforeAppend(sData)
            if (isValidObject(aData)) sData = aData
          }
          appendList.push(sData)
        }
      }
    }

    if (anyRowToUpdate) {
      sheetRange.setValues(sheetData)
      prettify()
      anyChange = true
    }
    if (isValidArray(appendList)) {
      anyChange = append(appendList, {
        ignoreDataTransform: isBeforeAppendAvailable
      }) || anyChange
    }

    return anyChange

  }


  /**
   * Append data to new row in sheet.
   * 
   * @param {{}|{}[]} data Data to append. rowData or sheetData (Object or Array of Objects)
   * @param {Object} [options]
   * @param {Boolean} [options.ignoreDataTransform] Pass true to ignore default `transform` option.
   * @param {Boolean} [options.ignoreAppendTransform] Pass true to ignore default `beforeAppend` option.
   * @return Return true if a new row added
   */
  function append(data = {} || [], {
    ignoreAppendTransform = false,
    ignoreDataTransform = false
  } = {}) {
    if (isValidArray(data)) {
      let anySuccess = false
      for (const i in data) {
        if (isValidObject(data[ i ])) {
          const add = _append(data[ i ], {
            ignoreAppendTransform,
            ignoreDataTransform
          })
          if (add) anySuccess = true
        }
      }
      if (anySuccess) {
        prettify()
        return true
      }
    } else if (isValidObject(data)) {
      const add = _append(data, {
        ignoreAppendTransform,
        ignoreDataTransform
      })
      if (add) prettify()
      return add
    }
    return false
  }


  /**
   * Append data to new row in sheet.
   * 
   * @param {{}} data rowData to append
   * @param {Object} [options]
   * @param {Boolean} [options.ignoreDataTransform] Pass true to ignore default `transform` option.
   * @param {Boolean} [options.ignoreAppendTransform] Pass true to ignore default `beforeAppend` option.
   * @return Return true if a new row added
   */
  function _append(data = {}, {
    ignoreAppendTransform = false,
    ignoreDataTransform = false
  } = {}) {
    // Nothing to append
    if (!isValidObject(data)) return false

    const ss = _sheet()
    if (ss === null) return false

    // create new Row array
    let newRowLength = 0
    let newRow = []
    // get last column in path
    for (const i in path) {
      const index = path[ i ]
      if (index > newRowLength)
        newRowLength = index
    }
    if (newRowLength > 0) {
      newRow = new Array(newRowLength)
    }

    // check if a empty new row
    let isNewRowEmpty = true
    if (!ignoreDataTransform) data = _transformData(data)
    if (!ignoreAppendTransform) data = _transformAppend(data)
    for (const i in path) {
      if (data[ i ] !== undefined)
        newRow[ path[ i ] ] = data[ i ]
    }
    for (const i in newRow) {
      if (!isEmptyVariable(newRow[ i ])) {
        isNewRowEmpty = false
      } else {
        newRow[ i ] = ''
      }
    }
    if (!isNewRowEmpty) {
      ss.getRange(ss.getLastRow() + 1, 1, 1, newRow.length).setValues([ newRow ])
      return true
    }

    return false
  }


  /**
   * Sort sheet by `sortProp`, clear empty rows and duplicate rows
   * @return {void}
   */
  function prettify() {
    var props = { sortProp: '', emptyPropList: [], uniquePropList: [] }
    var temp = { uniquePropList: [] }

    // check all prop provided
    for (const i in path) {
      if (sortProp == i)
        props.sortProp = path[ i ]
    }
    for (const i in emptyPropList) {
      for (const j in path) {
        if (emptyPropList[ i ] == j)
          props.emptyPropList.push(path[ j ])
      }
    }
    for (const i in uniquePropList) {
      for (const j in path) {
        if (uniquePropList[ i ] == j) {
          props.uniquePropList.push(path[ j ])
        }
      }
    }

    if (props.sortProp || props.emptyPropList.length || props.uniquePropList.length) {
      const ss = _sheet()
      if (ss === null) return
      if (ss.getLastRow() < 2) return

      const range = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
      let data = range.getValues()

      // remove row
      for (const i in data) {
        // empty prop list
        for (const j in props.emptyPropList) {
          if (isEmptyVariable(data[ i ][ props.emptyPropList[ j ] ])) {
            for (const k in data[ i ])
              data[ i ][ k ] = ''
            break
          }
        }
        // unique prop list
        let isRowDuplicated = false
        let tempPropCheck = {}
        for (const j in props.uniquePropList) {
          const propIndex = props.uniquePropList[ j ]
          tempPropCheck[ propIndex ] = data[ i ][ propIndex ]
        }
        // Check if existed in temp variable
        for (const j in temp.uniquePropList) {
          let checkCnt = 0
          for (const k in tempPropCheck) {
            if (smartCompare(temp.uniquePropList[ j ][ k ], tempPropCheck[ k ])) {
              checkCnt++
            }
          }
          if (checkCnt > 0 && checkCnt == Object.keys(tempPropCheck).length) {
            isRowDuplicated = true
            break
          }
        }
        if (!isRowDuplicated && isValidObject(tempPropCheck)) {
          // if not existed, push this row to temp variable
          temp.uniquePropList.push(tempPropCheck)
        } else if (isRowDuplicated) {
          // if existed in temp variable, empty this row
          for (const j in data[ i ]) {
            data[ i ][ j ] = ''
          }
        }

      }

      // sort
      if (data.length > 0) {
        if (props.sortProp >= 0 && sortType == 'number') {
          data.sort((a, b) => {
            if (!b[ props.sortProp ])
              return -1
            else if (!a[ props.sortProp ])
              return 1
            else
              return parseFloat(b[ props.sortProp ]) - parseFloat(a[ props.sortProp ])
          })
        } else if (props.sortProp) {
          data.sort((a, b) => {
            if (!b[ props.sortProp ])
              return -1
            else if (!a[ props.sortProp ])
              return 1
            else
              return b[ props.sortProp ] - a[ props.sortProp ]
          })
        }
        range.setValues(data)
      }

    }
  }

  /**
   * @deprecated DEPRECATED: Use `prettify()` instead
   * 
   * Sort sheet by `sortProp`, clear empty rows and duplicate rows
   * @return {void}
   */
  function sort() {
    prettify()
  }


  /**
   *  @deprecated DEPRECATED: Use `toJSON()` instead
   */
  function getAsJSON() {
    return toJSON()
  }

  function toJSON({ ignoreGetTransform = false } = {}) {
    let out = []
    const ss = _sheet()

    if (ss === null) return out
    if (ss.getLastRow() < 2) return out

    let data = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues()
    for (const i in data) {
      const sData = _toJSON(data[ i ], {
        ignoreEmpty: false,
        ignoreGetTransform
      })
      if (sData) out.push(sData)
    }

    return out
  }

  this.update = update
  this.append = append
  this.toJSON = toJSON
  this.prettify = prettify
  /* DEPRECATED */
  this.sort = sort
  this.getAsJSON = getAsJSON
  this.updateRow = updateRow
  return this
  // return {
  //   update,
  //   append,
  //   toJSON,
  //   prettify,
  //   /* DEPRECATED */
  //   sort,
  //   getAsJSON,
  //   updateRow
  // }

}

BillSheet.prototype.constructor = BillSheet



/**
 * @callback beforeAppendCB
 * @param {{}} rowData rowData as Object type (converted based on `path`)
 * @return {{}|undefined} new rowData
 */

/**
 * @callback afterGetCB
 * @param {{}} rowData rowData as Object type (converted based on `path`)
 * @return {{}|undefined} new rowData
 */

/**
 * @callback beforeChangeCB
 * @param {{}} oldData Old rowData in sheet
 * @param {{}} newData New data to update
 * @return {{}|undefined} Data to update
 */