/*
function onOpen() {
  // Thay email bên dưới bằng email chính xác của bạn
  var myEmail = "huy7a2004@gmail.com"; 
  var currentUser = Session.getActiveUser().getEmail();

  // Kiểm tra nếu không phải email của bạn thì thoát hàm, không tạo menu
  if (currentUser !== myEmail) {
    return;
  }

  // Nếu đúng là bạn, menu mới được tạo ra
  SpreadsheetApp.getUi()
    .createMenu('Form Automation')
    .addItem('Build Queue', 'buildQueueForSelectedSession')
    .addItem('Preview Row', 'previewSelectedQueueRow')
    .addItem('Send One', 'sendSelectedQueueRow')
    .addItem('Send Ready Rows', 'sendAllReadyRows')
    .addItem('Reset Error Status', 'resetErrorStatus')
    .addToUi();
}
*/
