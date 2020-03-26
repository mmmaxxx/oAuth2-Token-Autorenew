import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpRequest} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  DOMAIN = 'http://local.asia.tv5monde.com';
  CLIENT_ID = 'dcc1af5c-918a-43e9-b4d6-6dfed2484b7d';

  constructor(
    private httpClient: HttpClient
  ) { }

  getAccessToken(username: string, password: string) {
    const formData: any = new FormData();
    formData.append('grant_type', 'password');
    formData.append('client_id', this.CLIENT_ID);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', 'basic_account_user');
    return this.httpClient.post(this.DOMAIN + '/oauth/token', formData);
  }

  renewAccessToken(refreshToken: string) {
    const formData: any = new FormData();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', this.CLIENT_ID);
    formData.append('refresh_token', refreshToken);
    return this.httpClient.post(this.DOMAIN + '/oauth/token', formData, {withCredentials: true});
  }

  renewAccessTokenClone(request: HttpRequest<any>) {
  }

  getUserProfile() {
    return this.httpClient.get(this.DOMAIN + '/auth/profile');
  }

}
