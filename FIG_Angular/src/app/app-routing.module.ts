import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LandingPageComponent } from "./home-page/landing-page/landing-page.component";
import { LoginComponent } from "./login/login/login.component";
import { SignupComponent } from "./login/signup/signup/signup.component";
import { ArtistsComponent } from "./Artist/artists/artists.component";
import { TeamComponent } from "./home-page/team/team.component";
import { ArtistProfileComponent } from "./Artist/artist-profile/artist-profile.component";
import { ArtistPortfolioPreviewComponent } from "./designer/artist-portfolio-preview/artist-portfolio-preview.component";
import { AdminEventHistoryComponent } from "./Admin/admin-event-history.component";
import { AdminEditEventComponent } from "./Admin/admin-edit-event.component";
import { AdminCreateEventComponent } from "./Admin/admin-create-event.component";
import { AdminUpcomingEventsComponent } from "./Admin/admin-upcoming-events.component";
import { ArtistEventHistoryComponent } from "./designer/artist-portfolio-preview/artist-event-history.component";
import { AttendeeProfileComponent } from "./Attendees/attendee-profile/attendee-profile.component";
import { AttendeeEventInfoComponent } from "./Attendees/attendee-eventinfo/attendee-eventinfo.component";
import { AttendeeEventHistoryComponent } from "./Attendees/attendee-event-history/attendee-event-history.component";
import { AttendeeEventHistInfoComponent } from "./Attendees/attendee-event-history-info/attendee-event-histinfo.component";
import { ArtistPortfolioComponent } from "./designer/artist-portfolio/artist-portfolio.component";
import { AuthGuard } from "./services/authguard.service";
import { HomeComponent } from "./home-page/home/home.component";
import { CanDeactivateGuard } from "./services/can-deactivate-guard.service";
import { ForgotPasswordComponent } from "./login/forgot-password/forgot-password.component";
import { BoothComponent } from "./Attendees/Booth/booth.component";
import { QRCodeGuard } from "./services/QR-guard.service";
import { AdminGuard } from "./services/admin-guard.service";
import { ArtistGuard } from "./services/artist-guard.service.";
import { AttendeeGuard } from "./services/attendee-guard.service";
import { AccountComponent } from "./Account/account/account.component";
import { AccountArtistComponent } from "./designer/account/account-artist.component";
import { AccountAdminComponent } from "./Admin/account/account-admin.component";
import { AccountAttendeeComponent } from "./Attendees/account/account-attendee/account-attendee.component";

const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "team", redirectTo: "home", pathMatch: "full" },
  { path: "designers", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "home/:eventId", component: LandingPageComponent },
  { path: "login", component: LoginComponent },
  { path: "login/forgot-password", component: ForgotPasswordComponent },
  { path: "signup", component: SignupComponent },
  { path: "designers/:eventId", component: ArtistsComponent },
  { path: "team/:eventId", component: TeamComponent },
  {
    path: "attendee/event/:eventId/booth/:boothId",
    component: BoothComponent,
    canActivate: [QRCodeGuard],
  },
  {
    path: "artist-profile/:eventId/:userId",
    component: ArtistProfileComponent,
    //canActivate: [AuthGuard, ArtistGuard],
  },

  {
    path: "admin-upcoming-events/:userId",
    component: AdminUpcomingEventsComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin-event-history/:userId",
    component: AdminEventHistoryComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin-create-event/:userId",
    component: AdminCreateEventComponent,
    canActivate: [AuthGuard, AdminGuard],
    canDeactivate: [CanDeactivateGuard],
  },
  {
    path: "admin-edit-event/:userId/:eventId",
    component: AdminEditEventComponent,
    canActivate: [AuthGuard, AdminGuard],
    canDeactivate: [CanDeactivateGuard],
  },
  {
    path: "attendee-event/:id",
    component: AttendeeProfileComponent,
    canActivate: [AuthGuard, AttendeeGuard],
  },
  {
    path: "attendee-eventinfo/:userId/:eventId",
    component: AttendeeEventInfoComponent,
    canActivate: [AuthGuard, AttendeeGuard],
  },
  {
    path: "attendee-eventhistory/:userId",
    component: AttendeeEventHistoryComponent,
    canActivate: [AuthGuard, AttendeeGuard],
  },
  {
    path: "attendee-eventhistinfo/:userId/:eventId",
    component: AttendeeEventHistInfoComponent,
    canActivate: [AuthGuard, AttendeeGuard],
  },
  {
    path: "artist-portfolio-preview/:userId",
    component: ArtistPortfolioPreviewComponent,
    canActivate: [AuthGuard, ArtistGuard],
  },
  {
    path: "artist-portfolio/:userId",
    component: ArtistPortfolioComponent,
    canActivate: [AuthGuard, ArtistGuard],
  },
  {
    path: "artist-event-history/:userId",
    component: ArtistEventHistoryComponent,
    canActivate: [AuthGuard, ArtistGuard],
  },

  {
    path: "account-artist/:userId",
    component: AccountArtistComponent,
    canActivate: [AuthGuard, ArtistGuard],
  },
  {
    path: "account-admin/:userId",
    component: AccountAdminComponent,
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "account-attendee/:userId",
    component: AccountAttendeeComponent,
    canActivate: [AuthGuard, AttendeeGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [CanDeactivateGuard],
})
export class AppRoutingModule {}
