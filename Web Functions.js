/**'
 * Import html from a file. `<?!= importHtml('fileName'); ?>`
 * @param {string} fileName Name of the file
 * @return {string} The html
 */
function importHtml(fileName = '') {
  if(!fileName) return '';
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}