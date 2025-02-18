import { Injectable } from '@angular/core';
import { UserStorage } from '../user/user-storage';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  constructor(private userStorage: UserStorage) {}

  getToken(): string | null {
    return this.userStorage.TOKEN_KEY || null;
  }

  setToken(token: string): void {
    this.userStorage.TOKEN_KEY = token;
  }

  clearToken(): void {
    this.userStorage.TOKEN_KEY = '';
  }
}
