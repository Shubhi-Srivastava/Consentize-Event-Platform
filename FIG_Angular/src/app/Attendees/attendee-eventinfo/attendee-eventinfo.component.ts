import { DatePipe } from "@angular/common";
import {
  Component,
  OnInit,
  HostListener,
  Renderer2,
  ElementRef,
  Input,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { AttendeeService } from "src/app/services/attendee.service";
import { AuthService } from "src/app/services/auth.service";
import { imageurl } from "src/app/Model/constants";
import { EventsService } from "src/app/services/events.service";

@Component({
  selector: "app-attendee-eventinfo",
  templateUrl: "./attendee-eventinfo.component.html",
  styleUrls: ["./attendee-eventinfo.component.scss"],
})
export class AttendeeEventInfoComponent implements OnInit {
  user: any = {};
  userId: number = 0;
  eventId: number = 0;
  isOptedIn: boolean = false;
  isLoaded: boolean = false;
  walletAddressAdded: boolean = false;
  walletAddress: string = "";
  digitalWallet: string = "";
  @Input() isPopup: boolean = false;
  @Input() eventIdForPopup: number = 0;
  logoimageurl = "";
  eventIdCurrent: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private attendeeService: AttendeeService,
    private renderer: Renderer2,
    private el: ElementRef,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private eventService: EventsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.userId = +params["userId"];
      this.eventId = +params["eventId"];
    });

    this.getAttendee();
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
    //this.setPath();
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
    console.log(this.userId);
    const path1 = "/attendee-eventhistory/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathEvents() {
    console.log(this.userId);
    const path1 = "/attendee-event/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathAccountAttendee() {
    console.log(this.userId);
    const path1 = "/account-attendee/" + this.userId;
    this.router.navigate([path1]);
  }
  getAttendee(): void {
    let attendeeEventId = 0;
    if (this.isPopup) {
      attendeeEventId = this.eventIdForPopup;
      this.userId = Number(localStorage.getItem("userId"));
    } else {
      attendeeEventId = this.eventId;
    }
    this.attendeeService
      .getAttendee({ userId: this.userId, eventId: attendeeEventId })
      .subscribe(
        (user) => {
          this.user = user;
          this.isLoaded = true;
          this.isOptedIn = this.user.notificationStatus == "Y" ? true : false;
          this.walletAddressAdded =
            this.user.digitatWallet && this.user.digitatWallet != "null"
              ? true
              : false;
          this.digitalWallet = this.user.digitatWallet;
        },
        (error) => {
          this.isLoaded = true;
          console.log(error);
        }
      );
  }

  isNotification = true;
  isGoodies = false;

  toggletab1() {
    this.isNotification = true;
    this.isGoodies = false;
  }

  toggletab2() {
    this.isNotification = false;
    this.isGoodies = true;
  }

  BacktoEvents() {
    const path = "/attendee-event/" + this.user.userId;
    this.router.navigate([path]);
  }

  toggleOptIn() {
    const newOptInStatus = this.isOptedIn ? "N" : "Y";
    let attendeeEventId = 0;
    if (this.isPopup) {
      attendeeEventId = this.eventIdForPopup;
      this.userId = Number(localStorage.getItem("userId"));
    } else {
      attendeeEventId = this.eventId;
    }

    this.attendeeService
      .updateNotificationStatus(this.userId, attendeeEventId, newOptInStatus)
      .subscribe(
        () => {
          this.isOptedIn = !this.isOptedIn;
          console.log("Opt-in status updated");
        },
        (error) => console.error(error)
      );
  }

  addWallet() {
    const wallet = this.walletAddress;
    let attendeeEventId = 0;
    if (this.isPopup) {
      attendeeEventId = this.eventIdForPopup;
      this.userId = Number(localStorage.getItem("userId"));
    } else {
      attendeeEventId = this.eventId;
    }
    this.attendeeService
      .updateWalletAddress(this.userId, attendeeEventId, wallet)
      .subscribe(
        () => {
          this.walletAddressAdded = !this.walletAddressAdded;
          this.digitalWallet = wallet;
          console.log("Opt-in status updated");
        },
        (error) => console.error(error)
      );
  }

  updateWallet() {
    const wallet = this.walletAddress;
    let attendeeEventId = 0;
    if (this.isPopup) {
      attendeeEventId = this.eventIdForPopup;
      this.userId = Number(localStorage.getItem("userId"));
    } else {
      attendeeEventId = this.eventId;
    }
    if (wallet) {
      this.attendeeService
        .updateWalletAddress(this.userId, attendeeEventId, wallet)
        .subscribe(
          () => {
            this.digitalWallet = wallet;
            this.walletAddressAdded =
              this.digitalWallet && this.digitalWallet != "null" ? true : false;
            console.log("Opt-in status updated");
          },
          (error) => console.error(error)
        );
    }
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
