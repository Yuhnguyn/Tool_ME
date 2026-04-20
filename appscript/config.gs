const CONFIG = {
  FORM_PUBLIC_ID: "1FAIpQLSe2i217MIsqz-kBYmrWSEN9F9DQkhO3FNcTXi5EE01B918n3w",
  FORM_RESPONSE_URL: "https://docs.google.com/forms/d/e/1FAIpQLSe2i217MIsqz-kBYmrWSEN9F9DQkhO3FNcTXi5EE01B918n3w/formResponse",

  RAW_SESSION_TITLE_ROW: 10,
  RAW_HEADER_ROW: 11,
  DATA_START_ROW: 12,
  CLASS_NAME_ROW: 2,
  CLASS_NAME_COLUMN: 4,

  DEFAULT_YEAR: 2026,

  SHEETS: {
    QUEUE: "FORM_QUEUE",
    LOG: "FORM_LOG",
  },

  DEFAULTS: {
    CENTER: "Online",
    NEXT_TASK: "Bố mẹ nhắc con xem kỹ bài tập trên lớp và hoàn thành bài tập về nhà.",
    READY_TO_SEND: false,
    SEND_STATUS: "PENDING",
  },

  FORM_TITLES: {
    STUDY_DATE: "Ngày học (Ví dụ: 15/07/2025)",
    CENTER: "Trung tâm",
    CLASS_NAME: "Lớp",
    STUDENT_NAME: "Họ và tên học sinh",
    CRM_ID: "Mã CRM (Copy tránh thiếu ký tự)",
    ATTENDANCE: "1. Chuyên cần:",
    ATTITUDE: "2. Ý thức & Thái độ học tập:",
    HOMEWORK_SCORE: "1. Điểm bài tập: …/... (Ví dụ: 8/10 hoặc HSM hoặc 3,5/10 => 6/10)\nLưu ý: Dùng dấu phẩy không dùng dấu chấm với điểm là số thập phân",
    HOMEWORK_COMPLETED: "2. Con hoàn thành: .../... bài (Ví dụ: 5/7)",
    HOMEWORK_COMMENT: "3. Nhận xét bài tập về nhà (Ghi rõ lỗi sai của học sinh và những nội dung, kĩ năng học sinh cần luyện tập thêm)",
    NEXT_TASK: "* NHIỆM VỤ TUẦN NÀY:",
  },

  FORM_ENTRY_IDS: {
    STUDY_DATE: "entry.1549110541",
    CENTER: "entry.1012178970",
    CLASS_NAME: "entry.861517786",
    STUDENT_NAME: "entry.109327771",
    CRM_ID: "entry.1766945745",
    ATTENDANCE: "entry.294823671",
    ATTITUDE_GROUP_1: "entry.2100192124",
    ATTITUDE_GROUP_2: "entry.345323242",
    ATTITUDE_GROUP_3: "entry.1415789865",
    UNDERSTANDING: "entry.2097166637",
    HOMEWORK_SCORE: "entry.531824449",
    HOMEWORK_COMPLETED: "entry.2037599700",
    HOMEWORK_COMMENT: "entry.2083968250",
    HOMEWORK_FIX_STATUS: "entry.952107850",
    NEXT_TASK: "entry.179043034",
  },

  FORM_HIDDEN_FIELDS: {
    FBZX: "5271505638092524560",           // ← CHỈ THAY ĐỔI GIÁ TRỊ NÀY
    PAGE_HISTORY: "0",
    SUBMISSION_TIMESTAMP: "-1",
    PARTIAL_RESPONSE: '[null,null,"5271505638092524560"]',  // ← VÀ GIÁ TRỊ NÀY
  },
};