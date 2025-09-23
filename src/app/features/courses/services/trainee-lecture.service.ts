import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { 
  TraineeLecture, 
  TraineeLectureRequest, 
  TraineeLectureResponse, 
  StatusLearn 
} from '../../../core/models/trainee-lecture';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TraineeLectureService {
  // Base URL từ environment
  private readonly baseUrl = `${environment.services_domain}/TraineeLecture`;

  // BehaviorSubject để quản lý state
  private traineeLecturesSubject = new BehaviorSubject<TraineeLecture[]>([]);
  public traineeLectures$ = this.traineeLecturesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách TraineeLecture từ API
   */
  getTraineeLectures(request: TraineeLectureRequest): Observable<TraineeLecture[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Tạo URL query parameters
    let params = new HttpParams()
      .set('IsPaging', request.IsPaging.toString())
      .set('PageNumber', request.PageNumber.toString())
      .set('PageSize', request.PageSize.toString());

    // Thêm optional parameters vào URL
    if (request.Title && request.Title.trim()) {
      params = params.set('Tittle', request.Title.trim());
    }
    
    if (request.StatusLearn !== undefined) {
      params = params.set('StatusLearn', request.StatusLearn.toString());
    }

    console.log('TraineeLecture API URL Params:', params.toString());

    return this.http.post<TraineeLectureResponse>(`${this.baseUrl}/get`, {}, { params })
      .pipe(
        tap(response => {
          console.log('TraineeLecture API Response:', response);
        }),
        map(response => {
          if (response.result && response.data) {
            return response.data;
          } else {
            throw new Error(response.description || 'API trả về lỗi');
          }
        }),
        tap(data => {
          this.traineeLecturesSubject.next(data);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          const errorMessage = this.handleError(error);
          this.errorSubject.next(errorMessage);
          this.loadingSubject.next(false);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Lấy danh sách khóa học của tôi (đã đăng ký)
   */
  getMyCourses(pageNumber: number = 1, pageSize: number = 10): Observable<TraineeLecture[]> {
    const request: TraineeLectureRequest = {
      IsPaging: true,
      PageNumber: pageNumber,
      PageSize: pageSize
      // Không set StatusLearn để lấy tất cả
    };

    return this.getTraineeLectures(request);
  }

  /**
   * Lấy khóa học theo trạng thái học
   */
  getCoursesByStatus(status: StatusLearn, pageNumber: number = 1, pageSize: number = 10): Observable<TraineeLecture[]> {
    const request: TraineeLectureRequest = {
      StatusLearn: status,
      IsPaging: true,
      PageNumber: pageNumber,
      PageSize: pageSize
    };

    return this.getTraineeLectures(request);
  }

  /**
   * Tìm kiếm khóa học theo tên
   */
  searchCourses(title: string, pageNumber: number = 1, pageSize: number = 10): Observable<TraineeLecture[]> {
    const request: TraineeLectureRequest = {
      Title: title,
      IsPaging: true,
      PageNumber: pageNumber,
      PageSize: pageSize
    };

    return this.getTraineeLectures(request);
  }

  /**
   * Lấy tất cả khóa học không phân trang (để thống kê)
   */
  getAllCourses(): Observable<TraineeLecture[]> {
    const request: TraineeLectureRequest = {
      IsPaging: false,
      PageNumber: 1,
      PageSize: 1000 // Số lớn để lấy hết
    };

    return this.getTraineeLectures(request);
  }

  /**
   * Refresh dữ liệu
   */
  refreshData(): void {
    this.getMyCourses().subscribe({
      next: () => {
        console.log('Đã refresh dữ liệu TraineeLecture');
      },
      error: (error) => {
        console.error('Lỗi khi refresh dữ liệu:', error);
      }
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Xử lý lỗi
   */
  private handleError(error: any): string {
    console.error('TraineeLectureService Error:', error);
    
    if (error.error?.description) {
      return error.error.description;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.status === 0) {
      return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    }
    
    if (error.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }
    
    if (error.status === 403) {
      return 'Bạn không có quyền truy cập tính năng này.';
    }
    
    if (error.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.';
    }
    
    if (error.status >= 500) {
      return 'Lỗi server. Vui lòng thử lại sau.';
    }
    
    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  }

  /**
   * Thống kê khóa học theo status
   */
  getCoursesStatsByStatus(): Observable<{[key in StatusLearn]?: number}> {
    return this.getAllCourses().pipe(
      map(courses => {
        const stats: {[key in StatusLearn]?: number} = {};
        
        courses.forEach(course => {
          stats[course.statusLearn] = (stats[course.statusLearn] || 0) + 1;
        });
        
        return stats;
      })
    );
  }

  /**
   * Lấy khóa học theo ID
   */
  getCourseById(lectureId: string): Observable<TraineeLecture | undefined> {
    return this.traineeLectures$.pipe(
      map(courses => courses.find(course => course.lectureId === lectureId))
    );
  }
}