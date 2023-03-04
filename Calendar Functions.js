function Cal(options) {
  return null
  // return new CalendarClass(options)
}

/**
 * Chưa hoàn thiện:
 * [] Xử lý trường hợp xóa event trên calendar khi xóa trên sheet
 * [] Làm sao để xác định được 1 event cần pull về hay cần xóa nếu không tìm thấy nó trong sheet
 * [] Update row dựa trên updateList
 * [] Delete row dựa trên deleteList
 * [] Thêm method createEvent để có thể tạo event đồng thời trên sheet và calendar
 * [] Thêm method deleteEvent để có thể xóa event đồng thời trên sheet và calendar
 * [] Thêm method updateEvent để có thể update event đồng thời trên sheet và calendar
 * [] Tìm cách để xác định sheetLastUpdated, và callback nó về sync (hữu ích khi xóa cả hàng, lúc này sẽ xác định được event của hàng này cần phải xóa)
 */


/**
 * @class CalendarClass
 * @classdesc easily create and update events from Sheet to Calendar
 * 
 * To determine which row is which event, we use a property named '_eventId' to store the event id from GCalendar. If you want to use your own property, you can set it in `idProp`. If you use default we will add new columns in your sheet named `_eventId`, so you should not remove it from the sheet.
 * 
 * To determine which is the latest data source, we use 2 properties to store the last updated time of sheet and calendar. If you want to use your own property, you can set it in `sheetLastUpdatedProp` and `calLastUpdatedProp`. If you use default we will add 2 new columns in your sheet named `_sheetLastUpdated` and `_calLastUpdated, so you should not remove them from the sheet.
 */
class CalendarClass {

  /**
   * 
  * @param {Object} options
   * @param {CalendarApp.Calendar} [options.cal=null] Calendar object
   * @param {string} [options.calId=''] Calendar ID
   * @param {BillSheetClass} [options.billSheet=null] BillSheet object
   * @param {string|string[]} [options.idProp='_eventId'] The property name of the unique ID for each row
   * @param {string} [options.sheetLastUpdatedProp='_sheetLastUpdated'] The property name of the last updated time of sheet
   * @param {string} [options.calLastUpdatedProp='_calLastUpdated'] The property name of the last updated time of calendar
   * @param {boolean} [options.useAdd=false] If true, will add events to calendar base on the sheet
   * @param {boolean} [options.usePush=false] If true, will push events detail to Calendar, if it is different from the sheet. Otherwise, it only create the events once (when the row is append to sheet) and never update it.
   * @param {boolean} [options.usePull=false] If true, will pull events detail to Sheet, if it is different from the sheet. It update base on the last update time, so it will not update the event if the sheet is updated after the calendar.
   * @param {boolean} [options.usePullNew=false] If true, will pull new events to Sheet, if the sheet does not have it.
   * @param {boolean} [options.useDeleteBaseOnSheet=false] If true, will delete events on calendar if the row is deleted on the sheet
   * @param {boolean} [options.useDeleteBaseOnCalendar=false] If true, will delete events on sheet if the event is deleted on the calendar.
   */
  constructor({
    cal = null,
    calId = '',
    billSheet = null,
    idProp = '_eventId',
    sheetLastUpdatedProp = '_sheetLastUpdated',
    calLastUpdatedProp = '_calLastUpdated',
    useAdd = false,
    usePush = false,
    usePull = false,
    usePullNew = false,
    useDeleteBaseOnSheet = false,
    useDeleteBaseOnCalendar = false,
    callback = null
  } = {}) {
    this.calId = calId || null
    this.cal = cal || CalendarApp.getCalendarById(this.calId)
    this.billSheet = billSheet || null
    this.idProp = idProp
    this.sheetLastUpdatedProp = sheetLastUpdatedProp
    this.calLastUpdatedProp = calLastUpdatedProp
    this.useAdd = useAdd || false
    this.usePush = usePush || false
    this.usePull = usePull || false
    this.usePullNew = usePullNew || false
    this.useDeleteBaseOnSheet = useDeleteBaseOnSheet || false
    this.useDeleteBaseOnCalendar = useDeleteBaseOnCalendar || false
    this.callback = callback || null


    if (!this.cal) {
      console.warn('No calendar set, using default')
      this.cal = CalendarApp.getDefaultCalendar()
    }
    if (!this.billSheet) {
      console.error('No BillSheet set')
      return
    }
    if (typeof callback !== 'function') {
      this.callback = null
    }

  }

  /**
   * Return the calendar object
   * @returns {CalendarApp.Calendar}
   */
  calendar() {
    return this.cal
  }

  /**
   * Return the BillSheet object
   * @returns {BillSheetClass}
   */
  sheet() {
    return this.billSheet
  }

  /**
   * Execute the callback function
   * @param {CalendarApp.Event} event 
   * @param {{}} row 
   * @param {string} type 
   * @returns 
   */
  _callback(event, row, type) {
    if (!this.callback) return
    try {
      this.callback(event, row, type, this.billSheet)
    } catch (e) { console.warn('[Error at Callback]', e) }
  }

  _inheritEvent() {
    return {
      event: this.cal.createEvent('inherit', new Date(0), new Date(3600000)),
      start: new Date(0),
      end: new Date(3600000),
      title: 'inherit'
    }
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
   * Compare the last updated time of sheet and calendar
   * @param {Date|number} sheetLastUpdated 
   * @param {Date|number} calLastUpdated 
   * @returns {"SHEET"|"CALENDAR"|null} null is equal
   */
  _compareEvent(sheetLastUpdated, calLastUpdated) {
    sheetLastUpdated = sheetLastUpdated || 0
    calLastUpdated = calLastUpdated || 0
    if (typeof sheetLastUpdated != 'number') sheetLastUpdated = sheetLastUpdated.getTime()
    if (typeof calLastUpdated != 'number') calLastUpdated = calLastUpdated.getTime()
    const gap = sheetLastUpdated - calLastUpdated
    return gap > 0 ? 'SHEET' : gap < 0 ? 'CALENDAR' : null
  }

  /**
   * Sync events between the calendar and the sheet
   */
  sync() {
    if (!this.billSheet) return
    if (!this.cal) return

    const { idProp, sheetLastUpdatedProp, calLastUpdatedProp, useAdd, usePush, usePull, usePullNew, useDeleteBaseOnCalendar, useDeleteBaseOnSheet } = this
    let sheetData = this.billSheet.toJSON()
    let updateList = []
    let deleteList = []

    sheetData.forEach(row => {
      const eid = row[ idProp ] // event id stored in the sheet
      const sheetLastUpdated = row[ sheetLastUpdatedProp ] ? new Date(row[ sheetLastUpdatedProp ]) : null

      /* Create new event */
      if (!eid) {
        if (!useAdd) return
        if (!this.onCreate) return console.warn('No onCreate function!')
        try {
          const ie = this._inheritEvent()
          this.onCreate('SHEET', row, ie.event)
          if (ie.event.getStartTime().getTime() == ie.start.getTime()) {
            console.warn('[Event not created] This is inherit event object, please edit it to create event', row)
            ie.event.deleteEvent()
            return
          }
        } catch (e) { return console.error('[Error when add event]', e) }
        row[ calLastUpdatedProp ] = ie.event.getLastUpdated().toISOString()
        row[ sheetLastUpdatedProp ] = row[ calLastUpdatedProp ]
        return updateList.push(row)
      }

      
      const event = CalendarClass.getEvent(this.cal, eid)
      let source = this._compareEvent(sheetLastUpdated, event?.getLastUpdated())
      
      /* Delete event */
      if (!event) {
        if (!useDeleteBaseOnCalendar) return
        if (!this.onDelete) return console.warn('No onDelete function!')
        source = 'CALENDAR'
        try {
          this.onDelete(source, row, event)
        } catch (e) { return console.error('[Error when delete event]', e) }
        return deleteList.push(row)
      }
      
      /* Check update event */
      // check is any update: comapre base on last updated time
      // - In sheet, set a onEdit trigger to update the last updated time to a col (prop)
      // - In calendar, get by getLastUpdated()
      if (!usePush && !usePull) return
      if (!this.onUpdate) return
      if (!source) return // equal - no changes
      if (!usePush && source == 'SHEET') return
      if (!usePull && source == 'CALENDAR') return
      try {
        this.onUpdate(source, row, event)
      } catch (e) { return console.error('[Error when update event]', e) }
      row[ calLastUpdatedProp ] = event.getLastUpdated().toISOString()
      row[ sheetLastUpdatedProp ] = row[ calLastUpdatedProp ]
      return updateList.push(row)

    })

    if (updateList.length) {

    }

    if (deleteList.length) {

    }

    /* Match events */
    if (this.fMatch) {
      if (!this.matchStart) return console.warn('matchStart is unset!')
      if (!this.matchEnd) return console.warn('matchEnd is unset!')
      const events = this.cal.getEvents(this.matchStart, this.matchEnd)
      events.forEach(event => {
        try {
          if (!this.fMatch(event)) return
          if (sheetData.some(row => row[ idProp ] == event.getId())) return

          // làm sao để xác định được event này cần xóa hay cần pull về sheet?

          /* Pull new */
          if (usePullNew && this.onPullNew) {
            this.onPullNew(event)
          }

          /* Delete base on sheet */
          if (useDeleteBaseOnSheet && this.onDelete) {
            this.onDelete('SHEET', null, event)
            event.deleteEvent()
          }

        } catch (e) { console.error('[Error when match event]', e)}
      })
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
   * A function to run when an event need to be deleted
   * @param {(source:"SHEET"|"CALENDAR", row:{}, event:CalendarApp.Event) => {}} callback
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

  /**
   * The function that matchs events with your sheet (is the event part of the table's sequence of events)
   * @param {Date} start start time
   * @param {Date} end end time
   * @param {(event:CalendarApp.Event)=>boolean} callback
   */
  setEventMatchFunction(start, end, callback) {
    if (!start || !end) return
    if (start.getTime() > end.getTime()) return console.error('[Error at fMatch] Start time must be before end time')
    this.matchStart = start
    this.matchEnd = end
    if (!callback || typeof callback !== 'function')
      this.fMatch = null
    else
      this.fMatch = callback
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

}