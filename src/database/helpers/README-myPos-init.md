# Quy trình khởi tạo ứng dụng myPos offline

## Bước 1: Tạo micro-database cục bộ
- Tạo 10 tệp SQLite: `core.db`, `crm.db`, `pim.db`, `scm.db`, `oms.db`, `fnb.db`, `payment.db`, `analytics.db`, `config.db`.
- Tạo bảng `sync_queue` để lưu trữ thay đổi cục bộ.
- Tạo chỉ mục trên các cột như `store_id`, `product_id`.

## Bước 2: Khởi tạo dữ liệu mặc định
- **Doanh nghiệp (`core.db`)**: Tạo doanh nghiệp mặc định (`id: ent_001`, `name: Doanh nghiệp cá nhân`).
- **Cửa hàng (`core.db`)**: Tạo cửa hàng mặc định (`id: store_001`, `name: Cửa hàng cá nhân`).
- **Cấu hình (`config.db`)**: Tạo các quy tắc mặc định (thuế suất 10%, thanh toán tiền mặt, tích điểm tắt).
- **Thanh toán (`payment.db`)**: Tạo cấu hình thanh toán tiền mặt.
- **Sản phẩm (`pim.db`)**: Tạo danh mục, sản phẩm, và tồn kho mẫu.

## Bước 3: Đăng ký người dùng
- Hiển thị form đăng ký (`username`, `password`, `full_name`, v.v.).
- Kiểm tra `username` không trùng lặp, mã hóa `password`.
- Tạo người dùng với quyền `admin` trong `users` (`core.db`).
- Ghi nhật ký vào `audit_logs` và thêm vào `sync_queue`.

## Bước 4: Kiểm tra và hoàn tất
- Xác minh dữ liệu mặc định và quyền người dùng.
- Tải sản phẩm và cấu hình vào giao diện.
- Ghi nhật ký khởi tạo vào `audit_logs` và `sync_queue`.
- Hiển thị thông báo “Ứng dụng sẵn sàng”.