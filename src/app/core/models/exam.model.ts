/**
 * Exam Models and Interfaces
 * Định nghĩa các interface cho chức năng thi trắc nghiệm
 */

/**
 * Trạng thái bài thi
 * 0: Chưa học (chưa bắt đầu)
 * 1: Đang làm bài
 * 2: Đã hoàn thành
 */
export enum StatusExam {
  Created = 0,
  InProgress = 1,
  Completed = 2
}

/**
 * Loại câu trả lời đúng
 * 0: Chọn 1 đáp án
 * 1: Chọn nhiều đáp án
 */
export enum CorrectAnswerType {
  SINGLE_CHOICE = 0,
  MULTIPLE_CHOICE = 1
}

/**
 * Đáp án của một câu hỏi
 */
export interface ExamAnswer {
  id: string;
  answer: string;
}

/**
 * Câu hỏi trong bài thi
 */
export interface ExamQuestion {
  id: string;
  correctAnswerType: CorrectAnswerType;
  question: string;
  number: number;
  numberAnswers: number;
  answers: ExamAnswer[];
}

/**
 * Thông tin bài thi của trainee
 */
export interface ExamOfTrainee {
  id: string;
  lectureTraineeId: string;
  lectureExamId: string;
  timeStartExam: string; // ISO date string
  timeCompletedExam: string | null; // ISO date string hoặc null nếu chưa hoàn thành
  statusExam: number; // 0=Created, 1=InProgress, 2=Completed
  attemptNumber: number;
  score?: number; // Điểm số (nếu có)
}

/**
 * Dữ liệu bài thi chi tiết
 */
export interface ExamData {
  id: string;
  lectureId: string;
  timeOfExam: number; // Thời gian thi (giây)
  minimumPercentageToComplete: number;
  numberQuestions: number;
  questions: ExamQuestion[];
  listExamOfTrainee: ExamOfTrainee[];
}

/**
 * Response API get-exam
 */
export interface GetExamResponse {
  result: number;
  code: string;
  description: string;
  data: ExamData;
}

/**
 * Câu trả lời của user cho một câu hỏi
 */
export interface UserQuestionAnswer {
  lectureExamQuestionId: string;
  answers: UserAnswerItem[];
}

/**
 * Một đáp án được chọn
 */
export interface UserAnswerItem {
  lectureExamAnswerId: string;
  selected: boolean;
}

/**
 * Request body cho API finish-exam
 */
export interface FinishExamRequest {
  lectureExamId: string;
  listQuestions: UserQuestionAnswer[];
  attemptNumber: number;
}

/**
 * Response API finish-exam
 */
export interface FinishExamResponse {
  result: number;
  code: string;
  description: string;
  data?: {
    lectureExamId: string;
    attemptNumber: number;
    totalQuestions: number;
    correctQuestions: number;
    percentage: number;
    passed: boolean;
    completedAt: string | null;
  };
}
