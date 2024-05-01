import { DatePipe } from "@angular/common";
import { Component, OnInit, HostListener } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { ViewEditPortfolioDialogComponent } from "src/app/Admin/view-edit-portfolio-dialog.component";
import { AttendeeService } from "src/app/services/attendee.service";
import { AuthService } from "src/app/services/auth.service";
import { imageurl } from "src/app/Model/constants";
import { EventsService } from "src/app/services/events.service";

@Component({
  selector: "app-attendee-profile",
  templateUrl: "./attendee-profile.component.html",
  styleUrls: ["./attendee-profile.component.scss"],
})
export class AttendeeProfileComponent implements OnInit {
  events: any[] = [];
  userid: number = 0;
  eventsloaded: number = 0;
  signedUp: boolean[] = [false];
  backgroundurl: string = imageurl + "1-background-1.png";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private attendeeService: AttendeeService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    public dialog: MatDialog,
    private eventService: EventsService
  ) {}

  HandleClick(path: string) {
    window.location.href = path;
  }
  logoimageurl = "";
  eventIdCurrent: number = 0;

  ngOnInit(): void {
    const userid = this.route.snapshot.params["id"];
    this.userid = userid;
    this.getAllEvents(userid);
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

  setPath() {
    console.log(this.userid);
    const path1 = "/attendee-eventhistory/" + this.userid;
    this.router.navigate([path1]);
  }

  setPathAccountAttendee() {
    console.log(this.userid);
    const path1 = "/account-attendee/" + this.userid;
    this.router.navigate([path1]);
  }

  showUserTypePrompt(eventId: number) {
    var userType = prompt("Are you signing up as an Artist or an Attendee?");
    if (!userType) userType = "Attendee";
    this.SignUp(eventId, userType);
  }

  getAllEvents(id: number): void {
    this.attendeeService.getAllEvents(id).subscribe(
      (events) => {
        this.events = events;
        this.fixDate();
        this.eventsloaded = 1;
        this.updateSignUpStatus();
      },
      (error) => {
        console.log(error);
        this.eventsloaded = 1;
      }
    );
  }

  updateSignUpStatus() {
    this.events.forEach((x) =>
      x.userType == "Attendee"
        ? (this.signedUp[x.eventId] = true)
        : (this.signedUp[x.eventId] = false)
    );
  }

  SignUp(eventId: number, userType: string) {
    this.attendeeService
      .signUpForUpcomingEvent(this.userid, eventId, userType)
      .subscribe(
        (events) => {
          var event = this.events.find((x) => x.eventId == eventId);
          event.userType = userType;
          event.approvalStatus = "P";
          if (userType == "Attendee") this.signedUp[event.eventId] = true;
        },
        (error) => {
          console.log(error);
        }
      );
  }

  fixDate() {
    this.events.forEach((x) => {
      x.eventStartTime = this.datePipe.transform(
        x.eventStartTime,
        "yyyy-MM-dd HH:mm:ss"
      );
      x.eventEndTime = this.datePipe.transform(
        x.eventEndTime,
        "yyyy-MM-dd HH:mm:ss"
      );
    });

    this.eventsloaded = 1;
  }

  // updateNotification() {

  //   const newNotificationStatus = 'read';

  //   this.attendeeService.updateNotificationStatus(userId, eventId, newNotificationStatus)
  //     .subscribe(
  //       () => console.log('Notification status updated'),
  //       error => console.error(error)
  //     );
  // }

  public registerEvent(eventId: number) {
    const data = {
      userType: "Artist-New",
      eventId: eventId,
    };
    const dialogRef = this.dialog.open(ViewEditPortfolioDialogComponent, {
      width: "1000px",
      data: data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      location.reload();
    });
  }

  portfolioPreview(eventId: any) {
    const data = {
      userType: "Artist" + "-Edit",
      eventId: eventId,
    };
    const dialogRef = this.dialog.open(ViewEditPortfolioDialogComponent, {
      width: "1000px",
      data: data,
    });
  }

  loadNewComponent(id: any) {
    // Pass data to the new component using the ActivatedRoute service

    // Navigate to the new component with the route parameter "id"
    const path = "/attendee-eventinfo/" + this.userid + "/" + id;
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
