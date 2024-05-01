import { ChangeDetectorRef, Component, DoCheck } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { EventsService } from "../services/events.service";
import {
  ArtistEventInfo,
  ArtistPortfolio,
  Attendee,
  AttendeesBooths,
  Event,
  EventPreview,
  uploadFiles,
} from "../Model/event.model";
import { FileHandle } from "../Model/file-handle.model";
import { StartEndTime, imageurl } from "../Model/constants";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { DatePipe } from "@angular/common";
import { ViewArtistsDialogComponent } from "./view-artists-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { ApprovalArtistsDialogComponent } from "./approval-artists-dialog.component";
import { NotificationService } from "../services/notification.service";
import { AuthService } from "../services/auth.service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { MatTableDataSource } from "@angular/material/table";
import { Observable } from "rxjs";
import { DialogService } from "../services/dialog.service";
import { cloneDeep, isEqual, isEmpty } from "lodash";

interface TableData {
  name: string;
  email: string;
  approvalStatus: string;
}
@Component({
  selector: "app-admin-edit-event",
  templateUrl: "./admin-edit-event.component.html",
  styleUrls: ["./admin-edit-event.component.scss"],
})
export class AdminEditEventComponent {
  createEventForm!: FormGroup;
  carouselImageCount: number = 1;
  eventId: number = 0;
  eventName: string = "";
  editClicked: boolean = true;
  savedArtists: any[] = [];
  booths: any[] = [];
  selectedBoothNumber: number = 0;
  disableApproveDecline: boolean = false;
  plusIcon = imageurl + "plus-icon.svg";
  deleteIcon = imageurl + "delete-icon.svg";
  // uploadFile: uploadFiles = { files: [], description: [] };
  entity: EventPreview = {
    eventClass: {
      eventName: "",
      eventLocation: "",
      eventStartTime: "",
      eventId: 0,
      eventEndTime: "",
      ticketLink: "",
      eventBio: "",
      currentEvent: "",
      publishEvent: "",
      booths: 0,
      artists: [],
    },
  };

  time = StartEndTime;
  public state: Number = 1;
  urls = new Array<string>();
  numberOfArtists: number = 0;
  eventDate: any;
  isLoading: boolean = false;
  allArtists: any[] = [];
  logoimageurl = "";
  eventIdCurrent: number = 0;
  AttendeesBooths: any[] = [];
  backgroundurl: string = imageurl + "1-background-1.png";
  today = new Date();

  newArtists: any[] = [];
  artistsNeededCount: number = 0;

  approvalListArtists: ArtistPortfolio[] = [];
  // newArtists: [
  //   {
  //     name: string;
  //     emailAddress: string;
  //     boothNumber: number;
  //     designerName: string;
  //   }
  // ] = [{ name: "", emailAddress: "", boothNumber: 0, designerName: "" }];

  carousel: string[] = [""];
  carouselImages: any = [];
  sponsorsImages: any[] = [];
  backgroundImage: any[] = [];
  aboutUsImage: any[] = [];
  logoImage: any[] = [];

  savedCarousalImages: any = [];
  savedSponsersImages: any[] = [];
  savedBackgroundImage: any[] = [];
  savedAboutUsImage: any[] = [];
  savedLogoImage: any[] = [];

  existingCorousalImageCount: number = 0;
  existingSponsorImageCount: number = 0;
  existingAboutUsImageCount: number = 0;
  existingLogoImageCount: number = 0;
  existingBackgroundImageCount: number = 0;

  formData = new FormData();
  descriptionList: string[] = [];
  filesList: any[] = [];
  block: any;
  attendees: any[] = [];
  userId: number = 0;

  displayedColumns: string[] = ["name", "email", "approvalStatus"];
  dataSource = new MatTableDataSource<TableData>([]);

  initEditData: any = {};
  routeWarn = true;

  constructor(
    private router: Router,
    private eventService: EventsService,
    private sanitizer: DomSanitizer,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public notifyService: NotificationService,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef
  ) {}

  setPathCreateEvent() {
    console.log(this.userId);
    const path1 = "/admin-create-event/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathEditEvent() {
    console.log(this.userId);
    const path1 = "/admin-edit-event/" + this.userId + this.eventId;
    this.router.navigate([path1]);
  }

  setPathUpcomingEvent() {
    console.log(this.userId);
    const path1 = "/admin-upcoming-events/" + this.userId;
    this.router.navigate([path1]);
  }
  setPathEventHistory() {
    console.log(this.userId);
    const path1 = "/admin-event-history/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathAccontAdmin() {
    console.log(this.userId);
    const path1 = "/account-admin/" + this.userId;
    this.router.navigate([path1]);
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.userId = Number(localStorage.getItem("userId")) || 1;
    this.route.params.subscribe((params) => {
      this.eventId = params["eventId"];
    });
    this.eventService.getEventPreview(this.eventId).subscribe((result: any) => {
      this.entity.eventClass = result;
      this.eventName = result.eventName;
      this.savedArtists = this.entity.eventClass.artists;
      const startdatetimeString = result.eventStartTime;
      const startdateObj = new Date(startdatetimeString);
      this.eventDate = this.datePipe.transform(startdateObj, "yyyy-MM-dd");
      this.entity.eventClass.eventStartTime = startdateObj
        .getHours()
        .toString();
      const endatetimeString = result.eventEndTime;
      const enddateObj = new Date(endatetimeString);
      const currentTime = Date.now();
      if (enddateObj.getTime() <= currentTime) {
        this.editClicked = false;
        this.routeWarn = false;
      }
      this.entity.eventClass.eventEndTime = enddateObj.getHours().toString();
      //saved images logic

      // Reset data
      this.savedCarousalImages = [];
      this.savedSponsersImages = [];
      this.savedBackgroundImage = [];
      this.savedAboutUsImage = [];
      this.savedLogoImage = [];

      result.artifacts.forEach((artifact: any) => {
        const fileContent = "dummy file for saved images";
        const fileName = "saved.txt";
        const fileType = "text/plain";

        const blob = new Blob([fileContent], { type: fileType });
        const file = new File([blob], fileName);
        if (artifact.linkDescription.includes("-background-")) {
          const image = {
            file: file,
            url: artifact.link,
            linkDescription: artifact.linkDescription,
          };
          this.savedBackgroundImage.push(image);
          this.existingBackgroundImageCount = Number(
            artifact.linkDescription.substring(
              artifact.linkDescription.indexOf("-background-") +
                "-background-".length
            )
          );
        } else if (artifact.linkDescription.includes("-carousel-")) {
          const image = {
            file: file,
            url: artifact.link,
            linkDescription: artifact.linkDescription,
          };
          this.savedCarousalImages.push(image);
          this.existingCorousalImageCount = Number(
            artifact.linkDescription.substring(
              artifact.linkDescription.indexOf("-carousel-") +
                "-carousel-".length
            )
          );
        } else if (artifact.linkDescription.includes("-sponsor-")) {
          const image = {
            file: file,
            url: artifact.link,
            linkDescription: artifact.linkDescription,
          };
          this.savedSponsersImages.push(image);
          this.existingSponsorImageCount = Number(
            artifact.linkDescription.substring(
              artifact.linkDescription.indexOf("-sponsor-") + "-sponsor-".length
            )
          );
        } else if (artifact.linkDescription.includes("-aboutus-")) {
          const image = {
            file: file,
            url: artifact.link,
            linkDescription: artifact.linkDescription,
          };
          this.savedAboutUsImage.push(image);
          this.existingAboutUsImageCount = Number(
            artifact.linkDescription.substring(
              artifact.linkDescription.indexOf("-aboutus-") + "-aboutus-".length
            )
          );
        } else if (artifact.linkDescription.includes("-logo")) {
          const image = {
            file: file,
            url: artifact.link,
            linkDescription: artifact.linkDescription,
          };
          this.savedLogoImage.push(image);
          this.existingLogoImageCount = Number(
            artifact.linkDescription.substring(
              artifact.linkDescription.indexOf("-logo") + "-logo".length
            )
          );
        }
      });

      this.initEditData = cloneDeep(this.entity);
      var id = localStorage.getItem("current_event");
      if (id) this.eventIdCurrent = parseInt(id, 10);

      this.eventService.getEventLogoLink(this.eventIdCurrent).subscribe(
        (logoLink: any) => {
          this.logoimageurl = logoLink;
        },
        (error) => {
          console.error(error);
        }
      );
      // calling service to get attendees

      if (enddateObj.getTime() <= currentTime) {
        this.loadAttendees();
      } else {
        this.eventService.getAttendeesForEvent(this.eventId).subscribe(
          (attendees: Attendee[]) => {
            this.attendees = attendees;
          },
          (error) => {
            console.log(error);
          }
        );
      }
    });

    // calling service to get unapproved artists
    this.eventService.getUnapprovedArtists(this.eventId).subscribe(
      (approvalListArtists: any) => {
        this.approvalListArtists = approvalListArtists;
      },
      (error: any) => {
        console.log(error);
      }
    );

    //calling service to get all unassigned booths
    this.eventService.getUnassignedBooths(this.eventId).subscribe(
      (unassignedBoothNos) => {
        this.booths = unassignedBoothNos;
        if (this.booths.length < 1) {
          this.disableApproveDecline = true;
        } else {
          this.disableApproveDecline = false;
        }
        console.log(unassignedBoothNos);
      },
      (error) => {
        // Handle error
        console.error(error);
      }
    );

    // getting all artists
    this.eventService
      .getArtistsForEvent(this.eventId)
      .subscribe((artists: ArtistEventInfo[]) => {
        this.allArtists = artists;
        this.dataSource = new MatTableDataSource(this.allArtists);
        console.log(artists);
      });
  }

  public changeState(newStateValue: Number): void {
    this.state = newStateValue;
  }

  displayStyle = "none";
  displayStyleViewArtist = "none";
  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
  openViewArtistsModal() {
    const dialogRef = this.dialog.open(ViewArtistsDialogComponent, {
      width: "800px",
      data: { eventId: this.eventId },
    });
  }
  closeViewArtistsModal() {
    this.displayStyleViewArtist = "none";
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
    this.newArtists = [
      { name: "", emailAddress: "", boothNumber: 0, designerName: "" },
    ];
    if (
      this.entity.eventClass.booths <
      this.savedArtists.length + this.newArtists.length
    ) {
      this.newArtists.pop();
    } else {
      this.artistsNeededCount =
        this.entity.eventClass.booths - this.savedArtists.length;

      for (let i: number = 0; i < this.artistsNeededCount - 1; i++) {
        this.newArtists.push({
          name: "",
          emailAddress: "",
          boothNumber: 0,
          designerName: "",
        });
      }
    }
  }

  onEditClick(event: any) {
    this.editClicked = true;
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
      if (this.savedBackgroundImage.length > 0) {
        this.savedBackgroundImage = [];
        this.existingBackgroundImageCount--;
      }
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
      if (this.savedAboutUsImage.length > 0) {
        this.savedAboutUsImage = [];
        this.existingAboutUsImageCount--;
      }
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
      if (this.savedLogoImage.length > 0) {
        this.savedLogoImage = [];
        this.existingLogoImageCount--;
      }
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
      // if (this.carousalImages.length + this.savedCarousalImages.length > 4) {
      //   this.disableCarosalImages = true;
      // }
      this.carouselImages.push(fileHandle);
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
      this.sponsorsImages.push(fileHandle);
    }
  }

  approvalPreview(artist: any) {
    const dialogRef = this.dialog.open(ApprovalArtistsDialogComponent, {
      width: "600px",
      data: { eventArtists: artist },
    });
  }

  approveArtist(userId: any) {
    this.isLoading = true;
    this.eventService
      .approveArtist(this.eventId, userId, this.selectedBoothNumber)
      .subscribe(
        () => {
          this.isLoading = false;
          console.log("Artist approved");
          this.notifyService.showSuccess("Artist Approved!!", "Success");
          this.onLoad();
        },
        (error) => {
          this.isLoading = false;
          console.log("Error approving artist", error);
          this.notifyService.showError("Error approving artist", "Error");
        }
      );
  }

  denyArtist(userId: any) {
    this.eventService.denyArtist(this.eventId, userId).subscribe(
      () => {
        console.log("Artist denied");
        this.notifyService.showSuccess("Artist Denied!!", "Success");
        this.onLoad();
      },
      (error) => {
        console.log("Error denying artist", error);
        this.notifyService.showError("Error denying artist", "Error");
      }
    );
  }

  // this.eventService.uploadFiles(files, description).subscribe(
  //   (response) => console.log("success", response),
  //   (error) => console.log("error", error)
  // );

  onSubmit() {
    this.editClicked == false;
    this.entity.eventClass.artists = this.newArtists;
    // date assignment logic
    const eventDateTime = new Date(this.eventDate);
    const timeNow = new Date();
    const eventStartTime = eventDateTime?.setHours(
      Number(this.entity.eventClass.eventStartTime)
    );
    const eventEndTime = eventDateTime?.setHours(
      Number(this.entity.eventClass.eventEndTime)
    );
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
    this.isLoading = true;
    this.eventService
      .updateEvent(this.eventId, this.entity.eventClass)
      .subscribe(
        (result) => {
          console.log(result);
          this.isLoading = false;
          this.notifyService.showSuccess(
            "Event Edited successfully!!",
            "Success"
          );
          // upload file service call
          this.carouselImages.forEach((file: any) => {
            this.existingCorousalImageCount++;
            this.filesList.push(file.file);
            this.descriptionList.push(
              this.eventId + "-carousel-" + this.existingCorousalImageCount
            );
          });
          this.sponsorsImages.forEach((file: any) => {
            this.existingSponsorImageCount++;
            this.filesList.push(file.file);
            this.descriptionList.push(
              this.eventId + "-sponsor-" + this.existingSponsorImageCount
            );
          });
          if (this.backgroundImage.length > 0) {
            if (this.backgroundImage[0].file) {
              this.existingBackgroundImageCount++;
              this.filesList.push(this.backgroundImage[0].file);
              this.descriptionList.push(
                this.eventId +
                  "-background-" +
                  this.existingBackgroundImageCount
              );
            }
          }
          if (this.aboutUsImage.length > 0) {
            if (this.aboutUsImage[0].file) {
              this.existingAboutUsImageCount++;
              this.filesList.push(this.aboutUsImage[0].file);
              this.descriptionList.push(
                this.eventId + "-aboutus-" + this.existingAboutUsImageCount
              );
            }
          }

          if (this.logoImage.length > 0) {
            if (this.logoImage[0].file) {
              this.existingLogoImageCount++;
              this.filesList.push(this.logoImage[0].file);
              this.descriptionList.push(this.eventId + "-logo");
            }
          }

          // add presaved images to the list

          this.savedCarousalImages.forEach((image: any) => {
            this.filesList.push(image.file);
            this.descriptionList.push(image.linkDescription);
          });

          this.savedSponsersImages.forEach((image: any) => {
            this.filesList.push(image.file);
            this.descriptionList.push(image.linkDescription);
          });

          this.savedAboutUsImage.forEach((image: any) => {
            this.filesList.push(image.file);
            this.descriptionList.push(image.linkDescription);
          });

          this.savedLogoImage.forEach((image: any) => {
            this.filesList.push(image.file);
            this.descriptionList.push(image.linkDescription);
          });

          this.savedBackgroundImage.forEach((image: any) => {
            this.filesList.push(image.file);
            this.descriptionList.push(image.linkDescription);
          });

          // call editimages function
          this.eventService
            .editImages(this.filesList, this.descriptionList)
            .subscribe(
              (response) => console.log("success", response),
              (error) => console.log("error", error)
            );
          this.routeWarn = false;
          this.setPathUpcomingEvent();
        },

        (error) => {
          this.notifyService.showError("Event Updation Error!!", "Error");
          console.log(error);
          this.isLoading = false;
        }
      );
    console.log(this.entity);
  }

  artistSaved() {
    this.onLoad();
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
  onCancel() {
    this.setPathUpcomingEvent();
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (!this.routeWarn) {
      return true;
    }
    if (
      isEqual(this.entity, this.initEditData) &&
      isEmpty(this.carouselImages) &&
      isEmpty(this.sponsorsImages) &&
      isEmpty(this.backgroundImage) &&
      isEmpty(this.aboutUsImage) &&
      isEmpty(this.logoImage) &&
      this.savedCarousalImages.length === this.existingCorousalImageCount &&
      this.savedSponsersImages.length === this.existingSponsorImageCount &&
      this.savedBackgroundImage.length === this.existingBackgroundImageCount &&
      this.savedAboutUsImage.length === this.existingAboutUsImageCount &&
      this.savedLogoImage.length === this.existingLogoImageCount
    ) {
      return true;
    }
    return false;
  }

  loadAttendees() {
    this.eventService.getAttendeeBoothVisited(this.eventId).subscribe(
      (attendeesBooths: AttendeesBooths[]) => {
        this.attendees = attendeesBooths;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  sendGoodies(attendee: any) {
    attendee.isLoading = true;
    this.eventService
      .updateDigitalGoodies(this.eventId, attendee.userId, "Y")
      .subscribe(
        (response: any) => {
          this.notifyService.showSuccess("Goodies sent to the user", "Success");
          this.loadAttendees();
          attendee.isLoading = false;
        },
        (error: any) => {
          this.notifyService.showError(
            "Error occurred while sending goodies",
            "Error"
          );
          attendee.isLoading = false;
        }
      );
  }
}
