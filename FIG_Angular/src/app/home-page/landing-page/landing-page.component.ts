import { Component, OnInit, HostListener } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, switchMap } from "rxjs";
import { EventsService } from "src/app/services/events.service";
import { AuthService } from "src/app/services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { UserService } from "src/app/services/user.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
})
export class LandingPageComponent implements OnInit {
  backgroundimageurl = "";
  logoimageurl = "";
  sponsorimagesurl: string[] = [];
  carouselimagesurl: string[] = [];
  currentImageIndex: number = 0;
  aboutusimageurl = "";
  data: any = {};
  event: any = {};
  isLoaded: boolean = false;
  assets: any[] = [];
  feedback: any = {};
  Name: string = "";
  Email: string = "";
  Message: string = "";
  Subject: string = "";
  eventId: number = 0;
  userId: number = 0;
  currentEventId: number = 0;
  events: any[] = [];
  publishedEvents: any[] = [];
  userType: string = "";
  landingPageEvent: any = {};
  ticketLink: string = "";
  intervalId: ReturnType<typeof setInterval> | undefined;

  constructor(
    private http: HttpClient,
    private router: Router,
    public eventService: EventsService,
    private authService: AuthService,
    private userService: UserService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getImageAssets();
    this.getPublishedEvents();

    this.currentEventId = parseInt(
      localStorage.getItem("current_event") ?? "0",
      10
    );
    this.userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
    this.eventId = parseInt(
      this.route.snapshot.paramMap.get("eventId") ?? "0",
      10
    );
    this.userType = localStorage.getItem("userType") ?? "";
    this.ticketLink = localStorage.getItem("current_event_ticket") ?? "";
    this.eventService.getEventDetails(this.eventId).subscribe(
      (data) => {
        this.landingPageEvent = data;
      },
      (error) => console.log(error)
    );

    if (Object.keys(this.event).length === 1 && !this.eventId) {
      this.getCurrentEvent()
        .pipe(
          switchMap((event: any) => {
            return this.eventPreview(event.eventId);
          })
        )
        .subscribe(
          (data) => {
            this.data = data;
            this.getImageArtifacts();
          },
          (error) => console.log(error)
        );
    } else {
      if (!this.event.eventId) this.event.eventId = this.eventId;
      this.eventPreview(this.event.eventId).subscribe((x) => {
        this.data = x;
        this.getImageArtifacts();
      });
    }

    this.intervalId = setInterval(() => {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.carouselimagesurl.length;
    }, 4000);
  }

  // ngOnDestroy(): void {
  //   if (this.intervalId) {
  //     clearInterval(this.intervalId);
  //   }
  // }

  getPublishedEvents() {
    this.eventService.getPublishedEvents().subscribe(
      (data: any) => {
        this.publishedEvents = data;
      },
      (error) => console.log(error)
    );
  }

  onSelect(event: Event) {
    var eventId = (event.target as HTMLInputElement).value;

    if (eventId) {
      const eventid = parseInt(eventId, 10);
      this.router
        .navigateByUrl("/home", { skipLocationChange: true })
        .then(() => {
          this.router.navigate([`/home/${eventid}`]);
        });
    }
  }

  getImageAssets() {
    this.eventService.getEventAssets().subscribe((x) => {
      this.assets = x;
    });
  }

  eventPreview(eventId: any): Observable<any> {
    return this.eventService.getEventPreview(eventId);
  }

  getCurrentEvent(): Observable<any> {
    return this.eventService.getCurrentEvent();
  }

  getImageArtifacts(): void {
    if (!this.data) this.data = this.event;
    this.data.artifacts.forEach((artifact: any) => {
      if (artifact.linkDescription.includes("-background")) {
        this.backgroundimageurl = artifact.link;
      } else if (artifact.linkDescription.includes("-carousel-")) {
        this.carouselimagesurl.push(artifact.link);
      } else if (artifact.linkDescription.includes("-sponsor-")) {
        this.sponsorimagesurl.push(artifact.link);
      } else if (artifact.linkDescription.includes("-aboutus")) {
        this.aboutusimageurl = artifact.link;
      } else if (artifact.linkDescription.includes("-logo")) {
        this.logoimageurl = artifact.link;
      }
    });
    this.isLoaded = true;
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

  login(event: MouseEvent) {
    var eventid = {
      eventid: this.currentEventId,
    };

    this.router.navigateByUrl("/login", { state: eventid });

    event.preventDefault();
  }

  profile(event: MouseEvent) {
    var eventid = {
      eventid: this.currentEventId,
    };

    if (this.userType == "Artist") {
      this.router.navigateByUrl(`/artist-portfolio-preview/${this.userId}`, {
        state: eventid,
      });
    } else if (this.userType == "Attendee") {
      this.router.navigateByUrl(`/attendee-event/${this.userId}`, {
        state: eventid,
      });
    } else {
      this.router.navigateByUrl(`/admin-upcoming-events/${this.userId}`);
    }

    event.preventDefault();
  }

  team(event: MouseEvent) {
    var eventid = {
      eventid: this.currentEventId,
    };

    this.router.navigateByUrl(`/team/${this.eventId}`, { state: eventid });

    event.preventDefault();
  }

  home(event: MouseEvent){
    
    window.location.reload();
    event.preventDefault();
  };

  designers(event: MouseEvent){
    var eventid = {
      eventid: this.currentEventId,
    };

    this.router.navigateByUrl(`/designers/${this.eventId}`, { state: eventid });

    event.preventDefault();
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

  onSubmit() {
    this.feedback = {
      fromEmail: this.Email,
      name: this.Name,
      toEmail: "corey@neotrust.me",
      subject: "Feedback",
      content: `<b>Feedback Details - </b><br><br>
        <b>Event Name:</b> ${
          localStorage.getItem("current_event_name") || "N/A"
        } <br>
      <b>Name:</b> ${this.Name} <br>
      <b>Email:</b> ${this.Email}<br><br>
      <b>Subject:</b> ${this.Subject}<br><br>
      <b>Feedback:</b> ${this.Message}
      `,
      toName: "Manpreet",
      eventId: this.eventId,
    };
    if (this.Name && this.Subject && this.Email && this.Message) {
      this.userService.sendFeedback(this.feedback).subscribe(
        (response) => console.log(response),
        (error) => console.log(error)
      );
    } else {
      this._snackBar.open("Enter all details and try again", "Close", {
        duration: 5000,
      });
    }

    this.Name = "";
    this.Email = "";
    this.Subject = "";
    this.Message = "";
  }
}
