import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, Observable, of, Subject, Subscription, throwError} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';
import {ApiService} from './api.service';

@Injectable()
export class OAuth2Interceptor implements HttpInterceptor {

  accessTokenError$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private api: ApiService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {


    console.log('-- INTERCEPt --');
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
          console.log('HERE!');


          // you should probably clone the request here
          // req.clone({url: refreshtokenURL, params: refreshtokenPARAMS})
          req.clone({
            method: 'POST',
            url: 'test'
          })

          return this.api.renewAccessToken(refreshToken)
            .pipe(
              switchMap((event: any) => {
                console.log('RENEW TRIGGERED');
                localStorage.setItem('auth__access_token', event.access_token);
                localStorage.setItem('auth__refresh_token', event.refresh_token);
                localStorage.setItem('auth__token_expiry', event.expires_in);
                localStorage.setItem('auth__token_created', Math.floor(Date.now() / 1000).toString());

                this.accessTokenError$.next(false);
                console.log('req', req);
                const newRequest = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${localStorage.getItem('auth__access_token')}`
                  }
                });
                return next.handle(newRequest);
              }),
              catchError(err => {
                // error caught when trying to refresh token
                console.log('Error caught', err);
                localStorage.clear();
                return throwError(err);
              })
            );
        } else {
          // Not the first error, wait for access / refresh token
          console.log('NOT FIRST REQUEST!');
          return this.waitForNewTokens().pipe(
            switchMap((event: any) => {
              const newRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${localStorage.getItem('auth__access_token')}`
                }
              });
              return next.handle(newRequest);
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
