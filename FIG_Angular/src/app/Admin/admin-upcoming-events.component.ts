import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Subscription } from "rxjs";
import { EventsService, saveAsFile } from "../services/events.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { EventArtistsDialogComponent } from "./event-artists-dialog.component";
import { DatePipe } from "@angular/common";
import { ViewArtistsDialogComponent } from "./view-artists-dialog.component";
import { AuthService } from "../services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { imageurl } from "../Model/constants";
import * as saveAs from "file-saver";
import { ModalComponent } from "./modal/modal";

@Component({
  selector: "app-admin-upcoming-events",
  templateUrl: "./admin-upcoming-events.component.html",
  styleUrls: ["./admin-upcoming-events.component.scss"],
})
export class AdminUpcomingEventsComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private router: Router,
    public eventService: EventsService,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private httpClient: HttpClient
  ) {}
  events: any;
  artists: any;
  booths: any;
  event: any = {};
  userId: number = 0;
  infoIcon = imageurl + "info-circle.svg";
  logoimageurl = "";
  eventIdCurrent: number = 0;
  downloadIcon: string = "";
  backgroundurl: string = imageurl + "1-background-1.png";

  private subscription: Subscription = new Subscription(); // Initialize subscription
  ngOnInit() {
    // Call the .NET API to fetch events data
    this.downloadIcon = imageurl + "download-icon.png";
    this.userId = Number(localStorage.getItem("userId")) || 1;
    this.eventService.getUpcomingEvents().subscribe((eventsData) => {
      this.events = eventsData;
      this.events.forEach((event: any) => {
        const startdatetimeString = event.eventStartTime;
        const startdateObj = new Date(startdatetimeString);
        event.eventStartTime = this.datePipe.transform(
          startdateObj,
          "MMMM d yyyy'"
        );
        const endatetimeString = event.eventEndTime;
        const enddateObj = new Date(endatetimeString);
        event.eventEndTime = this.datePipe.transform(
          enddateObj,
          "MMMM d yyyy'"
        );
      });
    });
    var id = localStorage.getItem("current_event");
    if (id) this.eventIdCurrent = parseInt(id, 10);

    this.eventService.getEventLogoLink(this.eventIdCurrent).subscribe(
      (logoLink: any) => {
        this.logoimageurl = logoLink;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  setPathCreateEvent() {
    console.log(this.userId);
    const path1 = "/admin-create-event/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathEventHistory() {
    console.log(this.userId);
    const path1 = "/admin-event-history/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathUpcomingEvent() {
    console.log(this.userId);
    const path1 = "/admin-upcoming-events/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathAccontAdmin() {
    console.log(this.userId);
    const path1 = "/account-admin/" + this.userId;
    this.router.navigate([path1]);
  }
  eventPreview(eventId: any) {
    this.eventService.getEventPreview(eventId).subscribe((data) => {
      console.log(data);
      this.artists = data;
      const dialogRef = this.dialog.open(EventArtistsDialogComponent, {
        width: "600px",
        data: { eventArtists: data },
      });
    });
  }
  edit(eventId: any) {
    const path = "/admin-edit-event/" + this.userId + "/" + eventId;
    this.router.navigate([path]);
  }

  editArtists(eventId: any) {
    this.eventService.getEventPreview(eventId).subscribe((data) => {
      console.log(data);
      this.artists = data;
      const dialogRef = this.dialog.open(ViewArtistsDialogComponent, {
        width: "800px",
        data: { artists: this.artists },
      });
    });
  }

  openModal(): MatDialogRef<any> {
    return this.dialog.open(ModalComponent, {
      panelClass: "my-modal-class", // optional custom CSS class for styling the modal
      disableClose: true, // optional, disables the user from closing the modal
    });
  }

  publish(eventId: number, eventFlag: string) {
    const dialogRef = this.openModal();
    this.eventService.PublishEvent(eventId, eventFlag).subscribe(
      (data) => {
        this.event = data;
        if (eventFlag == "C") {
          localStorage.setItem("current_event", eventId.toString());
          localStorage.setItem(
            "current_event_name",
            this.event.eventName.toString()
          );
          dialogRef.close();
          const path = "/home";
          this.router.navigateByUrl(path, { state: this.event });
        } else {
          dialogRef.close();
          window.location.reload();
        }
      },
      (error) => console.log(error)
    );
  }

  downloadImages(eventId: number) {
    const dialogRef = this.openModal();
    this.eventService.downloadImages(eventId).subscribe((blob: Blob) => {
      const filename = `QR-codes-${eventId}.zip`;
      this.eventService.saveFile(blob, filename);
      dialogRef.close();
    });
  }

  public logOut = () => {
    var logouttoken = localStorage.getItem("jwt") ?? "";
    this.authService.logout(logouttoken).subscribe(
      (response: any) => {
        // Redirect to appropriate page based on user type and approval status
        localStorage.removeItem("jwt");
        localStorage.removeItem("userId");
        localStorage.removeItem("userType");
        this.router.navigate(["/home"]);
      },
      (error: any) => {
        // Display error message
        console.log(error);
      }
    );
  };

  isUserAuthenticated() {
    const token = localStorage.getItem("jwt");
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return true;
    } else {
      return false;
    }
  }
}
