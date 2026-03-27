import {StyleSheet, Platform} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 2,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'visible',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 60,
    position: 'relative',
    overflow: 'visible', // Thêm để cho phép nút hiển thị ra ngoài
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
  },
  // Nút menu chính - cùng kích thước và vị trí với sidebarToggleButton
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 36 : 10,
    left: -16,
    zIndex: 999999,
    padding: 8, // Giữ padding để tạo vùng touch dễ bấm
    backgroundColor: 'transparent', // Đảm bảo nền trong suốt
    borderWidth: 0, // Loại bỏ border
    elevation: 0, // Loại bỏ shadow trên Android
    shadowOpacity: 0, // Loại bỏ shadow trên iOS
  },
  // Style cho menuButton khi sidebar đang mở (nếu cần)
  menuButtonHidden: {
    left: -40, // Ẩn hoàn toàn khi sidebar mở (width = 40)
    opacity: 0,
    backgroundColor: 'transparent', // Đảm bảo nền trong suốt
  },
  // Style cho menuButton khi sidebar đóng
  menuButtonVisible: {
    left: -25, // Hiển thị một nửa (width 40 / 2 = 20)
    opacity: 1,
    backgroundColor: 'transparent', // Đảm bảo nền trong suốt
  },
  // Style cho Icon trong menuButton để dịch chuyển sang phải
  menuButtonIcon: {
    marginLeft: 10, // Dịch chuyển icon sang phải 10px để hiển thị đầy đủ
  },
  // Style cho Icon trong sidebarToggleButton để dịch chuyển sang trái
  // Style cho Icon trong menuButton khi sidebar mở (để reset vị trí)
  menuButtonIconHidden: {
    marginLeft: 0,
  },
  // Style cho Icon trong sidebarToggleButton để dịch chuyển sang trái
  sidebarToggleIcon: {
    marginRight: -20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99, // Dưới sidebar nhưng trên nội dung
  },
  // Container cho header để đảm bảo layout đúng
  headerContainer: {
    position: 'relative',
    height: Platform.OS === 'ios' ? 80 : 60,
    justifyContent: 'center',
  },
});
