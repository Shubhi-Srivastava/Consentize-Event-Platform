import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from 'src/app/services/auth.service';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-booth',
  templateUrl: './booth.component.html',
  styleUrls: ['./booth.component.scss']
})
export class BoothComponent implements OnInit {

  
  qrCodeData: any = {};
  eventId: number = 0;
  boothId: number = 0;
  userId: number = 0;
  currentEventId: number = 0;
  publishedEvents: any[] = []
  usertype: string = ""
  eventName: string = ""

  constructor(
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    public eventService: EventsService,
    private cookieService: CookieService) { }

  ngOnInit(): void {
    this.currentEventId = parseInt(localStorage.getItem("current_event") ?? "0",10);
    this.getPublishedEvents();
    this.route.queryParamMap.subscribe((params) => {
      const qrCode = params.get('qrCode')?.replace(/^\$/, '');
      const decodedJson = decodeURIComponent(qrCode ?? "");
      const qrCodeObject = JSON.parse(decodedJson);
      this.eventId = qrCodeObject.eventId;
      this.boothId = qrCodeObject.boothId;
    });
    this.eventService.getName(this.eventId).subscribe(
      (data: any) => {
        this.eventName = data;
      },
      error => console.log(error)
    )
    this.userId = parseInt(this.cookieService.get('UserCookie'));
    this.usertype = localStorage.getItem("userType") ?? ""
    this.scanQR();
  }

  getPublishedEvents(){
    this.eventService.getPublishedEvents().subscribe(
      (data: any) => {
        this.publishedEvents = data;
      },
      error => console.log(error)
    )
  }


  profile(event: MouseEvent){
    var eventid = {
      eventid: this.currentEventId
    }

    if(this.usertype == "Artist"){
      this.router.navigateByUrl(`/artist-portfolio-preview/${this.userId}`,{state: eventid});
    }
    else if(this.usertype == "Attendee"){
      this.router.navigateByUrl(`/attendee-event/${this.userId}`,{state: eventid});
    }
    else{
      this.router.navigateByUrl(`/admin-create-event/${this.userId}`,{state: eventid});
    }

    event.preventDefault();
  };

  team(event: MouseEvent){
    var eventid = {
      eventid: this.currentEventId
    }
    
    this.router.navigateByUrl(`/team/${this.eventId}`,{state: eventid});

    event.preventDefault();
  };

  designers(event: MouseEvent){
    var eventid = {
      eventid: this.currentEventId
    }
    
    this.router.navigateByUrl(`/designers/${this.eventId}`,{state: eventid});

    event.preventDefault();
  };

  scanQR(): void {
    var QRObject = {
      "eventId": this.eventId,
      "boothId": this.boothId,
      "userId": this.userId
    }

    if(this.userId) this.eventService.scanQR(QRObject).subscribe(
      (data) => {
        
      },
      error => console.log(error)
    );
  }

  onSelect(event: Event) {
    var eventId = (event.target as HTMLInputElement).value;

    if (eventId) {
      const eventid = parseInt(eventId,10)
      this.router.navigateByUrl('/home', { skipLocationChange: true }).then(() => {
        this.router.navigate([`/home/${eventid}`]);
      });
    }
  } 

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  isMenuOpen1 = false;

  toggleMenu() {
    this.isMenuOpen1 = !this.isMenuOpen1;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isMenuOpen1) {
      this.toggleMenu();
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
  
  redirectToTickets () {
    window.open('https://www.google.com', "_blank");
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView();
  }
}
