# Đặc tả mapping sheet gốc -> FORM_QUEUE

## Mục tiêu

Tài liệu này mô tả cách đọc dữ liệu từ sheet vận hành hiện tại và chuẩn hoá thành các dòng trong `FORM_QUEUE` để Apps Script có thể submit Google Form ổn định.

## Giả định hiện tại

- Dữ liệu học sinh nằm ở các cột cố định bên trái
- Mỗi buổi học là một block cột riêng bên phải
- Mỗi block buổi học có các cột dạng:
  - `Note bù`
  - `Nhận xét`
  - `Điểm Danh`
  - `Điểm gốc`
  - `Điểm sửa`
  - `Note bù`
  - `Nhận xét`
- Script sẽ chọn một block buổi học cụ thể để build queue
- Trung tâm luôn là `Online`

## Cấu trúc logic của sheet gốc

### Nhóm cột cố định bên trái

Các cột này dùng chung cho mọi buổi:

- `CRM`
- `Họ và tên HS`
- có thể có thêm `STT`, `SĐT Phụ huynh`, `Trạng thái`

### Nhóm cột theo từng buổi

Mỗi block buổi học có tiêu đề dạng:

```text
Buổi 2 (11/04)
```

Trong block đó, dữ liệu cần dùng cho form gồm:

- `Điểm Danh`
- `Điểm gốc`
- `Điểm sửa`
- `Note bù`
- `Nhận xét`

## Mục tiêu đầu ra của mỗi record queue

Mỗi dòng trong `FORM_QUEUE` tương ứng:

- 1 học sinh
- 1 buổi học
- 1 lần submit form

## Schema FORM_QUEUE sử dụng

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

## Mapping chi tiết

### 1. record_id

Nguồn:

- ghép từ `study_date`, `center`, `class_name`, `crm_id`

Ví dụ:

```text
2025-04-11_Online_7A_ONL23-00467
```

Yêu cầu:

- phải unique
- dùng để chống gửi trùng

### 2. study_date

Nguồn:

- lấy từ tiêu đề block buổi học, ví dụ `Buổi 2 (11/04)`

Rule:

- parse phần ngày trong ngoặc
- chuẩn hoá thành date thực để submit vào Google Form
- năm học cần được bổ sung theo config

Ví dụ:

- `Buổi 2 (11/04)` -> `2025-04-11` hoặc giá trị Date object tương ứng

Ghi chú:

- cần chốt năm mặc định theo kỳ vận hành thực tế

### 3. center

Nguồn:

- không đọc từ sheet

Rule:

- luôn set là `Online`

### 4. class_name

Nguồn:

- chưa chốt

Khuyến nghị:

- lấy từ tên sheet hoặc một ô config riêng
- không nên suy luận từ dữ liệu rời rạc

Trạng thái:

- cần chốt trước khi code

### 5. student_name

Nguồn:

- cột `Họ và tên HS`

Rule:

- trim khoảng trắng đầu cuối

### 6. crm_id

Nguồn:

- cột `CRM`

Rule:

- convert về text
- giữ nguyên ký tự, không để mất số 0 đầu nếu có

### 7. attendance

Nguồn:

- cột `Điểm Danh` trong block buổi học

Rule chuẩn hoá:

- `x` -> `Con tham gia buổi học`
- `x-S` -> `Con tham gia buổi học`
- `P` -> `Con nghỉ phép`
- `KP` -> `Con nghỉ không phép`

Lưu thêm:

- `raw_attendance` = giá trị gốc trong sheet

### 8. attitude_choices

Nguồn:

- không lấy trực tiếp từ sheet
- sinh từ rule dựa trên `Điểm Danh` và `homework_score`

Rule:

- nếu `raw_attendance = P` hoặc `KP` -> để trống
- nếu `raw_attendance = x-S` -> chọn đủ 4 ý:
  - `Con chủ động tương tác với giáo viên và bạn bè.`
  - `Con chủ động ghi chép bài, suy nghĩ và trình bày lời giải.`
  - `Con có tinh thần hợp tác tốt trong học tập.`
  - `Con tích cực tham gia phát biểu.`
- nếu `raw_attendance = x`:
  - nếu `homework_score < 7` -> chọn:
    - `Con có tinh thần hợp tác tốt trong học tập.`
  - nếu `homework_score > 7` -> chọn:
    - `Con có tinh thần hợp tác tốt trong học tập.`
    - `Con chủ động ghi chép bài, suy nghĩ và trình bày lời giải.`

Format lưu:

- nhiều lựa chọn cách nhau bởi dấu `|`

Ví dụ:

```text
Con có tinh thần hợp tác tốt trong học tập.|Con chủ động ghi chép bài, suy nghĩ và trình bày lời giải.
```

Ghi chú:

- cần chốt nốt rule cho trường hợp `homework_score = 7`

### 9. homework_score

Nguồn:

- `Điểm gốc` trong block buổi học
- `Điểm sửa` trong block buổi học

Rule:

- nếu `Điểm gốc = Chưa làm` và `Điểm sửa` trống hoặc `0` -> `0`
- nếu `Điểm gốc = Chưa làm` và `Điểm sửa > 0` -> lấy `Điểm sửa`
- nếu `Điểm gốc = Quên vở` và `Điểm sửa` trống hoặc `0` -> `0`
- nếu `Điểm gốc = Quên vở` và `Điểm sửa > 0` -> lấy `Điểm sửa`
- các trường hợp còn lại -> lấy `Điểm gốc`

Lưu thêm:

- `raw_score_original`
- `raw_score_makeup`

Yêu cầu chuẩn hoá:

- convert về text đúng format form
- nếu có số thập phân, dùng dấu phẩy nếu form yêu cầu

### 10. homework_completed

Nguồn:

- cột `Note bù` trong block buổi học

Rule:

- dùng trực tiếp làm số bài hoàn thành, ví dụ `4/5`
- nếu `Điểm gốc = Chưa làm` hoặc `Quên vở` và `Điểm sửa` trống hoặc `0` -> để trống

Lưu thêm:

- `raw_note_bu`

### 11. homework_comment

Nguồn:

- cột `Nhận xét` trong block buổi học

Rule:

- nếu `Điểm gốc = Chưa làm` và `Điểm sửa` trống hoặc `0` ->
  - `Con chú ý nộp bài tập cho thầy cô chấm chữa nhé`
- nếu `Điểm gốc = Quên vở` và `Điểm sửa` trống hoặc `0` ->
  - `Con chú ý nộp bài tập cho thầy cô chấm chữa nhé`
- các trường hợp còn lại -> lấy từ ô `Nhận xét`

Lưu thêm:

- `raw_comment`

### 12. next_task

Nguồn:

- không đọc từ sheet

Rule:

- luôn set:
  - `Bố mẹ nhắc con xem kỹ bài tập trên lớp và hoàn thành bài tập về nhà.`

### 13. ready_to_send

Nguồn:

- set mặc định khi build queue

Khuyến nghị:

- mặc định `FALSE`
- sau khi rà soát, người dùng mới chuyển sang `TRUE`

Nếu muốn tối ưu thao tác:

- có thể cho config để build queue với `TRUE`
- nhưng V1 nên mặc định `FALSE`

### 14. send_status

Rule:

- khi build queue -> `PENDING`
- khi gửi thành công -> `SENT`
- khi gửi lỗi -> `ERROR`

### 15. sent_at

Rule:

- chỉ ghi khi gửi thành công

### 16. error_message

Rule:

- ghi lỗi chi tiết nếu validate fail hoặc submit fail

### 17. source_sheet

Nguồn:

- tên sheet gốc hiện tại

### 18. source_row

Nguồn:

- số dòng của học sinh trong sheet gốc

### 19. source_session

Nguồn:

- tiêu đề block buổi học, ví dụ `Buổi 2 (11/04)`

### 20. raw fields

Gồm:

- `raw_attendance`
- `raw_score_original`
- `raw_score_makeup`
- `raw_note_bu`
- `raw_comment`

Mục đích:

- trace ngược dữ liệu
- debug khi queue sai hoặc submit sai

## Rule bỏ qua dòng

Script build queue nên bỏ qua các dòng không hợp lệ ngay từ đầu:

- không có `CRM`
- không có `Họ và tên HS`
- học sinh không còn đang học nếu nghiệp vụ yêu cầu loại bỏ
- block buổi học không có dữ liệu liên quan

Khuyến nghị:

- dòng nào bị bỏ qua nên được log ra summary cuối lần build

## Rule validate trước khi submit form

- `study_date` không trống
- `center = Online`
- `class_name` không trống
- `student_name` không trống
- `crm_id` không trống
- `attendance` thuộc 1 trong 3 giá trị hợp lệ
- `send_status != SENT`
- `ready_to_send = TRUE`

## Luồng xử lý đề xuất

### Bước 1: Chọn block buổi học

Script cần biết buổi nào đang được build queue. Có thể dùng một trong 2 cách:

- cách A: chọn bằng config hoặc prompt
- cách B: chọn theo cột đang active

Khuyến nghị:

- V1 dùng config rõ ràng hoặc chọn cột active trong block cần build

### Bước 2: Đọc các cột mốc

Script xác định:

- cột `CRM`
- cột `Họ và tên HS`
- cột `Điểm Danh`
- cột `Điểm gốc`
- cột `Điểm sửa`
- cột `Note bù`
- cột `Nhận xét`

Khuyến nghị:

- nên dò theo hàng tiêu đề thay vì hardcode số cột
- nhưng vẫn cần một rule xác định đúng block buổi học

### Bước 3: Duyệt từng dòng học sinh

Cho mỗi dòng:

- đọc dữ liệu gốc
- chuẩn hoá theo rule nghiệp vụ
- tạo record queue
- append vào `FORM_QUEUE`

### Bước 4: Rà soát queue

Người dùng kiểm tra:

- ngày học
- lớp
- nhận xét
- điểm
- trạng thái sẵn sàng gửi

### Bước 5: Gửi form

Script đọc các dòng:

- `ready_to_send = TRUE`
- `send_status = PENDING`

và submit form.

## Các điểm còn phải chốt trước khi code

1. `class_name` lấy từ đâu
2. `study_date` dùng năm nào
3. `homework_score = 7` thì `attitude_choices` thuộc nhánh nào
4. block nào trong sheet là block chuẩn để lấy `Note bù` và `Nhận xét` nếu có nhiều cụm tương tự

## Khuyến nghị triển khai V1

- chưa đọc tự động toàn bộ nhiều buổi
- chỉ build queue cho một buổi được chọn
- chưa submit hàng loạt toàn bộ sheet ngay
- test 3 đến 5 học sinh trước
- gửi lên form clone trước khi dùng form thật
