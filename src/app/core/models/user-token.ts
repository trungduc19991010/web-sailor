import { UserInfo } from "./user-info";

export class UserToken {
  token: string = '';
  userName: string = '';
  refreshToken: string = '';
  tokenExpiration: Date = new Date();
  permissions: string[] = [];
  company?: any;
  userInfo?: UserInfo;
}
