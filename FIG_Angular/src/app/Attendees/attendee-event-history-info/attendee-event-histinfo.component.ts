import { DatePipe, Location } from "@angular/common";
import { Component, OnInit, HostListener } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { imageurl } from "src/app/Model/constants";
import { AttendeeService } from "src/app/services/attendee.service";
import { AuthService } from "src/app/services/auth.service";
import { EventsService } from "src/app/services/events.service";

@Component({
  selector: "app-attendee-event-histinfo",
  templateUrl: "./attendee-event-histinfo.component.html",
  styleUrls: ["./attendee-event-histinfo.component.scss"],
})
export class AttendeeEventHistInfoComponent {
  userId: number = 0;
  eventId: number = 0;
  event: any = {};
  attendeeParticipationDetails: any;
  dataSource: any;
  displayedColumns: string[] = ["eventName", "eventLocation", "visitedBooths"];
  eventIdCurrent: string = "";
  logoimageurl = "";
  CurrentId: number = 0;
  backgroundurl: string = imageurl + "1-background-1.png";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private attendeeService: AttendeeService,
    private location: Location,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private eventService: EventsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = +params["userId"];
      this.eventId = +params["eventId"];
    });
    this.eventIdCurrent = localStorage.getItem("current_event") ?? "";
    var id = localStorage.getItem("current_event");
    if (id) this.CurrentId = parseInt(id, 10);

    this.eventService.getEventLogoLink(this.CurrentId).subscribe(
      (logoLink: any) => {
        this.logoimageurl = logoLink;
      },
      (error) => {
        console.error(error);
      }
    );

    this.attendeeService
      .getAttendeeParticipationDetails(this.userId, this.eventId)
      .subscribe(
        (attendeeParticipationDetails: any) => {
          this.attendeeParticipationDetails = attendeeParticipationDetails;
        },

        (error: any) => {
          console.log(error);
        }
      );
  }

  team(event: MouseEvent) {
    var eventid = {
      eventid: this.eventIdCurrent,
    };

    this.router.navigateByUrl(`/team/${this.eventIdCurrent}`, {
      state: eventid,
    });

    event.preventDefault();
  }

  designers(event: MouseEvent) {
    var eventid = {
      eventid: this.eventIdCurrent,
    };

    this.router.navigateByUrl(`/designers/${this.eventIdCurrent}`, {
      state: eventid,
    });

    event.preventDefault();
  }

  /*fixDate() {
    this.event.eventStartTime = this.datePipe.transform(
      this.event.eventStartTime,
      "yyyy-MM-dd HH:mm:ss"
    );
    this.event.eventEndTime = this.datePipe.transform(
      this.event.eventEndTime,
      "yyyy-MM-dd HH:mm:ss"
    );
  }*/

  closeCross() {
    const path1 = "/attendee-eventhistory/" + this.userId;
    this.router.navigate([path1]);
  }

  setPath() {
    console.log(this.userId);
    const path1 = "/attendee-eventhistory/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathEvents() {
    const path1 = "/attendee-event/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathAccountAttendee() {
    console.log(this.userId);
    const path1 = "/account-attendee/" + this.userId;
    this.router.navigate([path1]);
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
        this.event = history.state;
        // this.fixDate();
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
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener("window:scroll", ["$event"])
  onWindowScroll() {
    // Get the scroll position
    const scrollPosition =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    // Check if the hamburger menu is open
    if (this.isMenuOpen) {
      // If the user has scrolled to the bottom, close the menu
      if (scrollPosition + window.innerHeight >= document.body.scrollHeight) {
        this.toggleMenu();
      }
    }
  }
}
