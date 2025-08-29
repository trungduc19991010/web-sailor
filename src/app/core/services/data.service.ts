import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interface cho dữ liệu mẫu
export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Dữ liệu mẫu (Model trong MVC)
  private users: User[] = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com' },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com' },
    { id: 3, name: 'Lê Văn C', email: 'levanc@example.com' }
  ];

  constructor() { }

  // Phương thức lấy danh sách users
  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  // Phương thức lấy user theo ID
  getUserById(id: number): Observable<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return of(user);
  }

  // Phương thức thêm user mới
  addUser(user: Omit<User, 'id'>): Observable<User> {
    const newUser: User = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      ...user
    };
    this.users.push(newUser);
    return of(newUser);
  }
}
