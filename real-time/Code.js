// Google Apps Script code
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
}

function getSheetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0]; // First sheet
  const data = sheet.getDataRange().getValues();
  return data;
}
