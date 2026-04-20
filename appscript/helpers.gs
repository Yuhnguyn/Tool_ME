function getActiveSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet_(sheetName, headers) {
  const ss = getActiveSpreadsheet_();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const existingHeaders = headerRange.getValues()[0];
  const needsHeader = headers.some((header, index) => existingHeaders[index] !== header);
  if (needsHeader) {
    headerRange.setValues([headers]);
  }

  return sheet;
}

function getHeaderMap_(headers) {
  return headers.reduce(function (acc, header, index) {
    acc[header] = index;
    return acc;
  }, {});
}

function toDisplayDate_(dateValue) {
  return Utilities.formatDate(
    dateValue,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy'
  );
}

function parseNumericScore_(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim().replace(',', '.');
  const numeric = Number(normalized);
  return Number.isNaN(numeric) ? null : numeric;
}
