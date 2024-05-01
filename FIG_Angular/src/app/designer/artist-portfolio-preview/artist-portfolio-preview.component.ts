import { Component, OnInit, HostListener } from "@angular/core";
import { EventsService } from "src/app/services/events.service";
import { DatePipe } from "@angular/common";
import { Artist } from "src/app/Model/artist.model";
import { NotificationService } from "src/app/services/notification.service";
import { Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { ViewEditPortfolioDialogComponent } from "src/app/Admin/view-edit-portfolio-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { imageurl } from "src/app/Model/constants";

@Component({
  selector: "app-artist-portfolio-preview",
  templateUrl: "./artist-portfolio-preview.component.html",
  styleUrls: ["./artist-portfolio-preview.component.scss"],
})
export class ArtistPortfolioPreviewComponent {
  public state: Number = 1;

  constructor(
    private eventService: EventsService,
    private datePipe: DatePipe,
    private notifyService: NotificationService,
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    public dialog: MatDialog
  ) {}
  public events: any;
  public isLoading: boolean = false;
  public isEventsLoading: boolean = false;
  userId: number = 0;
  logoimageurl = "";
  eventIdCurrent: number = 0;
  backgroundurl: string = imageurl + "1-background-1.png";

  ngOnInit() {
    // Get userId from localStorage
    this.userId = Number(localStorage.getItem("userId")) || 1;

    // Set userId in localStorage
    localStorage.setItem("userId", this.userId.toString());
    this.fetchEvents();

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

  public changeState(newStateValue: Number): void {
    this.state = newStateValue;
  }

  setPathPortfolioPreview() {
    console.log(this.userId);
    const path1 = "/artist-portfolio-preview/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathArtistEventHistory() {
    console.log(this.userId);
    const path1 = "/artist-event-history/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathArtistPortfolio() {
    console.log(this.userId);
    const path1 = "/artist-portfolio/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathAccountArtist() {
    console.log(this.userId);
    const path1 = "/account-artist/" + this.userId;
    this.router.navigate([path1]);
  }

  public fetchEvents() {
    this.isEventsLoading = true;
    const userId = this.userId;
    this.eventService
      .getUpcomingEventsForArtist(userId)
      .subscribe((eventsData) => {
        this.events = eventsData;
        console.log(this.events);
        this.events.forEach((event: any) => {
          const startdatetimeString = event.eventStartTime;
          const startdateObj = new Date(startdatetimeString);
          event.eventStartTime = this.datePipe.transform(
            startdateObj,
            "MMMM d yyyy"
          );
          const endatetimeString = event.eventEndTime;
          const enddateObj = new Date(endatetimeString);
          event.eventEndTime = this.datePipe.transform(
            enddateObj,
            "MMMM d yyyy"
          );
          event.isRegistering = false;
        });
        this.isEventsLoading = false;
      });
  }

  public registerEvent(event: any) {
    event.isRegistering = true;
    const data = {
      userType: "Artist-New",
      eventId: event.eventId,
    };
    const dialogRef = this.dialog.open(ViewEditPortfolioDialogComponent, {
      width: "1000px",
      data: data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      location.reload();
    });
  }

  attendeeRegisterEvent(event: any) {
    this.eventService
      .registerForEventAttendee(event.eventId, this.userId)
      .subscribe(
        (response) => {
          console.log("Registration successful");
          this.notifyService.showSuccess(
            "Registered for the event successfully!",
            "Success"
          );
          this.fetchEvents();
        },
        (error) => {
          console.error(error);
          this.notifyService.showError("Error occurred", "Error");
        }
      );
  }
  public logOut = () => {
    var logouttoken = localStorage.getItem("jwt") ?? "";
    localStorage.removeItem("userId");
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
