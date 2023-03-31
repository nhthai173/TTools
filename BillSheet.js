/**
  * Easiest way to interact with GSheet
  * 
  * @param {Object} options
  * @param {SpreadsheetApp.Sheet} options.sheet Google Sheet. If it is not null, sheetId and sheetName will be ignored.
  * @param {string} options.sheetId Google Sheet ID
  * @param {string} options.sheetName Google Sheet Name
  * @param {{}|undefined} [options.path] Pairs of key and column index
  * @param {number[]|{}} [options.header] Header configuration. If it is an array, it is the range of header (like getRange()). Now `path` will be auto detected with the propName is the value of cell and the column index. If it is an object, it is the same with `path`.
  * @param {number} [options.startRow] Start row index
  * @param {number} [options.startColumn] Start column index
  * @param {string} [options.sortProp] Name of property to sort
  * @param {string} [options.sortType] sortProp type, "number" | "string"
  * @param {string[]} [options.emptyPropList] List of property name. If these properties of row are empty, the row will be removed
  * @param {string[]} [options.uniquePropList] List of property name. If there is more than one row with the same value of these properties, only the first row is kept, the rest will be removed.
  * @param {{}} [options.transform] A table containing functions whose input is the value of property of the same name and the output is saved to sheet. These functions will be executed before the data is saved to the sheet and before the beforeAppend function is executed.
  * @param {beforeAppendCB} [options.beforeAppend] A function that is called with the data of each row (as Object), before appending data to sheet.
  * @param {afterGetCB} [options.afterGet] A function that is called with the data of each row (as Object), after getting data from sheet.
  * @return {BillSheetClass}
  */
function BillSheet({
  sheet = null,
  sheetId = '',
  sheetName = '',
  path = {},
  header = [] || {},
  startRow = 0,
  startColumn = 0,
  sortProp = '',
  sortType = '',
  emptyPropList = [],
  uniquePropList = [],
  transform = {},
  beforeAppend,
  afterGet,
} = {}) {

  return new BillSheetClass({
    sheet,
    sheetId,
    sheetName,
    path,
    header,
    startRow,
    startColumn,
    sortProp,
    sortType,
    emptyPropList,
    uniquePropList,
    transform,
    beforeAppend,
    afterGet
  })

}



/**
 * Easiest way to interact with GSheet
 * @class
 */
class BillSheetClass {

  /** 
    * @param {Object} options
    * @param {SpreadsheetApp.Sheet} options.sheet Google Sheet. If it is not null, sheetId and sheetName will be ignored.
    * @param {string} options.sheetId Google Sheet ID
    * @param {string} options.sheetName Google Sheet Name
    * @param {{}|undefined} [options.path] Pairs of key and column index
    * @param {number[]|{}} [options.header] Header configuration. If it is an array, it is the range of header (like getRange()). Now `path` will be auto detected with the propName is the value of cell and the column index. If it is an object, it is the same with `path`.
    * @param {number} [options.startRow] Start row index
    * @param {number} [options.startColumn] Start column index
    * @param {string} [options.sortProp] Name of property to sort
    * @param {string} [options.sortType] sortProp type, "number" | "string"
    * @param {string|string[]} [options.emptyPropList] List of property name. If these properties of row are empty, the row will be removed
    * @param {string|string[]} [options.uniquePropList] List of property name. If there is more than one row with the same value of these properties, only the first row is kept, the rest will be removed.
    * @param {{}} [options.transform] This is the object containing the functions. These functions will transform the value of the property in rowData referenced by key. This step is performed when passing new data to the sheet, such as update(), append() and it is always executed first, before subsequent processing steps and before `beforeAppend`.
    * @param {beforeAppendCB} [options.beforeAppend] A function that is called with the data of each row (as Object), before appending data to sheet.
    * @param {afterGetCB} [options.afterGet] A function that is called with the data of each row (as Object), after getting data from sheet. 
    * @param {Function} [options.fCustom] DEPRECATED
    */
  constructor({
    sheet = null,
    sheetId = '',
    sheetName = '',
    path = {},
    header = [] || {},
    startRow = 0,
    startColumn = 0,
    sortProp = '',
    sortType = '',
    emptyPropList = [],
    uniquePropList = [],
    transform = {},
    beforeAppend,
    afterGet,
  } = {}) {

    /** 
     * @deprecated Default sheet id
     */
    const D_SHEET_ID = '13P0_OQ_-AjOM2q2zNKsgCAzWuOkNRYw8Z9LV8m8qXcc'

    this.sheet = sheet || null
    this.sheetId = sheetId || ''
    this.sheetName = sheetName || ''
    this.path = path || {}
    this.header = header || {}
    this.startRow = startRow || 0
    this.startColumn = startColumn || 0
    this.sortProp = sortProp || ''
    this.sortType = sortType || ''
    this.emptyPropList = emptyPropList
    this.uniquePropList = uniquePropList
    this.transform = {}

    // If no specific sheetId, use default sheet id
    if (!this.sheet && !this.sheetId) {
      console.warn('sheetId is empty, using default sheet id: D_SHEET_ID\nThis is deprecated, please specify sheetId in the future.')
      this.sheetId = D_SHEET_ID
    }

    // Init sheet header, priority: path > header.
    this._initPath()

    // Init `startRow` and `startColumn`
    this._dataRange()

    if (!isValidArray(this.emptyPropList) && !isEmptyVariable(emptyPropList)) {
      this.emptyPropList = [ emptyPropList ]
    }
    if (!isValidArray(uniquePropList) && !isEmptyVariable(uniquePropList)) {
      this.uniquePropList = [ uniquePropList ]
    }

    if (isValidObject(transform)) {
      for (let prop in transform) {
        if (typeof transform[ prop ] === 'function') {
          this.transform[ prop ] = transform[ prop ]
        }
      }
    }

    if (typeof beforeAppend === 'function') this.beforeAppend = beforeAppend
    else this.beforeAppend = null
    if (typeof afterGet === 'function') this.afterGet = afterGet
    else this.afterGet = null

  }

  /**
   * Log an error message
   * 
   * @param {string} type error type
   * @param {string} msg message
   * @return {void}
   */
  _errorLog(type = '', msg = '') {
    console.error(msg)
    if (type === 'sheet') {
      console.error({
        message: 'Cannot get sheet',
        detail: {
          sheetId: this.sheetId,
          sheetName: this.sheetName
        }
      })
    }
    if (type === 'path') {
      console.error({
        message: 'Missing path',
        detail: {
          path: this.path
        }
      })
    }
    if (type === 'header_parse') {
      console.error({
        message: 'Can not be parsed header correctly. Only allow 1 row',
        detail: {
          header: this.header
        }
      })
    }
    if (type === 'header_parse_error') {
      console.error({
        message: 'Can not be parsed header correctly.\n' + msg ? msg : '',
        detail: {
          header: this.header
        }
      })
    }
  }

  /**
   * Initialize Sheet header (path)
   */
  _initPath() {
    if (!isValidObject(this.path)) {
      if (isValidArray(this.header)) {
        const ss = this._sheet()
        if (ss) {
          let [ row, column, numRow, numColumn ] = this.header
          let range = null
          if (numRow && numRow != 1) {
            this._errorLog('header_parse')
          } else {
            numRow = 1
          }
          if (numRow == 1 && row && column) {
            try {
              if (!numColumn)
                numColumn = ss.getLastColumn() - column + 1
              range = ss.getRange(row, column, numRow, numColumn)
            } catch (e) {
              this._errorLog('header_parse_error', e)
            }
          }
          if (range) {
            const head = range.getValues()
            if (head[ 0 ] && isValidArray(head[ 0 ])) {
              for (const i in head[ 0 ]) {
                this.path[ head[ 0 ][ i ] ] = Number(i)
              }
            }
            if (!this.startRow) this.startRow = row + 1
            if (!this.startColumn) this.startColumn = column
          }
        }

      } else if (isValidObject(this.header)) {
        this.path = this.header
      }
    }
  }

  /**
   * Return sheet object
   * 
   * @return {SpreadsheetApp.Sheet|null}
   */
  _sheet() {
    const { sheet, sheetId, sheetName } = this
    if (sheet) {
      if (typeof sheet.getLastRow === 'function') {
        if (sheet.getLastRow() > -1)
          return sheet
      }
    }
    if (sheetId && sheetName)
      return SpreadsheetApp.openById(sheetId).getSheetByName(sheetName)
    else {
      this._errorLog('sheet')
      return null
    }
  }

  /**
   * Return SpreadSheet object
   * @returns {SpreadsheetApp.Spreadsheet|null}
   */
  _spreadSheet() {
    const ss = this._sheet()
    if (ss) return ss.getParent()
    return null
  }

  /**
   * Return data range
   * @param {SpreadsheetApp.Sheet|undefined} sheet
   * @returns {SpreadsheetApp.Range|null}
   */
  _dataRange(sheet) {
    if (!sheet) sheet = this._sheet()
    if (!sheet) return null
    if (isValidArray(this.header)) {
      const [ row, col ] = this.header
      if (!this.startRow) this.startRow = row + 1
      if (!this.startColumn) this.startColumn = col
    } else if (isValidObject(this.path)) {
      if (!this.startRow) this.startRow = 2
      if (!this.startColumn) this.startColumn = 1
    }
    if (!this.startRow || !this.startColumn) return null
    if (sheet.getLastRow() < this.startRow || sheet.getLastColumn() < this.startColumn) return null
    return sheet.getRange(this.startRow, this.startColumn, sheet.getLastRow() - this.startRow + 1, sheet.getLastColumn() - this.startColumn + 1)
  }

  /**
   * Get Sheet range by property name
   * @param {string} column 
   * @param {SpreadsheetApp.Sheet|undefined} sheet 
   * @returns {SheetRange|null}
   */
  _columnRange(column, sheet) {
    if (!column || !this.path[ column ]) return null
    if (!sheet) sheet = this._sheet()
    if (!sheet) return null
    if (!this._dataRange(sheet)) return null
    return new SheetRange(
      sheet.getRange(this.startRow, this.path[ column ] + 1, sheet.getLastRow() - this.startRow + 1, 1),
      [ this.path[ column ] ]
    )
  }

  /**
   * Get Sheet ranges by properties name
   * @param {string[]} columns 
   * @param {SpreadsheetApp.Sheet} sheet 
   * @returns {SheetRange[]|null}
   */
  _columnRanges(columns, sheet) {
    let result = []
    if (!isValidArray(columns)) return null
    if (!sheet) sheet = this._sheet()
    if (!sheet) return null
    if (!this._dataRange(sheet)) return null

    let colIndex = columns
      .map(col => this.path[ col ] > -1 ? this.path[ col ] : -1)
      .filter(i => i > -1)
    if (!colIndex || !colIndex.length) return null
    colIndex.sort((a, b) => a - b)

    let cnt = colIndex[ 0 ]
    let isContinuous = true
    for (const i in colIndex) {
      if (cnt != colIndex[ i ]) {
        isContinuous = false
        break
      }
      cnt++
    }
    if (isContinuous) {
      result.push(new SheetRange(
        sheet.getRange(
          this.startRow,
          colIndex[ 0 ] + 1,
          sheet.getLastRow() - this.startRow + 1,
          colIndex.length
        ),
        colIndex
      ))
    } else {
      let gColIndex = []
      let gTemp = []
      for (let i = 0; i < colIndex.length; i++) {
        if (i < 1) {
          gTemp.push(colIndex[ i ])
          continue
        }
        if (i == colIndex.length - 1) {
          if (gTemp[ gTemp.length - 1 ] != colIndex[ i ]) {
            gTemp.push(colIndex[ i ])
          }
          gColIndex.push(gTemp)
          break
        }
        if (colIndex[ i ] - colIndex[ i - 1 ] == 1) {
          gTemp.push(colIndex[ i ])
        } else {
          gColIndex.push(gTemp)
          gTemp = [ colIndex[ i ] ]
        }
      }
      for (const i in gColIndex) {
        const gi = gColIndex[ i ]
        result.push(new SheetRange(
          sheet.getRange(
            this.startRow,
            gi[ 0 ] + 1,
            sheet.getLastRow() - this.startRow + 1,
            gi.length
          ),
          gi
        ))
      }
    }
    return result
  }

  /**
   * Convert a row data to an object
   * 
   * @param {[]} rowData
   * @param {Object} [options]
   * @param {Boolean} [options.ignoreEmpty=true] Pass false to get `null`. Otherwise return `{}`
   * @param {Boolean} [options.ignoreGetTransform=false] Pass true to ignore `afterGet` transform
   * @returns {{}|null}
   */
  _toJSON(rowData = [], {
    ignoreEmpty = true,
    ignoreGetTransform = false
  } = {}) {
    const { path } = this
    let output = {}
    if (!Array.isArray(rowData)) return null
    if (!ignoreEmpty && rowData.length === 0) return null
    if (!isValidObject(path)) {
      this._errorLog('path')
      return null
    }
    for (const prop in path) {
      if (isEmptyVariable(rowData[ path[ prop ] ])) output[ prop ] = ''
      else output[ prop ] = rowData[ path[ prop ] ]
    }
    if (!ignoreGetTransform) output = this._transformGet(output)
    return output
  }


  _toRowData(data = {}, { }) {

  }


  /**
   * Transform row data by `transform` option
   * 
   * @param {{}} data rowData
   * @param {Boolean} [isTransformAll=false] Pass true to get transformed all properties (in `transform` option) even those properties are not in `data`. Otherwise only transform properties in `data`.
   * @returns {{}} transformed data
   */
  _transformData(data = {}, isTransformAll = false) {
    const { transform } = this
    if (!isValidObject(data)) return {}
    function __transform(prop = '') {
      if (transform[ prop ]) {
        try {
          let tData = transform[ prop ](data[ prop ]) // Object.create(data[ prop ])
          if (tData !== undefined) data[ prop ] = tData
        } catch (e) { console.error(`Error at transfrom "${prop}"`, e) }
      }
    }
    if (isTransformAll) {
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
  _transformAppend(data = {}, ignoreEmpty = false) {
    if (ignoreEmpty && !isValidObject(data)) return {}
    if (this.beforeAppend) {
      try {
        let tData = this.beforeAppend(data) // Object.create(data)
        if (tData === null) return null
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
   * @returns {{}|null} transformed data
   */
  _transformGet(data = {}, ignoreEmpty = false) {
    if (ignoreEmpty && !isValidObject(data)) return {}
    if (this.afterGet) {
      try {
        let tData = this.afterGet(data) // Object.create(data)
        if (tData === null) return null
        if (isValidObject(tData)) data = tData
      } catch (e) { console.error(`Error at afterGet`, e) }
    }
    return data
  }


  /**
   * Match query with object value
   * @param {[]|{}} query JSON query. Array for `OR` condition. Object for `AND` condition. Will match the value of each key in query with the value of the same key in object
   * @param {{}|[]} object 
   * @returns {boolean} true if match
   */
  _matchObject(query, object) {
    function __matchObject(q, obj, k) {
      if (isValidArray(q)) {
        return q.some(qVal => {
          if (typeof qVal === 'object')
            return __matchObject(qVal, obj, k)
          return obj[ k ] == qVal
        })
      } else if (isValidObject(q)) {
        return Object.keys(q).every(qKey => {
          if (typeof q[ qKey ] == 'object') {
            return __matchObject(q[ qKey ], obj, qKey)
          }
          return obj[ qKey ] == q[ qKey ]
        })
      }
    }
    return __matchObject(query, object)
  }


  /**
   * Return all rows that match the query
   * @param {[]|{}} queryObj JSON query. Array for `OR` condition. Object for `AND` condition. Will match the value of each key in query with the value of the same key in rowData
   * @param {[]} [data] If not provided, use sheetData
   * @returns {{}[]}
   */
  query(queryObj, data) {
    if (isEmptyVariable(queryObj)) return []
    if (isValidObject(data)) data = [ data ]
    if (!isValidArray(data)) data = this.toJSON()
    return data.filter(row => this._matchObject(queryObj, row)) || []
  }




  /**
   * @deprecated
   * @param {string} prop property name or "AND","OR"
   * @param {*} value property value or table of prop-value pairs
   * @param {Array} row row data
   * @return {Boolean} Return true if matched
   */
  matchRow(prop, value, row = []) {
    const { path } = this
    if (!isEmptyVariable(prop) && !isEmptyVariable(value) && isValidArray(row)) {
      if (prop == 'AND') {
        let cnt = 0
        let pLen = Object.keys(value).length
        for (const i in value) {
          if (this.matchRow(i, value[ i ], row)) cnt++
        }
        if (cnt == pLen) return true
      } else if (prop == 'OR') {
        let cnt = 0
        for (const i in value) {
          if (this.matchRow(i, value[ i ], row)) cnt++
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
  updateRow(query = {}, nData = {}) {
    const { path } = this
    if (isValidObject(query) && isValidObject(nData)) {
      let anyChange = false
      const ss = this._sheet()

      if (ss === null) return false
      if (ss.getLastRow() < 2) return this.append(nData)

      const range = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
      let data = range.getValues()
      for (const i in data) {
        let cnt = 0
        for (const j in query) {
          if (this.matchRow(j, query[ j ], data[ i ]))
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
        this.prettify()
        return true
      } else {
        return this.append(nData)
      }

    }

    return false
  }



  /**
   * Update existing row(s) or append new row(s) if not exist.
   * 
   * @param {{}|{}[]} data rowData or sheetData (Object or Array of Objects)
   * @param {string[]} idProps List of properties to determine which rows to update. If not provided, append new rows.
   * @param {Object} [options]
   * @param {Boolean} [options.appendIfNotFound=true] Pass true to append new rows if not found.
   * @param {Boolean} [options.onlyUpdateOnChange=false] Pass true to update only if the value is changed.
   * @param {[]} [options.map=[]] Properties list. If provided, only compare and update these properties. If not provided, compare and update all properties in `data`.
   * @param {beforeAppendCB} [options.beforeAppend] Callback function to transform data before append. If provided, it will be ignored default `beforeAppend`. If this function returns non-valid Object, It will be continued with the old data. Only called if `appendIfNotFound` is true.
   * @param {beforeChangeCB} [options.beforeChange] Callback function to transform data before change. It will be called before default `beforeAppend` option. If this function returns non-valid Object, It will be continued with the old data.
   * @param {Boolean} [options.ignoreTransform] Pass true to ignore `transform` option.
   * @param {Boolean} [options.ignoreGetTransform] Pass true to ignore `afterGet` option when get data from sheet.
   * @param {Boolean} [options.ignoreSetTransform] Pass true to ignore `beforeAppend` option when update.
   * @return {Boolean} Return true if success update or append
   */
  update(data, idProps = [], {
    appendIfNotFound = true,
    onlyUpdateOnChange = false,
    ignoreTransform = false,
    ignoreGetTransform = false,
    ignoreSetTransform = false,
    map = [],
    beforeAppend,
    beforeChange
  } = {}) {
    const { path } = this
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
    const ss = this._sheet()
    if (!ss) return false
    if (ss.getLastRow() < this.startRow) return this.append(newData)

    sheetRange = this._dataRange(ss)
    if (!sheetRange) return false
    sheetData = sheetRange.getValues()

    for (let sData of newData) {
      if (isValidObject(sData)) {
        if (!ignoreTransform) {
          sData = this._transformData(sData)
        }
        let found = false

        // Find in sheetData
        if (isValidArray(sheetData) && isIdPropsValid) {
          for (const i in sheetData) {
            const rData = this._toJSON(sheetData[ i ], { ignoreGetTransform })
            found = compareObject(sData, rData, idProps, {
              ignoreType: true,
              ignoreEmptyContent: true
            })
            if (!found) continue
            if (!onlyUpdateOnChange || !compareObject(sData, rData, map)) {
              if (isBeforeChangeAvailable) {
                let cbData = beforeChange(rData, sData)
                if (isValidObject(cbData)) sData = cbData
              }
              if (!ignoreSetTransform) {
                sData = this._transformAppend(sData)
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
            break
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
      if (isValidArray(map)) {
        const ranges = this._columnRanges(map, ss)
        if (isValidArray(ranges)) {
          for (const i in ranges) {
            console.log(
              'Update on Range:',
              JSON.stringify(
                ranges[ i ].dataPath.map(d => {
                  for (const i in path) { if (path[ i ] == d) return i }
                })))
            if (ranges[ i ]) {
              ranges[ i ].setValuesFromData(sheetData)
            }
          }
        }
      } else {
        sheetRange.setValues(sheetData)
      }
      this.prettify()
      anyChange = true
    }
    if (isValidArray(appendList)) {
      anyChange = this.append(appendList, {
        ignoreDataTransform: isBeforeAppendAvailable
      }) || anyChange
    }

    return anyChange

  }




  /**
   * Update existing row(s) by query object
   * @param {[]|{}} query JSON query. Array for `OR` condition. Object for `AND` condition. Will match the value of each key in query with the value of the same key in row data.
   * @param {queryCallback} callback Return new data to update. If return undefined, it will be ignored.
   * @returns {boolean} true if success update
   */
  queryUpdate(query, callback, {
    map = [],
    except = [],
    onlyUpdateOnChange = false,
    ignoreGetTransform = false,
    ignoreSetTransform = false
  } = {}) {
    if (isValidObject(query)) query = [ query ]
    if (!isValidArray(query)) return false
    if (!isValidObject(query[ 0 ])) return false
    if (typeof callback !== 'function') return false

    const { path } = this
    let anyChange = false

    const ss = this._sheet()
    if (!ss) return false
    const sheetRange = this._dataRange(ss)
    if (!sheetRange) return false
    let sheetData = sheetRange.getValues()

    if (except.length) {
      if (map.length) {
        map = map.filter(d => !except.includes(d))
      } else {
        map = Object.keys(path).filter(d => !except.includes(d))
      }
    }

    for (const i in sheetData) {
      const rData = this._toJSON(sheetData[ i ], { ignoreGetTransform })
      if (this._matchObject(query, rData)) {
        let newData = undefined
        try {
          const cbData = callback(rData) // Object.create(rData)
          if (isValidObject(cbData)) newData = cbData
        } catch (e) {
          console.error(e)
        }
        if (!isValidObject(newData)) continue

        if (!onlyUpdateOnChange || !compareObject(newData, rData, map)) {
          if (!ignoreSetTransform) {
            newData = this._transformAppend(newData)
          }
          function __updateRow(key) {
            const id = path[ key ]
            if (id >= 0) {
              if (isEmptyVariable(newData[ key ])) newData[ key ] = ''
              sheetData[ i ][ id ] = newData[ key ]
            }
          }
          if (isValidArray(map)) {
            for (const j in map) __updateRow(map[ j ])
          } else {
            for (const j in newData) __updateRow(j)
          }
          anyChange = true
        }
      }
    }

    if (anyChange) {
      if (isValidArray(map)) {
        const ranges = this._columnRanges(map, ss)
        if (isValidArray(ranges)) {
          for (const i in ranges) {
            console.log(
              'Update on Range:',
              JSON.stringify(
                ranges[ i ].dataPath.map(d => {
                  for (const i in path) { if (path[ i ] == d) return i }
                })))
            if (ranges[ i ]) ranges[ i ].setValuesFromData(sheetData)
          }
        }
      } else {
        sheetRange.setValues(sheetData)
      }
      this.prettify()
      return true
    }
    return false
  }




  /**
   * Remove existing row(s)
   * 
   * @param {{}|{}[]} data rowData or sheetData (Object or Array of Objects). To define which row(s) to remove, provide idProps.
   * @param {string[]} idProps List of properties to determine which rows to remove.
   * @return {Boolean} Return true if success remove
   */
  remove(data, idProps = []) {
    if (!isValidArray(idProps)) return false
    if (isValidObject(data)) data = [ data ]
    if (!isValidArray(data)) return false
    if (!isValidObject(data[ 0 ])) return false
    return this.update(data, idProps, {
      appendIfNotFound: false,
      onlyUpdateOnChange: true,
      ignoreSetTransform: true,
      beforeChange: (oldData, newData) => {
        for (const i in oldData) oldData[ i ] = ''
        return oldData
      }
    })
  }


  /**
   * Remove existing row(s)
   * 
   * @param {{}|{}[]} query Pairs of property and value to determine which rows to remove.
   * @param {string[]|string} except List of properties to exclude from remove.
   * @return {Boolean} Return true if success remove
   */
  queryRemove(query = [], { map = [], except = [] } = {}) {
    if (isEmptyVariable(except)) except = []
    if (typeof except === 'string') except = [ except ]
    return this.queryUpdate(
      query,
      (oldData) => {
        for (const i in oldData)
          oldData[ i ] = ''
        return oldData
      },
      { map, except })
  }





  /**
   * Append data to new row in sheet.
   * 
   * @param {{}|{}[]} data Data to append. rowData or sheetData (Object or Array of Objects)
   * @param {Object} [options]
   * @param {Boolean} [options.ignoreDataTransform] Pass true to ignore default `transform` option.
   * @param {Boolean} [options.ignoreAppendTransform] Pass true to ignore default `beforeAppend` option.
   * @return {Boolean} Return true if a new row added
   */
  append(data = {} || [], {
    ignoreAppendTransform = false,
    ignoreDataTransform = false
  } = {}) {
    if (isValidArray(data)) {
      let anySuccess = false
      for (const i in data) {
        if (isValidObject(data[ i ])) {
          const add = this._append(data[ i ], {
            ignoreAppendTransform,
            ignoreDataTransform
          })
          if (add) anySuccess = true
        }
      }
      if (anySuccess) {
        this.prettify()
        return true
      }
    } else if (isValidObject(data)) {
      const add = this._append(data, {
        ignoreAppendTransform,
        ignoreDataTransform
      })
      if (add) this.prettify()
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
  _append(data = {}, {
    ignoreAppendTransform = false,
    ignoreDataTransform = false
  } = {}) {
    const { path } = this

    // Nothing to append
    if (!isValidObject(data)) return false

    const ss = this._sheet()
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
    if (!ignoreDataTransform) data = this._transformData(data)
    if (!ignoreAppendTransform) data = this._transformAppend(data)
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
   * Add new Sheet to Spreadsheet
   * @param {string} name Sheet name
   * @param {{}|undefined} options 
   * @returns {SpreadsheetApp.Sheet|null}
   */
  addSheet(name, options) {
    const ss = this._spreadSheet()
    if (!ss) return null
    return ss.insertSheet(name, options)
  }



  /**
   * Delete a Sheet from Spreadsheet
   * @param {SpreadsheetApp.Sheet|string} sheet Sheet object or sheet name
   * @returns {boolean} true if success delete
   */
  deleteSheet(sheet) {
    if (!sheet) return false
    const ss = this._spreadSheet()
    if (!ss) return false
    if (typeof sheet === 'string') {
      sheet = ss.getSheetByName(sheet)
      if (!sheet) {
        console.error(`Sheet "${sheet}" not found`);
        return false
      }
    }
    ss.deleteSheet(sheet)
    return true
  }





  /**
   * Add new column to sheet
   * @param {string} name Column name
   * @returns {boolean} true if success add
   */
  addColumn(name) {
    const { header } = this
    const s = this._sheet()
    if (!s) return false
    try {

      const lastCol = s.getLastColumn()
      if (isValidArray(header) && header.length > 1) {
        const row = header[ 0 ]
        s.getRange(row, lastCol + 1).setValue(name)
        this._initPath()
        if (header.length > 3) {
          console.warn(`A column named ${name} has been added to the sheet. But the path is not updated because of the column limit. Please update the header config`)
        }
        return true
      } else {
        s.getRange(1, lastCol + 1).setValue(name)
        this._initPath()
        return true
      }

    } catch (e) {
      console.error(e)
      return false
    }
  }




  

  /**
   * Add new columns to sheet
   * @param {string[]} names Column names
   * @returns {boolean} true if success add
   */
  addColumns(names) {
    if (!isValidArray(names)) return false
    let anySuccess = false
    for (const i in names) {
      const name = names[ i ]
      if (name && typeof name === 'string' && this.addColumn(name)) {
        anySuccess = true
      }
    }
    return anySuccess
  }






  /**
   * Sync data between Sheet and Notion
   * 
   * @param {Object} options
   * @param {string} options.notionToken Notion private token
   * @param {string} options.notionDatabaseId Notion database id
   * @param {NotionSyncProperty[]} [options.sProps=[]] Sheet properties to sync to Notion. The value of each property in sheet will be synced to the corresponding property in Notion (Sheet -> Notion). Example: [{name: 'Time', type: NOTION_DATA_TYPE.date}]
   * @param {NotionSyncProperty[]} [options.nProps=[]] Notion properties to sync to Sheet. The value of each property in Notion will be synced to the corresponding property in Sheet (Notion -> Sheet). Example: [{name: 'Time', type: NOTION_DATA_TYPE.date}]
   * @param {string|string[]} [options.idProp] Identifier properties. The value of these properties will be used to identify the row in Notion and Sheet. Default is `uniquePropList`
   * @param {Boolean} [options.useDelete=false] Pass true to allow to delete pages in Notion if they are not in Sheet
   * @param {Boolean} [options.useAdd=true] Pass true to allow to add pages to Notion if they are not in Notion
   * @param {Boolean} [options.usePullNew=false] Pass true to allow to add rows to Sheet if they are not in Sheet
   * @param {Boolean} [options.usePull=true] Pass true to allow Notion pages to overwrite Sheet rows if they are not the same
   * @param {Boolean} [options.usePush=true] Pass true to allow Sheet rows to overwrite Notion Pages if they are not the same
   * @param {NotionSyncCustomPush} [options.fCustomPush] Function will be called before add/push data to Notion. If this function return a valid Object, it will be used as the data to push to Notion. Example: (data, payload, pageId) => {
    let p = new NotionPropertyMaker().relation('Source', ['abc']);
    payload.properties = {
      ...payload.properties,
      ...p
    };
    return { payload };
  }
   * @param {NotionSyncCustomPull} [options.fCustomPull] Function will be called after pull/pullNew from Notion and before save to Sheet. If this function return a valid Object, it will be used as the data to save to Sheet.
   * 
   * @returns {{}[]} Notion database data
   */
  syncNotion({
    notionToken = '',
    databaseId = '',
    sProps = [],
    nProps = [],
    idProp = [],
    useDelete = false,
    useAdd = true,
    usePull = true,
    usePush = true,
    usePullNew = false,
    fCustomPush,
    fCustomPull,
  } = {}) {
    const sheet = this
    if (typeof idProp === 'object' && !isValidArray(idProp)) {
      idProp = this.uniquePropList
    }
    return new DatabaseSyncClass({
      sheet,
      data: sheet.toJSON(),
      notionToken,
      databaseId,
      sProps,
      nProps,
      idProp,
      useDelete,
      useAdd,
      usePull,
      usePush,
      usePullNew,
      fCustomPush,
      fCustomPull
    }).sync()
  }






  /**
   * Sort sheet by `sortProp`, clear empty rows and duplicate rows
   * @return {void}
   */
  prettify() {
    const { path, sortProp, sortType, emptyPropList, uniquePropList } = this
    let props = { sortProp: '', emptyPropList: [], uniquePropList: [] }
    let temp = { uniquePropList: [] }

    // check all prop provided
    for (const i in path) {
      if (sortProp == i) {
        props.sortProp = path[ i ]
        break
      }
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
      const ss = this._sheet()
      if (!ss) return
      if (ss.getLastRow() < this.startRow) return

      const range = this._dataRange(ss)
      if (!range) return
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
  sort() {
    this.prettify()
  }



  /**
   *  @deprecated DEPRECATED: Use `toJSON()` instead
   */
  getAsJSON() {
    return this.toJSON()
  }


  /**
   * Return sheet data as JSON
   * 
   * @param {Object} options 
   * @param {Boolean} [options.ignoreGetTransform=false] Pass true to ignore default `afterGet` option.
   * @returns {{}} Sheet data
   */
  toJSON({ ignoreGetTransform = false } = {}) {
    let out = []
    const ss = this._sheet()

    if (!ss) return out
    if (ss.getLastRow() < this.startRow) return out

    let range = this._dataRange(ss)
    if (!range) return out
    let data = range.getValues()
    for (const i in data) {
      const sData = this._toJSON(data[ i ], {
        ignoreEmpty: false,
        ignoreGetTransform
      })
      if (sData) out.push(sData)
    }

    return out
  }



}






/* ======== Sheet Classes ======== */

class SheetRange {

  /**
   * @param {SpreadsheetApp.Range} range 
   * @param {number[]} dataPath Column index of data path
   */
  constructor(range, dataPath) {
    this.range = range || null
    this.dataPath = dataPath
  }

  /**
   * Set values to range from sheet data (2-dim array)
   * @param {[][]} data 
   */
  setValuesFromData(data) {
    const values = []
    for (const i in data) {
      const row = []
      for (const j in this.dataPath) {
        let cell = data[ i ][ this.dataPath[ j ] ]
        if (isEmptyVariable(cell)) cell = ''
        row.push(cell)
      }
      values.push(row)
    }
    this.range.setValues(values)
  }

  setFormulasR1C1FromData(data) {
    const formulas = []
    for (const i in data) {
      const row = []
      for (const j in this.dataPath) {
        let cell = data[ i ][ this.dataPath[ j ] ]
        if (isEmptyVariable(cell)) cell = ''
        row.push(cell)
      }
      formulas.push(row)
    }
    this.range.setFormulasR1C1(formulas)
  }

  /**
   * Set values to range
   * @param {[][]} values
   * @returns {SpreadsheetApp.Range|null}
   */
  setValues(values) {
    return this.range.setValues(values)
  }

  /**
   * Get range object
   * @returns {SpreadsheetApp.Range|null}
   */
  range() {
    return this.range
  }

  /**
   * Default
   * @returns {SpreadsheetApp.Range|null}
   */
  valueOf() {
    return this.range
  }

}






/**
 * @callback queryCallback
 * @param {{}} rowData rowData as Object type (converted based on `path`)
 * @return {{}|undefined} new rowData, if return undefined, this row will be ignored
 */

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