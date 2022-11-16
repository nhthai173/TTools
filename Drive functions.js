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