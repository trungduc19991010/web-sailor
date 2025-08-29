import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

// Enums
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  COMING_SOON = 'COMING_SOON'
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

// Interfaces
export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number; // in minutes
  level: CourseLevel;
  status: CourseStatus;
  price: number;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  studentsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  syllabus?: CourseSyllabus[];
}

export interface CourseSyllabus {
  id: number;
  title: string;
  description: string;
  duration: number;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: number;
  title: string;
  description: string;
  duration: number;
  type: 'video' | 'document' | 'quiz' | 'assignment';
  order: number;
  videoUrl?: string;
  documentUrl?: string;
  completed?: boolean;
}

export interface CourseEnrollment {
  id: number;
  courseId: number;
  userId: number;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'dropped';
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  // BehaviorSubject để quản lý state
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  public courses$ = this.coursesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    // Tự động load dữ liệu khi service được khởi tạo
    this.loadCourses();
  }

  /**
   * Lấy danh sách tất cả khóa học
   */
  getCourses(): Observable<Course[]> {
    const courses: Course[] = [
      {
        id: 1,
        title: 'Chứng chỉ An toàn cơ bản STCW',
        description: 'Khóa học cung cấp kiến thức cơ bản về an toàn hàng hải theo tiêu chuẩn STCW. Bao gồm kỹ năng sinh tồn trên biển, phòng cháy chữa cháy, sơ cứu y tế và an toàn cá nhân.',
        category: 'An toàn hàng hải',
        instructor: 'Thuyền trưởng Nguyễn Văn Hải',
        duration: 2400, // 40 hours
        level: CourseLevel.BEGINNER,
        status: CourseStatus.PUBLISHED,
        price: 0,
        imageUrl: 'assets/images/courses/stcw-basic.jpg',
        rating: 4.8,
        reviewsCount: 156,
        studentsCount: 850,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-08-10'),
        tags: ['STCW', 'an toàn', 'sinh tồn', 'sơ cứu', 'phòng cháy'],
        prerequisites: ['Không yêu cầu kiến thức trước'],
        learningOutcomes: [
          'Nắm vững các kỹ năng sinh tồn trên biển',
          'Thành thạo sử dụng thiết bị phòng cháy chữa cháy trên tàu',
          'Thực hiện sơ cứu y tế cơ bản',
          'Áp dụng các biện pháp an toàn cá nhân'
        ]
      },
      {
        id: 2,
        title: 'Điều khiển tàu và Navigation',
        description: 'Khóa học chuyên sâu về kỹ năng điều khiển tàu, sử dụng radar, GPS, ECDIS và các thiết bị định vị hiện đại. Phù hợp cho sĩ quan boong và những ai muốn trở thành thuyền trưởng.',
        category: 'Điều khiển và vận hành tàu',
        instructor: 'Thuyền trưởng Trần Minh Đức',
        duration: 3600, // 60 hours
        level: CourseLevel.ADVANCED,
        status: CourseStatus.PUBLISHED,
        price: 2500000,
        imageUrl: 'assets/images/courses/navigation.jpg',
        rating: 4.7,
        reviewsCount: 89,
        studentsCount: 245,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-08-05'),
        tags: ['navigation', 'radar', 'GPS', 'ECDIS', 'điều khiển tàu'],
        prerequisites: ['Chứng chỉ STCW cơ bản', 'Kinh nghiệm làm việc trên tàu'],
        learningOutcomes: [
          'Thành thạo sử dụng radar và GPS',
          'Vận hành hệ thống ECDIS',
          'Lập kế hoạch hành trình an toàn',
          'Xử lý tình huống khẩn cấp trên biển'
        ]
      },
      {
        id: 3,
        title: 'Vận hành máy tàu biển',
        description: 'Đào tạo toàn diện về vận hành, bảo dưỡng máy tàu, hệ thống động lực diesel, turbine và các thiết bị phụ trợ. Chuẩn bị cho chứng chỉ máy trưởng và sĩ quan máy.',
        category: 'Máy tàu và kỹ thuật',
        instructor: 'Máy trưởng Lê Thanh Tùng',
        duration: 4800, // 80 hours
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.PUBLISHED,
        price: 3000000,
        imageUrl: 'assets/images/courses/marine-engine.jpg',
        rating: 4.6,
        reviewsCount: 72,
        studentsCount: 180,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-07-20'),
        tags: ['máy tàu', 'diesel', 'turbine', 'bảo dưỡng', 'kỹ thuật'],
        prerequisites: ['Kiến thức cơ bản về cơ khí', 'Chứng chỉ STCW'],
        learningOutcomes: [
          'Vận hành thành thạo máy tàu diesel',
          'Thực hiện bảo dưỡng định kỳ',
          'Xử lý sự cố kỹ thuật',
          'Quản lý hệ thống động lực tàu'
        ]
      },
      {
        id: 4,
        title: 'Tiếng Anh hàng hải IMO',
        description: 'Khóa học tiếng Anh chuyên ngành hàng hải theo chuẩn IMO. Bao gồm giao tiếp radio, thuật ngữ kỹ thuật, báo cáo tình huống và Standard Marine Communication Phrases (SMCP).',
        category: 'Tiếng Anh hàng hải',
        instructor: 'ThS. Phạm Thị Lan',
        duration: 3000, // 50 hours
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.PUBLISHED,
        price: 1800000,
        imageUrl: 'assets/images/courses/maritime-english.jpg',
        rating: 4.5,
        reviewsCount: 124,
        studentsCount: 320,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-08-01'),
        tags: ['tiếng anh', 'IMO', 'SMCP', 'radio', 'giao tiếp'],
        prerequisites: ['Tiếng Anh cơ bản', 'Kiến thức hàng hải'],
        learningOutcomes: [
          'Giao tiếp thành thạo bằng tiếng Anh trên tàu',
          'Sử dụng SMCP trong các tình huống',
          'Báo cáo tình huống khẩn cấp',
          'Hiểu và sử dụng thuật ngữ kỹ thuật'
        ]
      },
      {
        id: 5,
        title: 'Y tế và sơ cứu hàng hải',
        description: 'Đào tạo kỹ năng sơ cứu y tế chuyên biệt cho môi trường tàu biển. Bao gồm xử lý chấn thương, bệnh tật, sử dụng thiết bị y tế và liên lạc y tế từ xa.',
        category: 'Y tế và sơ cứu hàng hải',
        instructor: 'Bác sĩ Nguyễn Thành Công',
        duration: 2400, // 40 hours
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.PUBLISHED,
        price: 2200000,
        imageUrl: 'assets/images/courses/maritime-medical.jpg',
        rating: 4.7,
        reviewsCount: 86,
        studentsCount: 195,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-07-30'),
        tags: ['y tế', 'sơ cứu', 'chấn thương', 'thiết bị y tế'],
        prerequisites: ['Chứng chỉ STCW cơ bản'],
        learningOutcomes: [
          'Xử lý các tình huống y tế khẩn cấp',
          'Sử dụng thiết bị y tế trên tàu',
          'Liên lạc với bác sĩ bờ',
          'Chăm sóc bệnh nhân dài hạn'
        ]
      },
      {
        id: 6,
        title: 'An toàn giao thông đô thị',
        description: 'Kiến thức về luật giao thông, kỹ năng lái xe an toàn, xử lý tình huống khẩn cấp và văn hóa giao thông trong môi trường đô thị.',
        category: 'Giao thông',
        instructor: 'Thiếu tá CSGT Hoàng Văn Tuấn',
        duration: 150, // 2.5 hours
        level: CourseLevel.BEGINNER,
        status: CourseStatus.PUBLISHED,
        price: 300000,
        imageUrl: 'assets/images/courses/traffic-safety.jpg',
        rating: 4.4,
        reviewsCount: 35,
        studentsCount: 180,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-08-12'),
        tags: ['giao thông', 'an toàn', 'lái xe', 'đô thị'],
        prerequisites: ['Có bằng lái xe'],
        learningOutcomes: [
          'Nắm vững luật giao thông mới nhất',
          'Kỹ năng lái xe an toàn',
          'Xử lý tình huống khẩn cấp'
        ]
      },
      {
        id: 7,
        title: 'Sơ cứu cấp cứu cơ bản',
        description: 'Kỹ năng sơ cứu cấp cứu cần thiết trong cuộc sống hàng ngày, xử lý các tình huống y tế khẩn cấp và chăm sóc sức khỏe cộng đồng.',
        category: 'Y tế',
        instructor: 'BS. CKI Nguyễn Thị Mai',
        duration: 180, // 3 hours
        level: CourseLevel.BEGINNER,
        status: CourseStatus.PUBLISHED,
        price: 400000,
        imageUrl: 'assets/images/courses/first-aid.jpg',
        rating: 4.9,
        reviewsCount: 52,
        studentsCount: 220,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-08-08'),
        tags: ['sơ cứu', 'cấp cứu', 'y tế', 'chăm sóc'],
        prerequisites: ['Không yêu cầu'],
        learningOutcomes: [
          'Thực hiện sơ cứu cơ bản',
          'Xử lý tình huống khẩn cấp',
          'Chăm sóc người bệnh ban đầu'
        ]
      },
      {
        id: 8,
        title: 'Microsoft Office 365 nâng cao',
        description: 'Sử dụng thành thạo các ứng dụng Office 365, tự động hóa công việc với macro, phân tích dữ liệu với Excel và quản lý dự án với Project.',
        category: 'Tin học Văn phòng',
        instructor: 'KS. Đỗ Minh Hải',
        duration: 240, // 4 hours
        level: CourseLevel.ADVANCED,
        status: CourseStatus.PUBLISHED,
        price: 600000,
        imageUrl: 'assets/images/courses/office-365.jpg',
        rating: 4.5,
        reviewsCount: 38,
        studentsCount: 145,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-08-15'),
        tags: ['office 365', 'excel', 'word', 'powerpoint', 'nâng cao'],
        prerequisites: ['Biết sử dụng Office cơ bản'],
        learningOutcomes: [
          'Sử dụng thành thạo Office 365',
          'Tự động hóa công việc với macro',
          'Phân tích dữ liệu chuyên nghiệp'
        ]
      },
      {
        id: 9,
        title: 'Quản lý dự án Agile & Scrum',
        description: 'Phương pháp quản lý dự án Agile, framework Scrum, công cụ Jira và kỹ năng làm việc nhóm hiệu quả trong môi trường phát triển phần mềm.',
        category: 'Kinh doanh & khởi nghiệp',
        instructor: 'Scrum Master Lê Hoàng Nam',
        duration: 300, // 5 hours
        level: CourseLevel.INTERMEDIATE,
        status: CourseStatus.COMING_SOON,
        price: 900000,
        imageUrl: 'assets/images/courses/agile-scrum.jpg',
        rating: 0,
        reviewsCount: 0,
        studentsCount: 0,
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-08-20'),
        tags: ['agile', 'scrum', 'quản lý dự án', 'jira'],
        prerequisites: ['Kinh nghiệm làm việc nhóm'],
        learningOutcomes: [
          'Áp dụng phương pháp Agile',
          'Sử dụng framework Scrum',
          'Quản lý dự án với Jira'
        ]
      },
      {
        id: 10,
        title: 'Thiết kế UX/UI cho người mới bắt đầu',
        description: 'Nguyên tắc thiết kế giao diện người dùng, trải nghiệm người dùng, sử dụng Figma và Adobe XD để tạo ra các sản phẩm số chất lượng cao.',
        category: 'Tin học Văn phòng',
        instructor: 'Designer Trần Thị Linh',
        duration: 420, // 7 hours
        level: CourseLevel.BEGINNER,
        status: CourseStatus.DRAFT,
        price: 1500000,
        imageUrl: 'assets/images/courses/ux-ui-design.jpg',
        rating: 0,
        reviewsCount: 0,
        studentsCount: 0,
        createdAt: new Date('2024-07-15'),
        updatedAt: new Date('2024-08-18'),
        tags: ['UX', 'UI', 'thiết kế', 'figma', 'adobe xd'],
        prerequisites: ['Không yêu cầu kinh nghiệm thiết kế'],
        learningOutcomes: [
          'Hiểu nguyên tắc thiết kế UX/UI',
          'Sử dụng thành thạo Figma',
          'Tạo ra prototype chất lượng cao'
        ]
      }
    ];

    return of(courses).pipe(delay(1000)); // Simulate API call
  }

  /**
   * Lấy khóa học theo ID
   */
  getCourseById(id: number): Observable<Course | undefined> {
    return new Observable(observer => {
      this.getCourses().subscribe(courses => {
        const course = courses.find(c => c.id === id);
        observer.next(course);
        observer.complete();
      });
    });
  }

  /**
   * Lấy khóa học theo category
   */
  getCoursesByCategory(category: string): Observable<Course[]> {
    return new Observable(observer => {
      this.getCourses().subscribe(courses => {
        const filteredCourses = courses.filter(c => c.category === category);
        observer.next(filteredCourses);
        observer.complete();
      });
    });
  }

  /**
   * Tìm kiếm khóa học
   */
  searchCourses(query: string): Observable<Course[]> {
    return new Observable(observer => {
      this.getCourses().subscribe(courses => {
        const searchResults = courses.filter(course => 
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.description.toLowerCase().includes(query.toLowerCase()) ||
          course.instructor.toLowerCase().includes(query.toLowerCase()) ||
          course.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        observer.next(searchResults);
        observer.complete();
      });
    });
  }

  /**
   * Load dữ liệu courses
   */
  private loadCourses(): void {
    this.loadingSubject.next(true);
    
    this.getCourses().subscribe({
      next: (courses) => {
        this.coursesSubject.next(courses);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách courses:', error);
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Refresh dữ liệu courses
   */
  refreshCourses(): void {
    this.loadCourses();
  }
}
