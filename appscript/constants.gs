const QUEUE_HEADERS = [
  'record_id',
  'study_date',
  'center',
  'class_name',
  'student_name',
  'crm_id',
  'attendance',
  'attitude_group1',   // Nhóm 1: Chủ động – Tích cực – Tốt
  'attitude_group2',   // Nhóm 2: Trung bình – Cần cải thiện
  'attitude_group3',   // Nhóm 3: Cần lưu ý – Cần hỗ trợ
  'homework_score',
  'homework_completed',
  'homework_comment',
  'homework_fix_status',
  'next_task',
  'ready_to_send',
  'send_status',
  'sent_at',
  'error_message',
  'source_sheet',
  'source_row',
  'source_session',
  'raw_attendance',
  'raw_score_original',
  'raw_score_makeup',
  'raw_note_bu',
  'raw_comment',
];

const LOG_HEADERS = [
  'timestamp',
  'action',
  'status',
  'message',
  'record_id',
  'source_sheet',
  'source_row',
];

const ATTENDANCE_OPTIONS = {
  PRESENT:   'Con tham gia buổi học',
  EXCUSED:   'Con nghỉ phép',
  UNEXCUSED: 'Con nghỉ không phép',
};

// ── Nhóm 1: Chủ động – Tích cực – Tốt ──────────────────────────────────────
const ATTITUDE_GROUP1_OPTIONS = {
  INTERACTS:    'Con chủ động tương tác với giáo viên và bạn bè.',
  NOTES:        'Con chủ động ghi chép bài, suy nghĩ và trình bày lời giải.',
  COOPERATES:   'Con có tinh thần hợp tác tốt trong học tập.',
  PARTICIPATES: 'Con tích cực tham gia phát biểu.',
};

// ── Nhóm 2: Trung bình – Cần cải thiện ─────────────────────────────────────
const ATTITUDE_GROUP2_OPTIONS = {
  NOT_FOCUSED:    'Con chưa tập trung trong giờ học.',
  NOT_PROACTIVE:  'Con chưa thực sự chủ động, còn phụ thuộc vào hướng dẫn.',
  SHY:            'Con còn rụt rè, ít phát biểu trong giờ học.',
  NEEDS_FEEDBACK: 'Con cần tích cực phản hồi giáo viên hơn.',
};

// ── Nhóm 3: Cần lưu ý – Cần hỗ trợ ────────────────────────────────────────
const ATTITUDE_GROUP3_OPTIONS = {
  EASILY_DISTRACTED: 'Con dễ mất tập trung khi học.',
  NOT_ATTENTIVE:     'Con chưa chú ý bài giảng.',
  NEEDS_REMINDER:    'Con cần nhắc nhở thường xuyên.',
  SLOW_NOTES:        'Con ghi bài chậm.',
  FORGOT_NOTEBOOK:   'Con quên vở.',
  FORGOT_PEN:        'Con quên bút.',
  FORGOT_RULER:      'Con quên thước.',
  FORGOT_CALCULATOR: 'Con quên máy tính.',
};

// Giữ lại alias cũ để không break mapping.gs
const ATTITUDE_OPTIONS = ATTITUDE_GROUP1_OPTIONS;

const UNDERSTANDING_OPTIONS = {
  STRONG: 'Con tiếp thu nhanh, nắm vững bài học.',
  BASIC:  'Con hiểu bài ở mức cơ bản, cần luyện tập thêm.',
};

const HOMEWORK_FIX_OPTIONS = {
  PRAISED_FIX:        'Khen con đã chữa bài tập về nhà của tuần trước nữa.',
  PRAISED_SUPPLEMENT: 'Khen con đã bổ sung bài tập về nhà của tuần trước nữa.',
  NOT_FIXED:          'Con chưa chữa bài tập về nhà của tuần trước nữa, bố mẹ nhắc con xem kĩ lại các lỗi sai tránh lặp lại.',
};

const NEXT_TASK_OPTIONS = {
  DEFAULT:    'Bố mẹ nhắc con xem kỹ bài tập trên lớp và hoàn thành bài tập về nhà.',
  EXAM:       'Buổi học tuần sau các con có bài kiểm tra chuyên đề bố mẹ nhắc các con ôn tập kĩ các nội dung đã học.',
  EXTRA_HW:   'Bố mẹ nhắc con xem kỹ bài tập trên lớp và hoàn thành bài tập về nhà ra vở riêng buổi sau nộp lại để thầy cô chấm, chữa cho con.',
};

const DEFAULT_HOMEWORK_COMMENT =
  'Con chú ý nộp bài tập cho thầy cô chấm chữa nhé';

const RAW_HEADERS = {
  CRM:            'CRM',
  STUDENT_NAME:   'Họ và tên HS',
  TRANG_THAI:     'Trạng thái',
  ATTENDANCE:     'Điểm Danh',
  SCORE_ORIGINAL: 'Điểm gốc',
  SCORE_MAKEUP:   'Điểm sửa',
  NOTE_BU:        'Note bù',
  COMMENT:        'Nhận xét',
};

const RAW_HEADER_ALIASES = {
  CRM:            ['CRM', 'Mã CRM'],
  STUDENT_NAME:   ['Họ và tên HS', 'Họ và tên học sinh', 'Họ tên HS'],
  TRANG_THAI:     ['Trạng thái', 'Trang thai'],
  ATTENDANCE:     ['Điểm Danh', 'Điểm danh'],
  SCORE_ORIGINAL: ['Điểm gốc'],
  SCORE_MAKEUP:   ['Điểm sửa'],
  NOTE_BU:        ['Note bù', 'Note bu'],
  COMMENT:        ['Nhận xét', 'Nhận xét BTVN'],
};

const STATUS = {
  PENDING: 'PENDING',
  SENT:    'SENT',
  ERROR:   'ERROR',
};