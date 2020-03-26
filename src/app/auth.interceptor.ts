import {Injectable} from '@angular/core';
import {HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {BehaviorSubject, Observable, of, Subject, Subscription, throwError} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';
import {ApiService} from './api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {


  constructor(private api: ApiService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const newRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${localStorage.getItem('auth__access_token')}`
      }
    });

    return next.handle(newRequest);

  }

}
