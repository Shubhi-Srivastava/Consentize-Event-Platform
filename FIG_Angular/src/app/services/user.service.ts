import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Observable } from "rxjs/internal/Observable";
import { environment } from "src/environments/environment";
import { AccountUpdate, User } from "../Model/user.model";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private path = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  getUsersByType(userType: string, eventId: number): Observable<User[]> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    const url = `${this.path}api/User/${userType}?eventId=${eventId}`;
    return this.httpClient.get<User[]>(url, {
      headers: header,
      withCredentials: true,
    });
  }

  getAdmin(eventId: number): Observable<User[]> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get<User[]>(
      this.path + "api/User/Admins/" + eventId,
      { headers: header, withCredentials: true }
    );
  }

  getUserById(userId: number | undefined,eventId: number): Observable<User[]> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get<any>(`${this.path}api/Artist/users/${userId}/events/${eventId}/portfolio`, {
      headers: header,
      withCredentials: true,
    });
  }
  sendFeedback(feedback: any): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.post(
      this.path + "api/Admin/submitFeedback",
      feedback
    );
  }

  getAccountDetails(userId: number): Observable<any> {
    const url = `${this.path}api/User/users/${userId}/accountDetails`;
    return this.httpClient.get(url);
  }

  updateAccount(userId: number, accountUpdate: AccountUpdate): Observable<any> {
    const url = `${this.path}api/User/accountupdate/${userId}`;
    return this.httpClient.put(url, accountUpdate);
  }

  updateMobileNo(userId: number, phoneNumber: string): Observable<any> {
    const url = `${this.path}api/User/phoneNoUpdate/${userId}`;
    const body = { phoneNumber: phoneNumber };
    return this.httpClient.put(url, body);
  }

  updatePassword(userId: number, password: string): Observable<any> {
    const url = `${this.path}api/User/passwordUpdate/${userId}`;
    const body = { password: password };
    return this.httpClient.put(url, body);
  }
}
