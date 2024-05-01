import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { CarouselModule } from "ngx-bootstrap/carousel";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { LandingPageComponent } from "./home-page/landing-page/landing-page.component";
import { HttpClientModule } from "@angular/common/http";
import { LoginComponent } from "./login/login/login.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./material/material.module";
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from "@angular/material/snack-bar";
import { LogoutComponent } from "./login/logout/logout.component";
import { ArtistsComponent } from "./Artist/artists/artists.component";
import { TeamComponent } from "./home-page/team/team.component";
import { ArtistPortfolioPreviewComponent } from "./designer/artist-portfolio-preview/artist-portfolio-preview.component";
import { AdminEventHistoryComponent } from "./Admin/admin-event-history.component";
import { AdminEditEventComponent } from "./Admin/admin-edit-event.component";
import { AdminCreateEventComponent } from "./Admin/admin-create-event.component";
import { AdminUpcomingEventsComponent } from "./Admin/admin-upcoming-events.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatNativeDateModule } from "@angular/material/core";
import { MatSelectModule } from "@angular/material/select";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatTabsModule } from "@angular/material/tabs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ArtistProfileComponent } from "./Artist/artist-profile/artist-profile.component";
import { ArtistEventHistoryComponent } from "./designer/artist-portfolio-preview/artist-event-history.component";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatDialogModule } from "@angular/material/dialog";
import { MatTableModule } from "@angular/material/table";
import { EventArtistsDialogComponent } from "./Admin/event-artists-dialog.component";
import { AttendeeProfileComponent } from "./Attendees/attendee-profile/attendee-profile.component";
import { AttendeeEventInfoComponent } from "./Attendees/attendee-eventinfo/attendee-eventinfo.component";
import { AttendeeEventHistoryComponent } from "./Attendees/attendee-event-history/attendee-event-history.component";
import { AttendeeEventHistInfoComponent } from "./Attendees/attendee-event-history-info/attendee-event-histinfo.component";
import { ToastrModule } from "ngx-toastr";
import { LoaderComponent } from "./loader/loader.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ViewArtistsDialogComponent } from "./Admin/view-artists-dialog.component";
import { ApprovalArtistsDialogComponent } from "./Admin/approval-artists-dialog.component";
import { ArtistPortfolioComponent } from "./designer/artist-portfolio/artist-portfolio.component";
import { SignupComponent } from "./login/signup/signup/signup.component";
import { JwtModule } from "@auth0/angular-jwt";
import { AuthGuard } from "./services/authguard.service";
import { DialogService } from "./services/dialog.service";
import { ViewEditPortfolioDialogComponent } from "./Admin/view-edit-portfolio-dialog.component";
import { ForgotPasswordComponent } from "./login/forgot-password/forgot-password.component";
import { BoothComponent } from "./Attendees/Booth/booth.component";
import { AdminGuard } from "./services/admin-guard.service";
import { QRCodeGuard } from "./services/QR-guard.service";
import { ArtistGuard } from "./services/artist-guard.service.";
import { AttendeeGuard } from "./services/attendee-guard.service";
import { UnsavedChangesDialogComponent } from "./components/unsaved-changes-dialog/unsaved-changes-dialog.component";
import { AccountComponent } from "./Account/account/account.component";
import { AccountArtistComponent } from "./designer/account/account-artist.component";
import { AccountAdminComponent } from "./Admin/account/account-admin.component";
import { AccountAttendeeComponent } from "./Attendees/account/account-attendee/account-attendee.component";
import { ModalComponent } from "./Admin/modal/modal";
import { ImageMultiUploadComponent } from "./components/image-multi-upload/image-multi-upload.component";
import { SafePipe } from "./services/safe.pipe";

export function tokenGetter() {
  return localStorage.getItem("jwt");
}
@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    LoginComponent,
    LogoutComponent,
    ArtistsComponent,
    TeamComponent,
    ArtistEventHistoryComponent,
    ArtistPortfolioPreviewComponent,
    AdminEventHistoryComponent,
    AdminEditEventComponent,
    AdminCreateEventComponent,
    AdminUpcomingEventsComponent,
    ArtistProfileComponent,
    EventArtistsDialogComponent,
    ViewArtistsDialogComponent,
    AttendeeProfileComponent,
    AttendeeEventInfoComponent,
    AttendeeEventHistoryComponent,
    AttendeeEventHistInfoComponent,
    LoaderComponent,
    ApprovalArtistsDialogComponent,
    ViewEditPortfolioDialogComponent,
    ArtistPortfolioComponent,
    SignupComponent,
    ForgotPasswordComponent,
    BoothComponent,
    UnsavedChangesDialogComponent,
    AccountComponent,
    AccountArtistComponent,
    AccountAdminComponent,
    AccountAttendeeComponent,
    ModalComponent,
    ImageMultiUploadComponent,
    SafePipe,
  ],
  imports: [
    MatProgressSpinnerModule,
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    CarouselModule.forRoot(),
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
    ReactiveFormsModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSelectModule,
    MatTabsModule,
    MatFormFieldModule,
    MatGridListModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTableModule,
    ToastrModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ["https://localhost:5001"],
      },
    }),
  ],
  providers: [
    AuthGuard,
    AdminGuard,
    QRCodeGuard,
    ArtistGuard,
    AttendeeGuard,
    DatePipe,
    DialogService,
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: Interceptor,
    //   multi: true,
    // },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
