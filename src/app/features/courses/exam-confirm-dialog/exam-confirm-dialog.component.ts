import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ExamConfirmData {
  courseName: string;
  timeOfExam: number; // in seconds
  numberQuestions: number;
  minimumPercentageToComplete: number;
  isRetake?: boolean; // true = thi lại, false/undefined = thi lần đầu hoặc tiếp tục
  attemptNumber?: number; // Số lần đã thi
  lastScore?: number; // Điểm lần thi gần nhất
}

@Component({
  selector: 'app-exam-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './exam-confirm-dialog.component.html',
  styleUrl: './exam-confirm-dialog.component.scss'
})
export class ExamConfirmDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<ExamConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExamConfirmData
  ) {}

  /**
   * Format time in minutes
   */
  get formattedTime(): string {
    const minutes = Math.floor(this.data.timeOfExam / 60);
    return `${minutes} phút`;
  }

  /**
   * Confirm and start exam
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Cancel exam
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
