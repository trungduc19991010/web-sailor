import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';

// Import service và interfaces
import {
  HomeService,
  Stats,
  TrainingField,
  Course,
  PlatformFeature,
  HomePageData,
  PublicCourse
} from './services/home.service';
import { DataService, User } from '../../core/services/data.service';
import { VietnamesePaginatorIntl } from '../../core/services/vietnamese-paginator-intl.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatListModule, MatIconModule, MatProgressSpinnerModule, MatPaginatorModule],
  providers: [
    { provide: MatPaginatorIntl, useClass: VietnamesePaginatorIntl }
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Dữ liệu từ service
  stats: Stats | null = null;
  trainingFields: TrainingField[] = [];
  featuredCourses: Course[] = [];
  platformFeatures: PlatformFeature[] = [];
  publicCourses: PublicCourse[] = []; // Hiển thị trực tiếp từ API
  
  // Pagination for public courses (server-side)
  pageSize = 6; // Mỗi trang 6 bản ghi
  pageIndex = 0; // Backend sử dụng pageNumber bắt đầu từ 1
  totalCourses = 0;
  totalPages = 0;

  // Loading states
  loading = false;
  homeDataLoading = false;
  coursesLoading = false;

  // Thuộc tính cũ (giữ lại để tương thích)
  users: User[] = [];

  // Subject để unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private homeService: HomeService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.coursesLoading = true; // Set loading state ban đầu
    this.loadHomeData();
    this.loadUsers(); // Giữ lại để tương thích
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dữ liệu trang chủ từ HomeService
   */
  private loadHomeData(): void {
    // Subscribe to loading state
    this.homeService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.homeDataLoading = loading;
      });

    // Subscribe to home data
    this.homeService.homeData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.stats = data.stats;
          this.trainingFields = data.trainingFields;
          this.featuredCourses = data.featuredCourses;
          this.platformFeatures = data.platformFeatures;
          this.animateStats();
        }
      });

    // Subscribe to public courses
    this.homeService.publicCourses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(courses => {
        this.publicCourses = courses;
        console.log('Public courses loaded:', courses.length, courses);
        this.coursesLoading = false;
      });
    
    // Subscribe to paging response
    this.homeService.pagingResponse$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagingResponse => {
        if (pagingResponse) {
          this.totalCourses = pagingResponse.totalRecords;
          this.totalPages = pagingResponse.totalPages;
          this.pageIndex = pagingResponse.currentPage - 1; // Convert to 0-based index
          console.log('Paging info:', pagingResponse);
        }
      });
  }

  /**
   * Refresh dữ liệu trang chủ
   */
  refreshHomeData(): void {
    this.homeService.refreshHomeData();
    this.homeService.loadPublicCourses(1, this.pageSize); // Reset về trang 1
  }

  /**
   * Xử lý sự kiện thay đổi trang (server-side)
   */
  onPageChange(event: PageEvent): void {
    console.log('Page changed:', event);
    
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    
    // Gọi API với pageNumber (backend bắt đầu từ 1)
    const pageNumber = event.pageIndex + 1;
    console.log(`Loading page ${pageNumber} with ${event.pageSize} items`);
    
    this.coursesLoading = true;
    this.homeService.loadPublicCourses(pageNumber, event.pageSize);
    
    // Scroll to top of courses section
    setTimeout(() => {
      const coursesSection = document.querySelector('.courses-section');
      if (coursesSection) {
        coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  /**
   * Phương thức để animate số liệu thống kê
   */
  private animateStats(): void {
    if (this.stats) {
      console.log('Stats loaded và sẵn sàng animate:', this.stats);
      // TODO: Thêm animation logic ở đây
    }
  }

  /**
   * Xử lý click vào lĩnh vực đào tạo
   */
  onTrainingFieldClick(field: TrainingField): void {
    console.log('Clicked on training field:', field);
    // TODO: Navigate to field detail page
  }

  /**
   * Xử lý click vào khóa học
   */
  onCourseClick(course: Course): void {
    console.log('Clicked on course:', course);
    // TODO: Navigate to course detail page
  }

  /**
   * Xử lý đăng ký khóa học
   */
  onEnrollCourse(course: Course): void {
    console.log('Enroll in course:', course);
    // TODO: Implement course enrollment logic
  }

  // ===== TRACKBY METHODS (để tối ưu performance) =====

  /**
   * TrackBy function cho training fields
   */
  trackByFieldId(index: number, field: TrainingField): number {
    return field.id;
  }

  /**
   * TrackBy function cho courses
   */
  trackByCourseId(index: number, course: Course): number {
    return course.id;
  }

  /**
   * TrackBy function cho platform features
   */
  trackByFeatureId(index: number, feature: PlatformFeature): number {
    return feature.id;
  }

  // ===== PHƯƠNG THỨC CŨ (giữ lại để tương thích) =====

  /**
   * Phương thức Controller để tải dữ liệu users (giữ lại)
   */
  loadUsers(): void {
    this.loading = true;
    this.dataService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải danh sách users:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Phương thức Controller để thêm user mới (giữ lại)
   */
  addNewUser(): void {
    const newUser = {
      name: 'User mới ' + (this.users.length + 1),
      email: `user${this.users.length + 1}@example.com`
    };

    this.dataService.addUser(newUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.users.push(user);
        },
        error: (error) => {
          console.error('Lỗi khi thêm user:', error);
        }
      });
  }
}
