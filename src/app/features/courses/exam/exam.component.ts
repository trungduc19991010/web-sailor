import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ToastService } from '../../../core/services/toast.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ExamResultDialogComponent, ExamResultData } from '../exam-result-dialog/exam-result-dialog.component';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { ExamService } from '../services/exam.service';
import {
  ExamData,
  ExamQuestion,
  CorrectAnswerType,
  FinishExamRequest,
  UserQuestionAnswer,
  StatusExam,
  ExamOfTrainee
} from '../../../core/models/exam.model';
import { ExamSubmitConfirmDialogComponent, ExamSubmitConfirmData } from '../exam-submit-confirm-dialog/exam-submit-confirm-dialog.component';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDialogModule
  ],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.scss'
})
export class ExamComponent implements OnInit, OnDestroy {
  loading = false;
  examData: ExamData | null = null;
  lectureId: string = '';
  
  // Timer
  timeRemaining: number = 0; // seconds
  timerSubscription?: Subscription;
  
  // User answers - Map<questionId, Set<answerId>>
  userAnswers: Map<string, Set<string>> = new Map();
  
  // Current question index
  currentQuestionIndex = 0;
  
  // LocalStorage key for saving answers
  private get storageKey(): string {
    return `exam_answers_${this.lectureId}_${this.examData?.id || ''}`;
  }
  
  // Enum reference for template
  CorrectAnswerType = CorrectAnswerType;
  
  // String reference for template
  String = String;
  
  // Submitting state
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examService: ExamService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.lectureId = this.route.snapshot.queryParamMap.get('lectureId') || '';
    const isRetake = this.route.snapshot.queryParamMap.get('isRetake') === 'true';
    const continueExam = this.route.snapshot.queryParamMap.get('continueExam') === 'true';
    
    if (!this.lectureId) {
      this.toast.error('Không tìm thấy thông tin bài học');
      this.router.navigate(['/courses']);
      return;
    }

    // Nếu là thi lại, gọi start-exam trước để BE cộng attemptNumber
    if (isRetake) {
      this.startExamThenLoad();
    } else {
      // Tiếp tục thi hoặc thi lần đầu: load exam rồi start
      this.loadExam();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  /**
   * Load exam data (cho trường hợp tiếp tục thi hoặc thi lần đầu)
   */
  loadExam(): void {
    this.loading = true;
    this.examService.getExam(this.lectureId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.result === 1 && response.data) {
          // Sắp xếp câu hỏi theo số thứ tự (number) tăng dần
          const sortedQuestions = [...(response.data.questions || [])]
            .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
          this.examData = { ...response.data, questions: sortedQuestions };
          
          // Load saved answers từ localStorage (nếu có)
          this.loadSavedAnswers();
          
          // Kiểm tra xem có exam InProgress không
          const continueExam = this.route.snapshot.queryParamMap.get('continueExam') === 'true';
          
          if (continueExam) {
            // Tiếp tục thi: Tính thời gian còn lại dựa trên timeStartExam
            this.calculateRemainingTime();
            this.startTimer();
          } else {
            // Thi lần đầu: Lấy thời gian gốc
            this.timeRemaining = this.examData.timeOfExam;
            this.startExamSession();
          }
        } else {
          this.toast.error(response.description || 'Không thể tải bài thi');
          this.router.navigate(['/courses']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading exam:', error);
        this.toast.error('Lỗi khi tải bài thi');
        this.router.navigate(['/courses']);
      }
    });
  }
  
  /**
   * Start exam trước, sau đó load exam (cho trường hợp thi lại)
   */
  startExamThenLoad(): void {
    this.loading = true;
    
    // Bước 1: Gọi getExam để lấy lectureExamId
    this.examService.getExam(this.lectureId).subscribe({
      next: (examResponse) => {
        if (examResponse.result === 1 && examResponse.data) {
          const lectureExamId = examResponse.data.id;
          
          // Bước 2: Gọi start-exam (BE sẽ tự cộng attemptNumber)
          this.examService.startExam(lectureExamId).subscribe({
            next: (startResponse) => {
              if (startResponse.result === 1) {
                // Bước 3: Gọi lại getExam để lấy dữ liệu mới nhất với attemptNumber đã cộng
                this.examService.getExam(this.lectureId).subscribe({
                  next: (refreshedResponse) => {
                    this.loading = false;
                    if (refreshedResponse.result === 1 && refreshedResponse.data) {
                      // Sắp xếp câu hỏi theo số thứ tự (number) tăng dần
                      const sortedQuestions = [...(refreshedResponse.data.questions || [])]
                        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
                      this.examData = { ...refreshedResponse.data, questions: sortedQuestions };
                      
                      // Thi lại: Xóa đáp án cũ vì là lần thi mới
                      this.clearSavedAnswers();
                      
                      // Thi lại: Tính thời gian còn lại dựa trên timeStartExam mới
                      this.calculateRemainingTime();
                      
                      // Bắt đầu timer
                      this.startTimer();
                    } else {
                      this.toast.error('Không thể tải bài thi');
                      this.router.navigate(['/courses']);
                    }
                  },
                  error: (error) => {
                    this.loading = false;
                    console.error('Error reloading exam:', error);
                    this.toast.error('Lỗi khi tải bài thi');
                    this.router.navigate(['/courses']);
                  }
                });
              } else {
                this.loading = false;
                this.toast.error(startResponse.description || 'Không thể bắt đầu bài thi');
                this.router.navigate(['/courses']);
              }
            },
            error: (error) => {
              this.loading = false;
              console.error('Error starting exam:', error);
              this.toast.error('Lỗi khi bắt đầu bài thi');
              this.router.navigate(['/courses']);
            }
          });
        } else {
          this.loading = false;
          this.toast.error('Không thể tải thông tin bài thi');
          this.router.navigate(['/courses']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading exam info:', error);
        this.toast.error('Lỗi khi tải thông tin bài thi');
        this.router.navigate(['/courses']);
      }
    });
  }

  /**
   * Call start-exam API
   */
  startExamSession(): void {
    if (!this.examData) return;
    
    this.examService.startExam(this.examData.id).subscribe({
      next: (response) => {
        if (response.result === 1) {
          // Start countdown timer
          this.startTimer();
        } else {
          this.toast.error(response.description || 'Không thể bắt đầu bài thi');
        }
      },
      error: (error) => {
        console.error('Error starting exam:', error);
        this.toast.error('Lỗi khi bắt đầu bài thi');
      }
    });
  }

  /**
   * Calculate remaining time based on timeStartExam
   */
  calculateRemainingTime(): void {
    if (!this.examData) {
      this.timeRemaining = 0;
      return;
    }
    
    // Tìm exam InProgress mới nhất
    const examList = this.examData.listExamOfTrainee || [];
    const inProgressExams = examList.filter((e: ExamOfTrainee) => e.statusExam === StatusExam.InProgress);
    
    if (inProgressExams.length > 0) {
      // Lấy exam có timeStartExam mới nhất
      const latestInProgress = inProgressExams.reduce((prev: ExamOfTrainee, current: ExamOfTrainee) => {
        const prevTime = new Date(prev.timeStartExam).getTime();
        const currentTime = new Date(current.timeStartExam).getTime();
        return currentTime > prevTime ? current : prev;
      });
      
      // Tính thời gian đã trôi qua (giây)
      const startTime = new Date(latestInProgress.timeStartExam).getTime();
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      
      // Thời gian còn lại = thời gian thi - thời gian đã trôi qua
      this.timeRemaining = Math.max(0, this.examData.timeOfExam - elapsedSeconds);
      
      console.log('Calculate remaining time:', {
        timeOfExam: this.examData.timeOfExam,
        startTime: new Date(latestInProgress.timeStartExam),
        currentTime: new Date(),
        elapsedSeconds,
        timeRemaining: this.timeRemaining
      });
      
      // Nếu hết giờ thì tự động nộp
      if (this.timeRemaining <= 0) {
        this.toast.warning('Thời gian thi đã hết!');
        setTimeout(() => {
          this.autoSubmit();
        }, 1000);
      }
    } else {
      // Không có exam InProgress, lấy thời gian gốc
      this.timeRemaining = this.examData.timeOfExam;
    }
  }

  /**
   * Start countdown timer
   */
  startTimer(): void {
    // Kiểm tra nếu thời gian <= 0 thì không bắt đầu timer
    if (this.timeRemaining <= 0) {
      return;
    }
    
    this.timerSubscription = interval(1000)
      .pipe(take(this.timeRemaining))
      .subscribe({
        next: () => {
          this.timeRemaining--;
          if (this.timeRemaining <= 0) {
            this.autoSubmit();
          }
        }
      });
  }

  /**
   * Stop timer
   */
  stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /**
   * Format time remaining as MM:SS
   */
  get formattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get time progress percentage
   */
  get timeProgressPercentage(): number {
    if (!this.examData) return 0;
    return (this.timeRemaining / this.examData.timeOfExam) * 100;
  }

  /**
   * Get current question
   */
  get currentQuestion(): ExamQuestion | null {
    if (!this.examData || !this.examData.questions[this.currentQuestionIndex]) {
      return null;
    }
    return this.examData.questions[this.currentQuestionIndex];
  }

  /**
   * Check if answer is selected
   */
  isAnswerSelected(questionId: string, answerId: string): boolean {
    const answers = this.userAnswers.get(questionId);
    return answers ? answers.has(answerId) : false;
  }

  /**
   * Toggle answer selection (for single choice)
   */
  selectSingleAnswer(questionId: string, answerId: string): void {
    this.userAnswers.set(questionId, new Set([answerId]));
    this.saveAnswersToLocalStorage();
  }

  /**
   * Toggle answer selection (for multiple choice)
   */
  toggleMultipleAnswer(questionId: string, answerId: string): void {
    if (!this.userAnswers.has(questionId)) {
      this.userAnswers.set(questionId, new Set());
    }
    
    const answers = this.userAnswers.get(questionId)!;
    if (answers.has(answerId)) {
      answers.delete(answerId);
    } else {
      answers.add(answerId);
    }
    this.saveAnswersToLocalStorage();
  }

  /**
   * Navigate to previous question
   */
  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  /**
   * Navigate to next question
   */
  nextQuestion(): void {
    if (this.examData && this.currentQuestionIndex < this.examData.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  /**
   * Go to specific question
   */
  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
    // Lưu vị trí câu hỏi hiện tại
    this.saveAnswersToLocalStorage();
  }

  /**
   * Check if question is answered
   */
  isQuestionAnswered(questionId: string): boolean {
    const answers = this.userAnswers.get(questionId);
    return answers ? answers.size > 0 : false;
  }

  /**
   * Count answered questions
   */
  get answeredQuestionsCount(): number {
    return Array.from(this.userAnswers.values()).filter(set => set.size > 0).length;
  }

  /**
   * Submit exam manually
   */
  submitExam(): void {
    if (!this.examData) return;
    
    // Prepare dialog data
    const unansweredCount = this.examData.questions.length - this.answeredQuestionsCount;
    const dialogData: ExamSubmitConfirmData = {
      totalQuestions: this.examData.questions.length,
      answeredQuestions: this.answeredQuestionsCount,
      unansweredQuestions: unansweredCount
    };
    
    // Show confirmation dialog
    const dialogRef = this.dialog.open(ExamSubmitConfirmDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
      data: dialogData
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.finishExam();
      }
    });
  }

  /**
   * Auto submit when time runs out
   */
  autoSubmit(): void {
    // Hiển thị thông báo hết giờ rõ ràng
    this.toast.error('⏰ Hết giờ thi! Hệ thống đang tự động nộp bài của bạn...', 5000);
    
    // Đợi 1 giây để người dùng thấy thông báo
    setTimeout(() => {
      this.finishExam();
    }, 1000);
  }

  /**
   * Finish exam and submit answers
   */
  finishExam(): void {
    if (!this.examData || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.stopTimer();
    
    // Prepare request data
    const listQuestions: UserQuestionAnswer[] = this.examData.questions.map(question => {
      const userAnswerIds = this.userAnswers.get(question.id) || new Set();
      
      return {
        lectureExamQuestionId: question.id,
        answers: question.answers.map(answer => ({
          lectureExamAnswerId: answer.id,
          selected: userAnswerIds.has(answer.id)
        }))
      };
    });
    
    // Lấy attemptNumber từ exam InProgress (statusExam = 1) mới nhất
    // Nếu không có, lấy attemptNumber lớn nhất + 1
    let attemptNumber = 1;
    const examList = this.examData.listExamOfTrainee || [];
    
    if (examList.length > 0) {
      // Tìm exam InProgress mới nhất (theo timeStartExam)
      const inProgressExams = examList.filter((e: ExamOfTrainee) => e.statusExam === StatusExam.InProgress);
      
      if (inProgressExams.length > 0) {
        // Lấy exam có timeStartExam mới nhất
        const latestInProgress = inProgressExams.reduce((prev: ExamOfTrainee, current: ExamOfTrainee) => {
          const prevTime = new Date(prev.timeStartExam).getTime();
          const currentTime = new Date(current.timeStartExam).getTime();
          return currentTime > prevTime ? current : prev;
        });
        attemptNumber = latestInProgress.attemptNumber;
      } else {
        // Nếu không có exam InProgress, lấy attemptNumber lớn nhất + 1
        const maxAttempt = Math.max(...examList.map((e: ExamOfTrainee) => e.attemptNumber));
        attemptNumber = maxAttempt;
      }
    }
    
    console.log('Finish exam with attemptNumber:', attemptNumber);
    
    const finishRequest: FinishExamRequest = {
      lectureExamId: this.examData.id,
      listQuestions,
      attemptNumber
    };
    
    this.examService.finishExam(finishRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.result === 1 && response.data) {
          this.toast.success('Nộp bài thành công!');
          
          // Hiển thị dialog kết quả
          const resultData: ExamResultData = {
            lectureExamId: response.data.lectureExamId,
            attemptNumber: response.data.attemptNumber,
            totalQuestions: response.data.totalQuestions,
            correctQuestions: response.data.correctQuestions,
            percentage: response.data.percentage,
            passed: response.data.passed,
            completedAt: response.data.completedAt
          };
          
          const dialogRef = this.dialog.open(ExamResultDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: resultData,
            disableClose: true
          });
          
          dialogRef.afterClosed().subscribe(result => {
            // Xóa đáp án đã lưu sau khi nộp bài thành công
            this.clearSavedAnswers();
            
            if (result?.retake) {
              // Thi lại - reload trang với param isRetake
              this.router.navigate(['/exam'], {
                queryParams: { 
                  lectureId: this.lectureId,
                  isRetake: 'true'
                }
              }).then(() => {
                window.location.reload();
              });
            } else {
              // Quay về danh sách khóa học
              this.router.navigate(['/courses']);
            }
          });
        } else {
          this.toast.error(response.description || 'Nộp bài thất bại');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error finishing exam:', error);
        this.toast.error('Lỗi khi nộp bài');
      }
    });
  }
  
  /**
   * Save answers to localStorage
   */
  private saveAnswersToLocalStorage(): void {
    try {
      const answersObject: { [key: string]: string[] } = {};
      
      // Convert Map<string, Set<string>> to plain object
      this.userAnswers.forEach((answers, questionId) => {
        answersObject[questionId] = Array.from(answers);
      });
      
      const savedData = {
        answers: answersObject,
        savedAt: new Date().toISOString(),
        currentQuestionIndex: this.currentQuestionIndex
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(savedData));
      console.log('✅ Đã lưu đáp án vào localStorage:', this.storageKey);
    } catch (error) {
      console.error('❌ Lỗi khi lưu đáp án vào localStorage:', error);
    }
  }
  
  /**
   * Load saved answers from localStorage
   */
  private loadSavedAnswers(): void {
    try {
      const savedDataStr = localStorage.getItem(this.storageKey);
      
      if (savedDataStr) {
        const savedData = JSON.parse(savedDataStr);
        const answersObject = savedData.answers;
        
        // Convert plain object back to Map<string, Set<string>>
        this.userAnswers.clear();
        Object.keys(answersObject).forEach(questionId => {
          this.userAnswers.set(questionId, new Set(answersObject[questionId]));
        });
        
        // Restore current question index
        if (savedData.currentQuestionIndex !== undefined) {
          this.currentQuestionIndex = savedData.currentQuestionIndex;
        }
        
        console.log('✅ Đã khôi phục đáp án từ localStorage:', {
          totalAnswers: this.userAnswers.size,
          savedAt: savedData.savedAt,
          currentQuestion: this.currentQuestionIndex
        });
        
        this.toast.info('Đã khôi phục đáp án trước đó', 3000);
      }
    } catch (error) {
      console.error('❌ Lỗi khi load đáp án từ localStorage:', error);
    }
  }
  
  /**
   * Clear saved answers from localStorage (khi nộp bài hoặc thi lại)
   */
  private clearSavedAnswers(): void {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ Đã xóa đáp án đã lưu:', this.storageKey);
    } catch (error) {
      console.error('❌ Lỗi khi xóa đáp án:', error);
    }
  }
}
