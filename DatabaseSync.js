/**
 * Sync data between Sheet and Notion database
 * @param {Object} options
 * @param {string} options.notionToken Notion Token
 * @param {BillSheetClass} [options.sheet] BillSheet
 * @param {any[]} [options.data=[]] Sheet data. If not provided and `sheet` is provided, will get data from `sheet`
 * @param {string} options.databaseId Notion database ID
 * @param {{}} [options.databaseFilter] Notion database filter. To reduce the number of pages to be pulled/pushed
 * @param {NotionSyncProperty[]} [options.sProps=[]] Sheet properties to sync to Notion. The value of each property in sheet will be synced to the corresponding property in Notion (Sheet -> Notion). Example: [{name: 'Time', type: NOTION_DATA_TYPE.date}]
 * @param {NotionSyncProperty[]} [options.nProps=[]] Notion properties to sync to Sheet. The value of each property in Notion will be synced to the corresponding property in Sheet (Notion -> Sheet). Example: [{name: 'Time', type: NOTION_DATA_TYPE.date}]
 * @param {string|string[]} options.idProp Identifier properties. The value of these properties will be used to identify the row in Notion and Sheet
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
 * @param {Boolean} [options.debug=false] Pass true to enable debug mode
 * @return {DatabaseSyncClass}
 */
function DatabaseSync({
  notionToken = '',
  sheet = {},
  data = [],
  databaseId = '',
  databaseFilter = {},
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
  debug = false
} = {}) {
  return new DatabaseSyncClass({
    notionToken,
    sheet,
    data,
    sProps,
    nProps,
    idProp,
    databaseId,
    databaseFilter,
    useDelete,
    useAdd,
    usePull,
    usePush,
    usePullNew,
    fCustomPush,
    fCustomPull,
    debug
  })
}

/**
 * @class
 */
class DatabaseSyncClass {

  /**
   * @param {Object} options
   * @param {string} options.notionToken Notion Token
   * @param {BillSheetClass} [options.sheet] BillSheet
   * @param {any[]} [options.data=[]] Sheet data. If not provided and `sheet` is provided, will get data from `sheet`
   * @param {string} options.databaseId Notion database ID
   * @param {{}} [options.databaseFilter] Notion database filter. To reduce the number of pages to be pulled/pushed
   * @param {NotionSyncProperty|NotionSyncProperty[]} [options.sProps=[]] Sheet properties to sync to Notion. The value of each property in sheet will be synced to the corresponding property in Notion (Sheet -> Notion). Example: [{name: 'Time', type: NOTION_DATA_TYPE.date}]
   * @param {NotionSyncProperty|NotionSyncProperty[]} [options.nProps=[]] Notion properties to sync to Sheet. The value of each property in Notion will be synced to the corresponding property in Sheet (Notion -> Sheet). Example: [{name: 'Time', type: NOTION_DATA_TYPE.date}]
   * @param {string|string[]} options.idProp Identifier properties. The value of these properties will be used to identify the row in Notion and Sheet
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
  * @param {Boolean} [options.debug=false] Pass true to enable debug mode
  */
  constructor({
    notionToken = '',
    sheet = {},
    data = [],
    databaseId = '',
    databaseFilter = {},
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
    debug = false
  } = {}) {
    this.notionToken = notionToken || ''
    this.databaseId = databaseId || ''
    this.databaseFilter = databaseFilter || {}
    this.sheet = null
    this.data = data
    this.sProps = sProps
    this.nProps = nProps
    this.idProp = idProp
    this.useDelete = useDelete
    this.useAdd = useAdd
    this.usePull = usePull
    this.usePush = usePush
    this.usePullNew = usePullNew
    this.debug = debug
    this.fCustomPush = null
    this.fCustomPull = null

    if (sheet && sheet._sheet)
      this.sheet = sheet
    if (!isValidArray(this.data)) {
      if (isValidObject(this.data)) {
        this.data = [ this.data ]
      } else if (this.sheet && this.sheet.toJSON) {
        this.data = this.sheet.toJSON()
      }
    }
    if (!isValidArray(this.data)) {
      this.data = []
    }
    if (isValidObject(this.sProps)) {
      this.sProps = [ this.sProps ]
    }
    if (!isValidArray(this.sProps)) {
      this.sProps = []
    }
    if (isValidObject(this.nProps)) {
      this.nProps = [ this.nProps ]
    }
    if (!isValidArray(this.nProps)) {
      this.nProps = []
    }
    if (!isValidArray(idProp) && !isEmptyVariable(idProp)) {
      this.idProp = [ idProp ]
    }
    if (!isValidArray(this.idProp)) {
      this.idProp = []
    }
    if (isValidObject(this.databaseFilter)) {
      if (this.databaseFilter.filter == undefined) {
        this.databaseFilter = { filter: this.databaseFilter }
      }
    } else {
      this.databaseFilter = {}
    }
    if (fCustomPush && typeof fCustomPush === 'function') {
      this.fCustomPush = fCustomPush
    }
    if (fCustomPull && typeof fCustomPull === 'function') {
      this.fCustomPull = fCustomPull
    }
  }

  /**
   * Debug log
   * @param {string} type console type
   * @param  {...any} content 
   * @return {void}
   */
  dbg(type, ...content) {
    if (this.debug) {
      if (console[ type ]) {
        console[ type ](...content)
      }
    }
  }

  /**
   * Comapre two properties
   * @param {any} a First property value
   * @param {any} b Second property value
   * @param {string} type Property type
   * @returns {boolean} true if equal
   */
  propCompare(a, b, type) {
    switch (type) {
      case NOTION_DATA_TYPE.date:
        return compareDate(a, b, { second: false, millisecond: false })
      case NOTION_DATA_TYPE.number:
        a = Number(a)
        b = Number(b)
        return (isNaN(a) && isNaN(b)) || (a == b)
      case NOTION_DATA_TYPE.relation:
      case NOTION_DATA_TYPE.multi_select:
        if (!isValidArray(a) && !isValidArray(b)) return true
        if (!Array.isArray(a) || !Array.isArray(b)) return false
        a = a.map((v) => v.replace(/\-/g, ''))
        a = a.sort((a, b) => a.localeCompare(b))
        b = b.map((v) => v.replace(/\-/g, ''))
        b = b.sort((a, b) => a.localeCompare(b))
        const aRaw = a.join('')
        const bRaw = b.join('')
        if (aRaw == bRaw) return true // quick compare
        if (!aRaw) a = []
        if (!bRaw) b = []
        if (a.length != b.length) return false
        return a.every((v) => b.includes(v))
      default:
        return smartCompare(a, b)
    }
  }

  /**
   * Compare Sheet row with Notion page
   * @param {{}} a Sheet row
   * @param {*} b Notion page
   * @param {*} props Properties to compare
   * @returns {boolean} true if equal
   */
  pageCompare(a, b, props) {
    let result = true
    if (!isValidObject(a) || !isValidObject(b)) return false
    if (!isValidArray(props)) {
      console.error('props can not empty')
      return false
    }
    for (const p of props) {
      result = result && this.propCompare(a[ p.name ], b[ p.name ], p.type)
      if (!result) break
    }
    return result
  }

  /**
   * Compare Sheet data with Notion data
   * @param {{}[]} sheet Sheet data
   * @param {{}[]} notion Notion data
   * @param {string[]} idProp identify of each item
   * @param {NotionSyncProperty[]} sProps Sheet properties
   * @param {NotionSyncProperty[]} nProps Notion properties
   * @return {{type: string, sheet: number, notion: number}[]} Changes
   */
  compare(sheet = [], notion = [], idProp = [], sProps = [], nProps = []) {
    if (!isValidArray(idProp)) {
      console.error('idProp can not empty')
      return []
    }
    let result = []
    let readList = []
    if (sheet && notion) {

      for (const i in sheet) {
        let subRes = {}

        // Check unempty item in Sheet by idProp
        if (!idProp.some(id => !isEmptyVariable(sheet[ i ][ id ]))) {
          continue
        }

        // If valid, find item in Notion and compare
        for (const j in notion) {

          if (idProp.every(id => {
            let propType = null
            if (sProps && sProps.length) propType = sProps.find(p => p.name == id)?.type
            if (!propType && nProps && nProps.length) propType = nProps.find(p => p.name == id)?.type
            return this.propCompare(sheet[ i ][ id ], notion[ j ][ id ], propType)
          })) {

            readList.push(j)
            let anyPushChange = false
            let anyPullChange = false

            if (sProps && sProps.length) {
              if (!this.pageCompare(sheet[ i ], notion[ j ], sProps)) {
                anyPushChange = true
              }

              // const sPropsMap = sProps.map(p => p.name)
              // if (!compareObject(sheet[ i ], notion[ j ], sPropsMap)) {
              //   anyPushChange = true
              // }
            }

            if (nProps && nProps.length) {
              if (!this.pageCompare(sheet[ i ], notion[ j ], nProps)) {
                anyPullChange = true
              }

              // const nPropsMap = nProps.map(p => p.name)
              // if (!compareObject(sheet[ i ], notion[ j ], nPropsMap)) {
              //   anyPullChange = true
              // }
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

        // If Sheet has and Notion doens't: 2 options to execute
        // 1. Add to Notion (ADD). If useAdd option is true, execute
        // 2. Delete that row (DELETE_IN_SHEET).
        if (!subRes.type) {
          subRes = {
            type: 'ADD',
            sheet: i
          }
        }
        // bổ sung delete in sheet
        result.push(subRes)
      }

      // If sheet empty, pullNew all from Notion
      if (sheet.length == 0) {
        for (const i in notion) {
          result.push({
            type: 'PULL_NEW',
            notion: i
          })
        }
      }

      // Delete or pull Notion page
      // If a page in Notion doesn't exist in sheet: 2 options to execute
      // 1. Delete this page in Notion. If useDelete option is true, execute
      // 2. Create new row in sheet. If usePullNew option is true, execute
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

  /**
   * Sync Sheet data with Notion data
   * @param {Object} options
   * @param {function} options.onPageAdded Callback when a page is added
   * @param {function} options.onPageUpdated Callback when a page is updated
   * @param {function} options.onPageDeleted Callback when a page is deleted
   * @param {function} options.onPagePulled Callback when a page is pulled
   * @returns {{}[]} Notion database data
   */
  sync({
    onPageAdded,
    onPageUpdated,
    onPageDeleted,
    onPagePulled
  } = {}) {

    if (typeof onPageAdded !== 'function') onPageAdded = null
    if (typeof onPageUpdated !== 'function') onPageUpdated = null
    if (typeof onPageDeleted !== 'function') onPageDeleted = null
    if (typeof onPagePulled !== 'function') onPagePulled = null

    // contains compare result
    const compareResult = {
      diffCnt: 0, notExcCnt: 0
    }
    const { notionToken, data, sProps, nProps, databaseId, databaseFilter, idProp, useDelete, useAdd, usePush, usePull, usePullNew } = this
    if (data && (sProps || nProps) && idProp && databaseId) {
      this.dbg('warn', 'Getting data from Notion...')
      let databaseData = new NotionDatabase({
        databaseId,
        token: notionToken
      }).load(databaseFilter)

      // If the database is not empty, then compare
      if (isValidArray(databaseData)) {
        // prepare data to compare
        let sheetData = data
        let notionData = databaseData.map(d => {
          let jd = d.getPropertiesJSON() // new NotionPage({pageId: d.getId()}).getPropertiesJSON()
          let rd = { page_info: { page_id: d.getId() } }
          // remove unnecessary properties, only keep sProps and nProps
          for (const i in jd) {
            if (sProps && sProps.find(p => p.name == i)) {
              rd[ i ] = jd[ i ]
            }
            if (nProps && nProps.find(p => p.name == i)) {
              rd[ i ] = jd[ i ]
            }
          }
          return rd
        })
        this.compare(sheetData, notionData, idProp, sProps, nProps).forEach(diff => {
          compareResult.diffCnt += 1
          if (diff.type == 'ADD' && useAdd) {
            console.info('ADD => ', sheetData[ diff.sheet ])
            const page = this.createDatabaseItems(sheetData[ diff.sheet ], databaseId)
            try { onPageAdded(new NotionPage({ page, token: notionToken })) }
            catch (e) { this.dbg('error', 'Error at onPageAdded', e) }
          } else if (diff.type == 'DELETE' && useDelete) {
            console.info('DELETE => ', notionData[ diff.notion ].page_info.page_id)
            const page = this.deleteDatabaseItems(notionData[ diff.notion ].page_info.page_id)
            try { onPageDeleted(new NotionPage({ page, token: notionToken })) }
            catch (e) { this.dbg('error', 'Error at onPageDeleted', e) }
          } else if (diff.type == 'PUSH' && usePush) {
            console.info('PUSH => ', sheetData[ diff.sheet ])
            console.info('===>', notionData[ diff.notion ])
            const page = this.updateDatabaseItems(sheetData[ diff.sheet ], notionData[ diff.notion ].page_info.page_id)
            try { onPageUpdated(new NotionPage({ page, token: notionToken })) }
            catch (e) { this.dbg('error', 'Error at onPageUpdated', e) }
          } else if (diff.type == 'PULL' && usePull) {
            console.info('PULL => ', notionData[ diff.notion ])
            const page = this.pullDataToSheet(notionData[ diff.notion ])
            try { onPagePulled(new NotionPage({ page, token: notionToken })) }
            catch (e) { this.dbg('error', 'Error at onPagePulled', e) }
          } else if (diff.type == 'PULL_NEW' && usePullNew) {
            console.info('PULL_NEW => ', notionData[ diff.notion ])
            this.pullDataToSheet(notionData[ diff.notion ])
            try { onPagePulled(notionData[ diff.notion ]) }
            catch (e) { this.dbg('error', 'Error at onPagePulled', e) }
          } else {
            compareResult.notExcCnt += 1
            this.dbg('log', 'Not Exec =>', {
              type: diff.type,
              sheet: sheetData[ diff.sheet ] || null,
              notion: notionData[ diff.notion ] || null
            })
          }
        });
        // if (this.databaseId == DATABASE_ID.TRANSACTIONS) {
        //   RelatedTransactions(notionData)
        // }

        if (compareResult.diffCnt === compareResult.notExcCnt) {
          console.log('Synced successfully without any updates!')
        }
        return notionData
      }

      // If database is empty, then create new pages in database
      else if (useAdd) {
        for (const row of data) {
          console.info('ADD => ', row)
          const page = this.createDatabaseItems(row, databaseId)
          try { onPageAdded(new NotionPage({ page, token: notionToken })) }
          catch (e) { this.dbg('error', 'Error at onPageAdded', e) }
        }
      }

    }

    this.dbg('warn', 'Invalid data to sync')
    return []
  }

  /**
   * Update Notion page(s)
   * @param {{}|{}[]} data data to update
   * @param {string} pageId Notion page id
   * @return {{}} true if success
   */
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
        return new NotionAPI({ token: this.notionToken }).updatePage(pageId, payload)
      }
    }
    console.error('Can not update Notion page without page id')
    return {}
  }

  /**
   * Create Notion page(s)
   * @param {{}|{}[]} data data of new page(s)
   * @param {string} databaseId Notion database id
   * @return {{}} true if success
   */
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
        return new NotionAPI({ token: this.notionToken }).createPage({
          "parent": { "database_id": databaseId },
          ...payload
        })
      }
    }
    console.error('Can not create a Notion page without database id')
    return {}
  }

  /**
   * Delete Notion page(s)
   * @param {string} pageId Notion page id to delete
   * @return {{}} true if success
   */
  deleteDatabaseItems(pageId = '') {
    if (pageId) {
      return new NotionAPI({ token: this.notionToken }).deletePage(pageId)
    }
    console.error('Can not delete Notion page without page id')
    return {}
  }

  /**
   * Get data from Notion page and save to Sheet
   * @param {string|{}} data Notion page id or Notion page data
   * @return {boolean} true if success
   */
  pullDataToSheet(data = {}) {
    if (data) {
      const pageId = data.page_info.page_id
      if (this.fCustomPull) {
        try {
          data = this.fCustomPull(data, pageId) || data
        } catch (e) { console.error('Error at [fCustomPull]', e) }
      }
      if (this.sheet && isValidArray(this.idProp)) {
        return this.sheet.update(data, this.idProp)
      }
    }
    return false
  }

}



/**
 * @typedef {Object} NotionSyncProperty
 * @property {string} name Property name
 * @property {NOTION_DATA_TYPE} type Property type
 */

/**
 * @callback NotionSyncCustomPush
 * @param {Object} data Data to push/add {<property_name>: <property_value>}
 * @param {Object} payload Request payload
 * @param {string} pageId Notion page id (push) or database id (add)
 * @returns {{pageId: string, payload: {properties: NotionPropertyMaker.getJSON}}}
 */


/**
 * @callback NotionSyncCustomPull
 * @param {Object} data Data from Notion after pull/pullNew {<property_name>: <property_value>}
 * @param {string} pageId Notion page id
 * @returns {Object} rowData to save to Sheet
 */