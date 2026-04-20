# Implementation Checklist

## Mục tiêu V1

- build dữ liệu từ sheet gốc sang `FORM_QUEUE`
- gửi 1 dòng sang Google Form
- gửi hàng loạt các dòng sẵn sàng
- cập nhật trạng thái và lỗi

## 1. Chốt nghiệp vụ

- [ ] chốt rule `Điểm = 7`
- [ ] chốt nguồn của `class_name`
- [ ] chốt năm dùng để parse `study_date`
- [ ] xác nhận title chính xác của các câu hỏi trong Google Form

## 2. Chuẩn bị Google Sheet

- [ ] tạo sheet `FORM_QUEUE`
- [ ] tạo sheet `FORM_LOG`
- [ ] thêm header cho `FORM_QUEUE`
- [ ] thêm header cho `FORM_LOG`
- [ ] kiểm tra sheet gốc có đủ cột `CRM`, `Họ và tên HS`, `Điểm Danh`, `Điểm gốc`, `Điểm sửa`, `Note bù`, `Nhận xét`

## 3. Chuẩn bị Apps Script

- [ ] tạo Apps Script project gắn với Google Sheet
- [ ] thêm `FORM_ID`
- [ ] tạo file `config.gs`
- [ ] tạo file `constants.gs`
- [ ] tạo file `menu.gs`
- [ ] tạo file `raw_sheet.gs`
- [ ] tạo file `mapping.gs`
- [ ] tạo file `queue.gs`
- [ ] tạo file `validation.gs`
- [ ] tạo file `form_submit.gs`
- [ ] tạo file `log.gs`
- [ ] tạo file `main.gs`

## 4. Build Queue

- [ ] detect được block buổi học đang chọn
- [ ] đọc được cột cố định
- [ ] đọc được cột trong block buổi học
- [ ] map đúng `attendance`
- [ ] map đúng `attitude_choices`
- [ ] map đúng `homework_score`
- [ ] map đúng `homework_completed`
- [ ] map đúng `homework_comment`
- [ ] append đúng vào `FORM_QUEUE`

## 5. Validate

- [ ] validate được field bắt buộc
- [ ] không cho gửi nếu `ready_to_send != TRUE`
- [ ] không cho gửi nếu `send_status = SENT`
- [ ] ghi được `error_message`

## 6. Submit Form

- [ ] mở được form bằng `FORM_ID`
- [ ] tìm được item theo title
- [ ] submit được 1 dòng mẫu
- [ ] cập nhật `SENT`
- [ ] cập nhật `sent_at`
- [ ] ghi log thành công
- [ ] ghi log lỗi nếu submit fail

## 7. Menu vận hành

- [ ] `Build Queue`
- [ ] `Preview Row`
- [ ] `Send One`
- [ ] `Send Ready Rows`

## 8. Test tối thiểu

- [ ] test 1 dòng có `attendance = x`
- [ ] test 1 dòng có `attendance = x-S`
- [ ] test 1 dòng có `attendance = P`
- [ ] test 1 dòng có `Điểm gốc = Chưa làm`
- [ ] test 1 dòng có `Điểm gốc = Quên vở`
- [ ] test 1 dòng có `Điểm sửa > 0`
- [ ] test batch 5 dòng

## 9. Go-live

- [ ] test trên form clone trước
- [ ] đối chiếu response với dữ liệu queue
- [ ] chạy 1 dòng trên form thật
- [ ] chạy batch nhỏ
- [ ] chốt quy trình vận hành
