import {Component, OnInit} from '@angular/core';
import {ApiService} from './api.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  username = 'MAXTEST@mailinator.com';
  password = 'test12345';
  timeLeft = 0;
  profileData: any;

  constructor(
    private api: ApiService
  ) {

  }

  ngOnInit() {


  }

  authenticate() {
    this.api.getAccessToken(this.username, this.password).subscribe(
      (event: any) => {
        localStorage.setItem('auth__access_token', event.access_token);
        localStorage.setItem('auth__refresh_token', event.refresh_token);
        localStorage.setItem('auth__token_expiry', event.expires_in);
        localStorage.setItem('auth__token_created', Math.floor(Date.now() / 1000).toString());
      }
    );
  }

  logout() {
    localStorage.removeItem('auth__access_token');
    localStorage.removeItem('auth__refresh_token');
    localStorage.removeItem('auth__token_expiry');
    localStorage.removeItem('auth__token_created');
  }

  manualRefresh() {
    this.api.renewAccessToken(localStorage.getItem('auth__refresh_token')).subscribe(data => {
      console.log('SUBSCRIBE DATA', data);
    });
  }

  manualAPICall() {

    this.api.getUserProfile()
      .pipe(
        map(data => {
          console.log('PROFILEDATA', data);
          this.profileData = data;
          return data;
        })
      )
      .subscribe();
  }

}
