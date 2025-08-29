import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Import service và interfaces
import { CourseService, Course, CourseStatus, CourseLevel } from '../services/course.service';

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
    MatChipsModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.scss'
})
export class CourseListComponent implements OnInit, OnDestroy {
  // Dữ liệu từ service
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  
  // Loading states
  loading = false;
  
  // Filter options
  searchQuery = '';
  selectedCategory = '';
  selectedLevel = '';
  selectedStatus = '';
  
  // Filter options data
  categories: string[] = [];
  levels = Object.values(CourseLevel);
  statuses = Object.values(CourseStatus);
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 0;
  
  // Subject để unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private courseService: CourseService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadCourses();
    this.handleQueryParams();
  }

  /**
   * Handle query parameters from navigation
   */
  private handleQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
        this.applyFilters();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load danh sách khóa học
   */
  private loadCourses(): void {
    this.loading = true;
    
    this.courseService.getCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          this.extractCategories();
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Lỗi khi tải danh sách khóa học:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Extract unique categories from courses
   */
  private extractCategories(): void {
    const categorySet = new Set(this.courses.map(course => course.category));
    this.categories = Array.from(categorySet).sort();
  }

  /**
   * Apply filters to courses
   */
  applyFilters(): void {
    let filtered = [...this.courses];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructor.toLowerCase().includes(query) ||
        course.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(course => course.category === this.selectedCategory);
    }

    // Level filter
    if (this.selectedLevel) {
      filtered = filtered.filter(course => course.level === this.selectedLevel);
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(course => course.status === this.selectedStatus);
    }

    this.filteredCourses = filtered;
    this.calculatePagination();
  }

  /**
   * Calculate pagination
   */
  private calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCourses.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  /**
   * Get courses for current page
   */
  getPaginatedCourses(): Course[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCourses.slice(startIndex, endIndex);
  }

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedLevel = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Refresh courses list
   */
  refreshCourses(): void {
    this.clearFilters();
    this.loadCourses();
  }

  /**
   * TrackBy function cho courses list
   */
  trackByCourseId(index: number, course: Course): number {
    return course.id;
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
   * Get status color
   */
  getStatusColor(status: CourseStatus): string {
    const colorMap = {
      [CourseStatus.DRAFT]: 'warn',
      [CourseStatus.PUBLISHED]: 'primary',
      [CourseStatus.ARCHIVED]: 'accent',
      [CourseStatus.COMING_SOON]: 'primary'
    };
    return colorMap[status] || 'primary';
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
   * Navigate to course detail
   */
  viewCourseDetail(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }

  /**
   * Enroll in course
   */
  enrollCourse(course: Course): void {
    // TODO: Implement course enrollment
    console.log('Enroll in course:', course);
  }
}
