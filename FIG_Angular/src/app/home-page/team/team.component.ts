import { Component, OnInit, HostListener } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { imageurl } from "src/app/Model/constants";
import { User } from "src/app/Model/user.model";
import { AuthService } from "src/app/services/auth.service";
import { EventsService } from "src/app/services/events.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-team",
  templateUrl: "./team.component.html",
  styleUrls: ["./team.component.scss"],
})
export class TeamComponent implements OnInit {
  users: User[] = [];
  userType: string = "";
  eventId: number = 0;
  currentEventId: number = 0;
  publishedEvents: any[] = [];
  userId: number = 0;
  usertype: string = "";
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
    this.eventId = parseInt(
      this.route.snapshot.paramMap.get("eventId") ?? "0",
      10
    );
    this.usertype = localStorage.getItem("userType") ?? "";
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

  getUsers(): void {
    this.userType = "Admin";
    this.userService.getAdmin(this.eventId).subscribe(
      (users) => (this.users = users),
      (error) => console.log(error)
    );
  }

  profile(event: MouseEvent) {
    var eventid = {
      eventid: this.currentEventId,
    };

    if (this.usertype == "Artist") {
      this.router.navigateByUrl(`/artist-portfolio-preview/${this.userId}`, {
        state: eventid,
      });
    } else if (this.usertype == "Attendee") {
      this.router.navigateByUrl(`/attendee-event/${this.userId}`, {
        state: eventid,
      });
    } else {
      this.router.navigateByUrl(`/admin-upcoming-events/${this.userId}`);
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

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  isMenuOpen1 = false;

  toggleMenu() {
    this.isMenuOpen1 = !this.isMenuOpen1;
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    if (this.isMenuOpen1) {
      this.toggleMenu();
    }
  }

  team(event: MouseEvent){
    var eventid = {
      eventid: this.currentEventId
    }
    
    this.router.navigateByUrl(`/team/${this.eventId}`,{state: eventid});

    event.preventDefault();
  };

  home(event: MouseEvent){

    var eventid = {
      eventid: this.currentEventId
    }
    
    this.router.navigateByUrl(`/home/${this.eventId}`,{state: eventid});
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

  redirectToTickets() {
    window.open("https://www.google.com", "_blank");
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }

  redirectToProfile() {}
}
