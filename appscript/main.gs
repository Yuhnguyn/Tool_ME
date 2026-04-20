function debugStudyDate() {
  const context = getSelectedQueueContext_();
  const raw = context.record.study_date;
  Logger.log('typeof: ' + typeof raw);
  Logger.log('value: ' + raw);
  Logger.log('instanceof Date: ' + (raw instanceof Date));
  const d = raw instanceof Date ? raw : new Date(raw);
  Logger.log('parsed year: ' + d.getFullYear());
}

function buildQueueForSelectedSession() {
  ensureQueueSheet_();
  ensureLogSheet_();

  const sheet = getActiveRawSheet_();
  const sessionBlock = detectSelectedSessionBlock_(sheet);
  const baseColumns = findBaseColumns_(sheet);
  const sessionColumns = findSessionColumns_(sheet, sessionBlock);
  const studyDate = getStudyDateFromSessionTitle_(sessionBlock.title);
  const className = getClassNameFromSheet_(sheet);
  const lastRow = sheet.getLastRow();
  const records = [];

  for (let row = CONFIG.DATA_START_ROW; row <= lastRow; row += 1) {
    if (!isStudentDataRow_(sheet, row, baseColumns)) {
      continue;
    }

    const crmId = String(sheet.getRange(row, baseColumns.CRM).getDisplayValue()).trim();
    const studentName = String(
      sheet.getRange(row, baseColumns.STUDENT_NAME).getDisplayValue()
    ).trim();
    const studentStatus = String(
      sheet.getRange(row, baseColumns.TRANG_THAI).getDisplayValue()
    ).trim();

    if (studentStatus === 'Nghỉ hẳn' || studentStatus === 'Chuyển đi') {
      continue;
    }

    const rawRow = {
      sourceRow: row,
      crmId: crmId,
      studentName: studentName,
      rawAttendance: sheet.getRange(row, sessionColumns.ATTENDANCE).getDisplayValue(),
      rawScoreOriginal: sheet
        .getRange(row, sessionColumns.SCORE_ORIGINAL)
        .getDisplayValue(),
      rawScoreMakeup: sessionColumns.SCORE_MAKEUP
        ? sheet.getRange(row, sessionColumns.SCORE_MAKEUP).getDisplayValue()
        : '',
      rawNoteBu: sheet.getRange(row, sessionColumns.NOTE_BU).getDisplayValue(),
      rawComment: sheet.getRange(row, sessionColumns.COMMENT).getDisplayValue(),
    };

    if (String(rawRow.rawScoreOriginal || '').trim().toUpperCase() === 'HSM') {
      continue;
    }

    records.push(
      buildQueueRecord_(rawRow, {
        studyDate: studyDate,
        className: className,
        sourceSheet: sheet.getName(),
        sourceSession: sessionBlock.title,
      })
    );
  }

  appendQueueRecords_(records);
  appendLog_(
    'BUILD_QUEUE',
    'SUCCESS',
    'Created ' + records.length + ' queue records.',
    {
      source_sheet: sheet.getName(),
      source_row: '',
      record_id: '',
    }
  );
  SpreadsheetApp.getUi().alert('Đã tạo ' + records.length + ' dòng trong FORM_QUEUE.');
}

function previewSelectedQueueRow() {
  const context = getSelectedQueueContext_();
  const validation = validateQueueRecord_(context.record);
  const summary = [
    'Học sinh: ' + context.record.student_name,
    'CRM: ' + context.record.crm_id,
    'Ngày học: ' + toDisplayDate_(context.record.study_date),
    'Chuyên cần: ' + context.record.attendance,
    'Điểm: ' + context.record.homework_score,
    'Nhận xét: ' + context.record.homework_comment,
    'Validate: ' + (validation.ok ? 'OK' : validation.errors.join(' | ')),
  ].join('\n');
  SpreadsheetApp.getUi().alert(summary);
}

function sendSelectedQueueRow() {
  const context = getSelectedQueueContext_();
  submitQueueRecord_(context.record, context.rowIndex);
  SpreadsheetApp.getUi().alert('Đã xử lý dòng ' + context.rowIndex + '.');
}

function sendAllReadyRows() {
  const readyRows = getReadyQueueRows_();
  let successCount = 0;
  let errorCount = 0;

  readyRows.forEach(function (item) {
    const record = {};
    QUEUE_HEADERS.forEach(function (header, index) {
      record[header] = item.row[index];
    });
    try {
      submitQueueRecord_(record, item.rowIndex);
      const updated = getQueueRecordByRow_(item.rowIndex);
      if (updated.send_status === STATUS.SENT) {
        successCount += 1;
      } else {
        errorCount += 1;
      }
    } catch (error) {
      updateQueueRowStatus_(item.rowIndex, {
        send_status: STATUS.ERROR,
        error_message: error.message,
      });
      appendLog_('SUBMIT_ROW', 'ERROR', error.message, record);
      errorCount += 1;
    }
  });

  appendLog_(
    'SEND_BATCH',
    'SUCCESS',
    'Success: ' + successCount + ', Error: ' + errorCount,
    {}
  );
  SpreadsheetApp.getUi().alert(
    'Hoàn tất.\nSuccess: ' + successCount + '\nError: ' + errorCount
  );
}

function resetErrorStatus() {
  const sheet = ensureQueueSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return;
  }

  const headerMap = getHeaderMap_(QUEUE_HEADERS);
  const values = sheet.getRange(2, 1, lastRow - 1, QUEUE_HEADERS.length).getValues();
  values.forEach(function (row, index) {
    if (row[headerMap.send_status] === STATUS.ERROR) {
      row[headerMap.send_status] = STATUS.PENDING;
      row[headerMap.error_message] = '';
      sheet
        .getRange(index + 2, 1, 1, QUEUE_HEADERS.length)
        .setValues([row]);
    }
  });

  SpreadsheetApp.getUi().alert('Đã reset các dòng ERROR về PENDING.');
}
