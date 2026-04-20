function appendLog_(action, status, message, record) {
  const sheet = ensureLogSheet_();
  const row = [
    new Date(),
    action,
    status,
    message,
    record && record.record_id ? record.record_id : '',
    record && record.source_sheet ? record.source_sheet : '',
    record && record.source_row ? record.source_row : '',
  ];
  sheet.appendRow(row);
}
