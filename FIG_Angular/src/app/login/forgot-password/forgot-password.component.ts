import { Component, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  resetCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  hidePassword: boolean = true;
  showCode: boolean = false;
  showSetPassword: boolean = false;
  

  constructor(
    private router: Router,
    private authService: AuthService,
    private _snackBar: MatSnackBar,
    ) { }

    ngOnInit(): void{

    }

  resetPassword(): void {
    this.authService.ForgotPassword(this.email).subscribe(
      (data: any) => {
        this.showCode = true;
      },
      (error: any) => {
        this._snackBar.open('Invalid email address. Please try again.', 'Close', { duration: 5000 });
      },
    )
  }

  checkCode(): void {
    this.authService.CheckCode(this.email,this.resetCode).subscribe(
      (data: any) => {
        this.showSetPassword = true;
        this.showCode = false;
      },
      (error: any) => {
        this._snackBar.open('Invalid code. Please try again.', 'Close', { duration: 5000 });
      },
    )
  }

  updatePassword(): void {
    this.authService.UpdatePassword(this.email,this.newPassword).subscribe(
      (data: any) => {
        this.router.navigate(['/login']);
      },
      (error: any) => {
        this._snackBar.open('Invalid password. Please try again.', 'Close', { duration: 5000 });
      },
    )
  }

  isMenuOpen20 = false;
  toggleMenu() {
    this.isMenuOpen20 = !this.isMenuOpen20;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    // Get the scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  
    // Check if the hamburger menu is open
    if (this.isMenuOpen20) {
      // If the user has scrolled to the bottom, close the menu
      if (scrollPosition + window.innerHeight >= document.body.scrollHeight - 50) {
        this.toggleMenu();
      }
    }
  }

  Login(): void {
    this.router.navigate(['/login']);
  }
}
