import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, Observable, of, Subject, Subscription, throwError} from 'rxjs';
import {catchError, filter, switchMap} from 'rxjs/operators';
import {ApiService} from './api.service';

@Injectable()
export class OAuth2Interceptor implements HttpInterceptor {

  accessTokenError$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private api: ApiService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {


    console.log('-- INTERCEPt --', req.body, next);
    // Intercept all requests,
    // check time in local storage, and trigger token refresh call when necessary
    const currentTime = Math.floor(Date.now() / 1000);

    const accessToken = localStorage.getItem('auth__access_token');
    const refreshToken = localStorage.getItem('auth__refresh_token');
    const tokenExpiry = +localStorage.getItem('auth__token_expiry');
    const tokenRequest = +localStorage.getItem('auth__token_created');

    if ( accessToken && refreshToken && tokenExpiry ) {
      if ( currentTime > (tokenRequest + tokenExpiry) ) {

        if (!this.accessTokenError$.getValue()) {
          this.accessTokenError$.next(true);
          console.log('REFRESH TOKEN NOW');

          // todo make sure not to call this on login
          // todo chain the old request to the token one

          const formData: any = new FormData();
          formData.append('grant_type', 'refresh_token');
          formData.append('client_id', this.api.CLIENT_ID);
          formData.append('refresh_token', refreshToken);
          formData.append('scope', 'authenticated');
          const initialReq = req;
          const newReq = req.clone({
            method: 'POST',
            url: this.api.DOMAIN + '/oauth/token',
            body: formData
          });
          return next.handle(newReq).pipe(
            filter((request: any) => request.type !== 0),
            switchMap((event: any) => {
              console.log('HELLO TOKEN EVENT', event);
              localStorage.setItem('auth__access_token', event.body.access_token);
              localStorage.setItem('auth__refresh_token', event.body.refresh_token);
              localStorage.setItem('auth__token_expiry', event.body.expires_in);
              localStorage.setItem('auth__token_created', Math.floor(Date.now() / 1000).toString());
              this.accessTokenError$.next(false);
              return next.handle(initialReq);
            })
          );
        }
      }
    }



    return next.handle(req);
  }

  waitForNewTokens(): Observable<any> {

    const subject = new Subject<any>();
    const waitForToken$: Subscription = this.accessTokenError$.subscribe((error: boolean) => {
      console.log('WAIT ERR =>', error);
      if (!error) {
        subject.next();
        waitForToken$.unsubscribe();
      }
    });
    return subject.asObservable();

  }

}
