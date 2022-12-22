function saveToDrive({
  folder = null,
  folderId = '',
  blob = null,
  text = '',
  fileName = '',
  fileExtension = '.txt'
} = {}) {
  let file = null
  let isFolderValid = false
  let validFile = ''
  const output = { ok: false, message: '', url: '', file: null }

  // check fileName
  const timeText = Utilities.formatDate(new Date(), 'GMT+7', 'ddMMyyyyHHmmss')
  if (fileName) {
    fileName = fileName.replace(/TIME/g, timeText)
  }

  // check default folder
  if (folderId === 'CACHE' || folderId === 'DEFAULT') {
    folderId = '10AeDHITThqcOowgHpEAXeWtuFwo3I4DZ'
  }

  // Check folder
  if (!folder) {
    if (!folderId) {
      output.message = 'invalid folder/folderId'
      return output
    }
    folder = DriveApp.getFolderById(folderId)
  }
  try {
    const folderURL = folder.getUrl()
    if (folderURL.includes('/folders/')) isFolderValid = true
  } catch (e) { }
  if (!isFolderValid) {
    output.message = 'invalid folder/folderId'
    return output
  }

  // check file
  if (blob) {
    try {
      const blobType = blob.getContentType()
      if (blobType) validFile = 'blob'
    } catch (e) { }
  } else {
    if (!text) {
      output.message = 'can not save empty content'
      return output
    }
    if (typeof text !== 'string') {
      output.message = 'can only save string type'
      return output
    }
    validFile = 'text'
  }

  // create file
  if (validFile == 'blob') {
    file = folder.createFile(blob)
    if (fileName) {
      const currName = file.getName()
      const extIndex = currName.lastIndexOf('.')
      if (extIndex) fileName += currName.substring(extIndex)
      file.setName(fileName)
    }
  } else if (validFile === 'text') {
    if (!fileName) fileName = timeText
    if (fileExtension) {
      if (!fileExtension.includes('.')) fileExtension = '.' + fileExtension
      if (!fileName.endsWith(fileExtension)) fileName += fileExtension
    }
    file = folder.createFile(fileName, text)
  }

  // return
  if (file) {
    output.ok = true
    output.message = ''
    output.url = file.getUrl()
    output.file = file
  }

  return output

}



/**
 * Create a Google Sheet from Blob if it is Excel
 * 
 * @param {Blob} blob
 * @param {string} parent Folder id to store
 * @param {Object} [options]
 * @param {string|(name: string)=>string} [options.name] Sheet name
 * @return {null|SpreadsheetApp.Spreadsheet}
 */
function blobToSheet(blob, parent, { name = '' } = {}) {
  let sheet = null
  let sheetName = ''
  if (!blob) return null
  if (!parent) return null
  if (name) {
    if (typeof name === 'string') sheetName = name
    if (typeof name === 'function') sheetName = name(blob.getName())
  }
  try {
    if (!blob.getContentType().includes('spreadsheet')) return null
    const sheetFile = Drive.Files.insert({
      title: sheetName || blob.getName(),
      parents: [ { id: parent } ],
      mimeType: MimeType.GOOGLE_SHEETS
    }, blob)
    sheet = SpreadsheetApp.openById(sheetFile.getId())
  } catch (e) { }
  return sheet
}


/**
 * Convert Excel to Google Sheet
 * 
 * @param {string} fileId Excel file id on Drive
 * @return {null|string} Google Sheet id if success or null
 */
function excelToSheet(fileId) {
  let file = null
  if (!fileId) return null
  try {
    file = DriveApp.getFileById(fileId)
  } catch (e) { }
  if (!file) return null
  if (!file.getMimeType().includes('spreadsheet')) return null

  const sheet = Drive.Files.insert({
    title: file.getName() + '_convert',
    parents: [ { id: file.getParents().next().getId() } ],
    mimeType: MimeType.GOOGLE_SHEETS
  }, file.getBlob())
  return sheet.id
}


/**
 * Read Sheet from Excel
 * 
 * @param {string} Excel file id on Drive
 * @return {SpreadsheetApp.Spreadsheet}
 */
function readExcel(fileId) {
  let sheet = null
  if (!fileId) return null
  try {
    const sheetId = excelToSheet(fileId)
    sheet = SpreadsheetApp.openById(sheetId)
  } catch (e) { }
  return sheet
}