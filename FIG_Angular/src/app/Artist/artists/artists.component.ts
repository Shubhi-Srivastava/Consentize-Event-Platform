import { Component, OnInit, HostListener } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { imageurl } from "src/app/Model/constants";
import { User } from "src/app/Model/user.model";
import { AuthService } from "src/app/services/auth.service";
import { EventsService } from "src/app/services/events.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-artists",
  templateUrl: "./artists.component.html",
  styleUrls: ["./artists.component.scss"],
})
export class ArtistsComponent implements OnInit {
  users: User[] = [];
  userType: string = "";
  eventId: number = 0;
  publishedEvents: any[] = [];
  currentEventId: number = 0;
  userId: number = 0;
  logoimageurl: string = "";
  ticketLink: string = "";

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    public eventService: EventsService
  ) {}

  ngOnInit(): void {
    this.currentEventId = parseInt(
      localStorage.getItem("current_event") ?? "0",
      10
    );
    this.userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
    this.userType = localStorage.getItem("userType") ?? "";
    this.eventId = parseInt(
      this.route.snapshot.paramMap.get("eventId") ?? "0",
      10
    );
    this.eventService.getEventLogoLink(this.eventId).subscribe(
      (logoLink: any) => {
        this.logoimageurl = logoLink;
      },
      (error) => {
        console.error(error);
      }
    );
    this.ticketLink = localStorage.getItem("current_event_ticket") ?? "";
    this.getPublishedEvents();
    this.getUsers();
  }

  home(event: MouseEvent){

    var eventid = {
      eventid: this.currentEventId
    }
    
    this.router.navigateByUrl(`/home/${this.eventId}`,{state: eventid});
    event.preventDefault();
  };

  getUsers(): void {
    this.userService.getUsersByType("Artist", this.eventId).subscribe(
      (users) => (this.users = users),
      (error) => console.log(error)
    );
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
      this.router.navigateByUrl(`/admin-create-event/${this.userId}`, {
        state: eventid,
      });
    }

    event.preventDefault();
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

  loadNewComponent(event: MouseEvent, user: any) {
    // Pass data to the new component using the ActivatedRoute service

    const data = {
      eventId: this.eventId,
    };

    // Navigate to the new component with the route parameter "id"
    const path = `/artist-profile/${this.eventId}/${user.userId}`;
    this.router.navigateByUrl(path, { state: data });
    event.preventDefault();
    //this.router.navigate(['/artist-profile', data.id], { state: { data } });
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

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  isMenuOpen2 = false;

  toggleMenu() {
    this.isMenuOpen2 = !this.isMenuOpen2;
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
    if (this.isMenuOpen2) {
      // If the user has scrolled to the bottom, close the menu
      if (scrollPosition + window.innerHeight >= document.body.scrollHeight) {
        this.toggleMenu();
      }
    }
  }
  redirectToTickets() {
    window.open("https://www.google.com", "_blank");
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }

  redirectToProfile() {}
}
