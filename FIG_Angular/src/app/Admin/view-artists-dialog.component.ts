import { HttpClient } from "@angular/common/http";
import { Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import {
  ArtistBooth,
  ArtistBoothSave,
  ArtistEventInfo,
  ArtistPortfolio,
} from "../Model/event.model";
import { EventsService } from "../services/events.service";
import { NotificationService } from "../services/notification.service";
import { ApprovalArtistsDialogComponent } from "./approval-artists-dialog.component";
import { JwtHelperService } from "@auth0/angular-jwt";
import { imageurl } from "../Model/constants";

@Component({
  selector: "view-artist-booth",
  templateUrl: "./view-artists-dialog.component.html",
  styleUrls: ["./approval-artists-dialog.component.scss"],
})
export class ViewArtistsDialogComponent {
  savedArtists: any[] = [];
  newArtists: any[] = [];
  booths: any = [];
  unusedBooths: any = [];
  numberOfBooths: number = 0;
  startBooth: number = 0;
  artistsNeededCount: number = 0;
  artistBooths: ArtistBooth[] = [];
  isDisabledLackofBooths: boolean = false;
  disableApproveDecline: boolean = false;
  allArtists: any[] = [];
  approveDeclineArtist: boolean = false;
  approvalstatus: any = "";
  boothChanged: boolean = false;
  approvedUser: any;
  approvedUserBooth: any;
  infoIcon = imageurl + "info-circle.svg";

  @Input() eventId: any;
  @Input() eventName: any;
  @Input() isDisabled: any;
  @Output() artistSaved = new EventEmitter();
  public isLoading = false;
  approvalListArtists: ArtistPortfolio[] = [];

  constructor(
    public eventService: EventsService,
    public notifyService: NotificationService,
    public dialog: MatDialog,
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.eventService.getEventPreview(this.eventId).subscribe(
      (data: any) => {
        this.numberOfBooths = data.booths;
        this.startBooth = this.numberOfBooths;
        this.booths = [];
        for (let i = 1; i <= this.numberOfBooths; i++) {
          this.booths.push(i);
        }
        this.savedArtists = data.artists;
        this.calculateRemainingBooths();
      },
      (error) => {
        console.log(error);
      }
    );

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
        this.unusedBooths = unassignedBoothNos;
        if (this.unusedBooths.length < 1) {
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
    let declinedArtists: any[] = [];
    this.eventService
      .getArtistsForEvent(this.eventId)
      .subscribe((artists: ArtistEventInfo[]) => {
        declinedArtists = artists;
        console.log(artists);
        declinedArtists.forEach((artist) => {
          if (artist.approvalStatus == "N") {
            this.allArtists.push(artist);
          }
        });
      });
  }

  viewArtistDetails(artist: any) {
    this.eventService
      .geCurrentPortfolioDetails(artist.designerId, this.eventId)
      .subscribe(
        (res) => {
          const dialogRef = this.dialog.open(ApprovalArtistsDialogComponent, {
            width: "600px",
            data: { eventArtists: res },
          });
        },
        (error) => {}
      );
  }

  calculateRemainingBooths() {
    // Calculate remaining booths for new artists
    this.newArtists = [];
    const remainingBooths =
      this.numberOfBooths -
      (this.savedArtists.length + this.approvalListArtists.length);
    if (remainingBooths > 0) {
      for (let i = 0; i < remainingBooths; i++) {
        this.newArtists.push({ boothNumber: "", name: "", emailAddress: "" });
      }
    }
    if (remainingBooths < -1) {
      let reduceFromExisting = Math.abs(remainingBooths);
      for (let i = 0; i < reduceFromExisting; i++) {
        this.savedArtists.pop();
      }
    }
  }

  onClose(): void {}
  onBoothBlur() {
    this.boothChanged = true;
    this.booths = [];
    for (let i = 1; i <= this.numberOfBooths; i++) {
      this.booths.push(i);
    }
    this.calculateRemainingBooths();
    this.onSave();
  }

  onSave() {
    let invalidData = false;
    this.artistBooths = [];
    this.savedArtists.forEach((artist) => {
      this.artistBooths.push({
        name: artist.name,
        emailAddress: artist.emailAddress,
        boothNumber: Number(artist.boothNumber),
        qrCodeURL: artist.qrCodeURL,
      });
    });
    this.newArtists.forEach((artist) => {
      if (
        artist.name == "" &&
        artist.emailAddress == "" &&
        artist.boothNumber == 0
      ) {
        // no adding new artists for empty list
      } else {
        this.artistBooths.push({
          name: artist.name,
          emailAddress: artist.emailAddress,
          boothNumber: Number(artist.boothNumber),
          qrCodeURL: "",
        });
      }
    });

    this.artistBooths.forEach((artist) => {
      if (
        (artist.name == "" && artist.boothNumber == 0) ||
        (artist.emailAddress == "" && artist.boothNumber == 0) ||
        (artist.emailAddress == "" && artist.name == "") ||
        artist.boothNumber == 0 ||
        artist.name == "" ||
        artist.emailAddress == ""
      ) {
        invalidData = true;
      }
    });
    const artistBoothSave: ArtistBoothSave = {
      totalBooths: this.numberOfBooths,
      eventId: this.eventId,
      artistBooths: this.artistBooths,
    };
    this.isLoading = true;
    const duplicates = this.artistBooths.filter((item, index, arr) => {
      return arr
        .slice(index + 1)
        .some(
          (innerItem) =>
            innerItem.boothNumber === item.boothNumber && item.boothNumber != 0
        );
    });

    if (duplicates.length > 0) {
      this.notifyService.showError(
        "Same booth selected for multiple Artists",
        "Error"
      );
      return;
    }
    if (invalidData == false) {
      this.eventService.createArtistBooth(artistBoothSave).subscribe(
        (res) => {
          this.notifyService.showSuccess(
            "Booths and Artists changed successsfully",
            "Success"
          );
          if (this.approvalstatus == "Approved") {
            this.eventService
              .approveArtist(
                this.eventId,
                this.approvedUser,
                this.approvedUserBooth
              )
              .subscribe(
                () => {
                  this.isLoading = false;
                  console.log("Artist approved");
                  this.notifyService.showSuccess(
                    "Artist Approved!!",
                    "Success"
                  );
                  this.load();
                  this.approvalstatus = "";
                },
                (error) => {
                  this.isLoading = false;
                  console.log("Error approving artist", error);
                  this.notifyService.showError(
                    "Error approving artist",
                    "Error"
                  );
                  this.approvalstatus = "";
                }
              );
          }
          if (this.boothChanged == true) {
            if (this.numberOfBooths > this.startBooth) {
              const data = {
                eventId: this.eventId,
                eventName: this.eventName,
                start: this.startBooth + 1,
                end: this.numberOfBooths,
              };
              this.eventService.addBooth(data).subscribe(
                (res) => {
                  console.log("Booth increased", res);
                  this.boothChanged == false;
                },
                (error) => {}
              );
            } else if (this.numberOfBooths == this.startBooth) {
              // do nothing
            } else {
              const data = {
                eventId: this.eventId,
                start: this.startBooth,
                end: this.numberOfBooths,
              };
              this.eventService.deleteBooth(data).subscribe(
                (res) => {
                  console.log("Booth Decreased", res);
                  this.boothChanged == false;
                },
                (error) => {}
              );
            }
          }

          console.log(res);
          this.artistSaved.emit();
          this.isLoading = false;
          this.load();
        },
        (error) => {
          this.notifyService.showError(
            "Error saving Booths and Artists",
            "Error"
          );
          console.error(error);
          this.isLoading = false;
        }
      );
    } else {
      this.notifyService.showError(
        "Name,Email and BoothNumber Mandatory",
        "Error"
      );
    }
  }

  onCancel() {
    this.load();
  }

  approveArtist(userId: any, boothNumber: any) {
    this.isLoading = true;

    //duplicates
    let duplicate = false;
    for (const savedArtist of this.savedArtists) {
      const boothNumber1 = savedArtist.boothNumber;
      for (const approvalArtist of this.approvalListArtists) {
        const boothNumber2 = Number(approvalArtist.boothNumber);
        if (boothNumber1 === boothNumber2) {
          duplicate = true;
        }
      }
    }
    for (const newArtist of this.newArtists) {
      const boothNumber1 = newArtist.boothNumber;
      for (const approvalArtist of this.approvalListArtists) {
        const boothNumber2 = Number(approvalArtist.boothNumber);
        if (boothNumber1 === boothNumber2) {
          duplicate = true;
        }
      }
    }
    if (boothNumber == "" || boothNumber == undefined) {
      this.notifyService.showError("Please select a booth number", "Error");
      return;
    }
    const remainingBooths =
      this.numberOfBooths -
      (this.savedArtists.length + this.approvalListArtists.length);
    if (remainingBooths <= -1) {
      this.notifyService.showWarning(
        "Booths exhausted for approval, please add more boooths",
        "Warning"
      );
      return;
    }
    if (duplicate) {
      this.notifyService.showError(
        "Same booth selected for multiple Artists",
        "Error"
      );
      return;
    } else {
      this.approveDeclineArtist = true;
      this.approvalstatus = "Approved";
      this.approvedUser = userId;
      this.approvedUserBooth = boothNumber;
      this.onSave();
    }
  }

  denyArtist(userId: any) {
    this.approveDeclineArtist = true;
    this.approvalstatus = "Denied";
    this.eventService.denyArtist(this.eventId, userId).subscribe(
      () => {
        console.log("Artist denied");
        this.notifyService.showSuccess("Artist Denied!!", "Success");
        this.load();
      },
      (error) => {
        console.log("Error denying artist", error);
        this.notifyService.showError("Error denying artist", "Error");
      }
    );
  }

  approvalPreview(artist: any) {
    const dialogRef = this.dialog.open(ApprovalArtistsDialogComponent, {
      width: "600px",
      data: { eventArtists: artist },
    });
  }

  downloadImage(imageUrl: string) {
    const parts = imageUrl.split("/");
    const filename = parts[parts.length - 1];
    this.eventService.downloadImage(filename).subscribe((response) => {
      const url = URL.createObjectURL(response);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    });
  }

  // downloadImage(imageUrl: string): void {
  //   // const imageUrl = 'https://fig-bucket.s3.amazonaws.com/1-1-profile-1682697607324.jpg';
  //   const parts = imageUrl.split("/");
  //   const filename = parts[parts.length - 1];
  //   this.httpClient.get(imageUrl, { responseType: "blob" }).subscribe((res) => {
  //     const url = URL.createObjectURL(res);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = filename;
  //     link.click();
  //   });
  // }
}
