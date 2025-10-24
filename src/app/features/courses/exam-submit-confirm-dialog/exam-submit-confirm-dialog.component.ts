import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ExamSubmitConfirmData {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
}

@Component({
  selector: 'app-exam-submit-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="relative">
      <!-- Header -->
      <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <mat-icon class="text-white text-3xl">warning</mat-icon>
          </div>
          <div>
            <h2 class="text-2xl font-bold">Xác nhận nộp bài</h2>
            <p class="text-orange-100 text-sm mt-1">Vui lòng kiểm tra kỹ trước khi nộp</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 bg-white">
        <!-- Statistics -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <!-- Total Questions -->
          <div class="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div class="text-3xl font-bold text-blue-600">{{ data.totalQuestions }}</div>
            <div class="text-sm text-blue-700 font-medium mt-1">Tổng số câu</div>
          </div>

          <!-- Answered Questions -->
          <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div class="text-3xl font-bold text-green-600">{{ data.answeredQuestions }}</div>
            <div class="text-sm text-green-700 font-medium mt-1">Đã trả lời</div>
          </div>

          <!-- Unanswered Questions -->
          <div class="text-center p-4 bg-red-50 rounded-xl border border-red-200">
            <div class="text-3xl font-bold text-red-600">{{ data.unansweredQuestions }}</div>
            <div class="text-sm text-red-700 font-medium mt-1">Chưa trả lời</div>
          </div>
        </div>

        <!-- Warning Message -->
        <div *ngIf="data.unansweredQuestions > 0" 
             class="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-400 rounded-xl mb-6">
          <mat-icon class="text-amber-600 mt-0.5">info</mat-icon>
          <div class="flex-1">
            <p class="text-amber-900 font-semibold text-base leading-relaxed">
              Bạn còn <span class="text-amber-600 font-bold">{{ data.unansweredQuestions }} câu</span> chưa trả lời!
            </p>
            <p class="text-amber-800 text-sm mt-1">
              Các câu chưa trả lời sẽ được tính là sai. Bạn có chắc chắn muốn nộp bài?
            </p>
          </div>
        </div>

        <!-- Success Message -->
        <div *ngIf="data.unansweredQuestions === 0" 
             class="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-400 rounded-xl mb-6">
          <mat-icon class="text-green-600 mt-0.5">check_circle</mat-icon>
          <div class="flex-1">
            <p class="text-green-900 font-semibold text-base leading-relaxed">
              Tuyệt vời! Bạn đã trả lời đầy đủ tất cả các câu hỏi.
            </p>
            <p class="text-green-800 text-sm mt-1">
              Hãy kiểm tra lại một lần nữa trước khi nộp bài.
            </p>
          </div>
        </div>

        <!-- Confirmation Question -->
        <div class="text-center mb-6">
          <p class="text-lg text-gray-700 font-medium">
            Bạn có chắc chắn muốn nộp bài không?
          </p>
          <p class="text-sm text-gray-500 mt-1">
            Sau khi nộp, bạn sẽ không thể thay đổi câu trả lời
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            mat-raised-button
            (click)="onCancel()"
            class="flex-1 !py-3 !text-base !font-semibold !bg-gray-100 !text-gray-700 hover:!bg-gray-200 !shadow-md hover:!shadow-lg !transition-all">
            <mat-icon class="mr-2">close</mat-icon>
            Hủy bỏ
          </button>
          
          <button
            mat-raised-button
            (click)="onConfirm()"
            class="flex-1 !py-3 !text-base !font-bold !bg-gradient-to-r !from-green-500 !to-emerald-600 !text-white hover:!from-green-600 hover:!to-emerald-700 !shadow-lg hover:!shadow-xl !transition-all">
            <mat-icon class="mr-2">send</mat-icon>
            Xác nhận nộp bài
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ExamSubmitConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExamSubmitConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExamSubmitConfirmData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
