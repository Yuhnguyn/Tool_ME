# Kế hoạch tự động hoá Google Sheet -> Google Form

## Mục tiêu

Xây một quy trình ổn định để lấy dữ liệu nhận xét học sinh từ Google Sheet, đổ đúng vào Google Form, tự động gửi hàng loạt, có kiểm soát lỗi, chống gửi trùng, và đủ dễ vận hành để dùng lâu dài.

## Phạm vi

Project gồm 4 phần:

1. Chuẩn hoá dữ liệu đầu vào trong Google Sheet
2. Xây Apps Script để map dữ liệu sang Google Form
3. Thêm cơ chế kiểm soát vận hành: duyệt, gửi, log, chống trùng
4. Kiểm thử và đưa vào dùng thật

## Kiến trúc đề xuất

- `RAW_DATA`
  Nơi dữ liệu điểm danh, điểm bài tập, nhận xét đang được nhập
- `FORM_QUEUE`
  Dữ liệu đã chuẩn hoá, mỗi dòng tương ứng một lần gửi form
- `FORM_LOG`
  Log gửi thành công hoặc lỗi
- `Apps Script`
  Đọc queue, map dữ liệu, submit form, cập nhật trạng thái
- `Custom Menu`
  Cho phép build queue, test từng dòng, gửi hàng loạt

Lý do cần `FORM_QUEUE`:

- Sheet gốc có bố cục theo block buổi học, không phù hợp để submit trực tiếp
- Form cần dữ liệu phẳng, ổn định
- Dễ kiểm tra dữ liệu trước khi gửi
- Dễ debug và trace ngược về dòng gốc

## Nguyên tắc thiết kế

- Form là fixed schema, mapping làm một lần
- Một dòng queue tương ứng một lần gửi form
- Không submit trực tiếp dữ liệu thô từ sheet vận hành
- Dòng đã gửi thì không được gửi lại
- Mọi lần gửi phải có trạng thái, timestamp, lỗi

## Schema đề xuất cho FORM_QUEUE

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

## Ý nghĩa các cột chính

- `record_id`: khoá nội bộ duy nhất cho mỗi lần gửi
- `study_date`: ngày học dùng cho field ngày của form
- `center`: trung tâm, hiện mặc định là `Online`
- `class_name`: lớp
- `student_name`: họ tên học sinh
- `crm_id`: mã CRM
- `attendance`: giá trị chuẩn hoá cho câu `Chuyên cần`
- `attitude_choices`: danh sách option cần tick ở `Ý thức & Thái độ học tập`, ngăn cách bởi `|`
- `homework_score`: điểm bài tập sau khi áp rule chuẩn hoá
- `homework_completed`: số bài hoàn thành, lấy từ `Note bù`
- `homework_comment`: nhận xét BTVN cuối cùng sẽ submit
- `next_task`: nhiệm vụ tuần này, mặc định một giá trị cố định
- `ready_to_send`: `TRUE/FALSE`, chỉ gửi khi là `TRUE`
- `send_status`: `PENDING`, `SENT`, `ERROR`
- `sent_at`: thời điểm gửi thành công
- `error_message`: lỗi cụ thể nếu có
- `source_*`, `raw_*`: dùng để debug và trace về dữ liệu gốc

## Mapping nghiệp vụ đã chốt

### Trung tâm

- luôn là `Online`

### Chuyên cần từ ô điểm danh

- `x` -> `Con tham gia buổi học`
- `x-S` -> `Con tham gia buổi học`
- `P` -> `Con nghỉ phép`
- `KP` -> `Con nghỉ không phép`

### Ý thức và thái độ học tập

- nếu `Điểm danh = P` hoặc `KP` -> không điền
- nếu `Điểm danh = x-S` -> chọn đủ 4 ý nhóm 1:
  - `Con chủ động tương tác với giáo viên và bạn bè.`
  - `Con chủ động ghi chép bài, suy nghĩ và trình bày lời giải.`
  - `Con có tinh thần hợp tác tốt trong học tập.`
  - `Con tích cực tham gia phát biểu.`
- nếu `Điểm danh = x`:
  - nếu `Điểm < 7` -> chọn:
    - `Con có tinh thần hợp tác tốt trong học tập.`
  - nếu `Điểm > 7` -> chọn:
    - `Con có tinh thần hợp tác tốt trong học tập.`
    - `Con chủ động ghi chép bài, suy nghĩ và trình bày lời giải.`
- nhóm 2 và nhóm 3 mặc định không chọn gì

Ghi chú:

- cần chốt thêm trường hợp `Điểm = 7`
- khuyến nghị nghiệp vụ: `>= 7` thì chọn 2 ý, `< 7` thì chọn 1 ý

### Điểm bài tập

- nếu `Điểm gốc = Chưa làm` và `Điểm sửa` trống hoặc `0` -> `0`
- nếu `Điểm gốc = Chưa làm` và `Điểm sửa > 0` -> lấy `Điểm sửa`
- nếu `Điểm gốc = Quên vở` và `Điểm sửa` trống hoặc `0` -> `0`
- nếu `Điểm gốc = Quên vở` và `Điểm sửa > 0` -> lấy `Điểm sửa`
- các trường hợp còn lại -> lấy `Điểm gốc`

### Số bài hoàn thành

- lấy từ ô `Note bù`
- nếu case `Chưa làm` hoặc `Quên vở` và `Điểm sửa` trống hoặc `0` -> bỏ trống

### Nhận xét bài tập về nhà

- nếu `Điểm gốc = Chưa làm` và `Điểm sửa` trống hoặc `0` -> `Con chú ý nộp bài tập cho thầy cô chấm chữa nhé`
- nếu `Điểm gốc = Quên vở` và `Điểm sửa` trống hoặc `0` -> `Con chú ý nộp bài tập cho thầy cô chấm chữa nhé`
- các trường hợp còn lại -> lấy từ ô `Nhận xét`

### Chữa bài tập về nhà tuần trước

- mặc định không điền

### Nhiệm vụ tuần này

- mặc định điền:
  - `Bố mẹ nhắc con xem kỹ bài tập trên lớp và hoàn thành bài tập về nhà.`

## Luồng vận hành đề xuất

1. Nhập dữ liệu vào `RAW_DATA`
2. Build dữ liệu sang `FORM_QUEUE`
3. Rà soát `FORM_QUEUE`
4. Đánh dấu `ready_to_send = TRUE`
5. Gửi thử một dòng
6. Gửi toàn bộ các dòng sẵn sàng
7. Theo dõi `send_status`, `sent_at`, `error_message`

## Menu Apps Script nên có

- `Build Queue For Selected Session`
- `Preview Selected Row`
- `Send Selected Row`
- `Send All Ready Rows`

## Module Apps Script đề xuất

- `config.gs`
  - chứa `FORM_ID`, tên sheet, header name, config chung
- `queue.gs`
  - đọc và ghi `FORM_QUEUE`
- `mapping.gs`
  - chuẩn hoá dữ liệu từ sheet gốc sang dữ liệu submit form
- `submit.gs`
  - tạo `FormResponse` và submit
- `menu.gs`
  - tạo custom menu
- `log.gs`
  - ghi log và lỗi

## Các hàm chính nên có

- `onOpen()`
- `buildQueueFromSelectedSession()`
- `validateQueueRow(row)`
- `previewSelectedRow()`
- `sendSelectedRow()`
- `sendAllReadyRows()`
- `submitFormResponse(data)`
- `markAsSent(...)`
- `markAsError(...)`

## Validate trước khi gửi

- `study_date` không được trống
- `center` phải là giá trị hợp lệ
- `class_name` không được trống
- `student_name` không được trống
- `crm_id` không được trống
- `attendance` phải đúng option form
- `homework_score` phải hợp lệ sau chuẩn hoá
- `homework_comment` không được trống nếu form bắt buộc
- `send_status = SENT` thì bỏ qua
- chỉ gửi khi `ready_to_send = TRUE`

## Kế hoạch triển khai

### Phase 1: Discovery

- chốt schema form
- chốt schema `FORM_QUEUE`
- chốt quy tắc đọc dữ liệu từ block buổi học

### Phase 2: Data Design

- tạo `FORM_QUEUE`
- tạo `FORM_LOG`
- chuẩn hoá cột và status

### Phase 3: Script Core

- tạo custom menu
- viết hàm build queue
- viết validate
- viết submit form
- viết update status

### Phase 4: Test

- test 1 dòng
- test 5 dòng
- test 1 lớp nhỏ

### Phase 5: Go-live

- chạy trên form clone trước
- đối chiếu dữ liệu
- sau khi khớp 100% thì chuyển sang form thật

## Tiêu chí hoàn thành

- không cần copy/paste thủ công từ sheet sang form
- không gửi trùng
- biết chính xác dòng nào lỗi và vì sao
- test thực tế không sai dữ liệu
- có thể vận hành bằng menu trong Google Sheet

## Bước tiếp theo

1. Chốt nốt rule `Điểm = 7`
2. Chốt cách lấy `class_name`
3. Chốt cách lấy `study_date` từ block buổi học
4. Thiết kế mapping chi tiết `sheet gốc -> FORM_QUEUE`
5. Bắt đầu viết Apps Script V1
