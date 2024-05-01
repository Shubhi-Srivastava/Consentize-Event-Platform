import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { EventsService } from 'src/app/services/events.service';
import { CookieService } from 'ngx-cookie-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { imageurl } from 'src/app/Model/constants';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
signupData: any = {
  userType: 'Attendee'
};
error: string = '';
eventId: number = 0;
publishedEvents: any[] = []
current_event_name: string = ""
backgroundurl: string = imageurl + "1-background-1.png"

  constructor(
    private router: Router,
    private _snackBar: MatSnackBar,
    private authService: AuthService,
    private http: HttpClient,
    public eventService: EventsService,
    private cookieService: CookieService
  ) { }
  
  ngOnInit(): void {
    var id = localStorage.getItem("current_event")
    this.current_event_name = localStorage.getItem("current_event_name") ?? ""
    if(id) this.eventId = parseInt(id,10);
    this.getPublishedEvents();
  }

  getPublishedEvents(){
    this.eventService.getPublishedEvents().subscribe(
      (data: any) => {
        this.publishedEvents = data;
      },
      error => console.log(error)
    )
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

  signup(): void {
    if (!this.signupData.name || !this.signupData.email || !this.signupData.password || !this.signupData.confirmPassword || !this.signupData.userType) {
      this._snackBar.open('Please fill in all the details and try again.', 'Close', { duration: 5000 });
      return;
    }

    if (this.signupData.password != this.signupData.confirmPassword) {
      this._snackBar.open('Passwords do not match try again.', 'Close', { duration: 5000 });
      return;
    }

    const { name, email, password, confirmPassword, userType } = this.signupData;
    // Call signUp() method from AuthService to send signup data to backend
    this.authService.signup(name, email, password, confirmPassword, userType,this.eventId).subscribe(
      (response: any) => {
        // Check the userType and redirect accordingly
        this.cookieService.set('UserCookie', response.userId, { expires: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) });
        if (response.userType === 'Artist') {
          this.router.navigate(['/artist-portfolio-preview/' + response.userId], { queryParams: { userId: response.userId } });
        } else if (response.userType === 'Attendee') {
          const path = '/attendee-event/' + response.userId;
          this.router.navigate([path], { queryParams: { userId: response.userId } });

        }
      },
      (error: any) => {
        this.error = "Already Registered Please Login";
        // Handle error here
      }
    );
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
