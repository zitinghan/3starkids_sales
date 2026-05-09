function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Return value Date : MM-DD-YYYY
function getDateFormat(newDate = new Date()) {
  if (!(newDate instanceof Date)) {
    newDate = new Date(newDate);
  }
  return `${
    newDate.getMonth() + 1
  }-${newDate.getDate()}-${newDate.getFullYear()}`;
}

function getSpreadSheetDetails() {
  let ss = SpreadsheetApp.getActive().getName().split('_');
  const projectDetails = {
    projectNo: ss[0],
    projectLocation: ss[1],
    projectDate: ss[2],
  };
  return projectDetails;
}

function ensureInvoiceColumn(ws) {
  const headerCell = ws.getRange(1, 1);
  if (headerCell.getValue() !== 'Invoice Number') {
    ws.insertColumnBefore(1);
    ws.getRange(1, 1).setValue('Invoice Number');
  }
}

function buildInvoiceNumber(rowNumber, dateObj) {
  const { projectNo } = getSpreadSheetDetails();
  const invoiceDate = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
  const day = String(invoiceDate.getDate()).padStart(2, '0');
  const year = String(invoiceDate.getFullYear()).slice(-2);
  const datePart = `${month}${day}${year}`;
  // row 2 is first data row -> invoice sequence starts at 1
  const invoiceSequence = Math.max(1, rowNumber - 1);
  const rowPart = String(invoiceSequence).padStart(4, '0');
  return `${projectNo}${datePart}${rowPart}`;
}

function processForm(formObject) {
  const todayObj = new Date();
  const today = getDateFormat(todayObj);
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var ws = activeSpreadsheet.getSheetByName(today);

  // create new tab if null
  if (ws === null) {
    ws = activeSpreadsheet.insertSheet();
    ws.setName(today);

    ws.appendRow([
      'Invoice Number',
      'Day Tic',
      'Combo Tic',
      'Socks',
      'Honey Water',
      'Anti Slip Socks',
      'Hand Balloon',
      'Custom Doll',
      'M.Water',
      'K.Car',
      'Workshop',
      'B.House',
      'Payment Type',
      'Amount',
      'Time',
      // "Phone Number",
      'Description',
    ]);
  } else {
    ensureInvoiceColumn(ws);
  }

  const nextRow = ws.getLastRow() + 1;
  const invoiceNumber = buildInvoiceNumber(nextRow, todayObj);

  // append new data
  ws.appendRow([
    invoiceNumber,
    formObject.ticket,
    formObject.halfHourTicket,
    formObject.socks,
    formObject.honeyWater,
    formObject.antiSlipSocks,
    formObject.handBalloon,
    formObject.customDollAmount,
    formObject.minaralWater,
    formObject.electricalCar,
    formObject.workshopAmount,
    formObject.bubbleHouse,
    formObject.paymentType,
    formObject.total,
    formObject.time,
    // formObject.phoneNumber,
    formObject.desc,
  ]);

  const rowNumber = ws.getLastRow();
  calcTodayCurrentSales();
  return {
    invoiceNumber,
    date: today,
    rowNumber,
    projectDetails: getSpreadSheetDetails(),
  };
}

function updateSummary(headcountPrice, halfHourHeadcountPrice, summaryDate) {
  const formObject = {};
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const summaryWs = activeSpreadsheet.getSheetByName('Summary');
  const lastRow = summaryWs.getLastRow();
  const lastDateCell = summaryWs.getRange(lastRow, 1);
  const date = getDateFormat(summaryDate);

  formObject.totalSales = getTodayTotalInColumn('N', summaryDate);
  formObject.tng = findTotalTngCash(date).tng;
  formObject.actualCash = findTotalTngCash(date).cash;
  formObject.cc = findTotalTngCash(date).cc;
  formObject.headcount = getTodayTotalInColumn('B', summaryDate);
  formObject.headcountEarn =
    getTodayTotalInColumn('B', summaryDate) * headcountPrice;
  formObject.hourlyheadcount = getTodayTotalInColumn('C', summaryDate);
  formObject.hourlyheadcountEarn =
    getTodayTotalInColumn('C', summaryDate) * halfHourHeadcountPrice;
  formObject.socks = getTodayTotalInColumn('D', summaryDate);
  formObject.honeyWater = getTodayTotalInColumn('E', summaryDate);
  formObject.antiSlipSocks = getTodayTotalInColumn('F', summaryDate);
  formObject.handBalloon = getTodayTotalInColumn('G', summaryDate);
  formObject.customDoll = getTodayTotalInColumn('H', summaryDate);
  formObject.minaralWater = getTodayTotalInColumn('I', summaryDate);
  formObject.electricalCar = getTodayTotalInColumn('J', summaryDate);
  formObject.workshopAmount = getTodayTotalInColumn('K', summaryDate);
  formObject.bubbleHouse = getTodayTotalInColumn('L', summaryDate);

  if (
    lastDateCell.getValue() &&
    getDateFormat(lastDateCell.getValue()) === getDateFormat(summaryDate)
  ) {
    summaryWs.deleteRow(summaryWs.getLastRow());
  }

  summaryWs.appendRow([
    getDateFormat(summaryDate),
    formObject.totalSales,
    0,
    0,
    0,
    formObject.tng,
    formObject.cc,
    formObject.actualCash,
    formObject.headcount,
    formObject.headcountEarn,
    formObject.hourlyheadcount,
    formObject.hourlyheadcountEarn,
    formObject.socks,
    formObject.honeyWater,
    formObject.antiSlipSocks,
    formObject.handBalloon,
    formObject.customDoll,
    formObject.minaralWater,
    formObject.electricalCar,
    formObject.workshopAmount,
    formObject.bubbleHouse,
  ]);

  return { date: getDateFormat(summaryDate), ...formObject };
}

function getTodayTotalInColumn(column, summaryDate) {
  const date = getDateFormat(summaryDate);
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const todayWs = activeSpreadsheet.getSheetByName(date);
  const range = todayWs.getRange(`${column}:${column}`);
  const data = range.getValues().flat().filter(Number); // skip empty cells and non-digits
  const sum = data.reduce((a, b) => a + b, 0);
  return sum;
}

function findTotalTngCash(summaryDate) {
  const date = getDateFormat(summaryDate);
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const todayWs = activeSpreadsheet.getSheetByName(date);
  const data = todayWs.getDataRange().getValues();
  const dayDataPaymentTypeColLocation = 12; // update if columns change
  const dayDataAmountColLocation = 13; // update if columns change

  const totalTng = data
    .filter((data) => {
      return (
        data[dayDataPaymentTypeColLocation] === 'TNG' &&
        data[dayDataPaymentTypeColLocation] !== 'Payment Type'
      );
    })
    .reduce((previous, currentAry) => {
      return previous + currentAry[dayDataAmountColLocation];
    }, 0);

  const totalCash = data
    .filter((data) => {
      return (
        data[dayDataPaymentTypeColLocation] === 'Cash' &&
        data[dayDataPaymentTypeColLocation] !== 'Payment Type'
      );
    })
    .reduce((previous, currentAry) => {
      return previous + currentAry[dayDataAmountColLocation];
    }, 0);
  const totalCc = data
    .filter((data) => {
      return (
        data[dayDataPaymentTypeColLocation] === 'Credit Card' &&
        data[dayDataPaymentTypeColLocation] !== 'Payment Type'
      );
    })
    .reduce((previous, currentAry) => {
      return previous + currentAry[dayDataAmountColLocation];
    }, 0);
  return { cash: totalCash, cc: totalCc, tng: totalTng };
}

function isOnline() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const summaryWs = activeSpreadsheet.getSheetByName('Summary');
  const lastRow = summaryWs.getLastRow();
  return lastRow ? true : false;
}

function calcTodayCurrentSales() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const todaySalesWs = activeSpreadsheet.getSheetByName('today_sales');
  const today = new Date();
  const totalSales = getTodayTotalInColumn('N', today);
  const tng = findTotalTngCash(today).tng;
  const actualCash = findTotalTngCash(today).cash;
  const cc = findTotalTngCash(today).cc;
  const headcount =
    getTodayTotalInColumn('B', today) + getTodayTotalInColumn('C', today);
  const socks =
    getTodayTotalInColumn('D', today) + getTodayTotalInColumn('F', today);
  const honeyWater = getTodayTotalInColumn('E', today);
  const customDoll = getTodayTotalInColumn('H', today);
  const minaralWater = getTodayTotalInColumn('I', today);
  const electricalCar = getTodayTotalInColumn('J', today);
  const workshopAmount = getTodayTotalInColumn('K', today);
  const bubblehouseAmount = getTodayTotalInColumn('L', today);

  todaySalesWs.getRange('B2').setValue(totalSales);
  todaySalesWs.getRange('B3').setValue(actualCash);
  todaySalesWs.getRange('B4').setValue(tng);
  todaySalesWs.getRange('B5').setValue(cc);
  todaySalesWs.getRange('B6').setValue(headcount);
  todaySalesWs.getRange('B7').setValue(socks);
  todaySalesWs.getRange('B8').setValue(honeyWater);
  todaySalesWs.getRange('B9').setValue(minaralWater);
  todaySalesWs.getRange('B10').setValue(electricalCar);
  todaySalesWs.getRange('B11').setValue(workshopAmount);
  todaySalesWs.getRange('B12').setValue(bubblehouseAmount);
  todaySalesWs.getRange('B13').setValue(customDoll);
}
