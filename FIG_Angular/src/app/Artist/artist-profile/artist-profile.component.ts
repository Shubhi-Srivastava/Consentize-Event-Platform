import { Component, OnInit, HostListener } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { imageurl } from "src/app/Model/constants";
import { AuthService } from "src/app/services/auth.service";
import { EventsService } from "src/app/services/events.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-artist-profile",
  templateUrl: "./artist-profile.component.html",
  styleUrls: ["./artist-profile.component.scss"],
  template: "{{ id }}",
})
export class ArtistProfileComponent implements OnInit {
  id: number | undefined;
  users: any = [];
  isLoading: boolean = true;
  publishedEvents: any[] = [];
  currentEventId: number = 0;
  userId: number = 0;
  eventId: number = 0;
  ticketLink: string = "";
  instalink: string = "https://www.instagram.com/";
  fblink: string = "https://www.facebook.com/";
  twitterlink: string = "https://www.twitter.com/";
  logoimageurl: string = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    public eventService: EventsService
  ) {}

  ngOnInit() {
    this.currentEventId = parseInt(
      localStorage.getItem("current_event") ?? "0",
      10
    );
    this.userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
    this.eventId = parseInt(
      this.route.snapshot.paramMap.get("eventId") ?? "0",
      10
    );
    const data = this.route.snapshot.data;
    this.eventService.getEventLogoLink(this.eventId).subscribe(
      (logoLink: any) => {
        this.logoimageurl = logoLink;
      },
      (error) => {
        console.error(error);
      }
    );
    this.id = this.route.snapshot.params["userId"];
    this.ticketLink = localStorage.getItem("current_event_ticket") ?? "";
    this.getArtist();
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

  getPublishedEvents() {
    this.eventService.getPublishedEvents().subscribe(
      (data: any) => {
        this.publishedEvents = data;
      },
      (error) => console.log(error)
    );
  }

  team(event: MouseEvent) {
    var eventid = {
      eventid: this.currentEventId,
    };

    this.router.navigateByUrl(`/team/${this.eventId}`, { state: eventid });

    event.preventDefault();
  }

  designers(event: MouseEvent) {
    var eventid = {
      eventid: this.currentEventId,
    };

    this.router.navigateByUrl(`/designers/${this.eventId}`, { state: eventid });

    event.preventDefault();
  }

  getArtist(): void {
    this.isLoading = true;
    this.userService.getUserById(this.id, this.eventId).subscribe(
      (user) => {
        this.users = user;
        const videoId = this.users.youtube.split("v=")[1];
        const ampersandPosition = videoId.indexOf("&");
        if (ampersandPosition !== -1) {
          this.users.youtube = videoId.substring(0, ampersandPosition);
        } else {
          this.users.youtube = videoId;
        }
        this.isLoading = false;
      },
      (error) => {
        console.log(error);
        this.isLoading = false;
      }
    );
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navigateToDesignersPage() {
    this.router.navigate([`/designers/${this.eventId}`]);
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

  home(event: MouseEvent){

    var eventid = {
      eventid: this.currentEventId
    }
    
    this.router.navigateByUrl(`/home/${this.eventId}`,{state: eventid});
    event.preventDefault();
  };

  isUserAuthenticated() {
    const token = localStorage.getItem("jwt");
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return true;
    } else {
      return false;
    }
  }

  isMenuOpen3 = false;

  toggleMenu() {
    this.isMenuOpen3 = !this.isMenuOpen3;
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
    if (this.isMenuOpen3) {
      // If the user has scrolled to the bottom, close the menu
      if (scrollPosition + window.innerHeight >= document.body.scrollHeight) {
        this.toggleMenu();
      }
    }
  }
}
