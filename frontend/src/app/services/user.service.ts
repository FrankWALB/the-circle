import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly USER_KEY = 'circle-user-id';
  private userIdSubject = new BehaviorSubject<string>(this.getOrCreateUserId());

  userId$ = this.userIdSubject.asObservable();

  get userId(): string {
    return this.userIdSubject.value;
  }

  private getOrCreateUserId(): string {
    let id = localStorage.getItem(this.USER_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(this.USER_KEY, id);
    }
    return id;
  }
}
