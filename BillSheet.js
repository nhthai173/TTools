/**
  * 
  * @sheetName `String` sheet name
  * @path `Object` table of props and index of sheet column
  * @sortProp `string` prop to sort
  * @sortType `string` sortProp type, number or string
  * @emptyPropList `array` if these props are empty, that row will be removed
  * @uniquePropList `array` if a row has duplicate value of these props, the duplicate rows will be removed
  * @transform `Object` a table containing functions whose input is the value of prop of the same name and the output is saved to sheet
  * @fCustom `function` data.map(fCustom), called before `transform`
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
  fCustom
} = {}) {

  // Default variables (deprecated)
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

  if (typeof fCustom !== 'function') {
    fCustom = null
  }


  // Get sheet as Sheet
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
   * @param {[]} rowData 
   * @returns {{}|null}
   */
  function _toJSON(rowData = [], ignoreEmpty = true) {
    let output = {}
    if (!Array.isArray(rowData)) return null
    if (!ignoreEmpty && rowData.length === 0) return null
    if (!isValidObject(path)) return null
    for (const prop in path) {
      output[ prop ] = rowData[ path[ prop ] ] || ''
    }
    return output
  }

  /**
   * Custom transform function
   * @param {{}} data row data
   * @returns {{}} transformed data
   */
  function _transformData(data = {}, ignoreEmpty = false) {
    if (!ignoreEmpty && !isValidObject(data)) return {}
    if (fCustom) {
      let fData = fCustom(data)
      if (isValidObject(fData)) data = fData
    }

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
    } else {
      for (const i in transform) __transform(i)
    }
    return data
  }

  /**
   * Deprecated
   * @param {String} prop property name or "AND","OR"
   * @param {*} value property value or table of prop-value pairs
   * @param {Array} row row data
   * @return {Boolean}
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
   * Deprecated
   * Find a row and update it data
   * @param {{}} query property name or "AND","OR"
   * eg. query = {"name": "test"}
   * eg. query = {"AND": {"name": "foo", "type": "bar"}}
   * Available: "AND", "OR"
   * @param {{}} nData row data
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
        sort()
        return true
      } else {
        return append(nData)
      }

    }

    return false
  }


  /**
   * Update existing rows or or append new rows if not exist.
   * @ Which rows to update is determined by value of each item in `idProps`. If `idProps` is not provided, append new rows.
   * @param {{}|{}[]} data 
   * @param {String[]} idProps List of properties to update existing row
   */
  function update(data, idProps = [], { onlyUpdateOnChange = false, map = {}, callback } = {}) {
    const isIdPropsValid = isValidArray(idProps)
    let newData = []
    let sheetRange = null
    let sheetData = null
    let appendList = []
    let anyRowToUpdate = false
    let anyChange = false

    // If data is object, convert to array
    if (isValidArray(data)) {
      newData = data
    } else if (isValidObject(data)) {
      newData = [ data ]
    } else {
      return false
    }

    // Get current sheet data
    const ss = _sheet()
    if (ss === null) return false
    if (ss.getLastRow() < 2) return append(newData)

    sheetRange = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
    sheetData = sheetRange.getValues()

    for (const sData of newData) {
      if (isValidObject(sData)) {
        let found = false

        // Find in sheetData
        if (isValidArray(sheetData) && isIdPropsValid) {
          for (const i in sheetData) {
            let matchCnt = 0
            for (const idProp of idProps) {
              if (!isEmptyVariable(sData[ idProp ])) {
                const idindex = path[ idProp ]
                if (idindex && idindex >= 0 && smartCompare(sheetData[ i ][ idindex ], sData[ idProp ])) {
                  matchCnt++
                }
              }
            }
            if (matchCnt == idProps.length) {
              found = true
              sData = _transformData(sData)
              const rData = _toJSON(sheetData[ i ])
              if (!onlyUpdateOnChange || !compareObject(sData, rData, map)) {
                if (callback && typeof callback === 'function') {
                  let cbData = callback(rData, sData)
                  if(isValidObject(cbData)) sData = cbData
                }
                function __updateRow(id) {
                  if (id >= 0) {
                    anyRowToUpdate = true
                    if (isEmptyVariable(sData[ j ])) sData[ j ] = ''
                    sheetData[ i ][ id ] = sData[ j ]
                  }
                }
                if (isValidObject(map)) {
                  for (const j in map) __updateRow(path[ map[ j ] ])
                } else {
                  for (const j in sData) __updateRow(path[ j ])
                }
              }
            }
          }

        }

        // If can not match or found row, append new row
        if (!found) {
          appendList.push(sData)
        }
      }
    }

    if (anyRowToUpdate) {
      sheetRange.setValues(sheetData)
      sort()
      anyChange = true
    }
    if (isValidArray(appendList)) {
      anyChange = append(appendList) || anyChange
    }

    return anyChange

  }


  /**
   * Append data to new row in sheet.
   * Return true if a new row added
   */
  function append(data = {} || []) {
    if (isValidArray(data)) {
      let anySuccess = false
      for (const i in data) {
        if (isValidObject(data[ i ])) {
          const add = _append(data[ i ])
          if (add) anySuccess = true
        }
      }
      if (anySuccess) {
        sort()
        return true
      }
    } else if (isValidObject(data)) {
      const add = _append(data)
      if (add) sort()
      return add
    }
    return false
  }


  /**
   * Append data to new row in sheet.
   * return true if success added
   */
  function _append(data = {}) {
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
    data = _transformData(data)
    for (const i in path) {
      if (data[ i ] !== undefined)
        newRow[ path[ i ] ] = data[ i ]
    }
    for (const i in newRow) {
      if (!isEmptyVariable(newRow[ i ])) {
        isNewRowEmpty = false
        newRow[ i ] = String(newRow[ i ])
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
   * Sort sheet by `sortProp` and clear empty rows and duplicate rows
   * @return void
   */
  function sort() {
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


  function prettify() {
    sort()
  }



  function getAsJSON() {

    let out = []
    const ss = _sheet()

    if (ss === null) return out
    if (ss.getLastRow() < 2) return out

    let data = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues()
    for (const i in data) {
      const sData = _toJSON(data[ i ], false)
      if (sData) out.push(sData)
    }

    return out
  }

  function toJSON() {
    return getAsJSON()
  }

  return {
    updateRow,
    update,
    append,
    sort,
    prettify,
    getAsJSON,
    toJSON
  }

}