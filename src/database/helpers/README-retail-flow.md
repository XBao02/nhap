Triển khai hệ thống **myPos** phiên bản 1 trên ứng dụng di động với chế độ **offline hoàn toàn**, các luồng đi của một phiên bán hàng trong ngành bán lẻ, đảm bảo tuân thủ kiến trúc microservice và các micro-database đã tách (`core.db`, `crm.db`, `pim.db`, `scm.db`, `oms.db`, `restaurant_ops.db`, `payment.db`, `logistics.db`, `analytics.db`, `config.db`). Vì hệ thống hoạt động offline, các luồng sẽ được tối ưu hóa để lưu trữ và xử lý dữ liệu cục bộ trên thiết bị di động, đồng thời chuẩn bị cho việc đồng bộ hóa khi thiết bị kết nối internet.

---

### **1. Bối cảnh hoạt động offline**
- **Mô hình hoạt động**: Ứng dụng di động lưu trữ một phiên bản cục bộ của các micro-database cần thiết cho một phiên bán hàng. Dữ liệu được lưu trong SQLite trên thiết bị và đồng bộ với máy chủ khi có kết nối internet.
- **Yêu cầu chính**:
  - **Khả năng hoạt động offline**: Tất cả các thao tác bán hàng (tạo đơn hàng, kiểm tra tồn kho, áp dụng khuyến mãi, thanh toán) phải được thực hiện cục bộ mà không cần kết nối mạng.
  - **Đồng bộ hóa dữ liệu**: Khi thiết bị online, dữ liệu cục bộ được đồng bộ với máy chủ qua API Gateway, đảm bảo tính nhất quán cuối cùng (eventual consistency).
  - **Tối ưu hiệu suất**: Giảm thiểu truy vấn phức tạp trên thiết bị di động để đảm bảo tốc độ xử lý nhanh.
- **Giả định**:
  - Mỗi thiết bị di động được liên kết với một `store_id` cụ thể trong `core.db`.
  - Dữ liệu cơ bản (sản phẩm, khách hàng, cấu hình, v.v.) được tải trước (pre-sync) từ máy chủ vào thiết bị khi có kết nối.
  - Các micro-database được lưu cục bộ dưới dạng SQLite trên thiết bị, nhưng chỉ chứa dữ liệu liên quan đến `store_id` của thiết bị.

---

### **2. Luồng đi của một phiên bán hàng (Retail)**
Một phiên bán hàng trong ngành bán lẻ bao gồm các bước chính: **kiểm tra tồn kho**, **tạo đơn hàng**, **áp dụng khuyến mãi**, **thanh toán**, và **ghi nhận dữ liệu**. Dưới đây là luồng chi tiết, được điều phối cho chế độ offline:

#### **2.1. Khởi tạo phiên bán hàng**
- **Mô tả**: Người dùng (nhân viên bán hàng) đăng nhập vào ứng dụng di động để bắt đầu phiên bán hàng.
- **Luồng dữ liệu**:
  1. **Xác thực người dùng**:
     - Ứng dụng truy vấn bảng `users` trong `core.db` cục bộ để kiểm tra `username`, `password`, và `store_id`.
     - Kiểm tra `role` và `status` để đảm bảo người dùng có quyền thực hiện bán hàng.
  2. **Tải dữ liệu cấu hình**:
     - Truy vấn bảng `settings` trong `config.db` cục bộ để lấy các quy tắc nghiệp vụ (ví dụ: thuế suất, giới hạn giảm giá).
     - Dữ liệu cấu hình đã được tải trước từ máy chủ khi thiết bị online.
  3. **Tải dữ liệu sản phẩm và tồn kho**:
     - Truy vấn `products`, `product_variants`, và `inventory` trong `pim.db` cục bộ để hiển thị danh sách sản phẩm và số lượng tồn kho khả dụng cho `store_id`.
  4. **Tải thông tin khách hàng và khuyến mãi**:
     - Truy vấn `customers` và `promotions` trong `crm.db` cục bộ để hiển thị thông tin khách hàng (nếu cần) và danh sách khuyến mãi áp dụng.
- **Lưu trữ cục bộ**:
  - Các bảng `users`, `settings`, `products`, `product_variants`, `inventory`, `customers`, `promotions` được lưu cục bộ với dữ liệu giới hạn theo `store_id`.
- **Tương tác offline**:
  - Tất cả truy vấn được thực hiện trên SQLite cục bộ, không cần kết nối mạng.
  - Dữ liệu được nén và tối ưu để giảm dung lượng lưu trữ trên thiết bị.

#### **2.2. Kiểm tra tồn kho**
- **Mô tả**: Trước khi tạo đơn hàng, kiểm tra xem sản phẩm có đủ tồn kho để bán hay không.
- **Luồng dữ liệu**:
  1. Nhân viên chọn sản phẩm từ giao diện ứng dụng.
  2. Ứng dụng truy vấn `inventory` trong `pim.db` cục bộ để kiểm tra `quantity` và `reserved_quantity` cho `product_id` hoặc `variant_id` tương ứng với `store_id`.
  3. Nếu `quantity - reserved_quantity` đủ để đáp ứng yêu cầu, sản phẩm được thêm vào giỏ hàng cục bộ (trạng thái tạm thời).
  4. Ứng dụng cập nhật `reserved_quantity` trong `inventory` cục bộ để giữ số lượng hàng, tránh bán trùng lặp.
- **Lưu trữ cục bộ**:
  - Bảng `inventory` được cập nhật cục bộ với `reserved_quantity` tăng lên.
  - Thay đổi được ghi vào một hàng đợi đồng bộ (sync queue) để gửi lên máy chủ khi online.
- **Tương tác offline**:
  - Kiểm tra tồn kho được thực hiện hoàn toàn trên `pim.db` cục bộ.
  - Nếu tồn kho không đủ, ứng dụng thông báo lỗi cho nhân viên.

#### **2.3. Tạo đơn hàng**
- **Mô tả**: Nhân viên tạo đơn hàng cho khách hàng, bao gồm thông tin sản phẩm, số lượng, và khuyến mãi (nếu có).
- **Luồng dữ liệu**:
  1. **Tạo đơn hàng**:
     - Ứng dụng tạo bản ghi mới trong bảng `orders` (`oms.db` cục bộ) với:
       - `id`: Tạo UUID cục bộ (để tránh xung đột khi đồng bộ).
       - `store_id`: Lấy từ thông tin đăng nhập.
       - `user_id`: ID của nhân viên từ `users` (`core.db`).
       - `customer_id`: Lấy từ `customers` (`crm.db`) nếu khách hàng được chọn.
       - `subtotal`, `tax_amount`, `discount_amount`, `total`: Tính toán dựa trên giỏ hàng và cấu hình thuế (`settings` trong `config.db`).
       - `order_type`: Mặc định là `dine_in` hoặc tùy chọn khác (takeaway, online).
  2. **Thêm chi tiết đơn hàng**:
     - Tạo các bản ghi trong `order_items` (`oms.db` cục bộ) với:
       - `order_id`: Liên kết với đơn hàng vừa tạo.
       - `product_id`, `variant_id`: Lấy từ giỏ hàng.
       - `quantity`, `unit_price`, `total_price`: Tính toán dựa trên thông tin sản phẩm (`products`, `product_variants` trong `pim.db`).
  3. **Áp dụng khuyến mãi**:
     - Truy vấn `promotions` (`crm.db` cục bộ) để kiểm tra `promo_code`, `discount_type`, `discount_value`, và `conditions`.
     - Cập nhật `discount_amount` và `total` trong `orders` nếu khuyến mãi hợp lệ.
     - Nếu khuyến mãi liên quan đến tích điểm, tạo bản ghi tạm trong `loyalty_transactions` (`crm.db` cục bộ) với `order_id` và `points`.
- **Lưu trữ cục bộ**:
  - `orders` và `order_items` được lưu vào `oms.db` cục bộ.
  - `loyalty_transactions` được lưu vào `crm.db` cục bộ (nếu áp dụng tích điểm).
  - Thay đổi được ghi vào hàng đợi đồng bộ.
- **Tương tác offline**:
  - Tất cả tính toán (giá, khuyến mãi, thuế) được thực hiện cục bộ dựa trên dữ liệu trong `pim.db`, `crm.db`, và `config.db`.
  - Nếu đơn hàng liên quan đến bàn ăn hoặc đặt chỗ, truy vấn `tables` hoặc `bookings` trong `restaurant_ops.db` cục bộ để gán `table_id` hoặc `booking_id`.

#### **2.4. Thanh toán**
- **Mô tả**: Xử lý thanh toán cho đơn hàng, hỗ trợ các phương thức như tiền mặt, thẻ, hoặc ví điện tử.
- **Luồng dữ liệu**:
  1. **Kiểm tra cấu hình thanh toán**:
     - Truy vấn `payment_configs` (`payment.db` cục bộ) để lấy danh sách phương thức thanh toán khả dụng (`payment_method`, `gateway_name`) cho `store_id`.
  2. **Tạo giao dịch thanh toán**:
     - Tạo bản ghi trong `transactions` (`oms.db` cục bộ) với:
       - `id`: UUID cục bộ.
       - `order_id`: Liên kết với đơn hàng.
       - `store_id`: Lấy từ thông tin đăng nhập.
       - `amount`: Lấy từ `total` của đơn hàng.
       - `payment_method`: Lựa chọn của khách hàng (ví dụ: cash, card).
       - `status`: Mặc định là `pending` (sẽ cập nhật khi đồng bộ).
  3. **Ghi nhận thanh toán qua cổng (nếu có)**:
     - Nếu là thanh toán qua cổng (ví dụ: thẻ, ví điện tử), tạo bản ghi tạm trong `payment_transactions` (`payment.db` cục bộ) với `order_id`, `transaction_id`, và `status` là `pending`.
     - Lưu thông tin giao dịch vào hàng đợi đồng bộ để xử lý khi online.
  4. **Cập nhật tồn kho**:
     - Giảm `quantity` và `reserved_quantity` trong `inventory` (`pim.db` cục bộ) dựa trên `order_items`.
  5. **Cập nhật tích điểm (nếu có)**:
     - Cập nhật `points` trong `loyalty_accounts` (`crm.db` cục bộ) và xác nhận bản ghi trong `loyalty_transactions`.
- **Lưu trữ cục bộ**:
  - `transactions` và `payment_transactions` được lưu vào `oms.db` và `payment.db` cục bộ.
  - `inventory` và `loyalty_accounts` được cập nhật cục bộ.
  - Tất cả thay đổi được ghi vào hàng đợi đồng bộ.
- **Tương tác offline**:
  - Thanh toán tiền mặt được xử lý hoàn toàn cục bộ.
  - Thanh toán qua cổng được ghi nhận tạm thời và chờ đồng bộ khi online.

#### **2.5. Ghi nhận dữ liệu và hoàn tất**
- **Mô tả**: Ghi lại nhật ký kiểm toán và chuẩn từ dữ liệu để đồng bộ sau này.
- **Luồng dữ liệu**:
  1. **Ghi nhật ký kiểm toán**:
     - Tạo bản ghi trong `audit_logs` (`analytics.db` cục bộ) với:
       - `store_id`, `user_id`: Lấy từ thông tin đăng nhập.
       - `action`: Ví dụ: `create_order`, `complete_payment`.
       - `table_name`, `record_id`: Liên quan đến `orders`, `transactions`, v.v.
       - `new_values`: Dữ liệu mới của đơn hàng hoặc giao dịch.
  2. **Cập nhật trạng thái đơn hàng**:
     - Cập nhật `status` trong `orders` (`oms.db` cục bộ) thành `completed` sau khi thanh toán thành công.
  3. **Chuẩn bị đồng bộ**:
     - Lưu tất cả thay đổi (trong `orders`, `order_items`, `transactions`, `payment_transactions`, `inventory`, `loyalty_transactions`, `audit_logs`) vào hàng đợi đồng bộ cục bộ.
- **Lưu trữ cục bộ**:
  - `audit_logs` được lưu vào `analytics.db` cục bộ.
  - Hàng đợi đồng bộ lưu trữ dưới dạng tệp JSON hoặc bảng SQLite riêng để theo dõi các thay đổi.
- **Tương tác offline**:
  - Tất cả nhật ký được ghi cục bộ và chờ đồng bộ khi online.

#### **2.6. Đồng bộ hóa khi online**
- **Mô tả**: Khi thiết bị kết nối internet, dữ liệu cục bộ được đồng bộ với máy chủ.
- **Luồng dữ liệu**:
  1. **Gửi dữ liệu lên máy chủ**:
     - Ứng dụng gửi các bản ghi trong hàng đợi đồng bộ (từ `oms.db`, `payment.db`, `pim.db`, `crm.db`, `analytics.db`) đến API Gateway.
     - API Gateway phân phối dữ liệu đến các dịch vụ tương ứng (`oms`, `payment`, `pim`, `crm`, `analytics`).
  2. **Xử lý xung đột**:
     - Máy chủ sử dụng `id` (UUID) và `created_at` để phát hiện và giải quyết xung đột.
     - Ví dụ: Nếu hai thiết bị cùng tạo đơn hàng cho cùng một sản phẩm, máy chủ ưu tiên bản ghi có `created_at` sớm hơn hoặc hợp nhất dữ liệu.
  3. **Cập nhật dữ liệu cục bộ**:
     - Máy chủ gửi về dữ liệu mới hoặc cập nhật (ví dụ: sản phẩm mới, tồn kho, khuyến mãi) để đồng bộ vào các micro-database cục bộ.
  4. **Xác nhận thanh toán qua cổng**:
     - Gửi các bản ghi `payment_transactions` đến cổng thanh toán qua API Gateway.
     - Cập nhật `status` trong `payment_transactions` và `transactions` dựa trên phản hồi từ cổng thanh toán.
- **Lưu trữ cục bộ**:
  - Sau khi đồng bộ thành công, hàng đợi đồng bộ được xóa hoặc đánh dấu hoàn tất.
  - Các micro-database cục bộ được cập nhật với dữ liệu mới từ máy chủ.
- **Tương tác**:
  - Đồng bộ hóa được thực hiện bất đồng bộ thông qua message queue (như RabbitMQ) để đảm bảo không làm gián đoạn hoạt động offline.

---

### **3. Tóm tắt luồng bán hàng offline**
1. **Khởi tạo**:
   - Xác thực người dùng (`core.db`), tải cấu hình (`config.db`), sản phẩm (`pim.db`), khách hàng và khuyến mãi (`crm.db`).
2. **Kiểm tra tồn kho**:
   - Kiểm tra và giữ tồn kho trong `inventory` (`pim.db`).
3. **Tạo đơn hàng**:
   - Tạo `orders` và `order_items` (`oms.db`), áp dụng khuyến mãi (`crm.db`), gán bàn/đặt chỗ (`restaurant_ops.db`).
4. **Thanh toán**:
   - Ghi giao dịch vào `transactions` (`oms.db`) và `payment_transactions` (`payment.db`), cập nhật tồn kho và tích điểm.
5. **Ghi nhận và đồng bộ**:
   - Ghi nhật ký vào `audit_logs` (`analytics.db`).
   - Lưu thay đổi vào hàng đợi đồng bộ và gửi lên máy chủ khi online.

---

### **4. Lưu ý và tối ưu hóa cho chế độ offline**
- **Lưu trữ cục bộ**:
  - Chỉ lưu dữ liệu liên quan đến `store_id` để giảm dung lượng.
  - Sử dụng SQLite với các chỉ mục (index) trên các cột thường xuyên truy vấn (như `store_id`, `product_id`) để tối ưu hiệu suất.
- **Hàng đợi đồng bộ**:
  - Lưu trữ hàng đợi đồng bộ trong một bảng SQLite riêng (ví dụ: `sync_queue`) với các trường: `table_name`, `record_id`, `action`, `data`, `timestamp`.
  - Sử dụng cơ chế retry để xử lý lỗi đồng bộ khi kết nối không ổn định.
- **Xử lý xung đột**:
  - Sử dụng UUID cho các bản ghi mới (`id` trong `orders`, `transactions`, v.v.) để tránh trùng lặp.
  - Lưu `created_at` và `updated_at` để hỗ trợ giải quyết xung đột khi đồng bộ.
- **Hiệu suất**:
  - Tối ưu hóa truy vấn bằng cách sử dụng bộ nhớ đệm cục bộ (cache) cho dữ liệu tĩnh (sản phẩm, cấu hình).
  - Giảm số lượng truy vấn bằng cách tải trước dữ liệu phổ biến (ví dụ: danh sách sản phẩm bán chạy).
- **Bảo mật**:
  - Mã hóa dữ liệu nhạy cảm (như `password` trong `users`, `secret_key` trong `payment_configs`) trên thiết bị.
  - Xác thực người dùng cục bộ để ngăn truy cập trái phép.

---

### **5. Đề xuất triển khai**
- **Cơ sở dữ liệu cục bộ**: Sử dụng SQLite với các micro-database riêng biệt trên thiết bị, mỗi database chỉ chứa dữ liệu liên quan đến `store_id`.
- **Hàng đợi đồng bộ**: Triển khai một bảng `sync_queue` để lưu trữ các thay đổi cục bộ. Khi online, ứng dụng gửi dữ liệu qua API REST hoặc GraphQL đến API Gateway.
- **Tối ưu giao diện**: Giao diện ứng dụng cần hiển thị trạng thái đồng bộ (pending, completed) và cảnh báo nếu tồn kho thấp.
- **Kiểm tra dữ liệu**: Trước khi tạo đơn hàng, ứng dụng kiểm tra ràng buộc logic (ví dụ: khuyến mãi hết hạn, tồn kho không đủ) để tránh lỗi khi đồng bộ.

---
