export interface LectureDetail {
  id: string;
  coursesId: string;
  courses: Course;
  tittle: string;
  normalizationTittle: string;
  description: string;
  objects: string;
  note: string;
  lecturePages: LecturePage[];
  lectureTrainees: LectureTrainee[];
  lectureExams: any;
  isDeleted: boolean;
  creator: string;
  updater: string;
  created: string;
  updated: string;
  inputDate: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  normalizationName: string;
  eName: string;
  days: number;
  halfDays: number;
  houres: number;
  certCourse: number;
  note: string;
  parentCourse: any;
  childCourses: any[];
  isDeleted: boolean;
  creator: string;
  updater: string;
  created: string;
  updated: string;
  inputDate: string;
}

export interface LecturePage {
  id: string;
  lectureId: string;
  lecture: any;
  tittle: string;
  description: string;
  pageNumber: number;
  storageURL: string;
  typeLecturePage: LecturePageType;
  isDeleted: boolean;
  creator: string;
  updater: string;
  created: string;
  updated: string;
  inputDate: string;
}

export interface LectureTrainee {
  id: string;
  lectureId: string;
  lecture: any;
  traineeId: string;
  trainee: Trainee;
  lecturePageTrainees: any;
  statusLearn: StatusLearn;
  timetStartLearn: string | null;
  timeCompletedLearn: string | null;
  exams: any;
  isDeleted: boolean;
  creator: string;
  updater: string;
  created: string;
  updated: string;
  inputDate: string;
}

export interface Trainee {
  id: string;
  surname: string;
  name: string;
  fullName: string;
  normalizationFullName: string;
  birthday: string;
  gender: number;
  phoneNumber: string;
  address: string;
  hometown: string;
  cccd: string;
  birthplace: string;
  nationalityId: string;
  nationality: any;
  appFileId: string;
  appFile: any;
  userId: string;
  user: any;
  isDeleted: boolean;
  creator: string;
  updater: string;
  created: string;
  updated: string;
  inputDate: string;
}

export enum LecturePageType {
  Other = 0,
  Image = 1,
  Video = 2,
  Text = 3,
  Doc = 4,
  Pdf = 5,
  Slide = 6
}

export enum StatusLearn {
  Created = 0,
  InProgressLearn = 1,
  CompletedLearn = 2,
  InProgressExam = 3,
  CompletedExam = 4
}

export interface LecturePageTrainee {
  id: string;
  lecturePageId: string;
  pageNumber: number;
  statusLearn: StatusLearn;
  timetStartLearn: string | null;
  timeCompletedLearn: string | null;
}

// API response từ /detail endpoint trả về TraineeLecture detail
 export interface TraineeLectureDetail {
  id: string;
  lectureId: string;
  lecture: LectureDetail;
  traineeId: string;
  lecturePageTrainees: LecturePageTrainee[];
  statusLearn: StatusLearn;
  timetStartLearn: string | null;
  timeCompletedLearn: string | null;
}

export interface LectureDetailResponse {
  result: number;
  code: string;
  description: string;
  data: TraineeLectureDetail;
}

// Helper functions
export function getLecturePageTypeDisplayText(type: LecturePageType): string {
  switch (type) {
    case LecturePageType.Other:
      return 'Khác';
    case LecturePageType.Image:
      return 'Hình ảnh';
    case LecturePageType.Video:
      return 'Video';
    case LecturePageType.Text:
      return 'Văn bản';
    case LecturePageType.Doc:
      return 'Tài liệu';
    case LecturePageType.Pdf:
      return 'PDF';
    case LecturePageType.Slide:
      return 'Slide';
    default:
      return 'Không xác định';
  }
}

export function getLecturePageTypeIcon(type: LecturePageType): string {
  switch (type) {
    case LecturePageType.Other:
      return 'help';
    case LecturePageType.Image:
      return 'image';
    case LecturePageType.Video:
      return 'play_circle';
    case LecturePageType.Text:
      return 'article';
    case LecturePageType.Doc:
      return 'description';
    case LecturePageType.Pdf:
      return 'picture_as_pdf';
    case LecturePageType.Slide:
      return 'slideshow';
    default:
      return 'help';
  }
}

export function getStatusLearnDisplayText(status: StatusLearn): string {
  switch (status) {
    case StatusLearn.Created:
      return 'Chưa học';
    case StatusLearn.InProgressLearn:
      return 'Đang học';
    case StatusLearn.CompletedLearn:
      return 'Hoàn thành học';
    case StatusLearn.InProgressExam:
      return 'Đang thi';
    case StatusLearn.CompletedExam:
      return 'Hoàn thành thi';
    default:
      return 'Không xác định';
  }
}

export function getStatusLearnColor(status: StatusLearn): string {
  switch (status) {
    case StatusLearn.Created:
      return 'basic';
    case StatusLearn.InProgressLearn:
      return 'blue';
    case StatusLearn.CompletedLearn:
      return 'green';
    case StatusLearn.InProgressExam:
      return 'red';
    case StatusLearn.CompletedExam:
      return 'green';
    default:
      return 'basic';
  }
}