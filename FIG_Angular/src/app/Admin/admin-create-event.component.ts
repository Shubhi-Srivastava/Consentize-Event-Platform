import { Component } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { EventsService } from "../services/events.service";
import { Event } from "../Model/event.model";
import { FileHandle } from "../Model/file-handle.model";
import { StartEndTime, imageurl } from "../Model/constants";
import { DomSanitizer } from "@angular/platform-browser";
import { NotificationService } from "../services/notification.service";
import { AuthService } from "../services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { DialogService } from "../services/dialog.service";
import { cloneDeep, isEqual, isEmpty } from "lodash";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { ImageMultiUploadComponent } from "../components/image-multi-upload/image-multi-upload.component";

@Component({
  selector: "app-admin-create-event",
  templateUrl: "./admin-create-event.component.html",
  styleUrls: ["./admin-create-event.component.scss"],
})
export class AdminCreateEventComponent {
  createEventForm!: FormGroup;
  carouselImageCount: number = 1;
  userId: number = 0;
  deleteIcon = imageurl + "delete-icon.svg";
  // uploadFile: uploadFiles = { files: [], description: [] };
  entity: Event = {
    eventClass: {
      eventName: "",
      eventLocation: "",
      eventStartTime: "",
      eventId: 0,
      eventEndTime: "",
      ticketLink: "",
      eventBio: "",
      currentEvent: "N",
      publishEvent: "N",
      booths: 0,
    },
    eventDesigners: {
      designers: [{ name: "", emailAddress: "", userType: "" }],
    },
  };

  time = StartEndTime;
  public state: Number = 1;
  urls = new Array<string>();
  numberOfArtists: number = 0;
  eventDate: any;
  routeWarn = true;
  artists: any;

  artistInitData: any = [];

  carousel: string[] = [""];
  carousalImages: any = [];
  sponsersImages: FileHandle[] = [];
  backgroundImage: FileHandle[] = [];
  aboutUsImage: FileHandle[] = [];
  logoImage: FileHandle[] = [];
  eventIdCurrent: number = 0;
  logoimageurl = "";
  today = new Date();

  descriptionList: string[] = [];
  filesList: any[] = [];
  isLoading: boolean = false;
  backgroundurl: string = imageurl + "1-background-1.png";
  initData: any = {};

  constructor(
    private router: Router,
    private eventService: EventsService,
    private sanitizer: DomSanitizer,
    private notifyService: NotificationService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private dialogService: DialogService
  ) {}
  ngOnInit() {
    // this.isLoading = true;
    this.userId = Number(localStorage.getItem("userId")) || 1;
    this.eventService.getEventHistory().subscribe((result) => {
      console.log(result);
    });
    this.initData = cloneDeep(this.entity);
    this.artistInitData = cloneDeep(this.artists);
    this.eventService
      .getEventDetails(1)
      .subscribe((result) => console.log(result));
    var id = localStorage.getItem("current_event");
    if (id) this.eventIdCurrent = parseInt(id, 10);

    this.getLogoUrl();
  }

  getLogoUrl() {
    this.eventService.getEventLogoLink(this.eventIdCurrent).subscribe(
      (logoLink: any) => {
        this.logoimageurl = logoLink;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  public changeState(newStateValue: Number): void {
    this.state = newStateValue;
  }

  setPathUpcomingEvents() {
    console.log(this.userId);
    const path1 = "/admin-upcoming-events/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathEventHistory() {
    console.log(this.userId);
    const path1 = "/admin-event-history/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathCreateEvent() {
    console.log(this.userId);
    const path1 = "/admin-create-event/" + this.userId;
    this.router.navigate([path1]);
  }
  setPathAccontAdmin() {
    console.log(this.userId);
    const path1 = "/account-admin/" + this.userId;
    this.router.navigate([path1]);
  }
  detectFiles(event: any) {
    let files = event.target.files;
    if (files) {
      for (let file of files) {
        let reader = new FileReader();
        reader.onload = (e: any) => {
          this.urls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onBoothBlur() {
    this.artists = [{ name: "", emailAddress: "", userType: "Artist" }];
    for (let i: number = 0; i < this.entity.eventClass.booths - 1; i++) {
      this.artists.push({ name: "", emailAddress: "", userType: "Artist" });
    }
  }

  public increaseCount() {
    this.carouselImageCount += 1;
  }

  public decreaseCount() {
    this.carouselImageCount -= 1;
  }

  onCarasoulAdd() {
    this.carousel.push("");
  }

  removeImages(list: any[], i: number) {
    list.splice(i, 1);
  }

  OnBackgroundImageSelect(event: any) {
    if (event.target.files) {
      const file = event.target.files[0];
      const fileHandle: FileHandle = {
        file: file,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(file)
        ),
      };
      this.backgroundImage = [];
      this.backgroundImage.push(fileHandle);
    }
  }

  OnAboutUsImageSelect(event: any) {
    if (event.target.files) {
      const file = event.target.files[0];
      const fileHandle: FileHandle = {
        file: file,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(file)
        ),
      };
      this.aboutUsImage = [];
      this.aboutUsImage.push(fileHandle);
    }
  }

  OnLogoImageSelect(event: any) {
    if (event.target.files) {
      const file = event.target.files[0];
      const fileHandle: FileHandle = {
        file: file,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(file)
        ),
      };
      this.logoImage = [];
      this.logoImage.push(fileHandle);
    }
  }

  onCarouselImageSelect(event: any) {
    if (event.target.files) {
      const file = event.target.files[0];
      const fileHandle: FileHandle = {
        file: file,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(file)
        ),
      };
      this.carousalImages.push(fileHandle);
    }
  }

  onSponsorsImageSelect(event: any) {
    if (event.target.files) {
      const file = event.target.files[0];
      const fileHandle: FileHandle = {
        file: file,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(file)
        ),
      };
      this.sponsersImages.push(fileHandle);
    }
  }

  onSubmit() {
    this.entity.eventDesigners.designers = this.artists;
    // date assignment logic
    const eventDateTime = this.eventDate;
    const eventStartTime = eventDateTime?.setHours(
      this.entity.eventClass.eventStartTime
    );
    const eventEndTime = eventDateTime?.setHours(
      this.entity.eventClass.eventEndTime
    );
    const timeNow = new Date();
    this.entity.eventClass.eventStartTime = new Date(
      eventStartTime - timeNow.getTimezoneOffset() * 60000
    );
    this.entity.eventClass.eventEndTime = new Date(
      eventEndTime - timeNow.getTimezoneOffset() * 60000
    );
    if (
      this.entity.eventClass.eventEndTime.getTime() <
      this.entity.eventClass.eventStartTime.getTime()
    ) {
      this.notifyService.showError(
        "End Time is smaller than Start Time !",
        "Error"
      );
      return;
    }
    var invalid = false;
    if (this.entity.eventClass.booths > 0) {
      this.artists.forEach((artist: any) => {
        if (
          (artist.emailAddress == "" && artist.name !== "") ||
          (artist.emailAddress !== "" && artist.name == "")
        ) {
          invalid = true;
        }
      });
    }
    if (invalid) {
      this.notifyService.showError("Name and email are required", "Error");
      return;
    }
    this.isLoading = true;

    this.eventService.createEvent(this.entity).subscribe(
      (result) => {
        console.log(result);
        // upload file service call
        this.isLoading = true;
        this.notifyService.showSuccess(
          "Event created successfully!!",
          "Success"
        );
        this.eventService
          .createBoothQR({
            eventId: result.eventId,
            eventName: result.eventName,
            boothCount: this.entity.eventClass.booths,
          })
          .subscribe(
            (data) => {
              this.isLoading = false;
              console.log(data);
            },
            (error) => {
              this.isLoading = false;
              console.log(error);
            }
          );
        this.isLoading = false;
        if (this.backgroundImage.length > 0) {
          let index = 1;
          this.filesList.push(this.backgroundImage[0].file);
          this.descriptionList.push(result.eventId + "-background-" + index);
        }
        if (this.aboutUsImage.length > 0) {
          let index = 1;
          this.filesList.push(this.aboutUsImage[0].file);
          this.descriptionList.push(result.eventId + "-aboutus-" + index);
        }
        if (this.logoImage.length > 0) {
          let index = 1;
          this.filesList.push(this.logoImage[0].file);
          this.descriptionList.push(result.eventId + "-logo");
        }
        if (this.carousalImages.length > 0) {
          let corousalindex = 0;
          this.carousalImages.forEach((file: any) => {
            corousalindex++;
            this.filesList.push(file.file);
            this.descriptionList.push(
              result.eventId + "-carousel-" + corousalindex
            );
          });
        }
        if (this.sponsersImages.length > 0) {
          let sponserIndex = 0;
          this.sponsersImages.forEach((file: any) => {
            sponserIndex++;
            this.filesList.push(file.file);
            this.descriptionList.push(
              result.eventId + "-sponsor-" + sponserIndex
            );
          });
        }
        this.isLoading = true;
        if (this.filesList.length !== 0) {
          this.eventService
            .uploadFiles(this.filesList, this.descriptionList)
            .subscribe(
              (response) => {
                console.log("success", response),
                  this.notifyService.showSuccess(
                    "Images uploaded successfully!!",
                    "Success"
                  );
                this.isLoading = false;
              },

              (error) => {
                this.notifyService.showError("Image Data Error!!", "Error");
                console.log("error", error);
                this.isLoading = false;
              }
            );
        }

        this.routeWarn = false;
        const path = "/admin-upcoming-events/" + this.userId;
        this.router.navigate([path]);
      },

      (error) => {
        this.notifyService.showError("Image Data Error!!", "Error");
        console.log(error);
        this.isLoading = false;
      }
    );
    console.log(this.entity);
  }

  onCancel() {
    this.setPathUpcomingEvents();
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

  canDeactivate(): Observable<boolean> | boolean {
    if (!this.routeWarn) {
      return true;
    }
    if (
      isEqual(this.entity, this.initData) &&
      isEqual(this.artists, this.artistInitData) &&
      isEmpty(this.carousalImages) &&
      isEmpty(this.sponsersImages) &&
      isEmpty(this.backgroundImage) &&
      isEmpty(this.aboutUsImage) &&
      isEmpty(this.logoImage)
    ) {
      return true;
    }
    return false;
  }
}
