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
import { ToastService } from '../../../core/services/toast.service';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

// Import services và interfaces
import { CourseService, Course, CourseLevel, CourseStatus, CourseSyllabus } from '../services/course.service';
import { LectureDetailService } from '../services/lecture-detail.service';
import { LectureDetail, LecturePage, TraineeLectureDetail, LecturePageTrainee, StatusLearn, getLecturePageTypeDisplayText, getLecturePageTypeIcon, getStatusLearnDisplayText, getStatusLearnColor } from '../../../core/models/lecture-detail';
import { AuthenticationService } from '../../../core/guards/authentication.service';
import { LoginDialogComponent } from '../../../components/login-dialog/login-dialog.component';
import { CourseEnrollmentComponent } from '../course-enrollment/course-enrollment.component';
import { ExamService } from '../services/exam.service';
import { ExamConfirmDialogComponent, ExamConfirmData } from '../exam-confirm-dialog/exam-confirm-dialog.component';
import { StatusExam, ExamData, ExamOfTrainee } from '../../../core/models/exam.model';


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
    MatProgressBarModule
  ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  // Course data
  course: Course | null = null;
  traineeLectureDetail: TraineeLectureDetail | null = null;
  lectureId: string = '';
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
  
  // Learning flow state
  currentPageIndex = 0;
  isLearningStarted = false;
  currentLearningPageId: string | null = null;
  completedPageIds: string[] = [];
  
  // Lecture page viewer state
  showLectureViewer = false;
  currentViewingPage: LecturePage | null = null;
  currentViewingPageIndex = 0;
  safeContentUrl: SafeResourceUrl | null = null;
  imageUrl: string = '';
  viewerError: string = '';
  
  // Subject để unsubscribe
  private destroy$ = new Subject<void>();


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private lectureDetailService: LectureDetailService,
    private authenticationService: AuthenticationService,
    private sanitizer: DomSanitizer,
    private toast: ToastService,
    private dialog: MatDialog,
    private examService: ExamService
  ) { }

  ngOnInit(): void {
    // Get lectureId from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.lectureId = params['id'];
      if (this.lectureId) {
        this.loadLectureDetail();
      }
    });

    // Check for query params to determine if coming from start learning
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(queryParams => {
      if (queryParams['autoStart'] === 'true') {
        // User came from "start learning" button, auto start the first page
        setTimeout(() => {
          if (this.traineeLectureDetail?.lecture?.lecturePages && this.traineeLectureDetail.lecture.lecturePages.length > 0) {
            this.startLearning();
          }
        }, 1000);
      }
      // If no autoStart param, just load normally for continue learning
    });

    // Check authentication status
    this.authenticationService.user.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isLoggedIn = this.authenticationService.isAuthenticated();
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load lecture details
   */
  private loadLectureDetail(): void {
    if (!this.authenticationService.isAuthenticated()) {
      // this.showErrorMessage('Vui lòng đăng nhập để xem chi tiết khóa học');
      return;
    }

    this.loading = true;
    
    this.lectureDetailService.getLectureDetail(this.lectureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (traineeLectureDetail) => {
        this.traineeLectureDetail = traineeLectureDetail;
        this.loadUserProgress();
        this.detectLearningProgress();
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
    return this.isLoggedIn;
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
    this.toast.error(message, 5000);
  }


  /**
   * Get icon for status
   */
  getStatusIcon(statusLearn: number): string {
    switch (statusLearn) {
      case 0: // NotStartedLearn
        return 'radio_button_unchecked';
      case 1: // InProgressLearn
        return 'play_circle';
      case 2: // CompletedLearn
        return 'check_circle';
      case 3: // FailedLearn
        return 'error';
      case 4: // CertifiedLearn
        return 'verified';
      default:
        return 'help_outline';
    }
  }

  /**
   * View lecture page
   */
  viewLecturePage(page: LecturePage): void {
    if (!this.traineeLectureDetail) return;
    
    this.currentViewingPage = page;
    this.currentViewingPageIndex = this.traineeLectureDetail.lecture.lecturePages.findIndex(p => p.id === page.id);
    this.showLectureViewer = true;
    this.loadPageContent(page);
    
    // Tìm lecturePageTraineeId tương ứng với page này
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(pt => pt.lecturePageId === page.id);
    if (pageTrainee) {
      // Chỉ gọi startPage API nếu trang chưa hoàn thành
      if (pageTrainee.statusLearn !== 2) { // Chưa CompletedLearn
        // Gọi startPage API
        this.lectureDetailService.startPage(pageTrainee.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              console.log('Started page successfully:', response);
              // Cập nhật trạng thái trong local data nếu cần
              if (pageTrainee.statusLearn === 0) { // Chỉ cập nhật nếu chưa bắt đầu
                pageTrainee.statusLearn = 1; // InProgressLearn
                pageTrainee.timetStartLearn = new Date().toISOString();
              }
            },
            error: (error) => {
              console.error('Error starting page:', error);
              this.showErrorMessage('Không thể bắt đầu trang học');
            }
          });
      } else {
        console.log('Page already completed, skipping startPage API call');
      }
    }
  }
  
  /**
   * Close lecture viewer
   */
  closeLectureViewer(): void {
    this.showLectureViewer = false;
    this.currentViewingPage = null;
    this.safeContentUrl = null;
    this.imageUrl = '';
    this.viewerError = '';
  }
  
  /**
   * Previous viewing page
   */
  previousViewingPage(): void {
    if (!this.canGoPreviousPage()) return;
    
    this.currentViewingPageIndex--;
    this.currentViewingPage = this.traineeLectureDetail!.lecture.lecturePages[this.currentViewingPageIndex];
    this.loadPageContent(this.currentViewingPage);
  }
  
  /**
   * Next viewing page
   */
  nextViewingPage(): void {
    if (!this.canGoNextPage()) return;
    
    this.currentViewingPageIndex++;
    this.currentViewingPage = this.traineeLectureDetail!.lecture.lecturePages[this.currentViewingPageIndex];
    this.loadPageContent(this.currentViewingPage);
  }
  
  /**
   * Go to specific page
   */
  goToPage(pageIndex: number): void {
    if (!this.traineeLectureDetail || 
        pageIndex < 0 || 
        pageIndex >= this.traineeLectureDetail.lecture.lecturePages.length) {
      return;
    }
    
    this.currentViewingPageIndex = pageIndex;
    this.currentViewingPage = this.traineeLectureDetail.lecture.lecturePages[pageIndex];
    this.loadPageContent(this.currentViewingPage);
  }
  
  /**
   * Check if can go to previous page
   */
  canGoPreviousPage(): boolean {
    return this.currentViewingPageIndex > 0;
  }
  
  /**
   * Check if can go to next page
   */
  canGoNextPage(): boolean {
    if (!this.traineeLectureDetail) return false;
    return this.currentViewingPageIndex < this.traineeLectureDetail.lecture.lecturePages.length - 1;
  }
  
  /**
   * Get current page index
   */
  getCurrentPageIndex(): number {
    return this.currentViewingPageIndex;
  }
  
  /**
   * Kiểm tra tất cả trang học đã hoàn thành chưa
   */
  areAllPagesCompleted(): boolean {
    if (!this.traineeLectureDetail?.lecturePageTrainees || this.traineeLectureDetail.lecturePageTrainees.length === 0) {
      return false;
    }
    
    return this.traineeLectureDetail.lecturePageTrainees.every(pageTrainee => 
      pageTrainee.statusLearn === 2 // CompletedLearn
    );
  }
  
  /**
   * Đếm số trang đã hoàn thành
   */
  getCompletedPagesCount(): number {
    if (!this.traineeLectureDetail?.lecturePageTrainees) return 0;
    
    return this.traineeLectureDetail.lecturePageTrainees.filter(pageTrainee => 
      pageTrainee.statusLearn === 2 // CompletedLearn
    ).length;
  }
  
  /**
   * Lấy tổng số trang học
   */
  getTotalPagesCount(): number {
    return this.traineeLectureDetail?.lecturePageTrainees?.length || 0;
  }
  
  /**
   * Tính phần trăm hoàn thành
   */
  getCompletionPercentage(): number {
    const total = this.getTotalPagesCount();
    if (total === 0) return 0;
    
    const completed = this.getCompletedPagesCount();
    return Math.round((completed / total) * 100);
  }
  
  /**
   * Lấy trạng thái hiển thị của một trang học
   */
  getPageStatus(page: LecturePage): string {
    if (!this.traineeLectureDetail?.lecturePageTrainees) return 'Chưa bắt đầu';
    
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(pt => pt.lecturePageId === page.id);
    if (!pageTrainee) return 'Chưa bắt đầu';
    
    return getStatusLearnDisplayText(pageTrainee.statusLearn);
  }
  
  /**
   * Lấy màu sắc hiển thị của một trang học
   */
  getPageStatusColor(page: LecturePage): string {
    if (!this.traineeLectureDetail?.lecturePageTrainees) return 'basic';
    
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(pt => pt.lecturePageId === page.id);
    if (!pageTrainee) return 'basic';
    
    return getStatusLearnColor(pageTrainee.statusLearn);
  }
  
  /**
   * Kiểm tra trang có được hoàn thành chưa
   */
  isPageCompleted(page: LecturePage): boolean {
    if (!this.traineeLectureDetail?.lecturePageTrainees) return false;
    
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(pt => pt.lecturePageId === page.id);
    return pageTrainee?.statusLearn === 2; // CompletedLearn
  }
  
  /**
   * Kiểm tra trang có đang học chưa
   */
  isPageInProgress(page: LecturePage): boolean {
    if (!this.traineeLectureDetail?.lecturePageTrainees) return false;
    
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(pt => pt.lecturePageId === page.id);
    return pageTrainee?.statusLearn === 1; // InProgressLearn
  }
  
  /**
   * Lấy trạng thái tổng thể của khóa học
   */
  getCourseStatus(): string {
    if (!this.traineeLectureDetail) return 'Chưa bắt đầu';
    return getStatusLearnDisplayText(this.traineeLectureDetail.statusLearn);
  }
  
  /**
   * Lấy màu sắc trạng thái tổng thể của khóa học
   */
  getCourseStatusColor(): string {
    if (!this.traineeLectureDetail) return 'basic';
    return getStatusLearnColor(this.traineeLectureDetail.statusLearn);
  }
  
  /**
   * Kiểm tra khóa học đã hoàn thành chưa
   */
  isCourseCompleted(): boolean {
    return this.traineeLectureDetail?.statusLearn === 2 || this.traineeLectureDetail?.statusLearn === 4;
  }
  
  /**
   * Hoàn thành khóa học
   */
  finishCourse(): void {
    if (!this.traineeLectureDetail) {
      this.showErrorMessage('Không tìm thấy thông tin khóa học');
      return;
    }
    
    // Kiểm tra nếu tất cả trang đã hoàn thành
    if (!this.areAllPagesCompleted()) {
      this.showErrorMessage('Bạn cần hoàn thành tất cả các trang học trước khi hoàn thành khóa học');
      return;
    }
    
    // Kiểm tra nếu khóa học chưa hoàn thành
    if (this.traineeLectureDetail.statusLearn === 2 || this.traineeLectureDetail.statusLearn === 4) {
      this.showSuccessMessage('Khóa học này đã được hoàn thành!');
      return;
    }
    
    // Gọi finishLearning API
    this.lectureDetailService.finishLearning(this.traineeLectureDetail.lectureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Finished course successfully:', response);
          
          // Cập nhật trạng thái local
          this.traineeLectureDetail!.statusLearn = 2; // CompletedLearn
          this.traineeLectureDetail!.timeCompletedLearn = new Date().toISOString();
          
          this.showSuccessMessage('Chúc mừng! Bạn đã hoàn thành khóa học!');
          
          // Tùy chọn: Điều hướng về trang danh sách khóa học hoặc tải lại
          setTimeout(() => {
            this.loadLectureDetail(); // Tải lại để cập nhật trạng thái mới nhất
          }, 2000);
        },
        error: (error) => {
          console.error('Error finishing course:', error);
          this.showErrorMessage('Không thể hoàn thành khóa học. Vui lòng thử lại sau.');
        }
      });
  }
  
  /**
   * Mark current page as completed
   */
  markPageCompleted(): void {
    if (!this.currentViewingPage || !this.traineeLectureDetail) return;
    
    // Tìm pageTrainee tương ứng
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(pt => pt.lecturePageId === this.currentViewingPage!.id);
    if (!pageTrainee) {
      this.showErrorMessage('Không tìm thấy thông tin trang học');
      return;
    }
    
    // Kiểm tra nếu trang chưa hoàn thành
    if (pageTrainee.statusLearn !== 2) { // Chưa CompletedLearn
      // Gọi finishPage API
      this.lectureDetailService.finishPage(pageTrainee.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Finished page successfully:', response);
            
            // Cập nhật trạng thái local
            pageTrainee.statusLearn = 2; // CompletedLearn
            pageTrainee.timeCompletedLearn = new Date().toISOString();
            
            // Thêm vào danh sách hoàn thành (compatibility với code cũ)
            if (!this.completedPageIds.includes(this.currentViewingPage!.id)) {
              this.completedPageIds.push(this.currentViewingPage!.id);
            }
            
            this.showSuccessMessage('Đã đánh dấu trang hoàn thành!');
            
            // Auto move to next page if available
            if (this.canGoNextPage()) {
              setTimeout(() => {
                this.nextViewingPage();
              }, 1000);
            } else {
              // Kiểm tra nếu tất cả trang đã hoàn thành
              if (this.areAllPagesCompleted()) {
                this.showSuccessMessage('Chúc mừng! Bạn đã hoàn thành tất cả tài liệu!');
                // Đóng viewer sau khi hoàn thành trang cuối cùng
                setTimeout(() => {
                  this.closeLectureViewer();
                }, 1500);
              }
            }
          },
          error: (error) => {
            console.error('Error finishing page:', error);
            this.showErrorMessage('Không thể hoàn thành trang học');
          }
        });
    } else {
      this.showSuccessMessage('Trang này đã được hoàn thành trước đó!');
    }
  }
  
  /**
   * Load page content for viewer
   */
  private loadPageContent(page: LecturePage): void {
    this.resetViewerContent();
    
    if (!page.storageURL) {
      this.viewerError = 'URL không tồn tại';
      return;
    }
    
    const url = page.storageURL.trim();
    
    if (!this.isValidUrlFormat(url)) {
      this.viewerError = 'URL không hợp lệ';
      return;
    }
    
    this.processUrlByType(page, url);
  }
  
  /**
   * Reset viewer content
   */
  private resetViewerContent(): void {
    this.safeContentUrl = null;
    this.imageUrl = '';
    this.viewerError = '';
  }
  
  /**
   * Process URL by page type
   */
  private processUrlByType(page: LecturePage, url: string): void {
    try {
      switch (page.typeLecturePage) {
        case 1: // Image
          this.processImageUrl(url);
          break;
        case 2: // Video
          this.processVideoUrl(url);
          break;
        case 4: // Doc
        case 5: // PDF
          this.processDocumentUrl(url);
          break;
        case 6: // Slide
          this.processSlideUrl(url);
          break;
        case 3: // Text
        case 0: // Other
        default:
          this.processGenericUrl(url);
          break;
      }
    } catch (error) {
      this.viewerError = 'Lỗi khi xử lý URL: ' + error;
    }
  }
  
  /**
   * Process image URL
   */
  private processImageUrl(url: string): void {
    if (url.includes('drive.google.com')) {
      const processedUrl = this.processGoogleDriveUrl(url, 'image');
      this.imageUrl = processedUrl;
    } else {
      this.imageUrl = url;
    }
  }
  
  /**
   * Process video URL
   */
  private processVideoUrl(url: string): void {
    if (url.includes('drive.google.com')) {
      const driveUrl = this.processGoogleDriveUrl(url, 'video');
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(driveUrl);
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      if (videoId) {
        this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${videoId}`
        );
      } else {
        this.viewerError = 'Không thể trích xuất YouTube video ID';
      }
    } else if (url.includes('vimeo.com')) {
      const videoId = this.extractVimeoId(url);
      if (videoId) {
        this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://player.vimeo.com/video/${videoId}`
        );
      } else {
        this.viewerError = 'Không thể trích xuất Vimeo video ID';
      }
    } else {
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }
  
  /**
   * Process document URL
   */
  private processDocumentUrl(url: string): void {
    if (url.includes('drive.google.com')) {
      const driveUrl = this.processGoogleDriveUrl(url, 'document');
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(driveUrl);
    } else {
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      );
    }
  }
  
  /**
   * Process slide URL
   */
  private processSlideUrl(url: string): void {
    if (url.includes('drive.google.com')) {
      const driveUrl = this.processGoogleDriveUrl(url, 'slide');
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(driveUrl);
    } else if (url.includes('docs.google.com/presentation')) {
      const embedUrl = url.includes('/embed') ? url : url.replace('/edit', '/embed');
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    } else {
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      );
    }
  }
  
  /**
   * Process generic URL
   */
  private processGenericUrl(url: string): void {
    if (url.includes('drive.google.com')) {
      const driveUrl = this.processGoogleDriveUrl(url, 'document');
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(driveUrl);
    } else {
      this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }
  
  /**
   * Extract YouTube ID
   */
  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  /**
   * Extract Vimeo ID
   */
  private extractVimeoId(url: string): string | null {
    const regExp = /vimeo.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }
  
  /**
   * Process Google Drive URLs
   */
  private processGoogleDriveUrl(url: string, fileType: 'image' | 'video' | 'document' | 'slide' = 'document'): string {
    const fileId = this.extractGoogleDriveFileId(url);
    
    if (fileId) {
      switch (fileType) {
        case 'image':
          return `https://drive.google.com/uc?id=${fileId}`;
        case 'video':
          return `https://drive.google.com/file/d/${fileId}/preview`;
        case 'slide':
          if (url.includes('docs.google.com/presentation')) {
            return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
          } else {
            return `https://drive.google.com/file/d/${fileId}/preview`;
          }
        case 'document':
        default:
          return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    
    return url;
  }
  
  /**
   * Extract Google Drive file ID
   */
  private extractGoogleDriveFileId(url: string): string | null {
    let fileId = '';
    
    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0];
    } else if (url.includes('id=')) {
      fileId = url.split('id=')[1]?.split('&')[0];
    } else if (url.includes('/open?id=')) {
      fileId = url.split('/open?id=')[1]?.split('&')[0];
    } else if (url.includes('drive.google.com/') && url.includes('?id=')) {
      fileId = url.split('?id=')[1]?.split('&')[0];
    }
    
    return fileId || null;
  }
  
  /**
   * Check if URL format is valid
   */
  private isValidUrlFormat(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Handle image error
   */
  onImageError(): void {
    if (this.imageUrl.includes('drive.google.com')) {
      const fileId = this.extractGoogleDriveFileId(this.imageUrl);
      if (fileId) {
        this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://drive.google.com/file/d/${fileId}/preview`
        );
        this.imageUrl = '';
        return;
      }
    }
    
    this.viewerError = 'Không thể tải hình ảnh. Vui lòng kiểm tra quyền truy cập hoặc thử mở trong tab mới.';
  }
  
  /**
   * Open URL in new tab
   */
  openInNewTab(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
  
  /**
   * Get current page status text
   */
  getCurrentPageStatusText(): string {
    if (!this.currentViewingPage || !this.traineeLectureDetail) {
      return 'Chưa bắt đầu';
    }
    
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees?.find(
      pt => pt.lecturePageId === this.currentViewingPage!.id
    );
    
    return pageTrainee ? getStatusLearnDisplayText(pageTrainee.statusLearn) : 'Chưa bắt đầu';
  }
  
  /**
   * Get current page status color
   */
  getCurrentPageStatusColor(): string {
    if (!this.currentViewingPage || !this.traineeLectureDetail) {
      return 'basic';
    }
    
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees?.find(
      pt => pt.lecturePageId === this.currentViewingPage!.id
    );
    
    return pageTrainee ? getStatusLearnColor(pageTrainee.statusLearn) : 'basic';
  }
  
  /**
   * Get type color for page
   */
  getTypeColor(type: number): string {
    switch (type) {
      case 2: // Video
        return '#f44336'; // Red
      case 1: // Image
        return '#4caf50'; // Green
      case 4: // Doc
      case 5: // Pdf
        return '#2196f3'; // Blue
      case 6: // Slide
        return '#ff9800'; // Orange
      case 3: // Text
        return '#9c27b0'; // Purple
      default:
        return '#607d8b'; // Blue Grey
    }
  }

  /**
   * Get sorted pages
   */
  getSortedPages(): LecturePage[] {
    if (!this.traineeLectureDetail?.lecture?.lecturePages) {
      return [];
    }
    
    return this.traineeLectureDetail.lecture.lecturePages.sort((a, b) => a.pageNumber - b.pageNumber);
  }
  
  /**
   * Track by page ID for ngFor
   */
  trackByPageId(index: number, page: LecturePage): string {
    return page.id;
  }
  
  /**
   * Check if current viewing page is completed
   */
  isCurrentPageCompleted(): boolean {
    if (!this.currentViewingPage || !this.traineeLectureDetail) {
      return false;
    }
    
    // Sử dụng dữ liệu từ API thay vì mảng local
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(
      pt => pt.lecturePageId === this.currentViewingPage!.id
    );
    
    return pageTrainee?.statusLearn === 2; // CompletedLearn
  }
  
  /**
   * Check if should show complete button for current page
   */
  shouldShowCompleteButton(): boolean {
    if (!this.currentViewingPage || !this.traineeLectureDetail) {
      return false;
    }
    
    // Chỉ hiển thị nút hoàn thành nếu trang chưa hoàn thành
    const pageTrainee = this.traineeLectureDetail.lecturePageTrainees.find(
      pt => pt.lecturePageId === this.currentViewingPage!.id
    );
    
    return pageTrainee?.statusLearn !== 2; // Không phải CompletedLearn
  }
  
  /**
   * Can start learning
   */
  canStartLearning(): boolean {
    if (!this.traineeLectureDetail) return false;
    return this.traineeLectureDetail.statusLearn === 0 || this.traineeLectureDetail.statusLearn === 1;
  }
  
  
  /**
   * Finish current page
   */
  finishCurrentPage(): void {
    if (this.currentLearningPageId && !this.completedPageIds.includes(this.currentLearningPageId)) {
      this.completedPageIds.push(this.currentLearningPageId);
      this.showSuccessMessage('Đã hoàn thành trang!');
      
      // Move to next page
      if (this.traineeLectureDetail?.lecture?.lecturePages) {
        const currentIndex = this.traineeLectureDetail.lecture.lecturePages.findIndex(p => p.id === this.currentLearningPageId);
        if (currentIndex >= 0 && currentIndex < this.traineeLectureDetail.lecture.lecturePages.length - 1) {
          this.currentLearningPageId = this.traineeLectureDetail.lecture.lecturePages[currentIndex + 1].id;
        } else {
          this.currentLearningPageId = null;
          this.showSuccessMessage('Chúc mừng! Bạn đã hoàn thành tất cả tài liệu!');
        }
      }
    }
  }
  
  /**
   * Get current page info for learning progress
   */
  getCurrentPageInfo(): { page: LecturePage | null; current: number; total: number } {
    if (!this.traineeLectureDetail?.lecture?.lecturePages || this.traineeLectureDetail.lecture.lecturePages.length === 0) {
      return { page: null, current: 0, total: 0 };
    }
    
    const pages = this.getSortedPages();
    const totalPages = pages.length;
    
    // Tìm trang đầu tiên chưa hoàn thành
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!this.isPageCompleted(page)) {
        return { page, current: i + 1, total: totalPages };
      }
    }
    
    // Nếu tất cả đã hoàn thành, trả về trang cuối cùng
    const lastPage = pages[pages.length - 1];
    return { page: lastPage, current: totalPages, total: totalPages };
  }
  
  /**
   * Get learning progress
   */
  getLearningProgress(): number {
    if (!this.traineeLectureDetail?.lecture?.lecturePages) {
      return 0;
    }
    
    const total = this.traineeLectureDetail.lecture.lecturePages.length;
    const completed = this.completedPageIds.length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
  
  /**
   * Get overall progress percentage
   */
  getOverallProgress(): number {
    return this.getCompletionPercentage();
  }

  /**
   * Get status badge CSS classes based on learning status
   */
  getStatusBadgeClasses(): string {
    if (!this.traineeLectureDetail) {
      return 'from-gray-400 to-gray-500 border-gray-300';
    }
    
    switch (this.traineeLectureDetail.statusLearn) {
      case 0: // NotStarted
        return 'from-gray-400 to-gray-500 border-gray-300';
      case 1: // InProgress
        return 'from-blue-400 to-blue-600 border-blue-300';
      case 2: // CompletedLearn
        return 'from-green-400 to-green-600 border-green-300';
      case 3: // InProgressExam
        return 'from-orange-400 to-orange-600 border-orange-300';
      case 4: // CompletedExam
        return 'from-purple-400 to-purple-600 border-purple-300';
      default:
        return 'from-gray-400 to-gray-500 border-gray-300';
    }
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.toast.success(message, 3000);
  }

  /**
   * Open lecture page content (legacy method - redirects to viewLecturePage)
   */
  openLecturePage(page: LecturePage): void {
    // Redirect to the new viewer method
    this.viewLecturePage(page);
  }

  /**
   * Get formatted duration from houres
   */
  getFormattedCourseDuration(): string {
    if (!this.traineeLectureDetail?.lecture?.courses?.houres) return '';
    return this.formatDuration(this.traineeLectureDetail.lecture.courses.houres * 60);
  }

  /**
   * Helper methods cho template
   */
  getLecturePageTypeDisplayText = getLecturePageTypeDisplayText;
  getLecturePageTypeIcon = getLecturePageTypeIcon;
  getStatusLearnDisplayText = getStatusLearnDisplayText;
  getStatusLearnColor = getStatusLearnColor;

  /**
   * Detect learning progress from existing data
   */
  private detectLearningProgress(): void {
    if (!this.traineeLectureDetail?.lecturePageTrainees) {
      return;
    }

    // Kiểm tra nếu có trang nào đang được học
    const inProgressPage = this.traineeLectureDetail.lecturePageTrainees.find(
      pt => pt.statusLearn === 1 // InProgressLearn
    );
    
    if (inProgressPage) {
      this.isLearningStarted = true;
      this.currentLearningPageId = inProgressPage.lecturePageId;
    } else {
      // Kiểm tra nếu có trang nào đã hoàn thành
      const completedPages = this.traineeLectureDetail.lecturePageTrainees.filter(
        pt => pt.statusLearn === 2 // CompletedLearn
      );
      
      if (completedPages.length > 0) {
        this.isLearningStarted = true;
        this.completedPageIds = completedPages.map(pt => pt.lecturePageId);
      }
    }
  }

  /**
   * Start learning flow
   */
  startLearning(): void {
    if (!this.traineeLectureDetail?.lecture?.lecturePages || this.traineeLectureDetail.lecture.lecturePages.length === 0) {
      this.showErrorMessage('Không có tài liệu để học');
      return;
    }
    
    const firstPage = this.getSortedPages()[0];
    if (firstPage) {
      this.isLearningStarted = true;
      this.currentPageIndex = 0;
      this.viewLecturePage(firstPage);
      this.showSuccessMessage('Bắt đầu học tập! Chúc bạn học tốt!');
    }
  }

  /**
   * Get status description for better UX
   */
  getStatusDescription(statusLearn: number): string {
    switch (statusLearn) {
      case 0:
        return 'Bạn chưa bắt đầu học khóa học này. Hãy click "Bắt đầu học" để bắt đầu.';
      case 1:
        return 'Bạn đang trong quá trình học tập. Tiếp tục theo dõi tiến độ và hoàn thành các tài liệu.';
      case 2:
        return 'Chúc mừng! Bạn đã hoàn thành phần học tập. Có thể bắt đầu thi để nhận chứng chỉ.';
      case 3:
        return 'Bạn đang trong quá trình thi. Hãy hoàn thành bài thi để nhận kết quả.';
      case 4:
        return 'Xuất sắc! Bạn đã hoàn thành toàn bộ khóa học và có thể nhận chứng chỉ.';
      default:
        return 'Trạng thái không xác định.';
    }
  }

  /**
   * View certificate - Mở chứng chỉ PDF từ Google Drive
   */
  viewCertificate(): void {
    if (!this.traineeLectureDetail) {
      this.showErrorMessage('Không tìm thấy thông tin khóa học');
      return;
    }

    if (!this.traineeLectureDetail.certification) {
      this.toast.warning('Chứng chỉ chưa được cấp', 3000);
      return;
    }

    // Mở link PDF drive trong tab mới
    window.open(this.traineeLectureDetail.certification, '_blank');
    this.toast.success('Đang mở chứng chỉ...', 2000);
  }

  /**
   * Check if can start exam (bao gồm thi lại)
   */
  canStartExam(): boolean {
    if (!this.traineeLectureDetail) return false;
    
    // Ẩn nút thi lại nếu đã có chứng chỉ
    if (this.traineeLectureDetail.certification || this.traineeLectureDetail.isCertified) {
      return false;
    }
    
    // Cho phép bắt đầu/tiếp tục/thi lại khi:
    // - Đã hoàn thành học (chuẩn bị thi)
    // - Đang thi dở
    // - Đã hoàn thành thi (cho phép thi lại)
    return (
      this.traineeLectureDetail.statusLearn === StatusLearn.CompletedLearn || 
      this.traineeLectureDetail.statusLearn === StatusLearn.InProgressExam ||
      this.traineeLectureDetail.statusLearn === StatusLearn.CompletedExam
    );
  }

  /**
   * Get exam button text based on status
   */
  getExamButtonText(): string {
    if (!this.traineeLectureDetail) return 'Bắt đầu thi';
    
    const statusLearn = this.traineeLectureDetail.statusLearn;
    
    if (statusLearn === StatusLearn.InProgressExam) {
      return 'Tiếp tục thi';
    } else if (statusLearn === StatusLearn.CompletedExam) {
      return 'Thi lại';
    } else {
      return 'Bắt đầu thi';
    }
  }

  /**
   * Get exam button icon based on status
   */
  getExamButtonIcon(): string {
    if (!this.traineeLectureDetail) return 'quiz';
    
    const statusLearn = this.traineeLectureDetail.statusLearn;
    
    if (statusLearn === StatusLearn.InProgressExam) {
      return 'play_arrow';
    } else if (statusLearn === StatusLearn.CompletedExam) {
      return 'refresh';
    } else {
      return 'quiz';
    }
  }

  /**
   * Start exam
   */
  startExam(): void {
    if (!this.traineeLectureDetail) {
      this.showErrorMessage('Không tìm thấy thông tin khóa học');
      return;
    }
    
    console.log('Bắt đầu thi khóa học:', this.traineeLectureDetail);
    
    const statusLearn = this.traineeLectureDetail.statusLearn;
    
    // Nếu đang trong quá trình thi (statusLearn = 3) -> Tiếp tục thi
    if (statusLearn === StatusLearn.InProgressExam) {
      this.toast.info('Bạn đang có bài thi chưa hoàn thành. Tiếp tục thi...', 2000);
      
      // Điều hướng trực tiếp đến trang thi để tiếp tục
      this.router.navigate(['/exam'], {
        queryParams: { 
          lectureId: this.traineeLectureDetail.lectureId,
          continueExam: 'true'
        }
      });
      return;
    }
    
    // Lấy thông tin chi tiết exam để hiển thị dialog
    this.examService.getExam(this.traineeLectureDetail.lectureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.result === 1 && response.data) {
            const examData = response.data;
            
            // Nếu statusLearn = 4 (CompletedExam) -> đây là thi lại
            const isRetake = statusLearn === StatusLearn.CompletedExam;
            
            // Tính số lần đã thi từ listExamOfTrainee
            const examList = examData.listExamOfTrainee || [];
            const attemptNumber = examList.length > 0 
              ? Math.max(...examList.map((e: ExamOfTrainee) => e.attemptNumber)) + 1
              : 1;
            
            // Tìm điểm lần thi gần nhất
            const latestAttempt = examList.length > 0 
              ? examList.reduce((prev: ExamOfTrainee, current: ExamOfTrainee) => 
                  (prev.attemptNumber > current.attemptNumber) ? prev : current
                )
              : null;
            
            let lastScore: number | undefined = latestAttempt?.score;
            
            // Nếu latestAttempt chưa có điểm, tìm attempt completed gần nhất
            if (!lastScore && examList.length > 0) {
              const completedAttempts = examList.filter((e: ExamOfTrainee) => 
                e.statusExam === StatusExam.Completed && e.score !== undefined
              );
              if (completedAttempts.length > 0) {
                const lastCompleted = completedAttempts.reduce((prev, current) => 
                  (prev.attemptNumber > current.attemptNumber) ? prev : current
                );
                lastScore = lastCompleted.score;
              }
            }
            
            // Hiển thị dialog xác nhận
            this.showExamConfirmDialog(
              examData, 
              isRetake, 
              isRetake ? attemptNumber - 1 : 0,
              lastScore
            );
            
          } else {
            this.toast.error(response.description || 'Không thể tải thông tin bài thi');
          }
        },
        error: (error) => {
          console.error('Lỗi khi tải thông tin bài thi:', error);
          this.toast.error('Lỗi khi tải thông tin bài thi. Vui lòng thử lại.');
        }
      });
  }

  /**
   * Show exam confirm dialog
   */
  private showExamConfirmDialog(
    examData: ExamData, 
    isRetake: boolean,
    retakeCount: number,
    lastScore?: number
  ): void {
    const dialogData: ExamConfirmData = {
      courseName: this.traineeLectureDetail!.lecture.tittle,
      timeOfExam: examData.timeOfExam,
      numberQuestions: examData.numberQuestions,
      minimumPercentageToComplete: examData.minimumPercentageToComplete,
      isRetake: isRetake,
      attemptNumber: retakeCount,
      lastScore: lastScore
    };
    
    const dialogRef = this.dialog.open(ExamConfirmDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        // Navigate to exam page
        this.router.navigate(['/exam'], {
          queryParams: { 
            lectureId: this.traineeLectureDetail!.lectureId,
            isRetake: isRetake ? 'true' : 'false'
          }
        });
      }
    });
  }
}

