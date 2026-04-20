// ─────────────────────────────────────────────
// HELPER: encode một cặp key=value đúng chuẩn
// application/x-www-form-urlencoded
// ─────────────────────────────────────────────
function encodeParam_(key, value) {
  return encodeURIComponent(key) + '=' + encodeURIComponent(String(value));
}

// Helper: push nhiều value cho cùng 1 entry (checkbox)
function pushMultiValue_(parts, entryId, pipedString) {
  const values = String(pipedString || '')
    .split('|')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  values.forEach(function (v) {
    parts.push(encodeParam_(entryId, v));
  });
}

// ─────────────────────────────────────────────
// Tính mức độ tiếp thu từ điểm số
// ─────────────────────────────────────────────
function buildUnderstandingFromRecord_(record) {
  const score = parseNumericScore_(record.homework_score);
  if (score !== null && score >= 7) {
    return UNDERSTANDING_OPTIONS.STRONG;
  }
  return UNDERSTANDING_OPTIONS.BASIC;
}

// ─────────────────────────────────────────────
// Build raw body string thủ công
// ─────────────────────────────────────────────
function buildFormBody_(record) {
  const E = CONFIG.FORM_ENTRY_IDS;
  const H = CONFIG.FORM_HIDDEN_FIELDS;
  const parts = [];

  // ==============================
  // 📅 XỬ LÝ NGÀY (ANTI TIMEZONE BUG)
  // ==============================
  let d;

  if (record.study_date instanceof Date) {
    d = record.study_date;
  } else if (typeof record.study_date === "string") {
    // Expect format: YYYY-MM-DD
    const [y, m, day] = record.study_date.split("-");
    d = new Date(Number(y), Number(m) - 1, Number(day));
  } else {
    throw new Error("Invalid study_date format");
  }

  // Debug nếu cần
  // console.log("Parsed date:", d.toString());

  parts.push(encodeParam_(E.STUDY_DATE + '_day',   d.getDate()));
  parts.push(encodeParam_(E.STUDY_DATE + '_month', d.getMonth() + 1));
  parts.push(encodeParam_(E.STUDY_DATE + '_year',  d.getFullYear()));

  // ==============================
  // 📝 TEXT FIELDS
  // ==============================
  parts.push(encodeParam_(E.CENTER,       record.center));
  parts.push(encodeParam_(E.CLASS_NAME,   record.class_name));
  parts.push(encodeParam_(E.STUDENT_NAME, record.student_name));
  parts.push(encodeParam_(E.CRM_ID,       record.crm_id));
  parts.push(encodeParam_(E.ATTENDANCE,   record.attendance));

  // ==============================
  // ✅ CHECKBOX GROUPS
  // ==============================
  pushMultiValue_(parts, E.ATTITUDE_GROUP_1, record.attitude_group1);
  pushMultiValue_(parts, E.ATTITUDE_GROUP_2, record.attitude_group2);
  pushMultiValue_(parts, E.ATTITUDE_GROUP_3, record.attitude_group3);

  // ==============================
  // 📊 RADIO / SELECT
  // ==============================
  parts.push(
    encodeParam_(E.UNDERSTANDING, buildUnderstandingFromRecord_(record))
  );

  parts.push(encodeParam_(E.HOMEWORK_SCORE, record.homework_score));

  if (record.homework_completed) {
    parts.push(
      encodeParam_(E.HOMEWORK_COMPLETED, record.homework_completed)
    );
  }

  parts.push(encodeParam_(E.HOMEWORK_COMMENT, record.homework_comment));

  if (record.homework_fix_status) {
    parts.push(
      encodeParam_(E.HOMEWORK_FIX_STATUS, record.homework_fix_status)
    );
  }

  parts.push(encodeParam_(E.NEXT_TASK, record.next_task));

  // ==============================
  // 🔒 HIDDEN FIELDS (BẮT BUỘC)
  // ==============================
  parts.push(encodeParam_('fvv', '1'));
  parts.push(encodeParam_('pageHistory', H.PAGE_HISTORY));
  parts.push(encodeParam_('submissionTimestamp', H.SUBMISSION_TIMESTAMP));
  parts.push(encodeParam_('partialResponse', H.PARTIAL_RESPONSE));
  parts.push(encodeParam_('fbzx', H.FBZX));

  return parts.join('&');
}

// ─────────────────────────────────────────────
// Submit một record lên Google Form
// ─────────────────────────────────────────────
function submitQueueRecord_(record, rowIndex) {
  const validation = validateQueueRecord_(record);
  if (!validation.ok) {
    const message = validation.errors.join(' | ');
    updateQueueRowStatus_(rowIndex, {
      send_status: STATUS.ERROR,
      error_message: message,
    });
    appendLog_('SUBMIT_ROW', 'ERROR', message, record);
    return;
  }

  const body = buildFormBody_(record);

  const response = UrlFetchApp.fetch(CONFIG.FORM_RESPONSE_URL, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: body,
    followRedirects: false,   // Google Form thành công trả 302
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();

  // 200 = OK, 302 = redirect sau khi submit thành công
  if (code !== 200 && code !== 302) {
    const snippet = response.getContentText().substring(0, 500);
    throw new Error('Submit thất bại. HTTP ' + code + '\n' + snippet);
  }

  updateQueueRowStatus_(rowIndex, {
    send_status: STATUS.SENT,
    sent_at: new Date(),
    error_message: '',
  });
  appendLog_('SUBMIT_ROW', 'SUCCESS', 'Submitted successfully. HTTP ' + code, record);
}

// ─────────────────────────────────────────────
// DEBUG: in body ra Execution Log, không submit thật
// 1. Chọn dòng trong FORM_QUEUE
// 2. Chạy hàm này từ Apps Script editor
// 3. View > Logs để xem
// ─────────────────────────────────────────────
function debugPrintFormBody() {
  const context = getSelectedQueueContext_();
  const body = buildFormBody_(context.record);
  const lines = decodeURIComponent(body).split('&');
  Logger.log('=== FORM BODY (decoded) ===\n' + lines.join('\n'));
  SpreadsheetApp.getUi().alert(
    'Body đã in ra Execution Log.\nMở Apps Script > View > Logs để xem.\n\n' +
    'Số params: ' + lines.length
  );
}