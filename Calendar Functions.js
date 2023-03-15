function Cal(options) {
  return null
  // return new CalendarClass(options)
}

/**
 * Chưa hoàn thiện:
 * [] Code phần xóa event khi xóa row trên sheet
 * [] Gọi hàm callback sau khi sync
 * [] Tạo method để có thể đồng bộ thủ công event từ Calendar về Sheet
 * [] Thêm method createEvent để có thể tạo event đồng thời trên sheet và calendar
 * [] Thêm method deleteEvent để có thể xóa event đồng thời trên sheet và calendar
 * [] Thêm method updateEvent để có thể update event đồng thời trên sheet và calendar
 * -------- *
 * [x] Tạo static method để calc lastUpdated (gọi nó trong onEdit)
 * [x] Thêm prop startDay, endDay/numberOfFutureDays để có thể lấy được toàn bộ event từ Calendar
 * [x] Xử lý trường hợp xóa event trên calendar khi xóa trên sheet
 *  └─ Đã có idea bên dưới
 * [x] Làm sao để xác định được 1 event cần pull về hay cần xóa nếu không tìm thấy nó trong sheet
 *  └─ Đã có idea bên dưới
 * [x] Update row dựa trên updateList
 * [x] Delete row dựa trên deleteList
 */


/**
 * @class CalendarClass
 * @classdesc easily create and update events from Sheet to Calendar
 * 
 * To determine which row is which event, we use a property named '_eventId' to store the event id from GCalendar. If you want to use your own property, you can set it in `eidProp`. If you use default we will add new columns in your sheet named `_eventId`, so you should not remove it from the sheet.
 * 
 * To determine which is the latest data source, we use a property to store the last updated time of sheet. If you want to use your own property, you can set it in `lastUpdatedProp`. If you use default we will add a new column in your sheet named `_sheetLastUpdated`, so you should not remove them from the sheet.
 * 
 * Để đồng bộ những event từ Calendar về Sheet thì bắt buộc các event này phải chứa trong calendar đó
 * Tạo một method riêng để user có thể chạy lệnh này manual để đồng bộ các event từ Calendar nào đó về Sheet
 * 
 */
class CalendarClass {

  /**
   * 
  * @param {Object} options
   * @param {CalendarApp.Calendar} [options.cal=null] Calendar object
   * @param {string} [options.calId=''] Calendar ID
   * @param {BillSheetClass} [options.billSheet=null] BillSheet object
   * @param {string|string[]} [options.eidProp='_eventId'] The property name of the unique ID for each row
   * @param {string} [options.lastUpdatedProp='_sheetLastUpdated'] The property name of the last updated time of sheet
   * @param {string} [options.dateProp=''] The property name of the start date of event in Sheet. This is optional, if provided, it will exec faster
   * @param {Date} [options.startDay] The start day to get events from Calendar. It will be used to pull events from Calendar to Sheet
   * @param {Date} [options.endDay] The end day to get events from Calendar. If it is null, will use numberOfFutureDays. It will be used to pull events from Calendar to Sheet
   * @param {number} [options.numberOfFutureDays=0] The number of future days from now to get events from Calendar. It will be used to pull events from Calendar to Sheet
   * @param {boolean} [options.useAdd=false] If true, will add events to calendar base on the sheet
   * @param {boolean} [options.usePush=false] If true, will push events detail to Calendar, if it is different from the sheet. Otherwise, it only create the events once (when the row is append to sheet) and never update it.
   * @param {boolean} [options.usePull=false] If true, will pull events detail to Sheet, if it is different from the sheet. It update base on the last update time, so it will not update the event if the sheet is updated after the calendar.
   * @param {boolean} [options.usePullNew=false] If true, will pull new events to Sheet, if the sheet does not have it.
   * @param {boolean} [options.useDeleteBaseOnCalendar=false] If true, will delete events on sheet if the event is deleted on the calendar.
   */
  constructor({
    debug = false,
    cal = null,
    calId = '',
    billSheet = null,
    eidProp = '_eventId',
    lastUpdatedProp = '_sheetLastUpdated',
    dateProp = '',
    startDay = null,
    endDay = null,
    numberOfFutureDays = 0,
    useAdd = false,
    usePush = false,
    usePull = false,
    usePullNew = false,
    useDeleteBaseOnCalendar = false
  } = {}) {
    this.debug = debug
    this.calId = calId || null
    this.cal = cal || CalendarApp.getCalendarById(this.calId)
    this.billSheet = billSheet || null
    this.eidProp = eidProp
    this.lastUpdatedProp = lastUpdatedProp
    this.dateProp = dateProp
    this.startDay = startDay
    this.endDay = endDay
    this.numberOfFutureDays = numberOfFutureDays
    this.useAdd = useAdd || false
    this.usePush = usePush || false
    this.usePull = usePull || false
    this.usePullNew = usePullNew || false
    this.useDeleteBaseOnCalendar = useDeleteBaseOnCalendar || false


    if (!this.cal) {
      console.warn('No calendar set, using default')
      this.cal = CalendarApp.getDefaultCalendar()
    }
    if (!this.billSheet) {
      console.error('No BillSheet set')
      return
    }

  }

  /**
   * Call this function in onEdit to update the lastUpdated time
   * @param {*} e 
   * @returns {void}
   */
  calSyncHandler(e) {
    /* Find lastUpdated column index */
    const path = this.billSheet.path
    const lastUpdatedColIndex = path[ this.lastUpdatedProp ] || -1
    const eidColIndex = path[ this.eidProp ] || -1
    if (lastUpdatedColIndex < 0) return

    const { authMode, triggerUid, source, range, oldValue, value, user } = e
    const { rowStart, columnStart, rowEnd, columnEnd } = range
    let ignore = false

    if (lastUpdatedColIndex >= columnStart && lastUpdatedColIndex <= columnEnd) {
      ignore = true
    }

    const sheet = this.sheet()
    const eSheet = range.getSheet()
    const isotime = new Date().toISOString()

    // save deleted events
    // --> delete event imediately when a row is deleted
    // Trường hợp delete từng cell --> sẽ không xóa cell eid, để khi row chỉ còn có mỗi cell eid thì sẽ xóa event đó
    // Trường hợp delete nguyên row --> easy
    // Remove lastUpdated on empty row

    if (sheet.getName() != eSheet.getName()) return
    const targetRange = eSheet.getRange(rowStart, lastUpdatedColIndex, (rowEnd - rowStart) + 1, 1)
    let tdata = targetRange.getValues().map(row => (row.map(col => {
      if (ignore) col = this._getTimestamp(col)
      if (ignore && col) return new Date(col).toISOString()
      return isotime
    })))
    targetRange.setValues(tdata)
  }

  /**
   * Return the calendar object
   * @returns {CalendarApp.Calendar}
   */
  calendar() {
    return this.cal
  }

  /**
   * Return the Sheet object
   * @returns {SpreadsheetApp}
   */
  sheet() {
    return this.billSheet._sheet()
  }

  /**
   * Log debug message
   * @param {string} type Log type
   * @param {string} message message to log
   */
  _dbg(type, message, ...args) {
    if (!this.debug) return
    console[type](message, ...args)
  }

  /**
   * Return some event detail for logging
   * @param {CalendarApp.Event} event
   * @param {{title: string, id: string, start: string, end: string}}
   */
  _shortEvent(event) {
    if (!event) {
      return {
        eventIsNull: true
      }
    }
    return {
      title: event.getTitle(),
      id: event.getId(),
      start: event.getStartTime()?.toISOString(),
      end: event.getEndTime()?.toISOString()
    }
  }

  /**
   * Try to get timestamp from input
   * @param {*} time
   * @returns {number|null}
   */
  _getTimestamp(time) {
    if (!time) return null
    try {
      return new Date(time).getTime() || null
    } catch (e) { }
    return null
  }

  /**
   * Check if the event is deleted
   * @param {CalendarApp.Calendar} cal Calendar object
   * @param {string|CalendarApp.Event} event event object
   * @returns {boolean} true if the event is deleted or not found
   */
  static isEventDeleted(cal, event) {
    if (!cal || !isValidObject(cal)) return true
    if (!event || !isValidObject(event)) return true
    try {
      const events = cal.getEvents(event.getStartTime(), event.getEndTime())
      return !events.some((e) => e.getId() == event.getId())
    } catch (e) { console.error('[Error at isEventDeleted]', e) }
    return true
  }

  /**
   * Return the event object if it is not deleted, otherwise return null
   * @param {CalendarApp.Calendar} cal Calendar object
   * @param {string|CalendarApp.Event} event event id or event object
   * @returns {null|CalendarApp.Event}
   */
  static getEvent(cal, event) {
    let eid = null
    if (typeof event == 'string') {
      eid = event
    } else if (event && event.getId) {
      eid = event.getId()
    }
    if (!eid) return null
    if (!cal) return null
    try {
      const e = cal.getEventById(eid)
      if (!e) return null
      const events = cal.getEvents(e.getStartTime(), e.getEndTime())
      return events.find((ev) => ev.getId() == eid)
    } catch (e) { console.error('[Error at isEventDeleted]', e) }
    return null
  }

  /**
   * Get events from Calendar by `startDay` and `endDay`/`numberOfFutureDays`. If not provided, use the time range of the Sheet
   * @param {{}[]} [sheetData] 
   * @returns {{}} Object list with the key is event id
   */
  getEvents(sheetData) {
    let result = {}
    const { startDay, endDay, numberOfFutureDays, dateProp } = this
    let range = [ null, null ]

    // Get Range from input
    if (startDay) {
      if (endDay) {
        range = [ startDay, endDay ]
      } else if (numberOfFutureDays > 0) {
        const tdate = new Date()
        tdate.setHours(0, 0, 0, 0)
        tdate.setDate(tdate.getDate() + numberOfFutureDays + 1)
        range = [ startDay, tdate ]
      }
    }

    // Get range from sheet
    if (!range[ 0 ] && dateProp) {
      if (!isValidArray(sheetData) || !isValidObject(sheetData[ 0 ])) {
        if (this.billSheet) {
          sheetData = this.billSheet.toJSON()
        }
      }
      if (!isValidArray(sheetData) || !isValidObject(sheetData[ 0 ])) return result
      const ts = sheetData
        .map(r => this._getTimestamp(r[ dateProp ]) || 0)
        .filter(r => r > 0)
      range = [ new Date(Math.min(...ts)), new Date(Math.max(...ts)) ]
    }

    if (!range[ 0 ] && !range[ 1 ]) {
      this._dbg('log', `Get all events from ${range[0].toISOString()} -> ${range[1].toISOString()}`)
      const evs = this.cal.getEvents(range[ 0 ], range[ 1 ])
      this._dbg('log', `==> Got ${evs.length} events`)
      evs.forEach(ev => {
        result[ ev.getId() ] = ev
      })
    }

    return result
  }

  /**
   * Compare the last updated time of sheet and calendar
   * @param {Date|number} sheetLastUpdated 
   * @param {Date|number} calLastUpdated 
   * @returns {"SHEET"|"CALENDAR"|null} null is equal
   */
  _compareEvent(sheetLastUpdated, calLastUpdated) {
    sheetLastUpdated = this._getTimestamp(sheetLastUpdated) || 0
    calLastUpdated = this._getTimestamp(calLastUpdated) || 0
    const gap = sheetLastUpdated - calLastUpdated
    return gap > 0 ? 'SHEET' : gap < 0 ? 'CALENDAR' : null
  }

  /**
   * Sync events between the calendar and the sheet
   */
  sync() {
    this._dbg('warn', 'START SYNC')
    if (!this.billSheet) return console.error('Cannot sync without BillSheet!')
    if (!this.cal) return console.error('Cannot sync without Calendar!')

    const { eidProp, lastUpdatedProp, useAdd, usePush, usePull, usePullNew, useDeleteBaseOnCalendar } = this
    let sheetData = this.billSheet.toJSON()
    let updateList = []
    let deleteList = []

    // Try to get all events in one request
    this._dbg('log', 'Get all events From range')
    let events = this.getEvents(sheetData)
    // Otherwise get event of everysingle row
    if (!isValidObject(events)) {
      this._dbg('Cannot found events range. try to get events of every row')
      sheetData.forEach(r => {
        const eid = r[ eidProp ]
        if (!eid) return
        const ev = CalendarClass.getEvent(this.cal, eid)
        if (!ev) return
        events[ eid ] = ev
      })
    }

    // Compare
    this._dbg('warn', 'START COMPARE')
    sheetData.forEach(row => {
      const eid = row[ eidProp ] // event id stored in the sheet
      const sheetLastUpdated = row[ lastUpdatedProp ] ? new Date(row[ lastUpdatedProp ]) : null
      this.log('log', `==> Event: ${eid}, lastUpdated: ${sheetLastUpdated} <==`)
      
      if (!sheetLastUpdated && !eid) {
        console.warn('Cannot defined last updated of this row. Make sure you called CalSyncHandler() in onEdit()', row)
      }

      /* Create new event */
      if (!eid) {
        if (!useAdd) return
        this._dbg('log', '==> ADD NEW EVENT TO CALENDAR', row)
        if (!this.onCreate) return console.warn('No onCreate function!')
        const ie = this.cal.createEvent('inherit', new Date(0), new Date(3600000))
        try {
          this.onCreate('SHEET', row, ie)
          if (ie.getStartTime().getTime() == 0) {
            console.warn('[Event not created] This is inherit event object, please edit it to create event', row)
            ie.deleteEvent()
            return
          }
        } catch (e) {
          ie.deleteEvent()
          return console.error('[Error when add event]', e)
        }
        this._dbg('log', '==> NEW EVENT detail', this._shortEvent(ie))
        row[ lastUpdatedProp ] = ie.getLastUpdated().toISOString()
        return updateList.push(row)
      }


      const event = events[ eid ]
      events[ eid ].readByCalendarSync = true
      let source = this._compareEvent(sheetLastUpdated, event?.getLastUpdated())

      /* Delete event */
      if (!event) {
        if (!useDeleteBaseOnCalendar) return
        this._dbg('log', `==> DELETE ROW, eventId: ${eid}`, row)
        if (!this.onDelete) return console.warn('No onDelete function!')
        source = 'CALENDAR'
        try {
          this.onDelete("CALENDAR", row, event)
          event.deleteEvent()
        } catch (e) { return console.error('[Error when delete event]', e) }
        return deleteList.push(row)
      }

      /* Check update event */
      // check is any update: comapre base on last updated time
      // - In sheet, set a onEdit trigger to update the last updated time to a col (prop)
      // - In calendar, get by getLastUpdated()
      if (!usePush && !usePull) return
      if (!source) return // equal - no changes
      if (!usePush && source == 'SHEET') return
      if (!usePull && source == 'CALENDAR') return
      this._dbg('log', `==> UPDATE EVENT FROM ${source}`, row, this._shortEvent(event))
      if (!this.onUpdate) return
      try {
        this.onUpdate(source, row, event)
      } catch (e) { return console.error('[Error when update event]', e) }
      row[ lastUpdatedProp ] = event.getLastUpdated().toISOString() // event này được GET trước khi change, liệu cái lastUpdate này nó có chính xác hay không
      return updateList.push(row)

    })

    // Handle event not in Sheet
    for (const i in events) {
      const event = events[ i ]
      if (event.readByCalendarSync) continue
      try {

        /* Pull new */
        if (usePullNew) {
          this._dbg('log', `==> PULL NEW EVENT TO SHEET`, this._shortEvent(event))
          if (this.onPullNew) {
            let newRow = this.onPullNew(event)
            if (!newRow) {
              console.warn('[Event not pulled] because onPullNew return null', event)
              continue
            }
            newRow[ eidProp ] = event.getId()
            updateList.push(newRow)
            this._dbg('log', '==> NEW ROW', newRow)
          }
        }

        /* Delete base on sheet */
        /** @deprecated **/

      } catch (e) {
        return console.error('[Error when handle event not in sheet]', e)
      }
    }

    if (updateList.length) {
      this._dbg('warn', `UPDATING ${updateList.length} rows`)
      this.billSheet.update(updateList, [ eidProp, ...this.billSheet.uniquePropList ])
    }

    if (deleteList.length) {
      this._dbg('warn', `DELETING ${updateList.length} rows`)
      this.billSheet.remove(deleteList, [ eidProp, ...this.billSheet.uniquePropList ])
    }

  }

  /**
   * A function to run when an event need to be added to the calendar
   * @param {(source:"SHEET"|"CALENDAR", row:{}|null, event:CalendarApp.Event) => {}} callback
   * `source` - If "SHEET", it means there is row in the sheet, but no event in the calendar. If "CALENDAR", it means there is event in the calendar, but no row in the sheet.
   * 
   * `row` - The row data. If the source is "CALENDAR", it will be null. If you change the row, it will be updated to the sheet.
   * 
   * `event` - The event object. If the source is "SHEET", it will be an inherited object of CalendarApp.Event
   */
  onCreate(callback) {
    if (!callback || typeof callback !== 'function')
      this.onCreate = null
    else
      this.onCreate = callback
  }

  /**
   * A function to run when an event need to be appended to the sheet
   * @param {(event:CalendarApp.Event) => Object} callback
   * The function should return a row object
   * 
   * `event` - The event object
   */
  onPullNew(callback) {
    if (!callback || typeof callback !== 'function')
      this.onPullNew = null
    else
      this.onPullNew = callback
  }

  /**
   * A function to run when an event need to be updated
   * @param {(source:"SHEET"|"CALENDAR", row:{}, event:CalendarApp.Event) => {}} callback
   * `source` - If "SHEET", it means this event need to be updated from the sheet. If "CALENDAR", it means this event need to be updated from the calendar.
   * 
   * `row` - The row data. If you change the row, it will be updated to the sheet.
   * 
   * `event` - The event object.
   */
  onUpdate(callback) {
    if (!callback || typeof callback !== 'function')
      this.onUpdate = null
    else
      this.onUpdate = callback
  }

  /**
   * A function to run when detect an event has been deleted from the Calendar
   * @param {(source:"CALENDAR", row:{}, event:CalendarApp.Event) => {}} callback
   * `source` - If "SHEET", it means a row is deleted from the sheet. If "CALENDAR", it means an event is deleted from the calendar.
   * 
   * `row` - The row data. If you change the row, it will be updated to the sheet. If source is "SHEET", it will be null.
   * 
   * `event` - The event object.
   */
  onDelete(callback) {
    if (!callback || typeof callback !== 'function')
      this.onDelete = null
    else
      this.onDelete = callback
  }

}