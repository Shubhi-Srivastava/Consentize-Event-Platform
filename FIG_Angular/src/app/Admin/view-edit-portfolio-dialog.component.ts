import { Component, Inject, Input } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ArtistBooth, ArtistBoothSave } from "../Model/event.model";
import { EventsService } from "../services/events.service";
import { NotificationService } from "../services/notification.service";

@Component({
  selector: "view-edit-portfolio",
  templateUrl: "./view-edit-portfolio-dialog.component.html",
})
export class ViewEditPortfolioDialogComponent {
  savedArtists: any[] = [];
  newArtists: any[] = [];
  booths: any = [];
  numberOfBooths: number = 0;
  artistsNeededCount: number = 0;
  artistBooths: ArtistBooth[] = [];

  constructor(
    public eventService: EventsService,
    public notifyService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ViewEditPortfolioDialogComponent>
  ) {}

  ngOnInit() {}

  closePopup() {
    this.dialogRef.close();
  }
}
