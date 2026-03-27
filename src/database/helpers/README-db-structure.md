Cấu trúc cơ sở dữ liệu myPos, tách thành các cơ sở dữ liệu độc lập nhưng có tính liên kết thông qua `store_id`. Đây là kiến trúc microservices database cho phép mở rộng không giới hạn:

## 1. **Core Management Database** (`core.db`)
**Chức năng**: Quản lý thông tin cốt lõi về doanh nghiệp và cửa hàng
**Bảng chính**: `enterprises`, `stores`, `users`
**Mô tả**: 
- Đây là trung tâm điều khiển chính của toàn hệ thống
- Quản lý cấu trúc tổ chức, phân quyền người dùng
- Cung cấp `store_id` làm khóa liên kết cho các database khác
- Hỗ trợ multi-tenant architecture

## 2. **Customer Relationship Database** (`crm.db`)
**Chức năng**: Quản lý quan hệ khách hàng và chương trình khuyến mãi
**Bảng chính**: `customers`, `loyalty_accounts`, `loyalty_transactions`, `promotions`
**Mô tả**:
- Quản lý thông tin khách hàng và lịch sử tương tác
- Xử lý chương trình tích điểm, khuyến mãi
- Có thể mở rộng thêm: phân khúc khách hàng, marketing automation
- Liên kết với Core qua `store_id`

## 3. **Product & Inventory Database** (`pim.db`)
**Chức năng**: Quản lý sản phẩm và tồn kho
**Bảng chính**: `categories`, `products`, `product_variants`, `inventory`
**Mô tả**:
- Quản lý catalog sản phẩm, phân loại, biến thể
- Theo dõi tồn kho real-time
- Có thể mở rộng: quản lý kho đa tầng, tracking lô hàng
- Hỗ trợ multiple warehouses per store

## 4. **Supply Chain Database** (`scm.db`)
**Chức năng**: Quản lý chuỗi cung ứng
**Bảng chính**: `suppliers`, `purchase_orders`, `purchase_order_items`
**Mô tả**:
- Quản lý nhà cung cấp và đơn đặt hàng
- Tracking quá trình nhập kho
- Có thể mở rộng: quản lý hợp đồng, đánh giá nhà cung cấp
- Tích hợp với PIM database để cập nhật inventory

## 5. **Order Management Database** (`oms.db`)
**Chức năng**: Quản lý đơn hàng và giao dịch
**Bảng chính**: `orders`, `order_items`, `transactions`
**Mô tả**:
- Xử lý đơn hàng từ nhiều kênh (in-store, online)
- Quản lý trạng thái đơn hàng và workflow
- Có thể mở rộng: order orchestration, fulfillment management
- Liên kết với Payment database cho xử lý thanh toán

## 6. **Restaurant Operations Database** (`restaurant_ops.db`)
**Chức năng**: Quản lý hoạt động nhà hàng
**Bảng chính**: `tables`, `bookings`
**Mô tả**:
- Quản lý bàn, đặt chỗ cho ngành F&B
- Có thể mở rộng: quản lý menu theo thời gian, staff scheduling
- Module này chỉ active cho business type = restaurant
- Có thể nhân bản cho các ngành nghề khác (salon, clinic, etc.)

## 7. **Payment Processing Database** (`payment.db`)
**Chức năng**: Xử lý thanh toán và tích hợp gateway
**Bảng chính**: `payment_transactions`, `payment_configs`
**Mô tả**:
- Tích hợp multiple payment gateways
- Xử lý reconciliation và settlement
- Có thể mở rộng: fraud detection, payment analytics
- Hỗ trợ multiple currencies và payment methods

## 8. **Delivery & Logistics Database** (`logistics.db`)
**Chức năng**: Quản lý giao hàng và logistics
**Bảng chính**: `online_orders`
**Mô tả**:
- Quản lý đơn hàng online và delivery
- Tích hợp với third-party delivery services
- Có thể mở rộng: route optimization, tracking real-time
- Hỗ trợ multiple delivery partners

## 9. **Analytics & Reporting Database** (`analytics.db`)
**Chức năng**: Phân tích dữ liệu và báo cáo
**Bảng chính**: `reports`, `audit_logs`
**Mô tả**:
- Tạo báo cáo đa chiều từ các database khác
- Audit trail cho compliance
- Có thể mở rộng: real-time dashboard, predictive analytics
- Data warehouse cho business intelligence

## 10. **Configuration Database** (`config.db`)
**Chức năng**: Quản lý cấu hình hệ thống
**Bảng chính**: `settings`
**Mô tả**:
- Lưu trữ cấu hình của từng store
- Feature flags, business rules
- Có thể mở rộng: A/B testing configuration, workflow rules

## **Kiến trúc liên kết và mở rộng:**

### **Nguyên tắc liên kết:**
- Tất cả databases đều sử dụng `store_id` làm tenant identifier
- Không có foreign key cross-database, sử dụng eventual consistency
- API Gateway làm orchestration layer giữa các databases

### **Khả năng mở rộng ngang:**
- Mỗi database có thể scale độc lập
- Sharding theo `store_id` hoặc geographic region
- Microservices architecture cho phép deploy riêng biệt

### **Khả năng mở rộng dọc:**
- Thêm industry-specific databases (healthcare, automotive, etc.)
- Plugin architecture cho custom business logic
- Event-driven communication giữa các databases

### **Multi-tenant support:**
- Mỗi enterprise có thể có nhiều stores
- Data isolation hoàn toàn theo `store_id`
- Flexible pricing model theo số stores hoặc features

Kiến trúc này cho phép bạn bắt đầu với SQLite cho phiên bản mobile, sau đó migrate từng database lên cloud databases (PostgreSQL, MongoDB) khi cần thiết mà không ảnh hưởng đến các components khác.