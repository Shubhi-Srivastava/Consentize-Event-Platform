import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { Observable } from "rxjs/internal/Observable";
import { environment } from "src/environments/environment";
import { saveAs } from "file-saver";
import {
  Event,
  uploadFiles,
  EventArtists,
  Attendee,
  ArtistBoothSave,
  ArtistEventInfo,
  AttendeesBooths,
  QRCodeEdit,
} from "../Model/event.model";
import { Artist } from "../Model/artist.model";

@Injectable({
  providedIn: "root",
})
export class EventsService {
  private path = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  downloadImage(key: string) {
    return this.httpClient.get(this.path + "api/Event/downloadQR/" + key, {
      responseType: "blob",
    });
  }

  createEvent(event: Event): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.post(this.path + "api/Event/events", event, {
      headers: header,
      withCredentials: true,
    });
  }

  createBoothQR(event: any): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.post(this.path + "api/Event/createBoothQR", event, {
      headers: header,
      withCredentials: true,
    });
  }

  uploadFiles(files: File[], description: string[]) {
    const url = this.path + "api/Event/uploadFile";
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i], files[i].name);
      formData.append("description", description[i]);
    }

    return this.httpClient.post(url, formData);
  }

  editImages(files: File[], description: string[]) {
    const url = this.path + "api/Event/editImages";
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i], files[i].name);
      formData.append("description", description[i]);
    }

    return this.httpClient.post(url, formData);
  }

  updateEvent(eventId: number, event: Event["eventClass"]) {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.put(
      this.path + "api/Event/UpdateEvent/" + eventId,
      event,
      {
        headers: header,
        withCredentials: true,
      }
    );
  }

  getEventHistory() {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "api/Event/EventHistory", {
      headers: header,
      withCredentials: true,
    });
  }

  getName(eventId: number) {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "api/Event/EventName", {
      headers: header,
      withCredentials: true,
    });
  }

  getUpcomingEvents() {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "api/Event/upcomingEvents", {
      headers: header,
      withCredentials: true,
    });
  }

  getPublishedEvents() {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "api/Event/publishedEvents", {
      headers: header,
      withCredentials: true,
    });
  }

  scanQR(QRObject: any) {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.put(this.path + `api/Event/scan-booth`, QRObject);
  }

  getUpcomingEventsForArtist(userId: any) {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(
      this.path + "api/Artist/upcoming-events-except-user/" + userId,
      {
        headers: header,
        withCredentials: true,
      }
    );
  }

  getEventDetails(eventId: number) {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "api/Event/events/" + eventId, {
      headers: header,
      withCredentials: true,
    });
  }

  getEventPreview(eventId: number): Observable<EventArtists> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get<EventArtists>(this.path + "preview/" + eventId, {
      headers: header,
      withCredentials: true,
    });
  }

  getEventAssets(): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get<any>(this.path + "api/Event/assetsLinks", {
      headers: header,
      withCredentials: true,
    });
  }

  getAttendeesForEvent(eventId: number): Observable<Attendee[]> {
    const url = `${this.path}api/Admin/attendees?eventId=${eventId}`;
    return this.httpClient.get<Attendee[]>(url);
  }
  getAttendeeBoothVisited(eventId: number): Observable<AttendeesBooths[]> {
    const url = `${this.path}booths-visited/${eventId}`;
    return this.httpClient.get<AttendeesBooths[]>(url);
  }

  getUnapprovedArtists(eventId: number) {
    return this.httpClient.get(
      this.path + "api/Event/events/" + eventId + "/unapproved-artists"
    );
  }

  getUnassignedBooths(eventId: number) {
    const url = `${this.path}api/Event/unassigned-booths/${eventId}`;
    return this.httpClient.get<number[]>(url);
  }

  approveArtist(eventId: number, userId: number, boothNo: number) {
    return this.httpClient.post(
      this.path +
        `api/Event/events/${eventId}/users/${userId}/approve/${boothNo}`,
      null
    );
  }

  denyArtist(eventId: number, userId: number) {
    return this.httpClient.put(
      this.path + `api/Event/events/${eventId}/deny/${userId}`,
      null
    );
  }

  createArtistBooth(artistBooth: ArtistBoothSave): Observable<any> {
    const url = `${this.path}api/Event/editBoothAndArtists`;
    const headers = new HttpHeaders().set("Content-Type", "application/json");
    return this.httpClient.post(url, artistBooth, { headers: headers });
  }

  updateArtist(artist: Artist, eventId: any): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.put(
      this.path +
        `api/Artist/users/update-portfolio/${artist.userId}` +
        "/" +
        eventId,
      artist,
      {
        headers: header,
        withCredentials: true,
      }
    );
  }

  getMyEventHistory(userId: Number): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "api/Artist/userevents/" + userId, {
      headers: header,
      withCredentials: true,
    });
  }
  getCurrentEvent(): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get<any>(this.path + "api/Event/current-event", {
      headers: header,
      withCredentials: true,
    });
  }

  getUserDetailsBeforeArtistRegistration(userId: Number): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(this.path + "users/" + userId, {
      headers: header,
      withCredentials: true,
    });
  }

  geCurrentPortfolioDetails(userId: Number, eventId: Number): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.get(
      this.path +
        "api/Artist/users/" +
        userId +
        "/events/" +
        eventId +
        "/portfolio",
      {
        headers: header,
        withCredentials: true,
      }
    );
  }
  // getUserDetails(userId: number): Observable<any> {
  //   const eventId = 123; // replace with the actual event ID
  //   this.httpClient.get<any>(`api/events/${eventId}/users/${userId}`).subscribe(
  //     (response) => {
  //       console.log(response); // replace with your desired logic to handle the API response
  //     },
  //     (error) => {
  //       console.error(error); // replace with your desired logic to handle API errors
  //     }
  //   );
  // }

  PublishEvent(eventId: number, eventFlag: string): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.put<any>(
      this.path + "api/Event/publish-event/",
      { eventId, eventFlag },
      {
        headers: header,
        withCredentials: true,
      }
    );
  }
  registerForEvent(payload: any): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.post(
      this.path + "api/Artist/artistRegister",
      payload,
      {
        headers: header,
        withCredentials: true,
      }
    );
  }

  registerForEventArtist(payload: any): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.post(
      this.path + "api/Artist/artistRegister",
      payload,
      {
        headers: header,
        withCredentials: true,
      }
    );
  }

  uploadArtistFiles(files: File[], description: string[]) {
    const url = this.path + "api/Artist/editArtistImages";
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i], files[i].name);
      formData.append("description", description[i]);
    }

    return this.httpClient.post(url, formData);
  }

  uploadProfilePicture(files: File[], description: string[]) {
    const url = this.path + "api/User/uploadProfilePhoto";
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("ProfilePhoto", files[i], files[i].name);
      formData.append("description", description[i]);
    }

    return this.httpClient.post(url, formData);
  }

  registerForEventAttendee(eventId: number, userId: number) {
    const data = { eventId: Number(eventId), userId };
    return this.httpClient.post(
      this.path + "api/Attendee/attendeeRegister",
      data
    );
  }

  addBooth(qRCodeEdit: QRCodeEdit): Observable<any> {
    const url = this.path + "api/Event/QREdit";
    return this.httpClient.post<any>(url, qRCodeEdit);
  }

  deleteBooth(qRCodeEdit: QRCodeEdit): Observable<any> {
    const url = this.path + "api/Event/deleteQRCode";
    return this.httpClient.delete<any>(url, { body: qRCodeEdit });
  }

  submitFeedback(payload: any): Observable<any> {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.post(
      this.path + "api/Admin/submitFeedback",
      payload,
      {
        headers: header,
        withCredentials: true,
      }
    );
  }
  getArtistsForEvent(id: number): Observable<ArtistEventInfo[]> {
    const url = this.path + `api/Artist/artistsForEvent/${id}`;
    return this.httpClient.get<ArtistEventInfo[]>(url);
  }

  downloadImages(eventId: number): Observable<Blob> {
    const url = `${this.path}api/Event/booth-QR-codes/${eventId}`;
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      Accept: "application/zip",
    });
    return this.httpClient.get<Blob>(url, {
      headers,
      responseType: "blob" as "json",
    });
  }

  saveFile(blob: Blob, filename: string) {
    saveAs(blob, filename);
  }

  getEventLogoLink(eventId: number): Observable<string> {
    return this.httpClient.get(`${this.path}api/Event/EventLogo/${eventId}`, {
      responseType: "text",
    });
  }

  updateDigitalGoodies(
    eventId: number,
    userId: number,
    digitalGoodiesReceived: string
  ) {
    const header = new HttpHeaders().set("Content-type", "application/json");
    return this.httpClient.put(
      this.path + "api/Attendee/DigitalGoodies",
      { eventId, userId, digitalGoodiesReceived },
      {
        headers: header,
        withCredentials: true,
      }
    );
  }
}

export function saveAsFile(response: ArrayBuffer, eventId: number): void {
  const blob = new Blob([response], { type: "application/zip" });
  const filename = `QR-codes-${eventId}.zip`;
  saveAs(blob, filename);
}
