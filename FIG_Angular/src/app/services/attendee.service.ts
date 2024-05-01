import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from 'src/environments/environment';
import { User } from '../Model/user.model';

@Injectable({
  providedIn: 'root'
})
export class AttendeeService {

  private path = environment.apiUrl

  constructor(private httpClient: HttpClient) { }

  getEvents(userId: number): Observable<any[]> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get<any[]>(this.path + "api/Attendee/UserEvents/" + userId, { headers: header, withCredentials: true });
  }

  updateNotificationStatus(userId: number, eventId: number, newNotificationStatus: string): Observable<any> {
    const url = `${this.path}api/Attendee/user/${userId}/event/${eventId}/notification`;
    var body = { notification: newNotificationStatus }
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.put(url, body, { headers: header, withCredentials: true });
  }

  updateWalletAddress(userId: number, eventId: number, walletAddress: string): Observable<any> {
    const url = `${this.path}api/Attendee/user/${userId}/event/${eventId}/wallet`;
    var body = { wallet: walletAddress }
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.put(url, body, { headers: header, withCredentials: true });
  }

  getAttendee(status: { userId: number, eventId: number }): Observable<any> {
    const url = `${this.path}api/Attendee/user/${status.userId}/event/${status.eventId}`;
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get<any>(url, { headers: header, withCredentials: true });
  }

  getAllEvents(userId: number): Observable<any[]> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get<any[]>(this.path + "api/Attendee/Events/" + userId, { headers: header, withCredentials: true });
  }

  signUpForUpcomingEvent(userId : number,eventId : number, userType: string): Observable<any> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    const userEvent = {
        userId: userId,
        eventId: eventId
    };

    return this.httpClient.post(this.path + "api/Attendee/SignUpForEvent/" + userType, userEvent, {
        headers: header,
        withCredentials: true,
      });
  }
  getAttendeeParticipationDetails(userId: number,eventId: number): Observable<any[]> {
    const header = new HttpHeaders().set('Content-type', 'application/json');
    return this.httpClient.get<any[]>(this.path + "api/Attendee/api/participationDetails/" + userId+ "/" +eventId, { headers: header, withCredentials: true });
  }

}