// Enum cho trạng thái học
export enum StatusLearn {
  Created = 0,
  InProgressLearn = 1,
  CompletedLearn = 2,
  InProgressExam = 3,
  CompletedExam = 4
}

// Interface cho TraineeLecture từ API response
export interface TraineeLecture {
  lectureId: string;
  title: string;
  description: string;
  objects: string;
  note: string;
  created: string; // ISO date string
  courseCode: string;
  courseName: string;
  isRegistered: boolean;
  statusLearn: StatusLearn;
}

// Interface cho request parameters
export interface TraineeLectureRequest {
  Title?: string;
  StatusLearn?: StatusLearn;
  IsPaging: boolean;
  PageNumber: number;
  PageSize: number;
}

// Interface cho API response
export interface TraineeLectureResponse {
  result: boolean;
  code: string;
  description: string;
  data: TraineeLecture[];
}

// Helper function để chuyển đổi status text
export function getStatusLearnDisplayText(status: StatusLearn): string {
  const statusMap = {
    [StatusLearn.Created]: 'Đã tạo',
    [StatusLearn.InProgressLearn]: 'Đang học',
    [StatusLearn.CompletedLearn]: 'Hoàn thành học',
    [StatusLearn.InProgressExam]: 'Đang thi',
    [StatusLearn.CompletedExam]: 'Hoàn thành thi'
  };
  return statusMap[status] || 'Không xác định';
}

// Helper function để lấy màu cho status
export function getStatusLearnColor(status: StatusLearn): string {
  const colorMap = {
    [StatusLearn.Created]: '#9e9e9e', // Grey
    [StatusLearn.InProgressLearn]: '#2196f3', // Blue
    [StatusLearn.CompletedLearn]: '#4caf50', // Green
    [StatusLearn.InProgressExam]: '#ff9800', // Orange
    [StatusLearn.CompletedExam]: '#8bc34a' // Light Green
  };
  return colorMap[status] || '#666';
}