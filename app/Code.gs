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

function processForm(formObject) {
  const today = getDateFormat();
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var ws = activeSpreadsheet.getSheetByName(today);

  // create new tab if null
  if (ws === null) {
    ws = activeSpreadsheet.insertSheet();
    ws.setName(today);

    ws.appendRow([
      'Day Tic',
      'Combo Tic',
      'Socks',
      'Bell Balloon',
      'Socks 6',
      'Hand Balloon',
      'Small Balloon',
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
  }

  // append new data
  ws.appendRow([
    formObject.ticket,
    formObject.halfHourTicket,
    formObject.socks,
    formObject.bellBalloon,
    formObject.bigBalloon,
    formObject.handBalloon,
    formObject.smallBalloon,
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

  calcTodayCurrentSales();
}

function updateSummary(headcountPrice, halfHourHeadcountPrice, summaryDate) {
  const formObject = {};
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const summaryWs = activeSpreadsheet.getSheetByName('Summary');
  const lastRow = summaryWs.getLastRow();
  const lastDateCell = summaryWs.getRange(lastRow, 1);
  const date = getDateFormat(summaryDate);

  formObject.totalSales = getTodayTotalInColumn('M', summaryDate);
  formObject.tng = findTotalTngCash(date).tng;
  formObject.actualCash = findTotalTngCash(date).cash;
  formObject.cc = findTotalTngCash(date).cc;
  formObject.headcount = getTodayTotalInColumn('A', summaryDate);
  formObject.headcountEarn =
    getTodayTotalInColumn('A', summaryDate) * headcountPrice;
  formObject.hourlyheadcount = getTodayTotalInColumn('B');
  formObject.hourlyheadcountEarn =
    getTodayTotalInColumn('B') * halfHourHeadcountPrice;
  formObject.socks = getTodayTotalInColumn('C', summaryDate);
  formObject.bellBalloon = getTodayTotalInColumn('D', summaryDate);
  formObject.bigBalloon = getTodayTotalInColumn('E', summaryDate);
  formObject.handBalloon = getTodayTotalInColumn('F', summaryDate);
  formObject.smallBalloon = getTodayTotalInColumn('G', summaryDate);
  formObject.minaralWater = getTodayTotalInColumn('H', summaryDate);
  formObject.electricalCar = getTodayTotalInColumn('I', summaryDate);
  formObject.workshopAmount = getTodayTotalInColumn('J', summaryDate);
  formObject.bubbleHouse = getTodayTotalInColumn('K', summaryDate);

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
    formObject.bellBalloon,
    formObject.bigBalloon,
    formObject.handBalloon,
    formObject.smallBalloon,
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
  const dayDataPaymentTypeColLocation = 11; //update if add new column
  const dayDataAmountColLocation = 12; //update if add new column

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
  const totalSales = getTodayTotalInColumn('M', today);
  const tng = findTotalTngCash(today).tng;
  const actualCash = findTotalTngCash(today).cash;
  const cc = findTotalTngCash(today).cc;
  const headcount =
    getTodayTotalInColumn('A', today) + getTodayTotalInColumn('B', today);
  const socks =
    getTodayTotalInColumn('C', today) + getTodayTotalInColumn('E', today);
  const bellBalloon = getTodayTotalInColumn('D', today);
  // const bigBalloon = getTodayTotalInColumn('E', today);
  // const handBalloon = getTodayTotalInColumn('E',today);
  // const smallBalloon = getTodayTotalInColumn('F', today);
  const minaralWater = getTodayTotalInColumn('H', today);
  const electricalCar = getTodayTotalInColumn('I', today);
  const workshopAmount = getTodayTotalInColumn('J', today);
  const bubblehouseAmount = getTodayTotalInColumn('K', today);

  todaySalesWs.getRange('B2').setValue(totalSales);
  todaySalesWs.getRange('B3').setValue(actualCash);
  todaySalesWs.getRange('B4').setValue(tng);
  todaySalesWs.getRange('B5').setValue(cc);
  todaySalesWs.getRange('B6').setValue(headcount);
  todaySalesWs.getRange('B7').setValue(socks);
  todaySalesWs.getRange('B8').setValue(bellBalloon);
  // todaySalesWs.getRange("B8").setValue(handBalloon);
  // todaySalesWs.getRange("B8").setValue(bigBalloon);
  // todaySalesWs.getRange("B10").setValue(smallBalloon);
  todaySalesWs.getRange('B9').setValue(minaralWater);
  todaySalesWs.getRange('B10').setValue(electricalCar);
  todaySalesWs.getRange('B11').setValue(workshopAmount);
  todaySalesWs.getRange('B12').setValue(bubblehouseAmount);
}
