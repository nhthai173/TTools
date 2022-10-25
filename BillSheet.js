function BillSheet({ sheetId = '', sheetName = '', path = {}, sortProp = '', sortType = '', emptyPropList = [], uniquePropList = [], transform = {}, fCustom } = {}){
  return new BillSheetClass({sheetId, sheetName, path, sortProp, sortType, emptyPropList, uniquePropList, transform, fCustom})
}




class BillSheetClass {

  /**
   * 
   * @param{string} sheetName sheet name
   * @param{object} path table of props and index of sheet column
   * @param{string} sortProp prop to sort
   * @param{string} sortType sortProp type, number or string
   * @param{array} emptyPropList if these props are empty, that row will be removed
   * @param{array} uniquePropList if a row has duplicate value of these props, the duplicate rows will be removed
   * @param{object} transform a table containing functions whose input is the value of prop of the same name and the output is saved to sheet
   * @param{function} data.map(fCustom), called before `transform`
   */
  constructor({ sheetId = '', sheetName = '', path = {}, sortProp = '', sortType = '', emptyPropList = [], uniquePropList = [], transform = {}, fCustom} = {}) {
    this._path = path
    this.sheetName = sheetName || ''
    this.sheetId = sheetId || ''
    if (sortProp)
      this.sortProp = sortProp
    if (emptyPropList)
      this.emptyPropList = emptyPropList
    if (sortType)
      this.sortType = sortType
    if (uniquePropList)
      this.uniquePropList = uniquePropList
    if (transform)
      this.transform = transform
    if (fCustom)
      this.fCustom = fCustom
  }

  /**
   * @return Spreadsheet
   */
  _sheet() {
    if (this.sheetId && this.sheetName)
      return SpreadsheetApp.openById(this.sheetId).getSheetByName(this.sheetName)
    else if (this.sheetName)
      return SpreadsheetApp.openById('13P0_OQ_-AjOM2q2zNKsgCAzWuOkNRYw8Z9LV8m8qXcc').getSheetByName(this.sheetName)
    else
      return null
  }

  /**
   * @param prop string - property name: "AND","OR" or any
   * @param value any - property value
   * @return boolean
   */
  matchRow(prop, value, row = []) {
    if (prop != undefined && value != undefined && row != undefined) {
      if (prop == 'AND') {
        var cnt = 0
        var pLen = Object.keys(value).length
        for (const i in value) {
          if (this.matchRow(i, value[ i ], row))
            cnt++
        }
        if (cnt == pLen)
          return true
      } else if (prop == 'OR') {
        var cnt = 0
        for (const i in value) {
          if (this.matchRow(i, value[ i ], row))
            cnt++
        }
        if (cnt > 0)
          return true
      } else if (this._path[ prop ] >= 0) {
        return row[ this._path[ prop ] ] == value
      }
    }
    return false
  }

  /**
   * Find a row and update it data
   * eg. query = {"name": "test"}
   * eg. query = {"AND": {"name": "foo", "type": "bar"}}
   * Available: "AND", "OR"
   */
  updateRow(query = {}, nData = {}) {
    if (isValidObject(query) && isValidObject(nData)) {
      let anyChange = false
      const ss = this._sheet()
      if (ss.getLastRow() > 1) {
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
              var id = this._path[ j ]
              if (id) {
                anyChange = true
                data[ i ][ id ] = nData[ j ] || ''
              }
            }
          }
        }
        if (anyChange) {
          range.setValues(data)
          this.sort()
        } else {
          this.append(nData)
        }
      } else {
        this.append(nData)
      }
    }
  }

  /**
   * Update existing rows or append new rows. If row is not found, append new row. If `idProps` is not provided, append new rows.
   * @param {*} data 
   * @param {array} idProps List of properties to update existing row
   */
  update(data, idProps = []) {
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
    }

    // Get current sheet data
    const ss = this._sheet()
    if (ss.getLastRow() > 1) {
      sheetRange = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn())
      sheetData = sheetRange.getValues()
    }

    for (const sData of newData) {
      if (isValidObject(sData)) {
        let found = false

        // Find in sheetData
        if (sheetData) {
          if (isIdPropsValid) {
            for (const i in sheetData) {
              let matchCnt = 0
              for (const idProp of idProps) {
                if (!isEmptyVariable(sData[ idProp ])) {
                  const idindex = this._path[ idProp ]
                  if (idindex >= 0 && smartCompare(sheetData[ i ][ idindex ], sData[ idProp ])) {
                    matchCnt++
                  }
                }
              }
              if (matchCnt == idProps.length) {
                found = true
                for (const j in sData) {
                  const id = this._path[ j ]
                  if (id >= 0) {
                    anyRowToUpdate = true
                    if(isEmptyVariable(sData[ j ])){
                      sData[ j ] = ''
                    }
                    sheetData[ i ][ id ] = sData[ j ]
                  }
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

    if(anyRowToUpdate){
      sheetRange.setValues(sheetData)
      this.sort()
      anyChange = true
    }
    if(isValidArray(appendList)){
      anyChange = this.append(appendList) || anyChange
    }

    return anyChange

  }

  /**
   * Append data to new row in sheet.
   * Return true if a new row added
   * 
   * @param data object/array
   * @return boolean
   */
  append(data) {
    if (isValidArray(data)) {
      let anySuccess = false
      for (const i in data) {
        if (isValidObject(data[ i ])) {
          const add = this._append(data[ i ])
          if (add)
            anySuccess = true
        }
      }
      if (anySuccess) {
        this.sort()
        return true
      }
    } else if (isValidObject(data)) {
      const add = this._append(data)
      if (add)
        this.sort()
      return add
    }
    return false
  }

  /**
   * Append data to new row in sheet.
   * return true if success added
   * @param data object
   * @return boolean
   */
  _append(data) {
    if (isValidObject(data)) {
      const ss = this._sheet()

      // create new Row array
      let newRowLength = 0
      let newRow = []
      // get last column in path
      for(const i in this._path){
        const index = this._path[i]
        if(index > newRowLength)
          newRowLength = index
      }
      if(newRowLength > 0){
        newRow = new Array(newRowLength)
      }

      // check if a empty new row
      let isNewRowEmpty = true
      if(this.fCustom && typeof this.fCustom == 'function'){
        let fData = this.fCustom(data)
        if(isValidObject(fData)){
          data = fData
        }
      }
      for (const i in this._path) {
        if (!isEmptyVariable(data[ i ])) {
          if (this.transform && this.transform[ i ] && typeof this.transform[ i ] == 'function')
            newRow[ this._path[ i ] ] = this.transform[ i ](data[ i ]) || data[ i ]
          else
            newRow[ this._path[ i ] ] = data[ i ]
        }
      }
      for (const i in newRow) {
        if (!isEmptyVariable(newRow[ i ])) {
          isNewRowEmpty = false
          newRow[ i ] = String(newRow[ i ])
        } else if (!isNewRowEmpty) {
          newRow[ i ] = ''
        }
      }
      if (!isNewRowEmpty) {
        ss.getRange(ss.getLastRow() + 1, 1, 1, newRow.length).setValues([ newRow ])
        return true
      }

    }
    return false
  }

  /**
   * Sort sheet by `sortProp` and clear empty rows and duplicate rows
   * @return void
   */
  sort() {
    const { sortProp, emptyPropList, uniquePropList } = this
    var props = { sortProp: '', emptyPropList: [], uniquePropList: [] }
    var temp = { uniquePropList: [] }

    // check all prop provided
    for (const i in this._path) {
      if (sortProp == i)
        props.sortProp = this._path[ i ]
    }
    for (const i in emptyPropList) {
      for (const j in this._path) {
        if (emptyPropList[ i ] == j)
          props.emptyPropList.push(this._path[ j ])
      }
    }
    for (const i in uniquePropList) {
      for (const j in this._path) {
        if (uniquePropList[ i ] == j) {
          props.uniquePropList.push(this._path[ j ])
        }
      }
    }

    if (props.sortProp || props.emptyPropList.length || props.uniquePropList.length) {
      const ss = this._sheet()
      if (ss.getLastRow() > 1) {
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
          for (const j in temp.uniquePropList){
            let checkCnt = 0
            for(const k in tempPropCheck){
              if(smartCompare(temp.uniquePropList[j][k], tempPropCheck[k])){
                checkCnt++
              }
            }
            if(checkCnt > 0 && checkCnt == Object.keys(tempPropCheck).length){
              isRowDuplicated = true
              break
            }
          }
          if(!isRowDuplicated && isValidObject(tempPropCheck)){
            // if not existed, push this row to temp variable
            temp.uniquePropList.push(tempPropCheck)
          }else if(isRowDuplicated){
            // if existed in temp variable, empty this row
            for (const j in data[ i ]){
              data[ i ][ j ] = ''
            }
          }

        }

        // sort
        if (data.length > 0) {
          if (props.sortProp >= 0 && this.sortType == 'number') {
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
  }


  getAsJSON() {
    function getProp(path, index) {
      for (const i in path) {
        if (index == path[ i ])
          return i
      }
      return null
    }

    var out = []
    const ss = this._sheet()
    if (ss.getLastRow() > 1) {
      var data = ss.getRange(2, 1, ss.getLastRow() - 1, ss.getLastColumn()).getValues()
      for (const i in data) {
        var subOut = {}
        for (const j in data[ i ]) {
          var p = getProp(this._path, j)
          if (p)
            subOut[ p ] = data[ i ][ j ]
        }
        if (Object.keys(subOut).length){
          let isEmpty = true
          for(const j in subOut){
            if(!isEmptyVariable(subOut[j])){
              isEmpty = false
            }
          }
          if(!isEmpty){
            out.push(subOut)
          }
        }
      }
    }
    return out
  }


}