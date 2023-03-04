/**
 * @typedef {Object} NOTION_DATA_TYPE
 * @property {string} title Database title
 * @property {string} rich_text Plain text
 * @property {string} number Number
 * @property {string} status Status
 * @property {string} select Select option
 * @property {string} multi_select Multi select option
 * @property {string} relation Page relation
 * @property {string} checkbox Checkbox
 * @property {string} url URL
 * @property {string} email Email
 * @property {string} phone_number Phone number
 * @property {string} date Date
 */
var NOTION_DATA_TYPE = {
  title: 'title',
  rich_text: 'rich_text',
  number: 'number',
  status: 'status',
  select: 'select',
  multi_select: 'multi_select',
  relation: 'relation',
  checkbox: 'checkbox',
  url: 'url',
  email: 'email',
  phone_number: 'phone_number',
  date: 'date'
}

var NOTION_FILE_TYPE = {
  external: "external",
  emoji: "emoji"
}

var NOTION_OPTION_COLORS = {
  default: "default",
  gray: "gray",
  brown: "brown",
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  blue: "blue",
  purple: "purple",
  pink: "pink"
}




function NOTION() {
  return {
    NOTION_DATA_TYPE,
    NotionAPI: function ({ token = '' } = {}) {
      return new NotionAPI({ token })
    },
    NotionPropertyMaker: function () {
      return new NotionPropertyMaker()
    },
    NotionFilterMaker: function () {
      return NotionFilterMaker
    },
    NotionSortMaker: function () {
      return new NotionSortMaker()
    },
    NotionPageIconMaker: function (type = '', value) {
      return NotionPageIconMaker(type, value)
    },
    NotionPageCoverMaker(type = '', value) {
      return NotionPageCoverMaker(type, value)
    },
    NotionDatabase: function ({ data = {}, databaseId = '', token = '' } = {}) {
      return new NotionDatabase({ data, databaseId, token })
    },
    NotionPage: function ({ page = {}, pageId = '', token = '' } = {}) {
      return new NotionPage({ page, pageId, token })
    },
    NotionProperty: function (data = {}, { pageId = '', token = '' } = {}) {
      return new NotionProperty(data, { pageId, token })
    },
    NotionPropertyUpdater: function ({ token, databaseId } = {}) {
      return new NotionPropertyUpdater({ token, databaseId })
    }
  }
}


/**
 * Create icon Object
 * @param {"external"|"emoji"} type Icon type
 * @param {string} value file url or emoji
 * @return {{icon: {}}}
 */
function NotionPageIconMaker(type = '', value) {
  if (isEmptyVariable(value)) return null
  const out = { icon: {} }
  const prop = new NotionPropertyMaker()
  if (type === NOTION_FILE_TYPE.emoji) {
    out.icon = prop.emoji(value)
  } else if (type === NOTION_FILE_TYPE.external) {
    out.icon = prop.externalFile(value)
  }
  return out
}


/**
 * Create cover Object
 * @param {"external"} type cover type
 * @param {string} value file url
 * @return {{cover: {}}}
 */
function NotionPageCoverMaker(type = '', value) {
  if (isEmptyVariable(value)) return null
  const out = { cover: {} }
  const prop = new NotionPropertyMaker()
  if (type === NOTION_FILE_TYPE.external) {
    out.cover = prop.externalFile(value)
  }
  return out
}








var NotionFilterMaker = {

  and: function (filter1, filter2, ...fileterN) {
    const out = []
    if (isValidObject(filter1)) out.push(filter1)
    if (isValidObject(filter2)) out.push(filter2)
    if (isValidArray(fileterN)) {
      fileterN.forEach(filter => {
        if (isValidObject(filter)) out.push(filter)
      })
    }
    if (isValidArray(out)) return { and: out }
    return null
  },

  or: function (filter1, filter2, ...fileterN) {
    const out = []
    if (isValidObject(filter1)) out.push(filter1)
    if (isValidObject(filter2)) out.push(filter2)
    if (isValidArray(fileterN)) {
      fileterN.forEach(filter => {
        if (isValidObject(filter)) out.push(filter)
      })
    }
    if (isValidArray(out)) return { or: out }
    return null
  },

  /**
   * Filter by created time or last edited time
   * @param {"created_time"|"last_edited_time"} propName Property name
   * @param {"equals"|"before"|"after"|"on_or_before"|"is_empty"|"is_not_empty"|"on_or_after"|"past_week"|"past_month"|"past_year"|"this_week"|"next_week"|"next_month"|"next_year"} type filter type
   * @param {string|undefined} value Filter value
   */
  timestamp(propName, type, value) {
    return {
      timestamp: propName,
      [ propName ]: {
        [ type ]: NotionFilter[ type ](value)
      }
    }
  },

  /**
   * Create object fo filter by property
   * @param {string} propName Property name
   * @param {string} propType Property type
   * @param {string} filterType filter type
   * @param {string|number|undefined} value filter value
   * @return {{property: string, [propType]: {[filterType]: string|number}}}
   */
  _propertyFilter(propName, propType, filterType, value) {
    return {
      property: propName,
      [ propType ]: NotionFilter[ filterType ](value)
    }
  },

  /**
   * Create object fo filter by text property
   * @param {string} propName Property name
   * @param {"title"|"rich_text"|"url"|"email"|"phone_number"} propType Property type
   * @param {"equals"|"does_not_equal"|"contains"|"does_not_contain"|"starts_with"|"ends_with"|"is_empty"|"is_not_empty"} filterType 
   * @param {string|undefined} value Property value
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  text(propName, propType, filterType, value) {
    return this._propertyFilter(propName, propType, filterType, value)
  },

  /**
   * Create object fo filter by number property
   * @param {string} propName Property name
   * @param {"equals"|"does_not_equal"|"greater_than"|"less_than"|"greater_than_or_equal_to"|"less_than_or_equal_to"|"is_empty"|"is_not_empty"} filterType
   * @param {number|undefined} value Property value
   * @return {{property: string, [propType]: {[filterType]: number}}}
   */
  number(propName, filterType, value) {
    return this._propertyFilter(propName, "number", filterType, value)
  },

  /**
   * Create object fo filter by checkbox property
   * @param {string} propName Property name
   * @param {"equals"|"does_not_equal"} filterType
   * @param {Boolean} value Property value
   * @return {{property: string, [propType]: {[filterType]: Boolean}}}
   */
  checkbox(propName, filterType, value) {
    return this._propertyFilter(propName, "checkbox", filterType, value)
  },

  /**
   * Create object fo filter by select property
   * @param {string} propName Property name
   * @param {"equals"|"does_not_equal"|"is_empty"|"is_not_empty"} filterType
   * @param {string|undefined} value Property value
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  select(propName, filterType, value) {
    return this._propertyFilter(propName, "select", filterType, value)
  },

  /**
   * Create object fo filter by multi-select property
   * @param {string} propName Property name
   * @param {"contains"|"does_not_contain"|"is_empty"|"is_not_empty"} filterType
   * @param {string|undefined} value Property value
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  multi_select(propName, filterType, value) {
    return this._propertyFilter(propName, "multi_select", filterType, value)
  },

  /**
   * Create object fo filter by status property
   * @param {string} propName Property name
   * @param {"equals"|"does_not_equal"|"is_empty"|"is_not_empty"} filterType
   * @param {string|undefined} value Property value
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  status(propName, filterType, value) {
    return this._propertyFilter(propName, "status", filterType, value)
  },

  /**
   * Create object fo filter by date property
   * @param {string} propName Property name
   * @param {"date"|"created_time"|"last_edited_time"} propType Property type
   * @param {"equals"|"before"|"after"|"on_or_before"|"is_empty"|"is_not_empty"|"on_or_after"|"past_week"|"past_month"|"past_year"|"this_week"|"next_week"|"next_month"|"next_year"} filterType ISO8601 date string or empty
   * @param {string|undefined} value Property value
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  date(propName, propType, filterType, value) {
    return this._propertyFilter(propName, propType, filterType, value)
  },

  /**
   * Create object fo filter by people property
   * @param {string} propName Property name
   * @param {"people"|"created_by"|"last_edited_by"} propType Property type
   * @param {"contains"|"does_not_contain"|"is_empty"|"is_not_empty"} filterType
   * @param {string|undefined} value UUIDv4 string or empty
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  people(propName, propType, filterType, value) {
    return this._propertyFilter(propName, propType, filterType, value)
  },

  /**
   * Create object fo filter by files property: empty or not
   * @param {string} propName Property name
   * @param {"is_empty"|"is_not_empty"} filterType
   * @return {{property: string, [propType]: {[filterType]: true}}}
   */
  files(propName, filterType) {
    return this._propertyFilter(propName, "files", filterType, true)
  },

  /**
   * Create object fo filter by relation property
   * @param {string} propName Property name
   * @param {"contains"|"does_not_contain"|"is_empty"|"is_not_empty"} filterType 
   * @param {string|undefined} value UUIDv4 of related page or empty
   * @return {{property: string, [propType]: {[filterType]: string}}}
   */
  relation(propName, filterType, value) {
    return this._propertyFilter(propName, "relation", filterType, value)
  },

  /**
   * Create object fo filter by rollup property
   * @param {string} propName Property name
   * @param {"any"|"every"|"none"|"number"|"date"} rollupFilterType Rollup filter type
   * @param {string} filterType Filter type
   * @param {string|number|undefined} value
   * @return {{property: string, rollup: {}}}
   * 
   * Full Documentation: https://developers.notion.com/reference/post-database-query-filter#rollup-filter-condition
   */
  rollup(propName, rollupFilterType, filterType, value) {
    const out = {
      property: propName,
      rollup: {}
    }
    // For a rollup property which evaluates to an number
    if (rollupFilterType === "number") {
      out.rollup.number = {
        [ filterType ]: value
      }
    }
    // For a rollup property which evaluates to an date
    else if (rollupFilterType === "date") {
      out.rollup.date = {
        [ filterType ]: value
      }
    }
    // For a rollup property which evaluates to an array
    else {
      out.rollup[ rollupFilterType ] = {
        rich_text: {
          [ filterType ]: value
        }
      }
    }
    return out
  },

  /**
   * Create object fo filter by formular property
   * @param {string} propName Property name
   * @param {"string"|"checkbox"|"number"|"date"} formulaFilterType Rollup filter type
   * @param {string} filterType Filter type
   * @param {string|number|undefined} value
   * @return {{property: string, formula: {}}}
   * 
   * Full Documentation: https://developers.notion.com/reference/post-database-query-filter#formula-filter-condition
   */
  formula(propName, formulaFilterType, filterType, value) {
    const out = {
      property: propName,
      formula: {}
    }
    if (formulaFilterType === "string") {
      out.formula.string = {
        [ filterType ]: value
      }
    } else if (formulaFilterType === "checkbox") {
      out.formula.checkbox = {
        [ filterType ]: value
      }
    } else if (formulaFilterType === "number") {
      out.formula.number = {
        [ filterType ]: value
      }
    } else if (formulaFilterType === "date") {
      out.formula.date = {
        [ filterType ]: value
      }
    }
    return out
  },

  /**
   * Add filter object to object property
   * @param {{}} obj Filter object
   * @return {{filter: {}}|null}
   */
  getJSON(obj) {
    if (isValidObject(obj)) return { filter: obj }
    return null
  }

}






var NotionFilter = {

  /**
   * @param {string|number|Boolean} value
   */
  equals: function (value) {
    return { equals: value }
  },

  /**
   * @param {string|number|Boolean} value
   */
  does_not_equal: function (value) {
    return { does_not_equal: value }
  },

  /**
   * @param {string} value
   */
  contains(value) {
    return { contains: value }
  },

  /**
   * @param {string} value
   */
  does_not_contain(value) {
    return { does_not_contain: value }
  },

  /**
   * @param {string} value
   */
  starts_with(value) {
    return { starts_with: value }
  },

  /**
   * @param {string} value
   */
  ends_with(value) {
    return { ends_with: value }
  },

  is_empty() {
    return { is_empty: true }
  },

  is_not_empty() {
    return { is_not_empty: true }
  },

  /**
   * @param {number} value
   */
  greater_than(value) {
    return { greater_than: value }
  },

  /**
   * @param {number} value
   */
  less_than(value) {
    return { less_than: value }
  },

  /**
   * @param {number} value
   */
  greater_than_or_equal_to(value) {
    return { greater_than_or_equal_to: value }
  },

  /**
   * @param {number} value
   */
  less_than_or_equal_to(value) {
    return { less_than_or_equal_to: value }
  },

  /**
   * @param {string} value
   */
  before(value) {
    return { before: value }
  },

  /**
   * @param {string} value
   */
  after(value) {
    return { after: value }
  },

  /**
   * @param {string} value
   */
  on_or_before(value) {
    return { on_or_before: value }
  },

  /**
   * @param {string} value
   */
  on_or_after(value) {
    return { on_or_after: value }
  },


  /**
   * Only return pages where the page property value is within the past week.
   */
  past_week() {
    return { past_week: {} }
  },

  /**
   * Only return pages where the page property value is within the past month.
   */
  past_month() {
    return { past_month: {} }
  },

  /**
   * Only return pages where the page property value is within the past year.
   */
  past_year() {
    return { past_year: {} }
  },

  /**
   * The current week starts on the most recent Sunday and ends on the upcoming Saturday.
   */
  this_week() {
    return { this_week: {} }
  },

  /**
   * Only return pages where the page property value is within the next week.
   */
  next_week() {
    return { next_week: {} }
  },

  /**
   * Only return pages where the page property value is within the next month.
   */
  next_month() {
    return { next_month: {} }
  },

  /**
   * Only return pages where the page property value is within the next year.
   */
  next_year() {
    return { next_year: {} }
  },

}




class NotionSortMaker {

  constructor() {
    this.data = {
      sorts: []
    }
  }

  /**
   * Add a property to sort by
   * @param {string} propName 
   * @param {"ascending"|"descending"} direction
   * @return {{property: string, direction: "ascending"|"descending"}} Property sort object
   */
  addProperty(propName, direction = "ascending") {
    if (!propName) return null
    if (!direction) direction = "ascending"
    const p = {
      property: propName,
      direction
    }
    this.data.sorts.push(p)
    return p
  }

  /**
   * Add a "created_time"|"last_edited_time" to sort by
   * @param {"created_time"|"last_edited_time"} propName Property name
   * @param {"ascending"|"descending"} direction
   * @return {{timestamp: string, direction: "ascending"|"descending"}} Property sort object
   */
  addTimestamp(propName, direction = "ascending") {
    if (!propName) return null
    if (!direction) direction = "ascending"
    const p = {
      timestamp: propName,
      direction
    }
    this.data.sorts.push(p)
    return p
  }

  /**
   * Get all properties as JSON
   * @return {{}}
   */
  getJSON() {
    return this.data
  }

}




// --------- //

/**
 * Create Notion page properties
 * @class
 */
class NotionPropertyMaker {

  constructor() {
    this.data = { "properties": {} }
  }

  /**
   * Create external File Object
   * @param {string} url image url
   * @param {"icon"|"cover"} type If provided, will be added to export data when call getJSON. Possible values: "icon", "cover".
   * @return {{type: "external", external: {url: string}}|{}}
   */
  externalFile(url, type) {
    let out = {}
    let p = {}
    if (!isEmptyVariable(url)) {
      p.type = 'external'
      p.external = { url }
    }
    if (type === 'icon' || type === 'cover') {
      out[ type ] = p
      if (!this.data[ type ]) this.data[ type ] = {}
      this.data[ type ] = p
      return out
    }
    return p
  }

  /**
   * Create external File Object
   * @param {string} value emoji
   * @param {"icon"} type If provided, will be added to export data when call getJSON. Possible values: "icon".
   * @return {{type: "emoji", emoji: string}|{}}
   */
  emoji(value, type) {
    let out = {}
    let p = {}
    if (!isEmptyVariable(value)) {
      p.type = 'emoji'
      p.emoji = value
    }
    if (type === 'icon') {
      out[ type ] = p
      if (!this.data[ type ]) this.data[ type ] = {}
      this.data[ type ] = p
      return out
    }
    return p
  }

  /**
   * Add title property
   * @param {string} name Property Name
   * @param {string} value Property Value
   * @return {{}} Notion property as json
   */
  title(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "title": [ {
          "text": {
            "content": String(value)
          }
        } ]
      }
      this.data.properties[ name ] = p
      out[ name ] = p
    }
    return out
  }

  /**
   * Add rich text property
   * @param {string} name Property Name
   * @param {string} value Property Value
   * @return {{}} Notion property as json
   */
  rich_text(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "rich_text": [ {
          "text": {
            "content": String(value)
          }
        } ]
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add select property
   * @param {string} name Property Name
   * @param {string} value Name of the option. If option does not exist, it will be created
   * @param {string} [color=default] Color of the option. Not currently editable. Defaults to "default". Possible values in `NOTION_OPTION_COLORS`
   * @return {{}} Notion property as json
   */
  select(name, value, color) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "select": {
          "name": String(value)
        }
      }
      // if (!isEmptyVariable(color)) p.select.color = color
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add number property
   * @param {string} name Property Name
   * @param {number} value Property Value
   * @return {{}} Notion property as json
   */
  number(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "number": parseFloat(value)
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add status property
   * @param {string} name Property Name
   * @param {string} value Property Value
   * @param {string} [color=default] Color of the option. Not currently editable. Defaults to "default". Possible values in `NOTION_OPTION_COLORS`
   * @return {{}} Notion property as json
   */
  status(name, value, color) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "name": String(value)
      }
      // if (!isEmptyVariable(color)) p.color = color
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add multi select property
   * @param {string} name Property Name
   * @param {string[]} value Array of option's name. If option does not exist, it will be created
   * @param {string} type Type of the option value. Possible values are: "name", "id". Defaults to "name"
   * @return {{}} Notion property as json
   */
  multi_select(name, value, type = 'name') {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name)) {
      let valid = false
      p = {
        "multi_select": []
      }
      if (isValidArray(value)) {
        value.forEach(v => {
          if (!isEmptyVariable(v)) {
            if (type === 'name')
              p[ 'multi_select' ].push({ "name": v })
            else if (type === 'id')
              p[ 'multi_select' ].push({ "id": v })
            valid = true
          }
        })
      } else if (Array.isArray(value) && value.length === 0) {
        valid = true
      }
      if (valid) {
        out[ name ] = p
        this.data.properties[ name ] = p
      }
    }
    return out
  }

  /**
   * Add relation property
   * @param {string} name Property Name
   * @param {string[]} value Array of relation page id.
   * @return {{}} Notion property as json
   */
  relation(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name)) {
      let valid = false
      p = {
        "relation": []
      }
      if (isValidArray(value)) {
        value.forEach(v => {
          if (v != null && v != '') {
            p[ 'relation' ].push({ "id": v },)
            valid = true
          }
        })
      } else if (Array.isArray(value) && value.length === 0) {
        valid = true
      }
      if (valid) {
        out[ name ] = p
        this.data.properties[ name ] = p
      }
    }
    return out
  }

  /**
   * Add checkbox property
   * @param {string} name Property Name
   * @param {boolean} value true or false
   * @return {{}} Notion property as json
   */
  checkbox(name = '', value = false) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "checkbox": value
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add url property
   * @param {string} name Property Name
   * @param {string} value Property Value
   * @return {{}} Notion property as json
   */
  url(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "url": value
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add email property
   * @param {string} name Property Name
   * @param {string} value Property Value
   * @return {{}} Notion property as json
   */
  email(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "email": value
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add phone number property
   * @param {string} name Property Name
   * @param {number} value Property Value
   * @return {{}} Notion property as json
   */
  phone_number(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "phone_number": value
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Add Date property
   * @param {string} name Property name
   * @param {Date|{start: Date, end: Date, time_zone: string}} value Date or object {start: Date, end: Date, time_zone: string}
   * @return {{}} Notion property as json
   */
  date(name, value) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && isValidObject(value)) {
      p = {
        "date": {}
      }
      if (value.start)
        p[ 'date' ][ 'start' ] = Utilities.formatDate(value.start, 'GMT+7', "yyyy-MM-dd'T'HH:mm:ss'Z'")
      if (value.end)
        p[ 'date' ][ 'end' ] = Utilities.formatDate(value.end, 'GMT+7', "yyyy-MM-dd'T'HH:mm:ss'Z'")
      if (value.time_zone)
        p[ 'date' ][ 'time_zone' ] = value.time_zone
      out[ name ] = p
      this.data.properties[ name ] = p
    } else if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "date": {
          start: Utilities.formatDate(value, 'GMT+7', "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          time_zone: 'Asia/Ho_Chi_Minh'
        }
      }
      out[ name ] = p
      this.data.properties[ name ] = p
    }
    return out
  }

  /**
   * Get all properties as JSON
   * @return {{}}
   */
  getJSON() {
    return this.data
  }

}




/**
 * Update Notion Database properties
 * @class
 */
class NotionPropertyUpdater {
  /**
   * @param {Object} options
   * @param {string} options.token Notion private token
   * @param {string} options.databaseId Notion database id
   */
  constructor({ token, databaseId } = {}) {
    this.token = token || ''
    this.databaseId = databaseId || ''
    this.data = { properties: {} }
  }

  /**
   * Apply changes
   */
  apply() {
    if (!this.token || !this.databaseId) return console.error('[NotionPropertyUpdater] Missing token or databaseId')
    if (!isValidObject(this.data.properties)) return console.error('[NotionPropertyUpdater] Missing properties')
    return new NotionAPI({ token: this.token }).updateDatabase(this.databaseId, this.data)
  }

  /**
   * Remove a property
   * @param {string|NotionProperty} id id or name of property to remove
   * @returns {void}
   */
  remove(id) {
    if (id instanceof NotionProperty) id = id.data.id || ''
    if (isEmptyVariable(id)) return
    this.data.properties[ id ] = null
  }

  /**
   * Rename a property
   * @param {string|NotionProperty} id id or name of property to rename
   * @param {string} newName
   * @returns {void}
   */
  rename(id, newName) {
    if (id instanceof NotionProperty) id = id.data.id || ''
    if (isEmptyVariable(id) || isEmptyVariable(newName)) return
    this.data.properties[ id ] = {
      name: newName
    }
  }

  /**
   * Change property type
   * @param {string|NotionProperty} id id or name of property to change type
   * @param {string} newType
   * @returns {void}
   */
  changeType(id, newType) {
    if (id instanceof NotionProperty) id = id.data.id || ''
    if (isEmptyVariable(id) || isEmptyVariable(newType)) return
    this.data.properties[ id ] = {
      [ newType ]: {}
    }
  }

  /**
   * 
   * @param {string} pid id or name of property to update options
   * @param {string} pType property type
   * @param {Object} options
   * @param {string[]} [options.id]
   * @param {string[]} [options.name]
   * @returns {void}
   */
  update_options(pid, pType, { id, name } = {}) {
    if (pid instanceof NotionProperty) pid = pid.data.id || ''
    if (isEmptyVariable(pid) || isEmptyVariable(pType)) return
    let options = []
    if (isValidArray(id)) {
      id.forEach(v => {
        if (!isEmptyVariable(v))
          options.push({ id: v })
      })
    } else if (isValidArray(name)) {
      name.forEach(v => {
        if (!isEmptyVariable(v))
          options.push({ name: v })
      })
    }
    if (!options.length) return
    this.data.properties[ pid ] = {
      [ pType ]: {
        options
      }
    }
  }

  /**
   * Update select options
   * @param {string} pid id or name of property to update options
   * @param {Object} options
   * @param {string[]} [options.id]
   * @param {string[]} [options.name]
   * @returns {void}
   */
  select_options(pid, { id, name } = {}) {
    return this.update_options(pid, 'select', { id, name })
  }

  /**
   * Update multi_select options
   * @param {string} pid id or name of property to update options
   * @param {Object} options
   * @param {string[]} [options.id]
   * @param {string[]} [options.name]
   * @returns {void}
   */
  multi_select_options(pid, { id, name } = {}) {
    return this.update_options(pid, 'multi_select', { id, name })
  }

}




/**
 * @class
 * Notion API requests
 */
class NotionAPI {

  /**
   * 
   * @param {Object} options
   * @param {string} options.token Notion private token
   */
  constructor({ token = '' } = {}) {
    this.token = token || ''
    this.headers = {}
  }

  /**
   * Generate request header
   * @return {null|{}} header
   */
  _generateHeader() {
    if (!this.token) {
      console.error('[NotionAPI] Missing token')
      return null
    }
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Notion-Version': '2022-02-22',
      'Content-Type': 'application/json'
    }
    return this.headers
  }

  /**
   * Get Notion database data by database id
   * @param {string} id Database id
   * @param {{}} payload request payload
   * @param {number} limit Number of records to return
   * @return {{results: {}[]}}
   */
  getDatabaseById(id = '', payload = {}, limit) {
    let out = {}
    const headers = this._generateHeader()
    if (!headers) return out
    if (!id) {
      console.error('Can not get database data without id')
      return out
    }

    const res = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${id}/query`, {
      muteHttpExceptions: true,
      method: 'post',
      headers: headers,
      payload: JSON.stringify(payload)
    })
    if (res.getResponseCode() == '200') {
      out = JSON.parse(res.getContentText())
      if (limit && out.results.length >= limit) {
        out.results = out.results.slice(0, limit)
        return out
      }
      if (out.next_cursor) {
        let np = this.getDatabaseById(id, {
          start_cursor: out.next_cursor
        })
        if (np.results) {
          out.results = [
            ...out.results,
            ...np.results
          ]
        }
      }
    } else {
      console.error({
        url: `https://api.notion.com/v1/databases/${id}/query`,
        method: 'post',
        token: this.token,
        headers: this.headers,
        message: res.getContentText()
      })
    }

    return out
  }

  /**
   * Create a Notion page
   * @param {{}} payload request payload
   * @param {string} databaseParent Database parent id
   * @return {{}}
   */
  createPage(payload = {}, databaseParent = '') {
    let output = {}
    const headers = this._generateHeader()
    if (!headers) return output
    if (!payload) {
      console.error('Can not create page without payload')
      return output
    }

    if (databaseParent) {
      payload = {
        "parent": { "database_id": databaseParent },
        ...payload
      }
    }
    const res = UrlFetchApp.fetch(`https://api.notion.com/v1/pages`, {
      muteHttpExceptions: true,
      method: 'post',
      headers: headers,
      payload: JSON.stringify(payload)
    })
    if (res.getResponseCode() == 200) {
      return JSON.parse(res.getContentText())
    } else {
      console.error({
        url: `https://api.notion.com/v1/pages`,
        method: 'post',
        token: this.token,
        headers: this.headers,
        message: res.getContentText()
      })
    }

    return output
  }

  /**
   * Update a Notion page
   * @param {string} pageId Page id
   * @param {{properties: {}, archived: Boolean, icon: {}, cover: {}}} payload request payload
   * @return {{}}
   */
  updatePage(pageId = '', payload = {}) {
    let output = {}
    const headers = this._generateHeader()
    if (!headers) return output
    if (!pageId) {
      console.error('Can not update page without page id')
      return output
    }

    const res = UrlFetchApp.fetch('https://api.notion.com/v1/pages/' + pageId, {
      muteHttpExceptions: true,
      method: 'patch',
      headers: this.headers || {},
      payload: JSON.stringify(payload)
    })
    if (res.getResponseCode() == '200') {
      return JSON.parse(res.getContentText())
    } else {
      console.error({
        url: 'https://api.notion.com/v1/pages/' + pageId,
        method: 'patch',
        token: this.token,
        headers: this.headers,
        message: res.getContentText()
      })
    }

    return output
  }

  updateDatabase(databaseId = '', payload = {}) {
    let output = {}
    const headers = this._generateHeader()
    if (!headers) return output
    if (!databaseId) {
      console.error('Can not update database without database id')
      return output
    }

    const res = UrlFetchApp.fetch('https://api.notion.com/v1/databases/' + databaseId, {
      muteHttpExceptions: true,
      method: 'patch',
      headers: this.headers || {},
      payload: JSON.stringify(payload)
    })
    if (res.getResponseCode() == '200') {
      return JSON.parse(res.getContentText())
    } else {
      console.error({
        url: 'https://api.notion.com/v1/databases/' + databaseId,
        method: 'patch',
        token: this.token,
        headers: this.headers,
        message: res.getContentText()
      })
    }

    return output
  }

  /**
   * Get Notion page data by page id
   * @param {string} pageId Page id
   * @return {{}}
   */
  getPageById(pageId = '') {
    if (!pageId) {
      console.error('Can not get page data without page id')
      return {}
    }
    return this.updatePage(pageId)
  }

  /**
   * Delete a Notion page by page id
   * @param {string} pageId Page id
   * @return {{}}
   */
  deletePage(pageId = '') {
    if (!pageId) {
      console.error('Can not delete page without page id')
      return {}
    }
    return this.updatePage(pageId, { "archived": true })
  }
}



// --------- //

class NotionDatabase {

  /**
   * @param {Object} options
   * @param {string} options.token Notion private token
   * @param {{}} [options.data] data got from notion
   * @param {string} [options.databaseId] UUIDv4 string
   */
  constructor({ data = {}, databaseId = '', token = '' } = {}) {
    this.token = token || ''
    if (data && Object.keys(data).length) {
      this.data = data
    } else {
      this.data = {}
    }
    this.databaseId = databaseId || ''
  }

  /**
   * Get all pages data in database
   * @param {string} id database id
   * @param {{filter: {}, sorts: []}} query query object. Can create with NotionFilterMaker and NotionSortMaker
   * @param {number} limit Number of records to return
   * @return {{}} Response object from Notion API
   */
  getByDatabaseId(id = '', query = {}, limit) {
    return new NotionAPI({ token: this.token }).getDatabaseById(id, query, limit)
  }

  /**
   * Load data from Notion database
   * @param {{filter: {}, sorts: []}} query query object. Can create with NotionFilterMaker and NotionSortMaker
   * @param {number} limit Number of records to return
   * @return {NotionPage[]}
   */
  load(query = {}, limit) {
    let results = [ new NotionPage() ] // for auto-complete
    let data = this.data
    if (!data || !data.results || !data.results.length) {
      if (this.databaseId) {
        data = this.getByDatabaseId(this.databaseId, query, limit)
      } else {
        return []
      }
    }
    results = []
    data.results.forEach(page => {
      results.push(new NotionPage({ page: page, token: this.token }))
    })
    return results
  }

}

class NotionPage {

  /**
   * 
   * @param {Object} options
   * @param {string} [options.token] Notion private token
   * @param {{}} [options.page] data got from Notion API
   * @param {string} [options.pageId] UUIDv4 string
   */
  constructor({ page = {}, pageId = '', token = '' } = {}) {
    this.token = token || ''
    if (page && Object.keys(page).length)
      this.page = page
    else if (pageId)
      this.page = new NotionAPI({ token: this.token }).getPageById(pageId)
    if (this.page && this.page.object == 'page') {
      this.validPage = true
    }
  }

  /**
   * Return UUIDv4 string page id
   * @returns {string|""}
   */
  getId() {
    if (this.validPage) {
      return this.page.id
    }
    return ''
  }

  /**
   * Return page url
   * @returns {string|""}
   */
  getUrl() {
    if (this.validPage) {
      return this.page.url
    }
    return ''
  }

  /**
   * Return first parent database id (UUIDv4 string)
   * @returns {{database: string}|{}}
   */
  getParent() {
    let result = {}
    if (this.validPage && this.page.parent) {
      let parent = this.page.parent
      switch (parent.type) {
        case 'database_id':
          result[ 'database' ] = parent.database_id
          break
      }
    }
    return result
  }

  /**
   * Return created time
   * @returns {Date|null}
   */
  getCreatedTime() {
    if (this.validPage) {
      return new Date(this.page.created_time)
    }
    return null
  }

  /**
   * Return last edited time
   * @returns {Date|null}
   */
  getLastEditedTime() {
    if (this.validPage) {
      return new Date(this.page.last_edited_time)
    }
    return null
  }

  /**
   * Return user UUIDv4 string
   * @returns {string|""}
   */
  getCreator() {
    if (this.validPage) {
      if (this.page.created_by) {
        return this.page.created_by.id || ""
      }
    }
    return ""
  }

  /**
   * Return user UUIDv4 string
   * @returns {string|""}
   */
  getLastEdited() {
    if (this.validPage) {
      if (this.page.last_edited_by) {
        return this.page.last_edited_by.id || ""
      }
    }
    return ""
  }

  /**
   * Return cover url
   * @return {string|null} url of cover image
   */
  getCover() {
    let result = null
    if (this.validPage && this.page.cover) {
      const cover = this.page.cover
      result = cover[ cover.type ][ 'url' ] || null
    }
    return result
  }

  /**
   * Get page icon
   * @return {string|null} url of icon image or emoji
   */
  getIcon() {
    let result = null
    if (this.validPage && this.page.icon) {
      const icon = this.page.icon
      const type = icon.type
      if (type == NOTION_FILE_TYPE.emoji) result = icon.emoji || null
      else if (type == NOTION_FILE_TYPE.external) result = icon.external.url || null
    }
    return result
  }

  /**
   * Is page archived
   * @returns {Boolean}
   */
  isArchived() {
    if (this.validPage) {
      return this.page.archived
    }
    return false
  }

  /**
   * Get page properties
   * @returns {NotionProperty[]|[]}
   */
  getProperties() {
    let results = []
    if (this.validPage) {
      for (const propName in this.page.properties) {
        const prop = {
          name: propName,
          ...this.page.properties[ propName ]
        }
        results.push(new NotionProperty(prop, { pageId: this.getId(), token: this.token }))
      }
    }
    return results
  }

  /**
   * Get a property by name
   * @param {string} propertyName 
   * @returns {NotionProperty|null}
   */
  getPropertyByName(propertyName = '') {
    let result = null
    if (this.validPage && propertyName) {
      this.getProperties().forEach(prop => {
        if (propertyName == prop.name) {
          result = prop
        }
      })
    }
    return result
  }

  /**
   * Get all properties as JSON
   * @returns {{}} {property_name: property_value}
   */
  getPropertiesJSON() {
    if (this.validPage) {
      let result = {}
      this.getProperties().forEach(prop => {
        result[ prop.name ] = prop.getValue()
      })
      return result
    }
    return {}
  }

  /**
   * Get all properties as JSON. All value is string
   * @returns {{}} {property_name: property_string_value}
   */
  getPropertiesJSONText() {
    if (this.validPage) {
      let result = {}
      this.getProperties().forEach(prop => {
        result[ prop.name ] = prop.getValueText()
      })
      return result
    }
    return {}
  }

  /**
   * Update page
   * @param {{archived: Boolean, icon: {}, cover: {}, properties: {}}} payload 
   * @param {string} [token] Notion private token. If not provided, use token in constructor
   * @returns {{}|null} Request response. Null if token is not provided
   */
  updatePage(payload = {}, token) {
    let _token = ''
    if (this.token) _token = this.token
    if (token) _token = token
    if (_token) {
      if (!this.token) this.token = _token
    } else {
      console.error('Can not update page. Missing token')
      return null
    }
    return new NotionAPI({ token: _token }).updatePage(this.getId(), payload)
  }

  /**
   * Delete page
   * @param {string} [token] Notion private token. If not provided, use token in constructor
   * @returns {{}|null} Request response. Null if token is not provided
   */
  deletePage(token) {
    let _token = ''
    if (this.token) _token = this.token
    if (token) _token = token
    if (_token) {
      if (!this.token) this.token = _token
    } else {
      console.error('Can not update page. Missing token')
      return null
    }
    return new NotionAPI({ token: _token }).deletePage(this.getId())
  }

}

class NotionProperty {

  constructor(data = {}, { pageId = '', token = '' } = {}) {
    this.token = token || ''
    if (pageId)
      this.pageId = pageId
    if (data && Object.keys(data).length) {
      this.data = data
      this.validData = true
      this.type = this.data.type
      this.name = this.data.name
    }
  }
  getFormulaValue(data = {}) {
    if (data && Object.keys(data).length && data.type) {
      switch (data.type) {
        case 'string': case 'number':
          return data[ data.type ]
      }
    }
    return null
  }
  getRollupValue(data = {}) {
    var results = []
    if (data && Object.keys(data).length && data.type) {
      switch (data.type) {
        case 'array':
          if (data.array.length == 1)
            return this._getValue(data.array[ 0 ])
          else if (data.array.length > 1) {
            data.array.forEach(item => {
              results.push(this._getValue(item))
            })
          }
      }
    }
    if (results.length)
      return results
    return null
  }
  getRichtextValue(data = []) {
    if (data.length) {
      var out = ''
      for (const i in data) {
        if (data[ i ][ data[ i ][ 'type' ] ] && data[ i ][ data[ i ][ 'type' ] ][ 'content' ])
          out += data[ i ][ data[ i ][ 'type' ] ][ 'content' ]
      }
      return out
    }
    return null
  }
  getMultiSelectValue(data = []) {
    if (data?.length) {
      return data.map(d => d.name)
    }
    return null
  }
  getRelationValue(data = []) {
    var results = []
    if (data && data.length) {
      results = data.map(v => v.id)
    }
    return results
  }
  getFilesValue(data = []) {
    var results = []
    if (data && data.length) {
      results = data.map(files => files.file.url)
    }
    return results
  }
  getStartDate() {
    return null
  }
  getEndDate() {
    return null
  }
  _getValue(data) {
    if (data && Object.keys(data).length && data.type) {
      switch (data.type) {
        case 'string': case 'url': case 'number': case 'checkbox':
          return data[ data.type ]
        case 'rich_text':
          return this.getRichtextValue(data.rich_text)
        case 'date':
          if (data.date && data.date.start)
            return new Date(data.date.start)
        case 'created_time':
          return new Date(data[ data.type ])
        case 'formula':
          return this.getFormulaValue(data.formula)
        case 'rollup':
          return this.getRollupValue(data.rollup)
        case 'select':
          return data.select?.name
        case 'multi_select':
          return this.getMultiSelectValue(data.multi_select)
        case 'title':
          if (data.title.length == 1)
            return data.title[ 0 ][ 'plain_text' ]
        case 'relation':
          return this.getRelationValue(data.relation)
        case 'files':
          return this.getFilesValue(data.files)
      }
    }
    return null
  }
  getValue() {
    if (this.validData)
      return this._getValue(this.data)
    return null
  }
  getValueText() {
    if (this.validData) {
      var val = this.getValue()
      if (val) {
        if (typeof val == 'object') {
          if (Array.isArray(val))
            return val.join(', ')
          else if (val.getTime())
            return val.toLocaleString('vi')
        } else {
          return val
        }
      }
    }
    return ''
  }
  getType() {
    if (this.validData)
      return this.data.type
    return null
  }
  getName() {
    if (this.validData)
      return this.data.name
    return null
  }
  update(value) {
    if (this.validData && value != undefined) {
      var updatePayload = new NotionPropertyMaker()
      updatePayload[ this.getType() ](this.getName(), value)
      return new NotionAPI({ token: this.token }).updatePage(this.pageId, updatePayload.getJSON())
    }
    return null
  }
}