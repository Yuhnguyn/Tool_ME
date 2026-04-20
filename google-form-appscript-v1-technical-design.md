# Technical Design - Google Apps Script V1

## Mục tiêu

Thiết kế bản V1 đủ để:

- build dữ liệu từ sheet gốc sang `FORM_QUEUE`
- kiểm tra dữ liệu trước khi gửi
- gửi từng dòng hoặc gửi hàng loạt sang Google Form
- ghi trạng thái thành công hoặc lỗi

V1 ưu tiên tính ổn định, dễ debug và dễ vận hành. Không tối ưu sớm cho quá nhiều biến thể.

## Phạm vi V1

Bao gồm:

- custom menu trong Google Sheet
- build queue cho một block buổi học được chọn
- validate dữ liệu queue
- gửi 1 dòng đang chọn
- gửi tất cả các dòng sẵn sàng
- cập nhật trạng thái `PENDING`, `SENT`, `ERROR`
- ghi timestamp và lỗi

Không bao gồm:

- tự sinh nhận xét bằng AI
- trigger tự chạy theo lịch
- dashboard nâng cao
- retry logic phức tạp
- hỗ trợ nhiều form khác nhau

## Kiến trúc tổng thể

```text
RAW_DATA -> Build Queue -> FORM_QUEUE -> Validate -> Submit Form -> Update Status
```

Luồng xử lý:

1. Người dùng mở Google Sheet
2. Chọn block buổi học cần build
3. Chạy `Build Queue`
4. Kiểm tra dữ liệu trong `FORM_QUEUE`
5. Đánh dấu `ready_to_send = TRUE`
6. Chạy `Send Selected Row` hoặc `Send All Ready Rows`
7. Script submit form và cập nhật trạng thái

## Danh sách sheet

### 1. Sheet dữ liệu gốc

Tên tạm:

- `RAW_DATA`

Thực tế có thể là tên lớp hoặc tên sheet hiện tại.

Chứa:

- thông tin học sinh
- block dữ liệu theo từng buổi học

### 2. FORM_QUEUE

Chứa dữ liệu chuẩn hoá để submit form.

Schema:

```text
record_id
study_date
center
class_name
student_name
crm_id
attendance
attitude_choices
homework_score
homework_completed
homework_comment
next_task
ready_to_send
send_status
sent_at
error_message
source_sheet
source_row
source_session
raw_attendance
raw_score_original
raw_score_makeup
raw_note_bu
raw_comment
```

### 3. FORM_LOG

Chứa log thao tác ở mức hệ thống.

Schema tối thiểu:

```text
timestamp
action
status
message
record_id
source_sheet
source_row
```

## Cấu trúc file Apps Script

Khuyến nghị tách code thành nhiều file `.gs`:

### `config.gs`

Chứa:

- `FORM_ID`
- tên các sheet
- tên header chuẩn của `FORM_QUEUE`
- option text cố định của form
- default values

Ví dụ config:

```javascript
const CONFIG = {
  FORM_ID: '...',
  SHEETS: {
    QUEUE: 'FORM_QUEUE',
    LOG: 'FORM_LOG',
  },
  DEFAULTS: {
    CENTER: 'Online',
    NEXT_TASK: 'Bố mẹ nhắc con xem kỹ bài tập trên lớp và hoàn thành bài tập về nhà.',
    READY_TO_SEND: false,
    SEND_STATUS: 'PENDING',
  },
};
```

### `constants.gs`

Chứa text cố định để tránh hardcode lặp lại:

- các option `attendance`
- các option `attitude`
- text nhận xét mặc định khi chưa nộp bài
- text của `next_task`

### `menu.gs`

Chứa:

- `onOpen()`
- `buildCustomMenu()`

Menu đề xuất:

- `Build Queue For Selected Session`
- `Preview Selected Queue Row`
- `Send Selected Queue Row`
- `Send All Ready Rows`
- `Reset Error Status`

### `raw_sheet.gs`

Chứa logic đọc sheet gốc:

- xác định sheet hiện tại
- xác định block buổi học đang chọn
- tìm các cột theo header
- đọc dữ liệu từng dòng

Các hàm chính:

- `getActiveRawSheet()`
- `detectSelectedSessionBlock()`
- `findBaseColumns(sheet)`
- `findSessionColumns(sheet, sessionBlock)`
- `readRawRows(sheet, sessionColumns)`

### `mapping.gs`

Chứa logic chuẩn hoá nghiệp vụ:

- map attendance
- map attitude
- map score
- map comment
- build queue record

Các hàm chính:

- `normalizeAttendance(rawAttendance)`
- `normalizeHomeworkScore(rawScoreOriginal, rawScoreMakeup)`
- `normalizeHomeworkCompleted(rawScoreOriginal, rawScoreMakeup, rawNoteBu)`
- `normalizeHomeworkComment(rawScoreOriginal, rawScoreMakeup, rawComment)`
- `buildAttitudeChoices(rawAttendance, homeworkScore)`
- `buildQueueRecord(rawRow, context)`

### `queue.gs`

Chứa logic thao tác với `FORM_QUEUE`:

- đảm bảo sheet tồn tại
- đọc header
- append rows
- lấy row đang chọn
- update status

Các hàm chính:

- `ensureQueueSheet()`
- `appendQueueRecords(records)`
- `getSelectedQueueRecord()`
- `getReadyQueueRecords()`
- `markQueueRowSent(rowIndex, meta)`
- `markQueueRowError(rowIndex, errorMessage)`

### `validation.gs`

Chứa validate trước khi submit:

- field bắt buộc
- giá trị hợp lệ
- chống gửi trùng

Các hàm chính:

- `validateQueueRecord(record)`
- `isAlreadySent(record)`
- `isReadyToSend(record)`

### `form_submit.gs`

Chứa logic làm việc với Google Form:

- mở form
- tìm item theo title
- map dữ liệu queue vào item response
- submit response

Các hàm chính:

- `openTargetForm()`
- `getFormItemsMap(form)`
- `buildFormResponse(form, itemsMap, record)`
- `submitQueueRecord(record, rowIndex)`

### `log.gs`

Chứa ghi log hệ thống:

- `appendLog(action, status, message, meta)`

### `main.gs`

Chứa các entry point để menu gọi:

- `buildQueueForSelectedSession()`
- `previewSelectedQueueRow()`
- `sendSelectedQueueRow()`
- `sendAllReadyRows()`
- `resetErrorStatus()`

## Thiết kế menu

Menu tên:

```text
Form Automation
```

Các item:

### `Build Queue For Selected Session`

Mục đích:

- đọc block buổi học tại sheet đang active
- sinh record vào `FORM_QUEUE`

### `Preview Selected Queue Row`

Mục đích:

- đọc dòng hiện tại trong `FORM_QUEUE`
- validate và hiển thị tóm tắt dữ liệu chuẩn bị gửi

V1 có thể đơn giản bằng `SpreadsheetApp.getUi().alert(...)`

### `Send Selected Queue Row`

Mục đích:

- chỉ gửi dòng hiện tại đang chọn trong `FORM_QUEUE`

### `Send All Ready Rows`

Mục đích:

- gửi tất cả các dòng:
  - `ready_to_send = TRUE`
  - `send_status = PENDING`

### `Reset Error Status`

Mục đích:

- chuyển các dòng `ERROR` về `PENDING` sau khi đã sửa dữ liệu

## Luồng xử lý chi tiết

### 1. Build Queue For Selected Session

Input:

- sheet dữ liệu đang active
- ô active nằm trong block của một buổi học

Các bước:

1. xác định sheet nguồn
2. xác định block buổi học từ cột active
3. đọc tiêu đề block, ví dụ `Buổi 2 (11/04)`
4. tìm các cột cần thiết trong block:
   - `Điểm Danh`
   - `Điểm gốc`
   - `Điểm sửa`
   - `Note bù`
   - `Nhận xét`
5. tìm các cột cố định:
   - `CRM`
   - `Họ và tên HS`
6. duyệt từng dòng học sinh
7. bỏ qua các dòng không hợp lệ
8. build queue record theo rule nghiệp vụ
9. append records vào `FORM_QUEUE`
10. ghi summary vào `FORM_LOG`

Output:

- các dòng mới trong `FORM_QUEUE`
- thông báo số dòng build thành công / số dòng bỏ qua

### 2. Preview Selected Queue Row

Input:

- dòng đang active trong `FORM_QUEUE`

Các bước:

1. đọc record
2. validate
3. hiển thị tóm tắt:
   - học sinh
   - ngày học
   - chuyên cần
   - điểm
   - nhận xét
   - trạng thái validate

Output:

- popup hoặc alert đơn giản

### 3. Send Selected Queue Row

Input:

- dòng đang active trong `FORM_QUEUE`

Các bước:

1. đọc record
2. validate
3. nếu lỗi -> ghi `ERROR`
4. mở Google Form
5. tìm item map theo title
6. build `FormResponse`
7. submit
8. cập nhật `SENT`, `sent_at`
9. ghi log

Output:

- dòng được đánh dấu `SENT` hoặc `ERROR`

### 4. Send All Ready Rows

Input:

- toàn bộ `FORM_QUEUE`

Điều kiện chọn:

- `ready_to_send = TRUE`
- `send_status = PENDING`

Các bước:

1. lấy tất cả record đủ điều kiện
2. lặp từng record
3. validate
4. submit
5. cập nhật status
6. đếm thành công / lỗi
7. ghi summary cuối cùng

Output:

- popup summary cuối lượt chạy
- log theo từng dòng

## Thiết kế mapping vào Google Form

Script nên map theo `title` của item trong form.

Ví dụ map logic:

- `Ngày học (Ví dụ: 15/07/2025)` <- `study_date`
- `Trung tâm` <- `center`
- `Lớp` <- `class_name`
- `Họ và tên học sinh` <- `student_name`
- `Mã CRM (Copy tránh thiếu ký tự)` <- `crm_id`
- `1. Chuyên cần:` <- `attendance`
- `2. Ý thức & Thái độ học tập:` <- `attitude_choices`
- `1. Điểm bài tập: …/...` <- `homework_score`
- `2. Con hoàn thành: .../... bài` <- `homework_completed`
- `3. Nhận xét bài tập về nhà ...` <- `homework_comment`
- `* NHIỆM VỤ TUẦN NÀY:` <- `next_task`

Khuyến nghị:

- map bằng title chính xác
- lưu title vào `constants.gs`
- khi không tìm thấy item theo title thì fail sớm

## Rule validate chi tiết

### Validate build queue

- có `crm_id`
- có `student_name`
- parse được `study_date`
- xác định được đầy đủ cột trong block buổi học

### Validate trước submit

- `study_date` không trống
- `center = Online`
- `class_name` không trống
- `student_name` không trống
- `crm_id` không trống
- `attendance` hợp lệ
- `ready_to_send = TRUE`
- `send_status != SENT`

### Validate form item

- tìm thấy đầy đủ item bắt buộc trong form
- item type đúng với dữ liệu cần submit

## Logging strategy

Mỗi action chính nên ghi vào `FORM_LOG`.

Ví dụ:

- `BUILD_QUEUE`, `SUCCESS`, `Created 25 queue records`
- `SUBMIT_ROW`, `SUCCESS`, `Sent record 2025-04-11_Online_7A_ONL23-00467`
- `SUBMIT_ROW`, `ERROR`, `Missing class_name`
- `SEND_BATCH`, `SUCCESS`, `Success: 23, Error: 2`

## Error handling

### Nhóm lỗi dữ liệu

Ví dụ:

- thiếu `crm_id`
- thiếu `class_name`
- không parse được ngày
- giá trị điểm không hợp lệ

Cách xử lý:

- không submit
- ghi `ERROR`
- lưu `error_message`

### Nhóm lỗi form

Ví dụ:

- không mở được form
- không tìm thấy item theo title
- lỗi submit response

Cách xử lý:

- dừng xử lý dòng hiện tại
- ghi log lỗi
- batch vẫn tiếp tục với các dòng sau

## Chống gửi trùng

V1 dùng 2 lớp chống trùng:

1. `send_status = SENT` thì không gửi lại
2. `record_id` là khoá nghiệp vụ để trace

Khuyến nghị thêm:

- khi build queue, có thể check nếu `record_id` đã tồn tại thì cảnh báo hoặc bỏ qua

## Cấu hình cần chuẩn bị trước khi code

1. `FORM_ID`
2. tên chính xác các sheet
3. tên chính xác các title trong Google Form
4. rule cho `Điểm = 7`
5. nguồn của `class_name`
6. năm mặc định khi parse `study_date`

## Kế hoạch code V1

### Bước 1

- tạo skeleton Apps Script files
- thêm config và constants

### Bước 2

- viết hàm detect session block
- viết hàm đọc sheet gốc

### Bước 3

- viết logic mapping nghiệp vụ
- build được `FORM_QUEUE`

### Bước 4

- viết validate
- viết submit form

### Bước 5

- thêm menu
- test 1 dòng
- test batch nhỏ

## Definition of Done cho V1

- build được queue từ một block buổi học
- queue record đúng logic nghiệp vụ đã chốt
- gửi được 1 dòng sang form thật hoặc form clone
- gửi batch các dòng `ready_to_send = TRUE`
- cập nhật `SENT` hoặc `ERROR`
- có `FORM_LOG`
- không cần copy/paste thủ công
