import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

// Import services và interfaces
import { CourseService, Course, CourseLevel, CourseStatus, CourseSyllabus } from '../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { LoginDialogComponent } from '../../../components/login-dialog/login-dialog.component';
import { CourseEnrollmentComponent } from '../course-enrollment/course-enrollment.component';

// Mock syllabus data for demonstration
const MOCK_SYLLABUS: CourseSyllabus[] = [
  {
    id: 1,
    title: 'Giới thiệu khóa học',
    description: 'Tổng quan về nội dung và mục tiêu khóa học',
    duration: 30,
    order: 1,
    lessons: [
      {
        id: 1,
        title: 'Chào mừng đến với khóa học',
        description: 'Video giới thiệu về khóa học và giảng viên',
        duration: 10,
        type: 'video',
        order: 1,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      },
      {
        id: 2,
        title: 'Mục tiêu học tập',
        description: 'Những gì bạn sẽ học được sau khóa học',
        duration: 15,
        type: 'document',
        order: 2,
        documentUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      },
      {
        id: 3,
        title: 'Kiểm tra kiến thức đầu vào',
        description: 'Bài kiểm tra đánh giá kiến thức hiện tại',
        duration: 5,
        type: 'quiz',
        order: 3
      }
    ]
  },
  {
    id: 2,
    title: 'Nội dung chính',
    description: 'Các bài học cốt lõi của khóa học',
    duration: 120,
    order: 2,
    lessons: [
      {
        id: 4,
        title: 'Bài 1: Khái niệm cơ bản',
        description: 'Tìm hiểu các khái niệm cơ bản trong lĩnh vực',
        duration: 30,
        type: 'video',
        order: 1,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      },
      {
        id: 5,
        title: 'Bài 2: Thực hành cơ bản',
        description: 'Bài tập thực hành để củng cố kiến thức',
        duration: 45,
        type: 'assignment',
        order: 2
      },
      {
        id: 6,
        title: 'Tài liệu tham khảo',
        description: 'Tài liệu bổ sung cho bài học',
        duration: 15,
        type: 'document',
        order: 3,
        documentUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      }
    ]
  }
];

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  // Course data
  course: Course | null = null;
  courseId: number = 0;
  
  // Loading states
  loading = false;
  enrolling = false;
  
  // Authentication
  isLoggedIn = false;
  currentUser: any = null;
  
  // Video/Document viewing
  currentVideoUrl: SafeResourceUrl | null = null;
  currentDocumentUrl: SafeResourceUrl | null = null;
  showVideoPlayer = false;
  showDocumentViewer = false;
  
  // Progress tracking
  userProgress = 0;
  completedLessons: number[] = [];
  
  // Subject để unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Get course ID from route
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.courseId = +params['id'];
      if (this.courseId) {
        this.loadCourse();
      }
    });

    // Check authentication status
    this.authService.isLoggedIn$.pipe(takeUntil(this.destroy$)).subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load course details
   */
  private loadCourse(): void {
    this.loading = true;
    
    this.courseService.getCourseById(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          if (course) {
            this.course = { ...course, syllabus: MOCK_SYLLABUS };
            this.loadUserProgress();
          } else {
            this.showErrorMessage('Không tìm thấy khóa học');
            this.router.navigate(['/courses']);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải chi tiết khóa học:', error);
          this.showErrorMessage('Không thể tải thông tin khóa học');
          this.loading = false;
        }
      });
  }

  /**
   * Load user progress for this course
   */
  private loadUserProgress(): void {
    if (!this.isLoggedIn || !this.course) return;
    
    // TODO: Load actual user progress from API
    // For now, simulate some progress
    this.userProgress = 25;
    this.completedLessons = [1, 2, 3];
  }

  /**
   * Check if user can access course content
   */
  canAccessContent(): boolean {
    return this.isLoggedIn && this.course?.status === CourseStatus.PUBLISHED;
  }

  /**
   * Handle course enrollment
   */
  enrollCourse(): void {
    if (!this.course) return;

    if (this.course.status !== CourseStatus.PUBLISHED) {
      this.showErrorMessage('Khóa học chưa được mở đăng ký');
      return;
    }

    // Open enrollment dialog
    this.openEnrollmentDialog();
  }

  /**
   * Open enrollment dialog
   */
  private openEnrollmentDialog(): void {
    if (!this.course) return;

    const dialogRef = this.dialog.open(CourseEnrollmentComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        course: this.course,
        isLoggedIn: this.isLoggedIn,
        currentUser: this.currentUser
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Enrollment successful
        this.showSuccessMessage('Đăng ký khóa học thành công!');
        this.loadUserProgress();

        // Log enrollment data for debugging
        console.log('Enrollment data:', result.data);
      }
    });
  }

  /**
   * Open login dialog
   */
  private openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '400px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User logged in successfully
        this.loadUserProgress();
      }
    });
  }

  /**
   * Play video lesson
   */
  playVideo(videoUrl: string): void {
    if (!this.canAccessContent()) {
      this.showErrorMessage('Vui lòng đăng nhập để xem nội dung khóa học');
      return;
    }

    this.currentVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    this.showVideoPlayer = true;
    this.showDocumentViewer = false;
  }

  /**
   * View document
   */
  viewDocument(documentUrl: string): void {
    if (!this.canAccessContent()) {
      this.showErrorMessage('Vui lòng đăng nhập để xem nội dung khóa học');
      return;
    }

    this.currentDocumentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(documentUrl);
    this.showDocumentViewer = true;
    this.showVideoPlayer = false;
  }

  /**
   * Mark lesson as completed
   */
  markLessonCompleted(lessonId: number): void {
    if (!this.canAccessContent()) return;

    if (!this.completedLessons.includes(lessonId)) {
      this.completedLessons.push(lessonId);
      this.updateProgress();
      this.showSuccessMessage('Đã đánh dấu bài học hoàn thành');
    }
  }

  /**
   * Update user progress
   */
  private updateProgress(): void {
    if (!this.course?.syllabus) return;

    const totalLessons = this.course.syllabus.reduce((total, section) => 
      total + section.lessons.length, 0
    );
    
    this.userProgress = Math.round((this.completedLessons.length / totalLessons) * 100);
  }

  /**
   * Check if lesson is completed
   */
  isLessonCompleted(lessonId: number): boolean {
    return this.completedLessons.includes(lessonId);
  }

  /**
   * Get status display text
   */
  getStatusDisplayText(status: CourseStatus): string {
    const statusMap = {
      [CourseStatus.DRAFT]: 'Bản nháp',
      [CourseStatus.PUBLISHED]: 'Đã xuất bản',
      [CourseStatus.ARCHIVED]: 'Đã lưu trữ',
      [CourseStatus.COMING_SOON]: 'Sắp ra mắt'
    };
    return statusMap[status] || status;
  }

  /**
   * Get level display text
   */
  getLevelDisplayText(level: CourseLevel): string {
    const levelMap = {
      [CourseLevel.BEGINNER]: 'Cơ bản',
      [CourseLevel.INTERMEDIATE]: 'Trung cấp',
      [CourseLevel.ADVANCED]: 'Nâng cao',
      [CourseLevel.EXPERT]: 'Chuyên gia'
    };
    return levelMap[level] || level;
  }

  /**
   * Get level color
   */
  getLevelColor(level: CourseLevel): string {
    const colorMap = {
      [CourseLevel.BEGINNER]: '#4caf50',
      [CourseLevel.INTERMEDIATE]: '#ff9800',
      [CourseLevel.ADVANCED]: '#f44336',
      [CourseLevel.EXPERT]: '#9c27b0'
    };
    return colorMap[level] || '#666';
  }

  /**
   * Format duration display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }
    
    return `${hours} giờ ${remainingMinutes} phút`;
  }

  /**
   * Format price display
   */
  formatPrice(price: number): string {
    if (price === 0) {
      return 'Miễn phí';
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  /**
   * Go back to course list
   */
  goBack(): void {
    this.router.navigate(['/courses']);
  }

  /**
   * Share course
   */
  shareCourse(): void {
    if (navigator.share) {
      navigator.share({
        title: this.course?.title,
        text: this.course?.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.showSuccessMessage('Đã sao chép link khóa học');
    }
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
