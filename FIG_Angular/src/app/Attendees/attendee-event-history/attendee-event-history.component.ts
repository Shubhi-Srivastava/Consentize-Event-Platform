import { DatePipe } from '@angular/common';
import { Component, OnInit,HostListener } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { imageurl } from 'src/app/Model/constants';
import { AttendeeService } from 'src/app/services/attendee.service';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: "app-attendee-event-history",
  templateUrl: "./attendee-event-history.component.html",
  styleUrls: ["./attendee-event-history.component.scss"],
})
export class AttendeeEventHistoryComponent implements OnInit {
  eventshist: any[] = [];
  id: number = 0;
  eventsloaded: number = 0;
  eventIdCurrent: string = ''
  backgroundurl: string = imageurl + "1-background-1.png"

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private attendeeService: AttendeeService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.id = +params["userId"];
    });
    this.eventIdCurrent =  localStorage.getItem("current_event") ?? "";
    this.getEvents(this.id);
  }

  team(event: MouseEvent){
    var eventid = {
      eventid: this.eventIdCurrent
    }
    
    this.router.navigateByUrl(`/team/${this.eventIdCurrent}`,{state: eventid});

    event.preventDefault();
  };

  designers(event: MouseEvent){
    var eventid = {
      eventid: this.eventIdCurrent
    }
    
    this.router.navigateByUrl(`/designers/${this.eventIdCurrent}`,{state: eventid});

    event.preventDefault();
  };

  setPathAccountAttendee() {
    console.log(this.id);
    const path1 = "/account-attendee/" + this.id;
    this.router.navigate([path1]);
  }

  getEvents(id: number): void {
    this.attendeeService.getEvents(id).subscribe(
      (events) => {
        this.eventshist = events;
        this.fixDate();
      },
      (error) => {
        console.log(error);
        this.eventsloaded = 1;
      }
    );
  }

  fixDate() {
    this.eventshist.forEach((x) => {
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

  loadNewComponent(eventid: any) {
    // Pass data to the new component using the ActivatedRoute service

    // Navigate to the new component with the route parameter "id"
    const event = this.eventshist.find((x) => x.eventId == eventid);
    const path = "/attendee-eventhistinfo/" + this.id + "/" + eventid;
    this.router.navigateByUrl(path, { state: event });
  }

  setPath() {
    const path1 = "/attendee-event/" + this.id;
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

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    // Get the scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    // Check if the hamburger menu is open
    if (this.isMenuOpen) {
      // If the user has scrolled to the bottom, close the menu
      if (scrollPosition + window.innerHeight >= document.body.scrollHeight) {
        this.toggleMenu();
      }
    }
  }

}
