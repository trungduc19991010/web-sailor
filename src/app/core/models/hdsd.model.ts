/**
 * Model cho HDSD (Hướng dẫn sử dụng)
 * Mapping từ API response /api/HDSDTrainee/get-all
 */
export interface HdsdItem {
  id: string;
  code: string;
  title: string;
  subTitle: string;
  descriptTion: string; // Note: API có typo "descriptTion"
  url: string;
}

/**
 * Response wrapper từ API
 */
export interface HdsdResponse {
  result: number;
  code: string;
  description: string;
  data: HdsdItem[];
}
