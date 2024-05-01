import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';


@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private router: Router,
    private service: AuthService,
    private _ngZone: NgZone) { }

  client: any = null

  ngOnInit(): void {
  }

  public logout(){
    this.service.signOutExternal();
    this._ngZone.run(() => {
      this.router.navigate(['/']).then(() => window.location.reload());
    })
  }

  public getRefreshed(){
    this.service.refreshToken().subscribe((res:any) => {
      console.log("tokens were refreshed")
    });
    
  }
  public getList(){
    this.service.getClient().subscribe({
      next: (personObject:any) => {
        this.client = personObject

      },
      error: (err:any) =>{
        console.log(err)
      }
    });
    
  }

}