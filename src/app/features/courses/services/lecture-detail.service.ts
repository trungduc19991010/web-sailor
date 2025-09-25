import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { LectureDetail, LectureDetailResponse, TraineeLectureDetail } from '../../../core/models/lecture-detail';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LectureDetailService {
  // Base URL từ environment
  private readonly baseUrl = `${environment.services_domain}/TraineeLecture`;

  // BehaviorSubject để quản lý state
  private traineeLectureDetailSubject = new BehaviorSubject<TraineeLectureDetail | null>(null);
  public traineeLectureDetail$ = this.traineeLectureDetailSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Lấy chi tiết khóa học theo LectureId
   */
  getLectureDetail(lectureId: string): Observable<TraineeLectureDetail> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('Getting lecture detail for lectureId:', lectureId);

    return this.http.get<LectureDetailResponse>(`${this.baseUrl}/detail`, {
      params: { LectureId: lectureId }
    }).pipe(
      tap(response => {
        console.log('Lecture Detail API Response:', response);
      }),
      map(response => {
        if (response.result === 1 && response.data) {
          return response.data;
        } else {
          throw new Error(response.description || 'API trả về lỗi');
        }
      }),
      tap(data => {
        this.traineeLectureDetailSubject.next(data);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = this.handleError(error);
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Clear state
   */
  clearLectureDetail(): void {
    this.traineeLectureDetailSubject.next(null);
    this.errorSubject.next(null);
  }

  /**
   * Start learning - Gọi API start
   */
  startLearning(lectureId: string): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('Starting learning for lectureId:', lectureId);

    return this.http.post(`${this.baseUrl}/start`, {
      lectureId: lectureId
    }).pipe(
      tap(response => {
        console.log('Start Learning API Response:', response);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = this.handleError(error);
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Start page - Gọi API start-page
   */
  startPage(lecturePageId: string): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('Starting page for lecturePageId:', lecturePageId);

    return this.http.post(`${this.baseUrl}/start-page`, {
      lecturePageTraineeId: lecturePageId
    }).pipe(
      tap(response => {
        console.log('Start Page API Response:', response);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = this.handleError(error);
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Finish page - Gọi API finish-page
   */
  finishPage(lecturePageId: string): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('Finishing page for lecturePageId:', lecturePageId);

    return this.http.post(`${this.baseUrl}/finish-page`, {
      lecturePageTraineeId: lecturePageId
    }).pipe(
      tap(response => {
        console.log('Finish Page API Response:', response);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = this.handleError(error);
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Finish learning - Gọi API finish
   */
  finishLearning(lectureId: string): Observable<any> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('Finishing learning for lectureId:', lectureId);

    return this.http.post(`${this.baseUrl}/finish`, {
      lectureId: lectureId
    }).pipe(
      tap(response => {
        console.log('Finish Learning API Response:', response);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        const errorMessage = this.handleError(error);
        this.errorSubject.next(errorMessage);
        this.loadingSubject.next(false);
        throw error;
      })
    );
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
    console.error('LectureDetailService Error:', error);
    
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
      return 'Không tìm thấy khóa học yêu cầu.';
    }
    
    if (error.status >= 500) {
      return 'Lỗi server. Vui lòng thử lại sau.';
    }
    
    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  }
}