function ensureQueueSheet_() {
  const sheet = ensureSheet_(CONFIG.SHEETS.QUEUE, QUEUE_HEADERS);

  // ==================== FIX CHÍNH ====================
  // Buộc 2 cột dễ bị nhầm thành ngày tháng luôn là Plain Text
  const completedCol = QUEUE_HEADERS.indexOf('homework_completed') + 1;
  const scoreCol     = QUEUE_HEADERS.indexOf('homework_score') + 1;

  if (completedCol > 0) {
    sheet.getRange(1, completedCol, sheet.getMaxRows(), 1)
         .setNumberFormat('@');   // '@' = Plain Text
  }
  if (scoreCol > 0) {
    sheet.getRange(1, scoreCol, sheet.getMaxRows(), 1)
         .setNumberFormat('@');
  }
  // ==================================================

  return sheet;
}

function ensureLogSheet_() {
  return ensureSheet_(CONFIG.SHEETS.LOG, LOG_HEADERS);
}

function appendQueueRecords_(records) {
  if (!records.length) {
    return;
  }
  const sheet = ensureQueueSheet_();
  sheet
    .getRange(sheet.getLastRow() + 1, 1, records.length, QUEUE_HEADERS.length)
    .setValues(records);
}

function getQueueRecordByRow_(rowIndex) {
  const sheet = ensureQueueSheet_();
  const row = sheet.getRange(rowIndex, 1, 1, QUEUE_HEADERS.length).getValues()[0];
  const record = {};
  QUEUE_HEADERS.forEach(function (header, index) {
    record[header] = row[index];
  });
  return record;
}

function getSelectedQueueContext_() {
  const sheet = getActiveSpreadsheet_().getActiveSheet();
  if (sheet.getName() !== CONFIG.SHEETS.QUEUE) {
    throw new Error('Hãy chọn một dòng trong sheet FORM_QUEUE.');
  }
  const rowIndex = sheet.getActiveCell().getRow();
  if (rowIndex <= 1) {
    throw new Error('Hãy chọn một dòng dữ liệu trong FORM_QUEUE.');
  }
  return {
    sheet: sheet,
    rowIndex: rowIndex,
    record: getQueueRecordByRow_(rowIndex),
  };
}

function getReadyQueueRows_() {
  const sheet = ensureQueueSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, QUEUE_HEADERS.length).getValues();
  const headerMap = getHeaderMap_(QUEUE_HEADERS);
  return values
    .map(function (row, index) {
      return {
        rowIndex: index + 2,
        row: row,
      };
    })
    .filter(function (item) {
      return (
        item.row[headerMap.ready_to_send] === true &&
        item.row[headerMap.send_status] === STATUS.PENDING
      );
    });
}

function updateQueueRowStatus_(rowIndex, patch) {
  const sheet = ensureQueueSheet_();
  const row = getQueueRecordByRow_(rowIndex);
  Object.keys(patch).forEach(function (key) {
    if (QUEUE_HEADERS.indexOf(key) === -1) {
      return;
    }
    row[key] = patch[key];
  });

  const output = QUEUE_HEADERS.map(function (header) {
    return row[header];
  });
  sheet.getRange(rowIndex, 1, 1, QUEUE_HEADERS.length).setValues([output]);
}
