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
    NotionDatabase: function ({ data = {}, databaseId = '', token = '' } = {}) {
      return new NotionDatabase({ data, databaseId, token })
    },
    NotionPage: function ({ page = {}, pageId = '', token = '' } = {}) {
      return new NotionPage({ page, pageId, token })
    },
    NotionProperty: function (data = {}, { pageId = '', token = '' } = {}) {
      return new NotionProperty(data, { pageId, token })
    }
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
   * @return {{results: {}[]}}
   */
  getDatabaseById(id = '', payload = {}) {
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
   * @param {{}} payload request payload
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

/**
 * Create Notion page properties
 * @class
 */
class NotionPropertyMaker {
  
  constructor() {
    this.data = { "properties": {} }
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
   * @param {string} [color=default] Color of the option. Defaults to "default". Possible values in `NOTION_OPTION_COLORS`
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
      if (!isEmptyVariable(color)) p.select.color = color
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
   * @param {string} [color=default] Color of the option. Defaults to "default". Possible values in `NOTION_OPTION_COLORS`
   * @return {{}} Notion property as json
   */
  status(name, value, color) {
    let p = {}
    let out = {}
    if (!isEmptyVariable(name) && value != undefined) {
      p = {
        "name": String(value)
      }
      if (!isEmptyVariable(color)) p.color = color
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


// --------- //

class NotionDatabase {

  /**
   * 
   * @param data object - data got from notion
   * @param databaseId string - database id
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
   * 
   * @param id string - database id
   * @return object - data got from notion
   */
  getByDatabaseId(id = '') {
    return new NotionAPI({ token: this.token }).getDatabaseById(id)
  }

  /**
   * Load data from notion database
   * @returns array of `NotionPage`
   */
  load() {
    // var results = []
    var results = [ new NotionPage() ] // for auto-complete
    var data = {}
    if (this.data && this.data.results) {
      data = this.data.results
    } else if (this.databaseId) {
      data = this.getByDatabaseId(this.databaseId)
    }
    if (data && data.results && data.results.length) {
      results = []
      data.results.forEach(page => {
        results.push(new NotionPage({ page: page, token: this.token }))
      })
    }
    return results
  }
}

class NotionPage {
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
  getId() {
    if (this.validPage) {
      return this.page.id
    }
    return ''
  }
  getUrl() {
    if (this.validPage) {
      return this.page.url
    }
    return ''
  }
  getParent() {
    var result = {}
    if (this.validPage && this.page.parent) {
      var parent = this.page.parent
      switch (parent.type) {
        case 'database_id':
          result[ 'database' ] = parent.database_id
          break
      }
    }
    return result
  }
  getCreatedTime() {
    if (this.validPage) {
      return new Date(this.page.created_time)
    }
    return null
  }
  getLastEditedTime() {
    if (this.validPage) {
      return new Date(this.page.last_edited_time)
    }
    return null
  }
  getCreator() {
    /*
      "created_by": {
        "object": "user",
        "id": "3e1fe115-5a9f-454e-b8b2-594e974a9022"
      }
    */
    return null
  }
  getLastEdited() {
    /*
      "last_edited_by": {
        "object": "user",
        "id": "3e1fe115-5a9f-454e-b8b2-594e974a9022"
      }
    */
    return null
  }
  getCover() {
    var result = null
    if (this.validPage && this.page.cover) {
      var cover = this.page.cover
      result = cover[ cover.type ][ 'url' ] || null
    }
    return result
  }
  getIcon() {
    return null
  }
  isArchived() {
    if (this.validPage) {
      return this.page.archived
    }
    return null
  }
  getProperties() {
    var results = []
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
  getPropertyByName(propertyName = '') {
    var result = new NotionProperty(null)
    if (this.validPage && propertyName) {
      this.getProperties().forEach(prop => {
        if (propertyName == prop.name) {
          result = prop
        }
      })
    }
    return result
  }
  getPropertiesJSON() {
    if (this.validPage) {
      var result = {}
      this.getProperties().forEach(prop => {
        result[ prop.name ] = prop.getValue()
      })
      return result
    }
    return {}
  }
  getPropertiesJSONText() {
    if (this.validPage) {
      var result = {}
      this.getProperties().forEach(prop => {
        result[ prop.name ] = prop.getValueText()
      })
      return result
    }
    return {}
  }
  updatePage(payload = {}) {
    return new NotionAPI({ token: this.token }).updatePage(this.getId(), payload)
  }
  deletePage() {
    return new NotionAPI({ token: this.token }).deletePage(this.getId())
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
    if (data.length) {
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
        case 'string': case 'number': case 'checkbox':
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
          return data.select.name
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