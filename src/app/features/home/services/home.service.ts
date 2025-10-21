import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Import configuration data
import {
  HOME_STATS,
  TRAINING_FIELDS,
  FEATURED_COURSES,
  PLATFORM_FEATURES
} from '../config/home-data.config';

// Interfaces cho dữ liệu trang chủ
export interface Stats {
  totalAccess: number;
  totalStudents: number;
  totalLessons: number;
  totalInstructors: number;
}

export interface TrainingField {
  id: number;
  name: string;
  courseCount: number;
  icon: string;
  description?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  rating: number;
  reviews: number;
  duration: string;
  featured: boolean;
  imageUrl?: string;
  instructor?: string;
  price?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}

// Interface cho API response từ backend
export interface PublicCourse {
  code: string;
  name: string;
  normalizationName: string;
  eName: string;
  note: string | null;
}

export interface ApiResponse<T> {
  result: number;
  code: string;
  description: string;
  data: T;
  pagingResponse?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

export interface PlatformFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface HomePageData {
  stats: Stats;
  trainingFields: TrainingField[];
  featuredCourses: Course[];
  platformFeatures: PlatformFeature[];
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private http = inject(HttpClient);
  private apiUrl = environment.services_domain;

  // BehaviorSubject để quản lý state
  private homeDataSubject = new BehaviorSubject<HomePageData | null>(null);
  public homeData$ = this.homeDataSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // BehaviorSubject cho public courses
  private publicCoursesSubject = new BehaviorSubject<PublicCourse[]>([]);
  public publicCourses$ = this.publicCoursesSubject.asObservable();
  
  // BehaviorSubject cho paging response
  private pagingResponseSubject = new BehaviorSubject<any>(null);
  public pagingResponse$ = this.pagingResponseSubject.asObservable();

  constructor() {
    // Tự động load dữ liệu khi service được khởi tạo
    this.loadHomeData();
    this.loadPublicCourses(1, 6); // Load trang đầu tiên với 6 items
  }

  /**
   * Lấy dữ liệu thống kê tổng quan
   */
  getStats(): Observable<Stats> {
    return of(HOME_STATS).pipe(delay(500)); // Simulate API call
  }

  /**
   * Lấy danh sách lĩnh vực đào tạo
   */
  getTrainingFields(): Observable<TrainingField[]> {
    return of(TRAINING_FIELDS).pipe(delay(300));
  }

  /**
   * Lấy danh sách khóa học nổi bật
   */
  getFeaturedCourses(): Observable<Course[]> {
    return of(FEATURED_COURSES).pipe(delay(400));
  }

  /**
   * Lấy danh sách tính năng nền tảng
   */
  getPlatformFeatures(): Observable<PlatformFeature[]> {
    return of(PLATFORM_FEATURES).pipe(delay(200));
  }

  /**
   * Load tất cả dữ liệu trang chủ
   */
  loadHomeData(): void {
    this.loadingSubject.next(true);

    // Simulate loading multiple data sources
    Promise.all([
      this.getStats().toPromise(),
      this.getTrainingFields().toPromise(),
      this.getFeaturedCourses().toPromise(),
      this.getPlatformFeatures().toPromise()
    ]).then(([stats, trainingFields, featuredCourses, platformFeatures]) => {
      const homeData: HomePageData = {
        stats: stats!,
        trainingFields: trainingFields!,
        featuredCourses: featuredCourses!,
        platformFeatures: platformFeatures!
      };

      this.homeDataSubject.next(homeData);
      this.loadingSubject.next(false);
    }).catch(error => {
      console.error('Lỗi khi tải dữ liệu trang chủ:', error);
      this.loadingSubject.next(false);
    });
  }

  /**
   * Refresh dữ liệu trang chủ
   */
  refreshHomeData(): void {
    this.loadHomeData();
  }

  /**
   * Lấy khóa học theo ID
   */
  getCourseById(id: number): Observable<Course | undefined> {
    return new Observable(observer => {
      this.getFeaturedCourses().subscribe(courses => {
        const course = courses.find(c => c.id === id);
        observer.next(course);
        observer.complete();
      });
    });
  }

  /**
   * Lấy lĩnh vực đào tạo theo ID
   */
  getTrainingFieldById(id: number): Observable<TrainingField | undefined> {
    return new Observable(observer => {
      this.getTrainingFields().subscribe(fields => {
        const field = fields.find(f => f.id === id);
        observer.next(field);
        observer.complete();
      });
    });
  }

  /**
   * Lấy danh sách khóa học công khai từ API (không cần đăng nhập)
   * @param pageNumber Số trang (bắt đầu từ 1)
   * @param pageSize Số bản ghi mỗi trang
   */
  getPublicCourses(pageNumber: number = 1, pageSize: number = 6): Observable<ApiResponse<PublicCourse[]>> {
    const url = `${this.apiUrl}/Courses/get-public?IsPaging=true&PageNumber=${pageNumber}&PageSize=${pageSize}`;
    return this.http.get<ApiResponse<PublicCourse[]>>(url).pipe(
      catchError(error => {
        console.error('Lỗi khi lấy khóa học công khai:', error);
        // Trả về empty response
        return of({
          result: 0,
          code: 'ERROR',
          description: 'Lỗi khi tải dữ liệu',
          data: [],
          pagingResponse: {
            currentPage: 1,
            pageSize: pageSize,
            totalPages: 0,
            totalRecords: 0
          }
        });
      })
    );
  }

  /**
   * Load danh sách khóa học công khai
   * @param pageNumber Số trang
   * @param pageSize Số bản ghi mỗi trang
   */
  loadPublicCourses(pageNumber: number = 1, pageSize: number = 6): void {
    this.getPublicCourses(pageNumber, pageSize).subscribe(response => {
      if (response.result === 1) {
        this.publicCoursesSubject.next(response.data || []);
        this.pagingResponseSubject.next(response.pagingResponse);
      } else {
        this.publicCoursesSubject.next([]);
        this.pagingResponseSubject.next(null);
      }
    });
  }
}
