# Operator Runbook

## Mục tiêu

Hướng dẫn ngắn để vận hành tool hàng tuần mà không cần làm thủ công trên Google Form.

## Quy trình chuẩn

### 1. Chuẩn bị dữ liệu

- cập nhật đầy đủ dữ liệu trong sheet gốc
- kiểm tra các cột:
  - `CRM`
  - `Họ và tên HS`
  - `Điểm Danh`
  - `Điểm gốc`
  - `Điểm sửa`
  - `Note bù`
  - `Nhận xét`

### 2. Build Queue

- mở sheet gốc
- chọn một ô trong block buổi học cần gửi
- chạy menu `Build Queue`

Kết quả mong đợi:

- dữ liệu được sinh sang sheet `FORM_QUEUE`
- mỗi học sinh có một dòng

### 3. Kiểm tra queue

- mở `FORM_QUEUE`
- kiểm tra nhanh:
  - `study_date`
  - `class_name`
  - `student_name`
  - `crm_id`
  - `attendance`
  - `homework_score`
  - `homework_comment`

- nếu đúng thì set `ready_to_send = TRUE`
- nếu có lỗi dữ liệu thì sửa trước khi gửi

### 4. Gửi thử một dòng

- chọn một dòng trong `FORM_QUEUE`
- chạy menu `Send One`
- kiểm tra response trong Google Form

Nếu đúng:

- tiếp tục gửi hàng loạt

Nếu sai:

- sửa dữ liệu hoặc sửa rule trước khi chạy tiếp

### 5. Gửi hàng loạt

- đảm bảo các dòng cần gửi có:
  - `ready_to_send = TRUE`
  - `send_status = PENDING`
- chạy menu `Send Ready Rows`

Kết quả mong đợi:

- dòng gửi thành công có `send_status = SENT`
- có `sent_at`

### 6. Xử lý lỗi

Nếu một dòng lỗi:

- xem cột `error_message`
- sửa dữ liệu trong `FORM_QUEUE`
- chuyển `send_status` về `PENDING` nếu cần
- chạy lại `Send One`

## Quy tắc vận hành

- luôn gửi thử 1 dòng trước khi gửi hàng loạt
- không gửi khi chưa kiểm tra `FORM_QUEUE`
- không sửa trực tiếp dữ liệu đã `SENT` nếu không có lý do rõ ràng
- không chạy batch khi chưa chắc block buổi học đã đúng

## Dấu hiệu hệ thống hoạt động đúng

- queue build đúng số học sinh cần gửi
- response trên form khớp với queue
- không có dòng bị gửi trùng
- log có thể truy vết được lỗi
