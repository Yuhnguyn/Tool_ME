function getActiveRawSheet_() {
  const sheet = getActiveSpreadsheet_().getActiveSheet();
  if (!sheet) {
    throw new Error("Không tìm thấy sheet đang active.");
  }
  if (
    sheet.getName() === CONFIG.SHEETS.QUEUE ||
    sheet.getName() === CONFIG.SHEETS.LOG
  ) {
    throw new Error("Hãy chạy Build Queue từ sheet dữ liệu gốc.");
  }
  return sheet;
}

function getClassNameFromSheet_(sheet) {
  const value = sheet
    .getRange(CONFIG.CLASS_NAME_ROW, CONFIG.CLASS_NAME_COLUMN)
    .getDisplayValue()
    .trim();
  
  if (!value) return "Online - [Chưa đặt tên lớp]";

  // Lấy phần sau dấu " - " cuối cùng, ví dụ "Online - 6T3C" → "6T3C"
  const parts = value.split(" - ");
  const className = parts[parts.length - 1].trim();
  
  return className || value; // fallback về chuỗi gốc nếu split ra rỗng
}

function detectSelectedSessionBlock_(sheet) {
  const activeColumn = sheet.getActiveCell().getColumn();
  const lastColumn = sheet.getLastColumn();
  const titles = sheet
    .getRange(CONFIG.RAW_SESSION_TITLE_ROW, 1, 1, lastColumn)
    .getValues()[0];

  let sessionTitle = titles[activeColumn - 1];
  if (!sessionTitle) {
    for (let col = activeColumn - 1; col >= 1; col -= 1) {
      if (titles[col - 1]) {
        sessionTitle = titles[col - 1];
        break;
      }
    }
  }

  if (!sessionTitle) {
    throw new Error("Không xác định được block buổi học từ cột đang chọn.");
  }

  const sessionStartColumn =
    titles.findIndex(function (title) {
      return title === sessionTitle;
    }) + 1;

  if (sessionStartColumn < 1) {
    throw new Error("Không xác định được cột bắt đầu của block buổi học.");
  }

  let sessionEndColumn = lastColumn;
  for (let col = sessionStartColumn + 1; col <= lastColumn; col += 1) {
    if (titles[col - 1]) {
      sessionEndColumn = col - 1;
      break;
    }
  }

  return {
    title: sessionTitle,
    startColumn: sessionStartColumn,
    endColumn: sessionEndColumn,
  };
}

function findBaseColumns_(sheet) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet
    .getRange(CONFIG.RAW_SESSION_TITLE_ROW, 1, 1, lastColumn)
    .getValues()[0];
  const map = {};

  Object.keys(RAW_HEADER_ALIASES).forEach(function (key) {
    const aliases = RAW_HEADER_ALIASES[key].map(normalizeHeader_);
    const index = headers.findIndex(function (header) {
      return aliases.indexOf(normalizeHeader_(header)) !== -1;
    });
    if (index !== -1 && !map[key]) {
      map[key] = index + 1;
    }
  });

  if (!map.CRM || !map.STUDENT_NAME || !map.TRANG_THAI) {
    throw new Error("Không tìm thấy cột CRM, Họ và tên HS hoặc Trạng thái.");
  }

  return map;
}

function normalizeHeader_(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function findSessionColumns_(sheet, sessionBlock) {
  const headers = sheet
    .getRange(
      CONFIG.RAW_HEADER_ROW,
      sessionBlock.startColumn,
      1,
      sessionBlock.endColumn - sessionBlock.startColumn + 1,
    )
    .getValues()[0];

  const map = {};
  headers.forEach(function (header, index) {
    const trimmed = normalizeHeader_(header);
    if (
      RAW_HEADER_ALIASES.ATTENDANCE.map(normalizeHeader_).indexOf(trimmed) !==
        -1 &&
      !map.ATTENDANCE
    ) {
      map.ATTENDANCE = sessionBlock.startColumn + index;
    }
    if (
      RAW_HEADER_ALIASES.SCORE_ORIGINAL.map(normalizeHeader_).indexOf(
        trimmed,
      ) !== -1 &&
      !map.SCORE_ORIGINAL
    ) {
      map.SCORE_ORIGINAL = sessionBlock.startColumn + index;
    }
    if (
      RAW_HEADER_ALIASES.SCORE_MAKEUP.map(normalizeHeader_).indexOf(trimmed) !==
        -1 &&
      !map.SCORE_MAKEUP
    ) {
      map.SCORE_MAKEUP = sessionBlock.startColumn + index;
    }
    if (
      RAW_HEADER_ALIASES.NOTE_BU.map(normalizeHeader_).indexOf(trimmed) !==
        -1 &&
      !map.NOTE_BU
    ) {
      map.NOTE_BU = sessionBlock.startColumn + index;
    }
    if (
      RAW_HEADER_ALIASES.COMMENT.map(normalizeHeader_).indexOf(trimmed) !==
        -1 &&
      !map.COMMENT
    ) {
      map.COMMENT = sessionBlock.startColumn + index;
    }
  });

  if (!map.ATTENDANCE || !map.SCORE_ORIGINAL || !map.NOTE_BU || !map.COMMENT) {
    throw new Error("Không tìm thấy đủ cột trong block buổi học đã chọn.");
  }

  return map;
}

function getStudyDateFromSessionTitle_(sessionTitle) {
  const match = String(sessionTitle).match(/\((\d{1,2})\/(\d{1,2})\)/);
  if (!match) {
    throw new Error("Không parse được ngày học từ tiêu đề block buổi học.");
  }

  const day   = Number(match[1]);
  const month = Number(match[2]);

  // ✅ LUÔN dùng năm trong CONFIG
  const year = CONFIG.DEFAULT_YEAR;

  return new Date(year, month - 1, day);
}

function isStudentDataRow_(sheet, rowIndex, baseColumns) {
  const crmId = String(
    sheet.getRange(rowIndex, baseColumns.CRM).getDisplayValue(),
  ).trim();
  const studentName = String(
    sheet.getRange(rowIndex, baseColumns.STUDENT_NAME).getDisplayValue(),
  ).trim();
  const firstCol = String(sheet.getRange(rowIndex, 1).getDisplayValue()).trim();

  if (firstCol === "DANH SÁCH HỌC BÙ LỚP") {
    return false;
  }
  if (firstCol === "-") {
    return false;
  }
  if (!crmId || !studentName) {
    return false;
  }
  return true;
}
