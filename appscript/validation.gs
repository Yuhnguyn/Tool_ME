function validateQueueRecord_(record) {
  const errors = [];

  if (!record.study_date) {
    errors.push('Thiếu study_date.');
  }
  if (!record.class_name) {
    errors.push('Thiếu class_name.');
  }
  if (!record.student_name) {
    errors.push('Thiếu student_name.');
  }
  if (!record.crm_id) {
    errors.push('Thiếu crm_id.');
  }
  if (!record.attendance) {
    errors.push('Thiếu attendance hợp lệ.');
  }
  if (record.ready_to_send !== true) {
    errors.push('ready_to_send phải là TRUE.');
  }
  if (record.send_status === STATUS.SENT) {
    errors.push('Dòng này đã được gửi.');
  }

  return {
    ok: errors.length === 0,
    errors: errors,
  };
}
