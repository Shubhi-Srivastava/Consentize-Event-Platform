import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class ArtistGuard implements CanActivate {

  constructor(private router: Router) {
  }
  canActivate() {
    const type = localStorage.getItem("userType");

    if (type == "Artist"){
      return true;
    }
    this.router.navigate(["home"]);
    return false;
  }

}