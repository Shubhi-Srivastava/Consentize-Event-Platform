import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Artist } from "src/app/Model/artist.model";
import { imageurl } from "src/app/Model/constants";
import { FileHandle } from "src/app/Model/file-handle.model";
import { AuthService } from "src/app/services/auth.service";
import { EventsService } from "src/app/services/events.service";
import { NotificationService } from "src/app/services/notification.service";
import { UserService } from "src/app/services/user.service";
@Component({
  selector: "account",
  templateUrl: "./account-artist.component.html",
  styleUrls: ["./account-artist.component.scss"],
})
export class AccountArtistComponent {
  public state: Number = 1;

  showEdit: boolean = true;

  public previewProfilePic: string = "";

  public profilePic: any = { file: null, url: "", linkDescription: null };

  userId: number = 0;
  eventId: number = 0;
  plusIcon = imageurl + "plus-icon.svg";
  deleteIcon = imageurl + "delete-icon.svg";
  logoimageurl = "";
  eventIdCurrent: number = 0;

  profileForm!: FormGroup;
  accountDetails: any;
  initialMobile: any;
  backgroundurl: string = imageurl + "1-background-1.png";

  constructor(
    private eventService: EventsService,
    private userService: UserService,
    private notifyService: NotificationService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private authService: AuthService,
    private jwtHelper: JwtHelperService,
    private route: ActivatedRoute,
    private fb: FormBuilder
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
    this.userId = Number(localStorage.getItem("userId")) || 1;
    this.load();
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

  load() {
    this.profileForm = this.fb.group({
      phoneNumber: [{ value: "", disabled: true }, Validators.required],
      name: [{ value: "", disabled: true }, Validators.required],
      email: [
        { value: "", disabled: true },
        [Validators.required, Validators.email],
      ],
      password: [{ value: "", disabled: true }, Validators.required],
      reenterPassword: [{ value: "", disabled: true }, Validators.required],
    });
    this.userService
      .getAccountDetails(this.userId)
      .subscribe((accountDetails) => {
        this.accountDetails = accountDetails;
        this.initialMobile = this.accountDetails.phone_Number;
        this.profileForm.setValue({
          name: this.accountDetails.name,
          email: this.accountDetails.email_Address,
          phoneNumber: this.accountDetails.phone_Number,
          password: "",
          reenterPassword: "",
        });
        if (accountDetails?.profilePhoto_Description) {
          const fileContent = "dummy file for saved images";
          const fileName = "saved.txt";
          const fileType = "text/plain";

          const blob = new Blob([fileContent], { type: fileType });
          const file = new File([blob], fileName);

          this.profilePic.url = accountDetails?.profilePhoto_URL;
          this.profilePic.file = file;
          this.profilePic.linkDescription =
            accountDetails?.profilePhoto_Description;
        }
      });
  }

  pageLoad() {
    this.userId = Number(localStorage.getItem("userId"));
    this.loadAccount();
  }

  openInNewTab(url?: string, prependUrl?: string) {
    if (url) {
      window.open(prependUrl + url, "_blank");
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

  cancelClick() {
    this.showEdit = true;
    this.load();
  }
  processImages(userId: Number) {
    let files: File[] = [];
    let description = [];
    let timeStamp = Date.now();
    if (this.profilePic?.file) {
      files.push(this.profilePic.file);
      description.push(
        this.profilePic.linkDescription || `${userId}-profile-${timeStamp}`
      );
    }
    if (files.length > 0) {
      this.eventService.uploadProfilePicture(files, description).subscribe({
        next: () => {
          // this.notifyService.showSuccess(
          //   "Profile image uploaded successfully.",
          //   "Success"
          // );

          this.isSaving = false;
          this.changeState(1);
        },
        error: () => {
          this.notifyService.showError("Profile image upload failed.", "Error");
        },
      });
    }
  }
  async loadAccount() {
    this.profilePic = { file: null, url: "" };
    // Get userId from localStorage
    this.userId = Number(localStorage.getItem("userId"));

    this.eventId = parseInt(localStorage.getItem("current_event") ?? "0", 10);
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
  public clearFile() {
    (<HTMLInputElement>document.getElementById("imageInputIdx")).value = "";

    this.profilePic = { url: "", file: null, linkDescription: null };
  }

  editClicked() {
    this.showEdit = false;
    this.profileForm.controls["phoneNumber"].enable();
    this.profileForm.controls["password"].enable();
    this.profileForm.controls["reenterPassword"].enable();
  }

  saveClicked() {
    this.saveProfileClicked();
    this.profileForm.controls["phoneNumber"].disable();
    if (this.initialMobile != this.profileForm.controls["phoneNumber"].value) {
      this.userService
        .updateMobileNo(
          this.userId,
          this.profileForm.controls["phoneNumber"].value
        )
        .subscribe(
          (response) => {
            this.notifyService.showSuccess(
              "Details Updated successfully.",
              "Success"
            );
          },
          (error) => {
            this.notifyService.showError(
              "Error updating mobile number",
              "Error"
            );
          }
        );
    }

    this.profileForm.controls["password"].disable();
    if (
      (this.profileForm.controls["password"].value == "" &&
        this.profileForm.controls["reenterPassword"].value != "") ||
      (this.profileForm.controls["password"].value != "" &&
        this.profileForm.controls["reenterPassword"].value == "")
    ) {
      this.notifyService.showError(
        "Please enter both password field values",
        "Error"
      );
    } else if (
      this.profileForm.controls["password"].value !=
      this.profileForm.controls["reenterPassword"].value
    ) {
      this.notifyService.showError("Both passwords should match", "Error");
    } else if (
      this.profileForm.controls["password"].value == "" &&
      this.profileForm.controls["reenterPassword"].value == ""
    ) {
    } else {
      this.userService
        .updatePassword(
          this.userId,
          this.profileForm.controls["password"].value
        )
        .subscribe(
          (response) => {
            this.notifyService.showSuccess(
              "Details Updated successfully.",
              "Success"
            );
          },
          (error) => {
            this.notifyService.showError("Error updating Password", "Error");
          }
        );
    }
    this.showEdit = true;
  }

  saveProfileClicked() {
    this.processImages(this.userId);
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
