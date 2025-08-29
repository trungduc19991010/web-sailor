/**
 * Configuration file cho dữ liệu trang chủ
 * Dễ dàng chỉnh sửa nội dung mà không cần thay đổi code logic
 */

import { Stats, TrainingField, Course, PlatformFeature } from '../services/home.service';

/**
 * Thống kê tổng quan hệ thống
 */
export const HOME_STATS: Stats = {
  totalAccess: 1245680,
  totalStudents: 185420,
  totalLessons: 650,
  totalInstructors: 18
};

/**
 * Danh sách lĩnh vực đào tạo
 */
export const TRAINING_FIELDS: TrainingField[] = [
  {
    id: 1,
    name: 'An toàn hàng hải',
    courseCount: 25,
    icon: 'security',
    description: 'Đào tạo về an toàn hàng hải, quy tắc STCW, phòng chống tai nạn và ứng phó khẩn cấp trên tàu'
  },
  {
    id: 2,
    name: 'Điều khiển tàu biển',
    courseCount: 18,
    icon: 'directions_boat',
    description: 'Kỹ năng điều khiển tàu, navigation, radar, GPS và các thiết bị hàng hải hiện đại'
  },
  {
    id: 3,
    name: 'Máy tàu biển',
    courseCount: 22,
    icon: 'precision_manufacturing',
    description: 'Vận hành, bảo dưỡng máy tàu, hệ thống động lực và thiết bị cơ khí trên tàu biển'
  },
  {
    id: 4,
    name: 'Thông tin liên lạc hàng hải',
    courseCount: 12,
    icon: 'radio',
    description: 'Hệ thống thông tin liên lạc hàng hải, GMDSS, radio và thiết bị điện tử hàng hải'
  },
  {
    id: 5,
    name: 'Y tế hàng hải',
    courseCount: 8,
    icon: 'local_hospital',
    description: 'Sơ cứu y tế trên tàu, chăm sóc sức khỏe thuyền viên và xử lý tình huống y tế khẩn cấp'
  },
  {
    id: 6,
    name: 'Pháp luật hàng hải',
    courseCount: 6,
    icon: 'gavel',
    description: 'Luật hàng hải quốc tế, quy định SOLAS, MARPOL và các công ước quốc tế'
  },
  {
    id: 7,
    name: 'Quản lý tàu biển',
    courseCount: 10,
    icon: 'manage_accounts',
    description: 'Quản lý thuyền bộ, lãnh đạo nhóm, quản lý tài nguyên và kỹ năng quản lý trên tàu'
  },
  {
    id: 8,
    name: 'Tiếng Anh hàng hải',
    courseCount: 15,
    icon: 'language',
    description: 'Tiếng Anh chuyên ngành hàng hải, giao tiếp quốc tế và thuật ngữ hàng hải chuẩn IMO'
  }
];

/**
 * Danh sách khóa học nổi bật
 */
export const FEATURED_COURSES: Course[] = [
  {
    id: 1,
    title: 'Chứng chỉ An toàn cơ bản STCW',
    description: 'Khóa học cung cấp kiến thức cơ bản về an toàn hàng hải theo tiêu chuẩn STCW. Bao gồm kỹ năng sinh tồn trên biển, phòng cháy chữa cháy, sơ cứu y tế và an toàn cá nhân. Bắt buộc cho tất cả thuyền viên.',
    rating: 4.8,
    reviews: 156,
    duration: '40 giờ',
    featured: true,
    instructor: 'Thuyền trưởng Nguyễn Văn Hải',
    level: 'Beginner',
    price: 0
  },
  {
    id: 2,
    title: 'Điều khiển tàu và Navigation',
    description: 'Khóa học chuyên sâu về kỹ năng điều khiển tàu, sử dụng radar, GPS, ECDIS và các thiết bị định vị hiện đại. Phù hợp cho sĩ quan boong và những ai muốn trở thành thuyền trưởng.',
    rating: 4.7,
    reviews: 89,
    duration: '60 giờ',
    featured: true,
    instructor: 'Thuyền trưởng Trần Minh Đức',
    level: 'Advanced',
    price: 0
  },
  {
    id: 3,
    title: 'Vận hành máy tàu biển',
    description: 'Đào tạo toàn diện về vận hành, bảo dưỡng máy tàu, hệ thống động lực diesel, turbine và các thiết bị phụ trợ. Chuẩn bị cho chứng chỉ máy trưởng và sĩ quan máy.',
    rating: 4.6,
    reviews: 72,
    duration: '80 giờ',
    featured: true,
    instructor: 'Máy trưởng Lê Thanh Tùng',
    level: 'Intermediate',
    price: 0
  },
  {
    id: 4,
    title: 'Tiếng Anh hàng hải IMO',
    description: 'Khóa học tiếng Anh chuyên ngành hàng hải theo chuẩn IMO. Bao gồm giao tiếp radio, thuật ngữ kỹ thuật, báo cáo tình huống và Standard Marine Communication Phrases (SMCP).',
    rating: 4.5,
    reviews: 124,
    duration: '50 giờ',
    featured: true,
    instructor: 'ThS. Phạm Thị Lan',
    level: 'Intermediate',
    price: 0
  }
];

/**
 * Danh sách tính năng nền tảng
 */
export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: 1,
    title: 'Hồ sơ thuyền viên',
    description: 'Quản lý hồ sơ cá nhân, chứng chỉ, bằng cấp và lịch sử đào tạo của thuyền viên. Theo dõi tiến độ học tập và thời hạn gia hạn chứng chỉ.',
    icon: 'person'
  },
  {
    id: 2,
    title: 'Cộng đồng thuyền viên',
    description: 'Kết nối cộng đồng thuyền viên toàn cầu, chia sẻ kinh nghiệm làm việc trên tàu, tìm kiếm cơ hội việc làm và hỗ trợ lẫn nhau trong nghề nghiệp.',
    icon: 'group'
  },
  {
    id: 3,
    title: 'Đào tạo trực tuyến',
    description: 'Học tập trực tuyến với giảng viên có kinh nghiệm thực tế, tương tác qua video call, chat và diễn đàn. Mô phỏng tình huống thực tế trên tàu.',
    icon: 'chat'
  },
  {
    id: 4,
    title: 'Tài liệu chuẩn quốc tế',
    description: 'Học liệu được biên soạn theo tiêu chuẩn IMO, STCW và các quy định quốc tế. Bao gồm video thực hành, tài liệu kỹ thuật và bài tập mô phỏng.',
    icon: 'library_books'
  },
  {
    id: 5,
    title: 'Chứng chỉ quốc tế',
    description: 'Cấp chứng chỉ được công nhận quốc tế theo tiêu chuẩn STCW, có thể xác thực trực tuyến. Hỗ trợ thuyền viên làm việc trên tàu quốc tế.',
    icon: 'verified'
  },
  {
    id: 6,
    title: 'Học tập trên tàu',
    description: 'Hỗ trợ học tập ngay cả khi đang làm việc trên tàu với khả năng học offline. Đồng bộ tiến độ khi có kết nối internet vệ tinh.',
    icon: 'schedule'
  }
];

/**
 * Cấu hình SEO cho trang chủ
 */
export const HOME_SEO_CONFIG = {
  title: 'Trang chủ - Hệ thống đào tạo thuyền viên VOSCO',
  description: 'Nền tảng đào tạo thuyền viên hàng đầu Việt Nam với các khóa học chuẩn quốc tế STCW, IMO. Đào tạo chuyên nghiệp cho ngành hàng hải và vận tải biển.',
  keywords: 'đào tạo thuyền viên, VOSCO, STCW, IMO, hàng hải, vận tải biển, chứng chỉ quốc tế, thuyền trưởng, máy trưởng',
  ogImage: 'https://www.vosco.vn/style/voscovn/images/vosco-logo.png',
  canonicalUrl: 'https://edu.vosco.vn'
};

/**
 * Cấu hình animation và UI
 */
export const HOME_UI_CONFIG = {
  // Thời gian delay cho animation (ms)
  statsAnimationDelay: 100,
  cardHoverDelay: 200,
  
  // Số lượng items hiển thị
  maxFeaturedCourses: 6,
  maxTrainingFields: 8,
  
  // Breakpoints responsive
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  
  // Colors
  primaryColor: '#1976d2',
  accentColor: '#ff5722',
  successColor: '#4caf50',
  warningColor: '#ff9800'
};
