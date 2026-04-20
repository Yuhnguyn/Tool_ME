# 🚀 ToolME: Google Form Automation System

**ToolME** là giải pháp tự động hóa giúp đội ngũ vận hành loại bỏ việc nhập liệu thủ công trên Google Form. Chỉ với vài cú click, dữ liệu từ bảng tính sẽ được chuẩn hóa và "đổ" thẳng vào hệ thống báo cáo.

---

<div align="center">
  <video src="assets/video/demo.mp4" width="100%" controls></video>
</div>

> *Mẹo: Nếu video không tự động hiển thị, bạn có thể xem trực tiếp tại [đây](https://github.com/Yuhnguyn/Tool_ME/blob/main/assets/video/demo.mp4).*

---

## 🛠 Quy trình 3 Bước Siêu Đơn Giản

### Bước 1: Build Queue (Chuẩn bị dữ liệu)

1. Mở Sheet **Lớp Online** (sheet gốc chứa điểm và chuyên cần).
2. Click chọn một ô trong cột của buổi học bạn muốn gửi báo cáo (Ví dụ: Click vào ô "Buổi 2").
3. Trên thanh Menu, chọn: Form Automation > `Build Queue for Selected Session`.
   * *Kết quả:* Script sẽ tự động đọc tên HS, CRM, Điểm, Nhận xét... và ghi vào sheet `FORM_QUEUE`.

### Bước 2: Review (Kiểm tra & Sửa lỗi)

1. Mở sheet `FORM_QUEUE`.
2. Rà soát các thông tin quan trọng: **Ngày học**, **Lớp**, **Nhận xét**.
3. Tại cột `Ready to Send`, chuyển giá trị thành **TRUE** cho những dòng bạn muốn gửi đi.
   * *Mẹo:* Bạn có thể sửa trực tiếp nội dung nhận xét ở đây nếu muốn cá nhân hóa thêm cho từng học sinh.

### Bước 3: Submit (Gửi Form)

1. Chọn menu: `ToolME` > `Send All Ready Rows`.
2. Theo dõi cột `Send Status`:
   * ✅ **SENT**: Gửi thành công.
   * ❌ **ERROR**: Gửi thất bại (xem lý do tại cột `Error Message`).

---

## 💡 Các Tính Năng Thông Minh

* **Auto-Normalize:** Tự động đổi `x` thành "Con đi học", `7.5` thành định dạng số Google Form yêu cầu.
* **Smart Comment:** Tự động sinh nhận xét thái độ dựa trên điểm số (Học sinh điểm cao tự động được khen tích cực).
* **Duplicate Protection:** Mỗi học sinh trong một buổi học chỉ có 1 `Record ID` duy nhất, không bao giờ lo gửi trùng dữ liệu.
* **Error Logging:** Lưu vết chi tiết mọi lỗi xảy ra để bạn dễ dàng sửa chữa.

---

## ⚠️ Lưu ý Quan trọng

1. **Gửi thử trước:** Luôn dùng tính năng `Preview Selected Row` hoặc `Send Selected Row` để kiểm tra 1 học sinh trước khi chạy hàng loạt.
2. **Trạng thái HS:** Tool sẽ tự động bỏ qua những học sinh có trạng thái "Nghỉ hẳn" hoặc "Chuyển đi".
3. **Reset lỗi:** Nếu muốn gửi lại những dòng bị lỗi sau khi đã sửa dữ liệu, hãy chạy `ToolME` > `Reset Error Status`.

---

*Phát triển bởi HuyNguyen*

# Tool_ME
