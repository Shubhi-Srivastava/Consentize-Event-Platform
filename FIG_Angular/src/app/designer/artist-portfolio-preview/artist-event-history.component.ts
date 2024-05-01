import { Component, HostListener, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EventsService } from "src/app/services/events.service";
import { Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { DatePipe } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { ViewEditPortfolioDialogComponent } from "src/app/Admin/view-edit-portfolio-dialog.component";
import { imageurl } from "src/app/Model/constants";

@Component({
  selector: "app-artist-event-history",
  templateUrl: "./artist-event-history.component.html",
  styleUrls: ["./artist-event-history.component.scss"],
})
export class ArtistEventHistoryComponent implements OnInit {
  public myEvents: any[] = [];
  public isLoading = true;
  userId: number = 0;
  backgroundurl: string = imageurl + "1-background-1.png";
  constructor(
    private http: HttpClient,
    private eventService: EventsService,
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private datePipe: DatePipe,
    public dialog: MatDialog
  ) {}
  logoimageurl = "";
  eventIdCurrent: number = 0;

  ngOnInit() {
    // this.userId = history.state.userId;
    // Get userId from localStorage
    this.userId = Number(localStorage.getItem("userId"));

    this.fetchMyEvents();
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
  public fetchMyEvents() {
    this.isLoading = true;
    this.eventService.getMyEventHistory(this.userId).subscribe((response) => {
      this.myEvents = response;
      this.myEvents.forEach((event: any) => {
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
      this.isLoading = false;
    });
  }
  public logOut = () => {
    localStorage.removeItem("userId");
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
  portfolioPreview(userType: any, eventId: any) {
    const data = {
      userType: userType + "-Edit",
      eventId: eventId,
    };
    const dialogRef = this.dialog.open(ViewEditPortfolioDialogComponent, {
      width: "1000px",
      data: data,
    });
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
