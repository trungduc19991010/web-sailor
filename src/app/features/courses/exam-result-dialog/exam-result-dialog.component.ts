import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

export interface ExamResultData {
  lectureExamId: string;
  attemptNumber: number;
  totalQuestions: number;
  correctQuestions: number;
  percentage: number;
  passed: boolean;
  completedAt: string | null;
}

@Component({
  selector: 'app-exam-result-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './exam-result-dialog.component.html',
  styleUrls: ['./exam-result-dialog.component.scss']
})
export class ExamResultDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<ExamResultDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExamResultData,
    private router: Router
  ) {}

  /**
   * Lấy class CSS cho điểm số dựa trên kết quả
   */
  getScoreClass(): string {
    if (this.data.passed) {
      return 'text-green-600';
    } else if (this.data.percentage >= 50) {
      return 'text-orange-600';
    } else {
      return 'text-red-600';
    }
  }

  /**
   * Lấy icon cho kết quả
   */
  getResultIcon(): string {
    return this.data.passed ? 'check_circle' : 'cancel';
  }

  /**
   * Lấy class cho icon
   */
  getIconClass(): string {
    return this.data.passed ? 'text-green-500' : 'text-red-500';
  }

  /**
   * Lấy message kết quả
   */
  getResultMessage(): string {
    if (this.data.passed) {
      return 'Chúc mừng! Bạn đã đạt yêu cầu';
    } else {
      return 'Rất tiếc! Bạn chưa đạt yêu cầu';
    }
  }

  /**
   * Đóng dialog và quay về danh sách khóa học
   */
  goToCourses(): void {
    this.dialogRef.close();
    this.router.navigate(['/courses']);
  }

  /**
   * Đóng dialog và thi lại
   */
  retakeExam(): void {
    this.dialogRef.close({ retake: true });
  }
}
