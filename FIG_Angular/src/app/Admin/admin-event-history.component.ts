import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Subscription } from "rxjs";
import { EventsService } from "../services/events.service";
import { DatePipe } from "@angular/common";
import { AuthService } from "../services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { StartEndTime, imageurl } from "../Model/constants";
@Component({
  selector: "app-admin-event-history",
  templateUrl: "./admin-event-history.component.html",
  styleUrls: ["./admin-event-history.component.scss"],
})
export class AdminEventHistoryComponent {
  constructor(
    private http: HttpClient,
    private router: Router,
    private eventService: EventsService,
    private datePipe: DatePipe,
    private authService: AuthService,
    private jwtHelper: JwtHelperService
  ) {}
  events: any;
  userId: number = 0;
  logoimageurl = "";
  backgroundurl: string = imageurl + "1-background-1.png";
  eventIdCurrent: number = 0;
  private subscription: Subscription = new Subscription(); // Initialize subscription

  setPathCreateEvent() {
    console.log(this.userId);
    const path1 = "/admin-create-event/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathUpcomingEvent() {
    console.log(this.userId);
    const path1 = "/admin-upcoming-events/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathEventHistory() {
    console.log(this.userId);
    const path1 = "/admin-event-history/" + this.userId;
    this.router.navigate([path1]);
  }
  setPathAccontAdmin() {
    console.log(this.userId);
    const path1 = "/account-admin/" + this.userId;
    this.router.navigate([path1]);
  }

  ngOnInit() {
    // Call the .NET API to fetch events data
    this.userId = Number(localStorage.getItem("userId")) || 1;
    this.eventService.getEventHistory().subscribe((eventsData) => {
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
  edit(eventId: any) {
    const path = "/admin-edit-event/" + this.userId + "/" + eventId;
    this.router.navigate([path]);
  }

  public logOut = () => {
    var logouttoken = localStorage.getItem("jwt") ?? "";
    this.authService.logout(logouttoken).subscribe(
      (response: any) => {
        // Redirect to appropriate page based on user type and approval status
        localStorage.removeItem("jwt");
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
