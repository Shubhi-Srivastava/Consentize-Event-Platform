import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  private loginStatus = new BehaviorSubject<boolean>(this.loggedIn())
  private username = new BehaviorSubject<string>(localStorage.getItem('username')!)
  private path = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  public signOutExternal = () => {
      localStorage.removeItem("token");
      console.log("token deleted")
  }

  LoginWithGoogle(credentials: string,eventId: number): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    //var credential = JSON.stringify(credentials)
    const body = { credentials, eventId }
    return this.httpClient.post(this.path + "api/Auth/LoginWithGoogle", body, { headers: header, withCredentials: true });
  }

  LoginWithFacebook(credentials: string): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.post(this.path + "LoginWithFacebook", JSON.stringify(credentials), { headers: header, withCredentials: true });
  }

  getClient(): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get(this.path + "GetColorList", { headers: header, withCredentials: true });
  }

  
  refreshToken(): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get(this.path + "RefreshToken", { headers: header, withCredentials: true });
  }

  revokeToken(): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.delete(this.path + "RevokeToken/" + this.username.value, { headers: header, withCredentials: true });
  }

  saveToken(token:string) {
    localStorage.setItem('token', token)
  }

  saveUsername(username:string) {
    localStorage.setItem('username', username)
  }

  loggedIn(): boolean {
    if (localStorage.getItem('token')) {
      return true;
    }
    return false;
  }

  setLoginStatus(val:any) {
    this.loginStatus.next(val)
  }

  setUsername(val:any) {
    this.username.next(val)
  }

  signup(name: string, email: string, password: string, confirmPassword: string, userType: string,eventId: number) {
    const body = { name, email, password, confirmPassword, userType, eventId };
    return this.httpClient.post(`${this.path}api/Auth/Register`, body);
  }

  login(email: string, password: string,eventId: number) {
    // Update the API URL and endpoint as per your backend API
    const url = `${this.path}api/Auth/Login`;
    const body = { email, password,eventId };
    return this.httpClient.post(url, body);
  }

  ForgotPassword(email: string) {
    const url = `${this.path}api/Auth/ForgotPassword`;
    const body = { email };
    return this.httpClient.post(url, body);
  }

  CheckCode(email: string, code: string) {
    const url = `${this.path}api/Auth/CheckCode`;
    const body = { email, code };
    return this.httpClient.post(url, body);
  }

  UpdatePassword(email: string, password: string) {
    const url = `${this.path}api/Auth/UpdatePassword`;
    const body = { email, password };
    return this.httpClient.post(url, body);
  }

  logout(token: string) {
    // Update the API URL and endpoint as per your backend API
    const url = `${this.path}api/Auth/Logout`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const options = { headers: headers };
    const body = JSON.stringify(token);
    return this.httpClient.post(url,body,options);
  }
}