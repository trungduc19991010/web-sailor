import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  // BehaviorSubject để quản lý state
  private homeDataSubject = new BehaviorSubject<HomePageData | null>(null);
  public homeData$ = this.homeDataSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    // Tự động load dữ liệu khi service được khởi tạo
    this.loadHomeData();
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
}
