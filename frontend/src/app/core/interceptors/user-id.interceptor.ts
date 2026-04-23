import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserService } from '../../services/user.service';

export const userIdInterceptor: HttpInterceptorFn = (req, next) => {
  const userId = inject(UserService).userId;
  return next(req.clone({ setHeaders: { 'x-user-id': userId } }));
};
