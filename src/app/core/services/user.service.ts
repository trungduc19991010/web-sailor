import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseApi } from '../models/response-api';
import { UserInfo } from '../models/user-info';

export interface UpdateUserInfoRequest {
  fullName: string;
  email: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.services_domain}/User`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getUserInfo(): Observable<ResponseApi<UserInfo>> {
    return this.http.get<ResponseApi<UserInfo>>(`${this.apiUrl}/user-info`);
  }

  /**
   * Cập nhật thông tin người dùng
   */
  updateUserInfo(data: UpdateUserInfoRequest): Observable<ResponseApi<any>> {
    return this.http.post<ResponseApi<any>>(`${this.apiUrl}/update-info`, data);
  }
}
