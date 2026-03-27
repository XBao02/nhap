export default {
  main: {
    welcome: 'Xin chào, {{name}}',
  },
  menu: {
    logo:"Xin chào!",
    dashboard: {
      title: 'Bảng tổng hợp',
    },
    groups: {
      main: 'Menu Chính',
      analytics: 'Báo cáo & Phân tích',
      admin: 'Quản trị',
      system: 'Cài đặt Hệ thống',
      support: 'Hỗ trợ & Thông tin',
    },
    pos: {
      title: 'Bán hàng',
      mainPos: 'POS chính',
      cart: 'Giỏ hàng',
      scanner: 'Quét QR',
      payment: {
        title: 'Thanh toán',
        methods: 'Phương thức thanh toán',
        qrCode: 'Thanh toán QR',
        status: 'Trạng thái thanh toán',
      },
    },
    inventory: {
      title: 'Quản lý kho',
      products: {
        title: 'Sản phẩm',
        list: 'Danh sách sản phẩm',
        create: 'Tạo sản phẩm',
        search: 'Tìm kiếm sản phẩm',
        variants: 'Biến thể sản phẩm',
      },
      categories: {
        title: 'Danh mục',
        list: 'Danh sách danh mục',
        images: 'Thư viện ảnh',
      },
      stock: {
        title: 'Quản lý tồn kho',
        dashboard: 'Bảng điều khiển kho',
        stockIn: 'Nhập kho',
        stockOut: 'Xuất kho',
        transfer: 'Chuyển kho',
        report: 'Báo cáo tồn kho',
      },
    },
    orders: {
      title: 'Đơn hàng',
      list: 'Danh sách đơn hàng',
      detail: 'Chi tiết đơn hàng',
      invoices: 'Hóa đơn',
      paymentHistory: 'Lịch sử thanh toán',
    },
    customers: {
      title: 'Khách hàng',
      list: 'Danh sách khách hàng',
      detail: 'Chi tiết khách hàng',
      loyalty: 'Chương trình khách hàng thân thiết',
    },
    reports: {
      title: 'Báo cáo & Phân tích',
      sales: {
        title: 'Báo cáo bán hàng',
        dashboard: 'Bảng điều khiển bán hàng',
        daily: 'Báo cáo bán hàng ngày',
        monthly: 'Báo cáo bán hàng tháng',
        yearly: 'Báo cáo bán hàng năm',
      },
      financial: {
        title: 'Báo cáo tài chính',
        cashFlow: 'Dòng tiền',
        accounting: 'Kế toán',
        taxManagement: 'Quản lý thuế',
      },
    },
    users: {
      title: 'Người dùng & Phân quyền',
      management: 'Quản lý người dùng',
      profile: 'Hồ sơ người dùng',
      roleAssignment: 'Phân quyền vai trò',
      permissionMatrix: 'Ma trận phân quyền',
    },
    settings: {
      title: 'Cài đặt',
      store: {
        title: 'Cài đặt cửa hàng',
        config: 'Cấu hình cửa hàng',
        enterprise: 'Cài đặt doanh nghiệp',
        branches: 'Danh sách chi nhánh',
      },
      system: {
        title: 'Cấu hình hệ thống',
        general: 'Cài đặt chung',
        themeLanguage: 'Giao diện & Ngôn ngữ',
        paymentConfig: 'Cấu hình thanh toán',
      },
      data: {
        title: 'Quản lý dữ liệu',
        backupRestore: 'Sao lưu & Khôi phục',
        syncStatus: 'Trạng thái đồng bộ',
        databaseSetup: 'Thiết lập cơ sở dữ liệu',
      },
    },
    support: {
      title: 'Hỗ trợ & Thông tin',
      documentation: 'Tài liệu',
      helpCenter: {
        title: 'Trung tâm hỗ trợ',
        contact: 'Liên hệ hỗ trợ',
        feedback: 'Gửi phản hồi',
      },
      notifications: 'Thông báo',
      about: 'Thông tin ứng dụng',
    },
    admin: {
      dashboard: 'Bảng điều khiển quản trị',
    },
    logout: 'Đăng xuất',
  },
  alerts: {
    logout: {
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất?',
      cancel: 'Hủy',
      confirm: 'Đăng xuất',
    },
    backup: {
      title: 'Sao lưu dữ liệu',
      message: 'Bạn có muốn sao lưu dữ liệu ngay bây giờ?',
      cancel: 'Hủy',
      confirm: 'Sao lưu',
    },
  },
};