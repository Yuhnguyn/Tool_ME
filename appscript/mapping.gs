function normalizeAttendance_(rawAttendance) {
  const value = String(rawAttendance || '').trim();
  const normalized = value.replace(/\s+/g, '');
  if (normalized === 'x' || normalized === 'x-S') {
    return ATTENDANCE_OPTIONS.PRESENT;
  }
  if (normalized === 'P') {
    return ATTENDANCE_OPTIONS.EXCUSED;
  }
  if (normalized === 'KP') {
    return ATTENDANCE_OPTIONS.UNEXCUSED;
  }
  return '';
}

function normalizeHomeworkScore_(rawScoreOriginal, rawScoreMakeup) {
  const original = String(rawScoreOriginal || '').trim();
  const makeup = parseNumericScore_(rawScoreMakeup);
  const isMissingHomework =
    original.toLowerCase() === 'chưa làm' ||
    original.toLowerCase() === 'quen vở' ||
    original.toLowerCase() === 'quên vở';

  if (isMissingHomework) {
    if (!makeup || makeup === 0) {
      return '0';
    }
    return String(rawScoreMakeup).trim().replace('.', ',');
  }

  return String(rawScoreOriginal || '').trim().replace('.', ',');
}

function normalizeHomeworkCompleted_(rawScoreOriginal, rawScoreMakeup, rawNoteBu) {
  const original = String(rawScoreOriginal || '').trim().toLowerCase();
  const makeup = parseNumericScore_(rawScoreMakeup);
  const isMissingHomework =
    original === 'chưa làm' || original === 'quen vở' || original === 'quên vở';
  if (isMissingHomework && (!makeup || makeup === 0)) {
    return '';
  }
  return String(rawNoteBu || '').trim();
}

function normalizeHomeworkComment_(rawScoreOriginal, rawScoreMakeup, rawComment) {
  const original = String(rawScoreOriginal || '').trim().toLowerCase();
  const makeup = parseNumericScore_(rawScoreMakeup);
  const isMissingHomework =
    original === 'chưa làm' || original === 'quen vở' || original === 'quên vở';
  if (isMissingHomework && (!makeup || makeup === 0)) {
    return DEFAULT_HOMEWORK_COMMENT;
  }
  return String(rawComment || '').trim();
}

// Hàm làm sạch tên lớp, bỏ prefix "Online - " thừa
function cleanClassName_(className) {
  let name = String(className || '').trim();
  // Xóa "Online - " ở đầu (có thể có 1 hoặc 2 lần)
  name = name.replace(/^Online -\s*/i, '');
  name = name.replace(/^Online -\s*/i, '');   // xóa lần thứ 2 nếu có
  return name || CONFIG.CLASS_NAME;   // fallback nếu rỗng
}
// ─────────────────────────────────────────────────────────────────────────────
// Attitude: trả về object { group1, group2, group3 }
// mỗi field là chuỗi các lựa chọn nối bằng '|'
//
// Logic mặc định:
//   x-S  → Nhóm 1: đủ 4 tiêu chí (xuất sắc)
//   x    → Nhóm 1: COOPERATES + NOTES (nếu điểm ≥ 7), hoặc chỉ COOPERATES
//   P/KP → không chọn gì
//
// GV/TG có thể chỉnh thủ công trong FORM_QUEUE trước khi gửi.
// ─────────────────────────────────────────────────────────────────────────────
function buildAttitudeGroups_(rawAttendance, homeworkScore) {
  const attendance = String(rawAttendance || '').trim().replace(/\s+/g, '');
  const result = { group1: '', group2: '', group3: '' };

  if (attendance === 'P' || attendance === 'KP') {
    return result;
  }

  if (attendance === 'x-S') {
    result.group1 = [
      ATTITUDE_GROUP1_OPTIONS.INTERACTS,
      ATTITUDE_GROUP1_OPTIONS.NOTES,
      ATTITUDE_GROUP1_OPTIONS.COOPERATES,
      ATTITUDE_GROUP1_OPTIONS.PARTICIPATES,
    ].join('|');
    return result;
  }

  if (attendance === 'x') {
    const score = parseNumericScore_(homeworkScore);
    if (score !== null && score >= 7) {
      result.group1 = [
        ATTITUDE_GROUP1_OPTIONS.COOPERATES,
        ATTITUDE_GROUP1_OPTIONS.NOTES,
      ].join('|');
    } else {
      result.group1 = ATTITUDE_GROUP1_OPTIONS.COOPERATES;
    }
    return result;
  }

  return result;
}

// Giữ lại hàm cũ để không break chỗ nào còn gọi
function buildAttitudeChoices_(rawAttendance, homeworkScore) {
  return buildAttitudeGroups_(rawAttendance, homeworkScore).group1;
}

function buildRecordId_(studyDate, crmId) {
  const formattedDate = Utilities.formatDate(
    studyDate,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
  return [formattedDate, CONFIG.DEFAULTS.CENTER, CONFIG.CLASS_NAME, crmId].join('_');
}

function buildQueueRecord_(rawRow, context) {
  const homeworkScore = normalizeHomeworkScore_(
    rawRow.rawScoreOriginal,
    rawRow.rawScoreMakeup
  );

  const attitudeGroups = buildAttitudeGroups_(rawRow.rawAttendance, homeworkScore);

  const record = {
    record_id: [
      Utilities.formatDate(context.studyDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      CONFIG.DEFAULTS.CENTER,
      context.className,
      rawRow.crmId,
    ].join('_'),
    study_date:           context.studyDate,
    center:               CONFIG.DEFAULTS.CENTER,
    class_name:           context.className,
    student_name:         rawRow.studentName,
    crm_id:               rawRow.crmId,
    attendance:           normalizeAttendance_(rawRow.rawAttendance),
    attitude_group1:      attitudeGroups.group1,
    attitude_group2:      attitudeGroups.group2,
    attitude_group3:      attitudeGroups.group3,
    homework_score:       homeworkScore,
    homework_completed:   normalizeHomeworkCompleted_(
                            rawRow.rawScoreOriginal,
                            rawRow.rawScoreMakeup,
                            rawRow.rawNoteBu
                          ),
    homework_comment:     normalizeHomeworkComment_(
                            rawRow.rawScoreOriginal,
                            rawRow.rawScoreMakeup,
                            rawRow.rawComment
                          ),
    homework_fix_status:  '',   // để trống, GV/TG điền thủ công trước khi gửi
    next_task:            CONFIG.DEFAULTS.NEXT_TASK,
    ready_to_send:        CONFIG.DEFAULTS.READY_TO_SEND,
    send_status:          CONFIG.DEFAULTS.SEND_STATUS,
    sent_at:              '',
    error_message:        '',
    source_sheet:         context.sourceSheet,
    source_row:           rawRow.sourceRow,
    source_session:       context.sourceSession,
    raw_attendance:       rawRow.rawAttendance,
    raw_score_original:   rawRow.rawScoreOriginal,
    raw_score_makeup:     rawRow.rawScoreMakeup,
    raw_note_bu:          rawRow.rawNoteBu,
    raw_comment:          rawRow.rawComment,
  };

  return QUEUE_HEADERS.map(function (header) {
    return record[header];
  });
}