import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Artist } from "src/app/Model/artist.model";
import { imageurl } from "src/app/Model/constants";
import { FileHandle } from "src/app/Model/file-handle.model";
import { AuthService } from "src/app/services/auth.service";
import { EventsService } from "src/app/services/events.service";
import { NotificationService } from "src/app/services/notification.service";

@Component({
  selector: "app-artist-portfolio",
  templateUrl: "./artist-portfolio.component.html",
  styleUrls: ["./artist-portfolio.component.scss"],
})
export class ArtistPortfolioComponent {
  backgroundurl: string = imageurl + "1-background-1.png";
  public state: Number = 1;
  public socialMediaInfo: Artist = {
    name: "",
    phoneNumber: "",
    emailAddress: "",
    personalBio: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    twitter: "",
    personalWebsite: "",
    userId: 0,
  };

  public previewProfilePic: string = "";
  public designerPic: string[] = [];

  public profilePic: any = { file: null, url: "", linkDescription: null };

  public designerFiles: any[] = [];
  userId: number = 0;
  eventId: number = 0;
  plusIcon = imageurl + "plus-icon.svg";
  deleteIcon = imageurl + "delete-icon.svg";
  facebookIcon = imageurl + "facebook.svg";
  instaIcon = imageurl + "insta-logo.svg";
  twitterIcon = imageurl + "twitter-logo.svg";
  tiktokIcon = imageurl + "tiktok-logo.svg";
  youtubeIcon = imageurl + "youtube-logo.svg";
  @Input() isPopup: boolean = false;
  @Input() isEdit: boolean = false;
  @Input() eventIdForPopup: number = 0;
  @Output() closePopup = new EventEmitter();
  logoimageurl = "";
  eventIdCurrent: number = 0;

  constructor(
    private eventService: EventsService,
    private notifyService: NotificationService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute
  ) {}
  public events: any;
  public isLoading: boolean = false;
  public isSaving: boolean = false;

  public changeState(newStateValue: Number): void {
    this.state = newStateValue;
  }

  ngOnInit() {
    // this.userId = history.state.userId;
    // Get userId from localStorage
    this.pageLoad();
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
  }

  closeModal() {}

  pageLoad() {
    this.userId = Number(localStorage.getItem("userId"));
    this.loadArtist();
  }

  openInNewTab(url?: string, prependUrl?: string) {
    if (url) {
      window.open(prependUrl + url, "_blank");
    }
  }
  async saveArtist() {
    // if (this.profilePic.file === null) {
    //   this.notifyService.showWarning("Profile picture is mandatory", "Warning");
    //   return;
    // }
    if (!this.socialMediaInfo.name) {
      this.notifyService.showWarning("Profile name is mandatory", "Warning");
      return;
    }
    this.isSaving = true;
    if (!this.isPopup || this.isEdit) {
      this.eventService
        .updateArtist(
          this.socialMediaInfo,
          this.eventIdForPopup === 0 ? this.eventId : this.eventIdForPopup
        )
        .subscribe({
          next: () => {
            this.notifyService.showSuccess(
              "Artist portfolio updated successfully!",
              "Success"
            );
            if (this.isEdit == true) {
              this.closePopup.emit();
            }
            this.processImages(this.socialMediaInfo.userId);
          },
          error: () => {
            this.isSaving = false;
            this.notifyService.showError("Error occurred", "Error");
          },
        });
    } else {
      var regEvent;
      if (!this.isEdit) {
        regEvent = this.eventIdForPopup;
      } else {
        regEvent = this.eventId;
      }
      const registrationData = {
        // registration data
        registration: {
          userId: this.userId,
          eventId: regEvent,
        },
        artistPortfolio: this.socialMediaInfo,
      };
      this.eventService.registerForEventArtist(registrationData).subscribe({
        next: () => {
          //event.isRegistering = false;
          this.notifyService.showSuccess(
            "Registered for the event successfully!",
            "Success"
          );
          //this.fetchEvents();
          this.processImages(this.socialMediaInfo.userId);
          if (this.isEdit == false) {
            this.closePopup.emit();
          }
        },
        error: () => {
          //event.isRegistering = false;
          this.notifyService.showError("Error occurred", "Error");
        },
      });
    }
  }

  setPathPortfolioPreview() {
    console.log(this.userId);
    const path1 = "/artist-portfolio-preview/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathArtistEventHistory() {
    console.log(this.userId);
    const path1 = "/artist-event-history/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathArtistPortfolio() {
    console.log(this.userId);
    const path1 = "/artist-portfolio/" + this.userId;
    this.router.navigate([path1]);
  }

  setPathAccountArtist() {
    console.log(this.userId);
    const path1 = "/account-artist/" + this.userId;
    this.router.navigate([path1]);
  }

  processImages(userId: Number) {
    var imageEventId: number = 0;
    if (this.isPopup) {
      imageEventId = this.eventIdForPopup;
    } else {
      imageEventId = this.eventId;
    }
    let files: File[] = [];
    let description = [];
    let timeStamp = Date.now();
    if (this.profilePic?.file) {
      files.push(this.profilePic.file);
      description.push(
        this.profilePic.linkDescription ||
          imageEventId + `-${userId}-profile-${timeStamp}`
      );
    }

    for (let df of this.designerFiles) {
      timeStamp++;
      files.push(df.file);
      description.push(
        df.linkDescription || imageEventId + `-${userId}-design-${timeStamp}`
      );
    }
    if (files.length > 0) {
      this.eventService.uploadArtistFiles(files, description).subscribe({
        next: () => {
          // this.notifyService.showSuccess(
          //   "Artist images uploaded successfully.",
          //   "Success"
          // );

          this.isSaving = false;
          this.changeState(2);
        },
        error: () => {
          this.notifyService.showError("Artist images upload failed.", "Error");
        },
      });
    }
  }
  async loadArtist() {
    this.isLoading = true;
    this.profilePic = { file: null, url: "" };
    this.designerFiles = [];
    // Get userId from localStorage
    this.userId = Number(localStorage.getItem("userId"));
    this.eventId = parseInt(localStorage.getItem("current_event") ?? "0", 10);
    var portfolioEventId = 0;
    if (this.isEdit) {
      portfolioEventId = this.eventIdForPopup;
    } else {
      portfolioEventId = this.eventId;
    }
    if (!this.isPopup || this.isEdit) {
      this.eventService
        .geCurrentPortfolioDetails(this.userId, portfolioEventId)
        .subscribe({
          next: (userDetails) => {
            this.socialMediaInfo = userDetails;
            if (
              userDetails?.designerArtifacts &&
              userDetails?.designerArtifacts.length
            ) {
              const record = userDetails.designerArtifacts.find((art: any) => {
                return art.linkDescription.includes("profile");
              });
              const fileContent = "dummy file for saved images";
              const fileName = "saved.txt";
              const fileType = "text/plain";

              const blob = new Blob([fileContent], { type: fileType });
              const file = new File([blob], fileName);
              if (record) {
                this.profilePic.url = record.link;
                this.profilePic.file = file;
                this.profilePic.linkDescription = record.linkDescription;
              }
              for (const rec of userDetails.designerArtifacts) {
                if (rec.linkDescription.includes("design")) {
                  this.designerFiles.push({
                    file: file,
                    url: rec.link,
                    linkDescription: rec.linkDescription,
                  });
                }
              }
            }
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
    } else {
      this.eventService
        .getUserDetailsBeforeArtistRegistration(this.userId)
        .subscribe({
          next: (userDetails) => {
            this.socialMediaInfo = userDetails;
            if (
              userDetails?.designerArtifacts &&
              userDetails?.designerArtifacts.length
            ) {
              const record = userDetails.designerArtifacts.find((art: any) => {
                return art.linkDescription.includes("profile");
              });
              const fileContent = "dummy file for saved images";
              const fileName = "saved.txt";
              const fileType = "text/plain";

              const blob = new Blob([fileContent], { type: fileType });
              const file = new File([blob], fileName);
              if (record) {
                this.profilePic.url = record.link;
                this.profilePic.file = file;
                this.profilePic.linkDescription = record.linkDescription;
              }
              for (const rec of userDetails.designerArtifacts) {
                if (rec.linkDescription.includes("design")) {
                  this.designerFiles.push({
                    file: file,
                    url: rec.link,
                    linkDescription: rec.linkDescription,
                  });
                }
              }
            }
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
    }
  }

  public onFileChanged(e: any) {
    if (e.target.files) {
      let newFile = e.target.files[0];
      const fileHandle: FileHandle = {
        file: newFile,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(newFile)
        ),
      };
      this.profilePic = fileHandle;
    }
  }
  public conFileChanged(e: any) {
    if (e.target.files) {
      let newFile = e.target.files[0];
      const fileHandle: any = {
        file: newFile,
        url: this.sanitizer.bypassSecurityTrustUrl(
          window.URL.createObjectURL(newFile)
        ),
        linkDescription: null,
      };
      this.designerFiles.push(fileHandle);
    }
  }
  public clearFile() {
    (<HTMLInputElement>document.getElementById("imageInputIdx")).value = "";

    this.profilePic = { url: "", file: null, linkDescription: null };
  }
  public clearFile1(idx: any) {
    this.designerFiles.splice(idx, 1);
    (<HTMLInputElement>document.getElementById(`cimageInputIdx`)).value = "";
  }
  public logOut = () => {
    localStorage.removeItem("userId");
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

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
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
    if (this.isMenuOpen) {
      // If the user has scrolled to the bottom, close the menu
      if (scrollPosition + window.innerHeight >= document.body.scrollHeight) {
        this.toggleMenu();
      }
    }
  }
}
