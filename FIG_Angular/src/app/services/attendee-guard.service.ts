import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class AttendeeGuard implements CanActivate {

  constructor(private jwtHelper: JwtHelperService, private router: Router) {
  }
  canActivate() {
    const type = localStorage.getItem("userType");

    if (type == "Attendee"){
      return true;
    }
    this.router.navigate(["home"]);
    return false;
  }

}