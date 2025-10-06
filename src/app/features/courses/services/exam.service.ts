import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  GetExamResponse,
  FinishExamRequest,
  FinishExamResponse
} from '../../../core/models/exam.model';
import { ResponseApi } from '../../../core/models/response-api';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = `${environment.services_domain}/TraineeLecture`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy thông tin bài thi theo lectureId
   * POST /api/TraineeLecture/get-exam
   * @param lectureId - ID của lecture
   */
  getExam(lectureId: string): Observable<GetExamResponse> {
    return this.http.post<GetExamResponse>(
      `${this.apiUrl}/get-exam`,
      null,
      {
        params: { lectureId },
        withCredentials: true
      }
    );
  }

  /**
   * Bắt đầu làm bài thi
   * POST /api/TraineeLecture/start-exam?lectureExamId={id}
   * @param lectureExamId - ID của bài thi
   */
  startExam(lectureExamId: string): Observable<ResponseApi<any>> {
    return this.http.post<ResponseApi<any>>(
      `${this.apiUrl}/start-exam`,
      null,
      {
        params: { lectureExamId },
        withCredentials: true
      }
    );
  }

  /**
   * Nộp bài thi và kết thúc
   * POST /api/TraineeLecture/finish-exam
   * @param finishExamRequest - Dữ liệu câu trả lời
   */
  finishExam(finishExamRequest: FinishExamRequest): Observable<FinishExamResponse> {
    return this.http.post<FinishExamResponse>(
      `${this.apiUrl}/finish-exam`,
      finishExamRequest,
      { withCredentials: true }
    );
  }
}
