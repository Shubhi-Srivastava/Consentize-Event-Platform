import { Component, OnInit, NgZone, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CredentialResponse, PromptMomentNotification } from 'google-one-tap';
import { AuthService } from 'src/app/services/auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';
import { EventsService } from 'src/app/services/events.service';
import { imageurl } from 'src/app/Model/constants';
import { CookieService } from 'ngx-cookie-service';


@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  // form = this.fb.group({
  //   username: ['', Validators.email],
  //   password: ['', Validators.required]
  // });

  private clientId = environment.clientId;
  invalidLogin?: boolean;
  eventId: number = 0;
  publishedEvents: any[] = []
  loginwithgoogleusertype: string = ""
  logoimageurl = ''
  scan: boolean = false;
  url: string = ""
  eventName: string = ''
  backgroundurl: string = imageurl + "1-background-1.png";

  constructor(
    private router: Router,
    private authService: AuthService,
    private _ngZone: NgZone,
    // private fb: FormBuilder,
    private _snackBar: MatSnackBar,
    private jwtHelper : JwtHelperService,
    public eventService: EventsService,
    private cookieService: CookieService
    ) { }

    ngOnInit(): void {
      this.scan = history.state.scan;
      this.url = history.state.url;
      (window as any).onGoogleLibraryLoad = () => {
        // @ts-ignore
        google.accounts.id.initialize({
          client_id: this.clientId,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        // @ts-ignore
        google.accounts.id.renderButton(
        // @ts-ignore
        document.getElementById("buttonDiv"),
          { theme: "outline", size: "large", width: "100%" } 
        );
        // @ts-ignore
        google.accounts.id.prompt((notification: PromptMomentNotification) => {});
      };

      var id = localStorage.getItem("current_event")
      if(id) this.eventId = parseInt(id,10);

      this.logoimageurl = imageurl + this.eventId.toString() + '-logo.jpeg'
      this.eventName = localStorage.getItem("current_event_name") ?? "";
      this.getPublishedEvents();
    }

    async handleCredentialResponse(response: CredentialResponse) {
      await this.authService.LoginWithGoogle(response.credential,this.eventId).subscribe(
        (response:any) => {
          // Redirect to appropriate page based on user type and approval status
          if(this.scan){
            const urlParts = this.url.split('/');
            var pathAfter4200 = urlParts.slice(2).join('/');
            const path = pathAfter4200
            this.router.navigate([path]);
          }
          const token = (<any>response).token;
          localStorage.setItem("jwt", token);
          localStorage.setItem("userType", response.userType);
          localStorage.setItem("userId",response.userId);
          this.cookieService.set('UserCookie', response.userId, { expires: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) });
          this.invalidLogin = false;
          if (response.userType === 'Admin') {
            const path = '/admin-upcoming-events/' + response.userId
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else if (response.userType === 'Artist' && response.approvalStatus === 'Y') {
            const path = '/artist-portfolio-preview/' + response.userId;
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else if (response.userType === 'Artist' && response.approvalStatus === 'N') {
            const path = '/artist-pending-page/' + response.userId;
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else if (response.userType === 'Attendee') {
            const path = '/attendee-event/' + response.userId;
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else {
            this._snackBar.open('Invalid user. Please try again.', 'Close', { duration: 5000 });
          }},
        (error:any) => {
            // Display error message
          this.invalidLogin = true;
          this._snackBar.open('Invalid user or password. Please try again.', 'Close', { duration: 5000 });
          }
        );  
    }

    forgotpassword(): void {
      this.router.navigate(['/login/forgot-password']);
    }

  // async onSubmit() {
  //   //this.formSubmitAttempt = false;
  //   if (this.form.valid) {
  //     try {
  //       this.service.login(this.form.value).subscribe((x: any) => {
  //         this.router.navigate(['/logout']);
  //         this._snackBar.open("Login Successful", "Close", {
  //           duration: 2000
  //         });
  //       },
  //         (error: any) => {
  //           console.error(error);
  //           this._snackBar.open("Error with Username or Password", "Close", {
  //             duration: 5000
  //           });
  //         });
  //     } catch (err) {
  //       this._snackBar.open("Error with Username or Password", "Close", {
  //         duration: 5000
  //       });
  //     }
  //   } else {
  //     //this.formSubmitAttempt = true;
  //   }
  // }

  // async login() {
  //   FB.login(async (result:any) => {
  //       await this.service.LoginWithFacebook(result.authResponse.accessToken).subscribe(
  //         (x:any) => {
  //           this._ngZone.run(() => {
  //             this.router.navigate(['/logout']);
  //           })},
  //         (error:any) => {
  //             console.log(error);
  //           }
  //         );
  //   }, { scope: 'email' });

  // }

  isMenuOpen8 = false;
  toggleMenu() {
    this.isMenuOpen8 = !this.isMenuOpen8;
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
    if (this.isMenuOpen8) {
      // If the user has scrolled to the bottom, close the menu
      if (
        scrollPosition + window.innerHeight >=
        document.body.scrollHeight - 50
      ) {
        this.toggleMenu();
      }
    }
  }

  loginData: any = {};
  hidePassword = true;

  login(): void {
    // Call the login method from AuthService
    const { email, password } = this.loginData;
  
    // Make sure email and password are not empty
    if (!email || !password) {
      this._snackBar.open('Email and password are required.', 'Close', { duration: 5000 });
      return;
    }
  
    this.authService.login(email, password,this.eventId)
      .subscribe(
        (response: any) => {
          // Redirect to appropriate page based on user type and approval status
          if (response.userType === 'Admin') {
            const path = '/admin-upcoming-events/' + response.userId
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else if (response.userType === 'Artist' && response.approvalStatus === 'Y') {
            const path = '/artist-portfolio-preview/' + response.userId;
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else if (response.userType === 'Artist' && response.approvalStatus === 'N') {
            const path = '/artist-pending-page/' + response.userId;
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else if (response.userType === 'Attendee') {
            const path = '/attendee-event/' + response.userId;
            this.router.navigateByUrl(path,{ state: { userId : response.userId} });
          } else {
            this._snackBar.open('Invalid user. Please try again.', 'Close', { duration: 5000 });
          }

          const token = (<any>response).token;
          localStorage.setItem("jwt", token);
          localStorage.setItem("userType", response.userType);
          localStorage.setItem("userId",response.userId);
          this.cookieService.set('UserCookie', response.userId, { expires: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) });
          this.invalidLogin = false;
        },
        (error: any) => {
          // Display error message
          this.invalidLogin = true;
          this._snackBar.open('Invalid user or password. Please try again.', 'Close', { duration: 5000 });
        }
      );
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

  team(event: MouseEvent){
    var eventid = {
      eventid: this.eventId
    }
    
    this.router.navigateByUrl(`/team/${this.eventId}`,{state: eventid});

    event.preventDefault();
  };

  designers(event: MouseEvent){
    var eventid = {
      eventid: this.eventId
    }
    
    this.router.navigateByUrl(`/designers/${this.eventId}`,{state: eventid});

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

  logout(): void {
    var logouttoken = localStorage.getItem("jwt") ?? "";
    this.authService.logout(logouttoken).subscribe(
      (response: any) => {
        // Redirect to appropriate page based on user type and approval status
        this.router.navigate(["/home"]);
      },
      (error: any) => {
        // Display error message
        console.log(error);
      }
    );
  }

}
