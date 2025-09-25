import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Import services và interfaces
import { TraineeLectureService } from '../services/trainee-lecture.service';
import { LectureDetailService } from '../services/lecture-detail.service';
import { AuthenticationService } from '../../../core/guards/authentication.service';
import { 
  TraineeLecture, 
  TraineeLectureRequest,
  StatusLearn, 
  getStatusLearnDisplayText, 
  getStatusLearnColor 
} from '../../../core/models/trainee-lecture';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatPaginatorModule
  ],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss'
})
export class CourseListComponent implements OnInit, OnDestroy {
  // Dữ liệu từ service - chỉ hiển thị khóa học của tôi
  myCourses: TraineeLecture[] = [];
  
  // Loading states
  loading = false;
  error: string | null = null;
  
  // Filter options cho TraineeLecture
  searchTitle = '';
  selectedStatusLearn: StatusLearn | '' = '';
  
  // StatusLearn options cho TraineeLecture
  statusLearnOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: StatusLearn.Created, label: 'Đã tạo' },
    { value: StatusLearn.InProgressLearn, label: 'Đang học' },
    { value: StatusLearn.CompletedLearn, label: 'Hoàn thành học' },
    { value: StatusLearn.InProgressExam, label: 'Đang thi' },
    { value: StatusLearn.CompletedExam, label: 'Hoàn thành thi' }
  ];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  
  // Subject để unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private traineeLectureService: TraineeLectureService,
    private lectureDetailService: LectureDetailService,
    private authenticationService: AuthenticationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.subscribeToServiceStates();
    
    // Kiểm tra trạng thái đăng nhập và subscribe đến thay đổi
    this.authenticationService.user
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user.token) {
          this.loadMyCourses();
        } else {
          // Nếu chưa đăng nhập, clear dữ liệu
          this.myCourses = [];
          this.showLoginRequiredMessage();
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Subscribe to service states (loading, error) của TraineeLectureService
   */
  private subscribeToServiceStates(): void {
    // Subscribe to loading state
    this.traineeLectureService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Subscribe to error state
    this.traineeLectureService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
        if (error) {
          this.snackBar.open(error, 'Đóng', {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: ['snack-error']
          });
        }
      });
  }

  /**
   * Load danh sách khóa học của tôi từ TraineeLecture API
   */
  private loadMyCourses(): void {
    // Kiểm tra authentication trước khi gọi API
    if (!this.authenticationService.userTokenValue.token) {
      console.log('User chưa đăng nhập, không gọi API TraineeLecture');
      this.myCourses = [];
      return;
    }

    // Tạo request với cả title và status filter
    const request: TraineeLectureRequest = {
      IsPaging: true,
      PageNumber: this.currentPage,
      PageSize: this.pageSize
    };

    // Thêm title filter nếu có
    if (this.searchTitle && this.searchTitle.trim()) {
      request.Title = this.searchTitle.trim();
    }

    // Thêm status filter nếu có
    if (this.selectedStatusLearn !== '' && this.selectedStatusLearn !== undefined) {
      request.StatusLearn = this.selectedStatusLearn as StatusLearn;
    }

    const request$ = this.traineeLectureService.getTraineeLectures(request);

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.myCourses = courses;
          // Note: API có thể cần trả về totalCount để tính toán pagination chính xác
          // Hiện tại set tạm thời
          this.totalItems = courses.length < this.pageSize ? 
            (this.currentPage - 1) * this.pageSize + courses.length :
            this.currentPage * this.pageSize + 1;
        },
        error: (error) => {
          console.error('Lỗi khi tải khóa học của tôi:', error);
        }
      });
  }


  /**
   * Apply filters cho TraineeLecture
   */
  applyFilters(): void {
    this.currentPage = 1; // Reset về trang đầu
    this.loadMyCourses();
  }

  /**
   * Clear filters
   */
  clearFilters(): void {
    this.searchTitle = '';
    this.selectedStatusLearn = '';
    this.currentPage = 1;
    this.loadMyCourses();
  }

  /**
   * Quick filter method - supports all status types
   */
  quickFilter(type: 'created' | 'in-progress' | 'completed-learn' | 'in-exam' | 'completed-exam'): void {
    let targetStatus: StatusLearn;
    
    switch (type) {
      case 'created':
        targetStatus = StatusLearn.Created;
        break;
      case 'in-progress':
        targetStatus = StatusLearn.InProgressLearn;
        break;
      case 'completed-learn':
        targetStatus = StatusLearn.CompletedLearn;
        break;
      case 'in-exam':
        targetStatus = StatusLearn.InProgressExam;
        break;
      case 'completed-exam':
        targetStatus = StatusLearn.CompletedExam;
        break;
      default:
        return;
    }
    
    // Toggle: if already selected, clear it; otherwise set it
    this.selectedStatusLearn = this.selectedStatusLearn === targetStatus ? '' : targetStatus;
    this.applyFilters();
  }

  /**
   * Clear search title only
   */
  clearSearchTitle(): void {
    this.searchTitle = '';
    this.applyFilters();
  }

  /**
   * Clear status learn filter only
   */
  clearStatusLearn(): void {
    this.selectedStatusLearn = '';
    this.currentPage = 1;
    this.loadMyCourses();
  }

  /**
   * Get completed courses count for quick stats (CompletedExam)
   */
  getCompletedCoursesCount(): number {
    return this.myCourses.filter(course => 
      course.statusLearn === StatusLearn.CompletedExam
    ).length;
  }

  /**
   * Get in progress courses count for quick stats (InProgressLearn + InProgressExam)
   */
  getInProgressCoursesCount(): number {
    return this.myCourses.filter(course => 
      course.statusLearn === StatusLearn.InProgressLearn || 
      course.statusLearn === StatusLearn.InProgressExam
    ).length;
  }

  /**
   * Get courses count by status for detailed stats
   */
  getStatusCounts() {
    const counts = {
      created: 0,
      inProgressLearn: 0,
      completedLearn: 0,
      inProgressExam: 0,
      completedExam: 0
    };

    this.myCourses.forEach(course => {
      switch (course.statusLearn) {
        case StatusLearn.Created:
          counts.created++;
          break;
        case StatusLearn.InProgressLearn:
          counts.inProgressLearn++;
          break;
        case StatusLearn.CompletedLearn:
          counts.completedLearn++;
          break;
        case StatusLearn.InProgressExam:
          counts.inProgressExam++;
          break;
        case StatusLearn.CompletedExam:
          counts.completedExam++;
          break;
      }
    });

    return counts;
  }

  /**
   * Math utility for template
   */
  Math = Math;

  /**
   * Xử lý thay đổi trang
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadMyCourses();
  }

  /**
   * Refresh courses list
   */
  refreshCourses(): void {
    if (this.authenticationService.userTokenValue.token) {
      this.clearFilters();
    } else {
      this.showLoginRequiredMessage();
    }
  }

  /**
   * Hiển thị thông báo cần đăng nhập
   */
  private showLoginRequiredMessage(): void {
    // Chỉ hiển thị message nếu đã có user tương tác (không phải lần đầu load trang)
    // this.snackBar.open('Đăng nhập để xem khóa học của bạn', 'Đóng', {
    //   duration: 3000,
    //   horizontalPosition: 'center',
    //   verticalPosition: 'top'
    // });
  }


  // ===== METHODS CHO TRAINEE LECTURE =====

  /**
   * Get status display text cho TraineeLecture
   */
  getStatusLearnDisplayText(status: StatusLearn): string {
    return getStatusLearnDisplayText(status);
  }

  /**
   * Get status color cho TraineeLecture
   */
  getStatusLearnColor(status: StatusLearn): string {
    return getStatusLearnColor(status);
  }

  /**
   * Format date display cho TraineeLecture
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Navigate to TraineeLecture detail
   */
  viewTraineeLectureDetail(course: TraineeLecture): void {
    this.router.navigate(['/courses', course.lectureId]);
  }

  /**
   * Start learning course
   */
  startLearning(course: TraineeLecture): void {
    console.log('Bắt đầu học khóa học:', course);
    
    // Gọi API start để bắt đầu học
    this.lectureDetailService.startLearning(course.lectureId).subscribe({
      next: (response) => {
        console.log('Bắt đầu học thành công:', response);
        // Điều hướng sang trang chi tiết bài giảng với autoStart param
        this.router.navigate(['/courses', course.lectureId], { 
          queryParams: { autoStart: 'true' } 
        });
      },
      error: (error) => {
        console.error('Lỗi khi bắt đầu học:', error);
        // Hiển thị thông báo lỗi
        this.snackBar.open('Lỗi khi bắt đầu học. Vui lòng thử lại.', 'Đóng', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  /**
   * Continue learning course
   */
  continueLearning(course: TraineeLecture): void {
    console.log('Tiếp tục học khóa học:', course);
    // Điều hướng trực tiếp đến trang chi tiết bình thường
    this.router.navigate(['/courses', course.lectureId]);
  }

  /**
   * Start exam
   */
  startExam(course: TraineeLecture): void {
    console.log('Bắt đầu thi khóa học:', course);
    // TODO: Implement navigation to exam interface
  }

  /**
   * View certificate
   */
  viewCertificate(course: TraineeLecture): void {
    console.log('Xem chứng chỉ khóa học:', course);
    // TODO: Implement certificate viewing
  }

  /**
   * Check if can start learning
   */
  canStartLearning(course: TraineeLecture): boolean {
    return course.statusLearn === StatusLearn.Created;
  }

  /**
   * Check if can continue learning
   */
  canContinueLearning(course: TraineeLecture): boolean {
    return course.statusLearn === StatusLearn.InProgressLearn;
  }

  /**
   * Check if can start exam
   */
  canStartExam(course: TraineeLecture): boolean {
    return course.statusLearn === StatusLearn.CompletedLearn || 
           course.statusLearn === StatusLearn.InProgressExam;
  }

  /**
   * Check if completed
   */
  isCompleted(course: TraineeLecture): boolean {
    return course.statusLearn === StatusLearn.CompletedExam;
  }

  /**
   * TrackBy function cho TraineeLecture list
   */
  trackByTraineeLectureId(index: number, course: TraineeLecture): string {
    return course.lectureId;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.traineeLectureService.clearError();
    this.error = null;
  }
}
