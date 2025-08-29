import { PagingData } from "./paging-data";

export interface ResponseApi<T> {
  code: string;
  result: number;
  description: string;
  data: T;
  pagingResponse?: PagingData;
}
