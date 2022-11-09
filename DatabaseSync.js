function DatabaseSync({ notionToken = '', sheet = {}, data = [], sProps = [], nProps = [], idProp = [], databaseId = '', useDelete = false, useAdd = true, usePull = true, usePush = true, usePullNew = false, fCustomPush = (data, payload, pageId) => { }, fCustomPull = (data, pageId) => { } } = {}) {
  return new DatabaseSyncClass({ notionToken, sheet, data, sProps, nProps, idProp, databaseId, useDelete, useAdd, usePull, usePush, usePullNew, fCustomPush, fCustomPull })
}

class DatabaseSyncClass {

  /**
   * @param{BillSheet} sheet
   * @param data array - sheet data to sync
   * @param sProps object - This Properties in Notion will be updated according to this in Sheet. eg. [{name:"Amount", type:"number"}]
   * @param nProps object - This Properties in Sheet will be updated according to this in Notion. eg. [{name:"Amount", type:"number"}]
   * @param{array} idProp identify of each item
   * @param{string} databaseId database id to sync
   * @param{bool} useDelete Delete Notion page if it doesn't exsit in Sheet
   * @param{bool} useAdd If a row in sheet doesn't exist in Notion, a new page will be created
   * @param{bool} usePush If a difference between Sheet and Notion, the data in Notion will be updated according to Sheet
   * @param{bool} usePull If a difference between Sheet and Notion, the data in the sheet will be updated according to Notion
   * @param{bool} usePullNew If a page in Notion doesn't exist in Sheet, a new row will be appended
   * @param{function} fCustomPush
   * @param{function} fCustomPull
   */
  constructor({ notionToken = '', sheet = {}, data = [], sProps = [], nProps = [], idProp = [], databaseId = '', useDelete = false, useAdd = true, usePull = true, usePush = true, usePullNew = false, fCustomPush = (data, payload, pageId) => { }, fCustomPull = (data, pageId) => { } } = {}) {
    if (sheet && sheet._sheet)
      this.sheet = sheet
    if (isValidArray(data)) {
      this.data = data
    } else if (isValidObject(data)) {
      this.data = [ data ]
    } else {
      this.data = []
    }
    if (isValidArray(sProps)) {
      this.sProps = sProps
    }
    if (isValidArray(nProps)) {
      this.nProps = nProps
    }
    if (isValidArray(idProp)) {
      this.idProp = idProp
    } else {
      this.idProp = []
    }
    if (databaseId) {
      this.databaseId = databaseId
    }
    if (!isEmptyVariable(useDelete))
      this.useDelete = useDelete
    else
      this.useDelete = false
    if (!isEmptyVariable(useAdd))
      this.useAdd = useAdd
    else
      this.useAdd = true
    if (!isEmptyVariable(usePush))
      this.usePush = usePush
    else
      this.usePush = true
    if (!isEmptyVariable(usePull))
      this.usePull = usePull
    else
      this.usePull = true
    if (!isEmptyVariable(usePullNew))
      this.usePullNew = usePullNew
    else
      this.usePullNew = false
    if (fCustomPush)
      this.fCustomPush = fCustomPush
    if (fCustomPull)
      this.fCustomPull = fCustomPull
    this.notionToken = notionToken || ''
  }

  /**
   * Compare sheet data with database data-
   * @param{array} a
   * @param{array} b
   * @param{array} idProp identify of each item
   * @return array
   */
  compare(sheet = [], notion = [], idProp = [], sProps = [], nProps = []) {
    let result = []
    let readList = []
    if (sheet && notion) {

      for (const i in sheet) {
        let macthId = 0
        let subRes = {}

        for (const idp of idProp) {
          if (!smartCompare(sheet[ i ][ idp ], null)) {
            macthId++
          }
        }
        if (macthId != idProp.length) {
          continue
        }
        for (const j in notion) {
          let match = 0
          for (const idp of idProp) {
            if (smartCompare(sheet[ i ][ idp ], notion[ j ][ idp ])) {
              match++
            }
          }

          if (match == idProp.length) {
            readList.push(j)
            let anyPushChange = false
            let anyPullChange = false

            for (const k in sProps) {
              const spk = sProps[ k ][ 'name' ]
              if (!smartCompare(sheet[ i ][ spk ], null)) {
                if (!smartCompare(notion[ j ][ spk ], null)) {
                  if (!smartCompare(sheet[ i ][ spk ], notion[ j ][ spk ])) {
                    anyPushChange = true
                    break
                  }
                } else {
                  anyPushChange = true
                  break
                }
              }
            }

            if (nProps && nProps.length) {
              for (const k in nProps) {
                const npk = nProps[ k ][ 'name' ]
                if (!smartCompare(notion[ j ][ npk ], null)) {
                  if (!smartCompare(sheet[ i ][ npk ], null)) {
                    if (!smartCompare(sheet[ i ][ npk ], notion[ j ][ npk ])) {
                      anyPullChange = true
                      break
                    }
                  } else {
                    anyPullChange = true
                    break
                  }
                }
              }
            }

            if (anyPullChange) {
              result.push({
                type: 'PULL',
                sheet: i,
                notion: j
              })
            } else if (anyPushChange) {
              subRes = {
                type: 'PUSH',
                sheet: i,
                notion: j
              }
            } else {
              subRes = {
                type: 'EQUAL',
                sheet: i,
                notion: j
              }
            }

            break
          }
        }

        // If Sheet has and Notion doens't -> ADD or DELETE_IN_SHEET
        if (!subRes.type) {
          subRes = {
            type: 'ADD',
            sheet: i
          }
        }
        // bổ sung delete in sheet
        result.push(subRes)
      }

      // If sheet empty -> pull all from Notion
      if (sheet.length == 0) {
        for (const i in notion) {
          result.push({
            type: 'PULL_NEW',
            notion: i
          })
        }
      }
      // Delete or pull Notion page
      // If a page in Notion database doesn't exist in sheet: 2 options to execute
      // - useDelete == true -> delete this page
      // - usePullNew == true -> create new row in sheet
      else {
        for (const i in notion) {
          if (!readList.includes(i)) {
            result.push({
              type: 'DELETE',
              notion: i
            })
            result.push({
              type: 'PULL_NEW',
              notion: i
            })
          }
        }
      }

    }
    return result
  }

  sync() {
    const { data, sProps, nProps, databaseId, idProp, useDelete, useAdd, usePush, usePull, usePullNew } = this
    if (data && (isValidArray(sProps) || isValidArray(nProps)) && isValidArray(idProp) && databaseId) {
      let databaseData = new NotionDatabase({ databaseId: databaseId, token: this.notionToken }).load()
      if (isValidArray(databaseData)) {
        let sheetData = data
        let notionData = databaseData.map(d => {
          let jd = d.getPropertiesJSON() // new NotionPage({pageId: d.getId()}).getPropertiesJSON()
          let rd = { page_info: { page_id: d.getId() } }
          for (const i in jd) {
            if (sProps && sProps.filter(p => p.name == i).length)
              rd[ i ] = jd[ i ]
            if (nProps && nProps.filter(p => p.name == i).length)
              rd[ i ] = jd[ i ]
          }
          return rd
        })
        this.compare(sheetData, notionData, idProp, sProps, nProps).forEach(diff => {
          if (diff.type == 'ADD' && useAdd) {
            console.log('ADD => ', sheetData[ diff.sheet ])
            this.createDatabaseItems(sheetData[ diff.sheet ], databaseId)
          } else if (diff.type == 'DELETE' && useDelete) {
            console.log('DELETE => ', notionData[ diff.notion ].page_info.page_id)
            this.deleteDatabaseItems(notionData[ diff.notion ].page_info.page_id)
          } else if (diff.type == 'PUSH' && usePush) {
            console.log('PUSH => ', sheetData[ diff.sheet ])
            this.updateDatabaseItems(sheetData[ diff.sheet ], notionData[ diff.notion ].page_info.page_id)
          } else if (diff.type == 'PULL' && usePull) {
            console.log('PULL => ', notionData[ diff.notion ])
            this.pullDataToSheet(notionData[ diff.notion ])
          } else if (diff.type == 'PULL_NEW' && usePullNew) {
            console.log('PULL_NEW => ', notionData[ diff.notion ])
            this.pullDataToSheet(notionData[ diff.notion ])
          } else {
            console.log(
              'Not Exec =>',
              {
                type: diff.type,
                sheet: sheetData[ diff.sheet ] || null,
                notion: notionData[ diff.notion ] || null
              }
            )
          }
        });
        // if (this.databaseId == DATABASE_ID.TRANSACTIONS) {
        //   RelatedTransactions(notionData)
        // }

        return notionData
      }
    }

    return []
  }

  updateDatabaseItems(data = {}, pageId = '') {
    if (data) {
      let { sProps } = this
      let prop = new NotionPropertyMaker()
      for (const i in sProps) {
        let p = sProps[ i ]
        if (data[ p.name ]) {
          prop[ p.type ](p.name, data[ p.name ])
        }
      }
      let payload = prop.getJSON()
      if (isValidObject(payload.properties)) {
        if (this.fCustomPush) {
          let fcall = this.fCustomPush(data, payload, pageId)
          if (fcall) {
            pageId = fcall.pageId || pageId
            payload = fcall.payload || payload
          }
        }
        new NotionAPI({ token: this.notionToken }).updatePage(pageId, payload)
      }
    }
  }
  createDatabaseItems(data = {}, databaseId = '') {
    if (databaseId && isValidObject(data)) {
      let { sProps, nProps } = this
      let prop = new NotionPropertyMaker()
      if (isValidArray(sProps)) {
        for (const i in sProps) {
          let p = sProps[ i ]
          if (data[ p.name ]) {
            prop[ p.type ](p.name, data[ p.name ])
          }
        }
      }
      if (isValidArray(nProps)) {
        for (const i in nProps) {
          let p = nProps[ i ]
          if (data[ p.name ]) {
            prop[ p.type ](p.name, data[ p.name ])
          }
        }
      }
      let payload = prop.getJSON()
      if (isValidObject(payload.properties)) {
        if (this.fCustomPush) {
          let fcall = this.fCustomPush(data, payload, databaseId)
          if (fcall) {
            databaseId = fcall.databaseId || databaseId
            payload = fcall.payload || payload
          }
        }
        new NotionAPI({ token: this.notionToken }).createPage({
          "parent": { "database_id": databaseId },
          ...payload
        })
      }
    }
  }
  deleteDatabaseItems(pageId = '') {
    if (pageId)
      new NotionAPI({ token: this.notionToken }).deletePage(pageId)
  }
  pullDataToSheet(data = {}) {
    if (data) {
      const pageId = data.page_info.page_id
      if (this.fCustomPull) {
        data = this.fCustomPull(data, pageId) || data
      }
      if (this.sheet && isValidArray(this.idProp)) {
        let query = {}
        for (const idp of this.idProp) {
          query[ idp ] = data[ idp ]
        }
        this.sheet.updateRow(query, data)
      }
    }
  }

}