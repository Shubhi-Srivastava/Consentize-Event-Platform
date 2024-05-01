import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EventArtists } from "../Model/event.model";

@Component({
  selector: "app-event-artists-dialog",
  templateUrl: "./event-artists-dialog.component.html",
  styleUrls: ["./event-artists-dialog.component.scss"],
})
export class EventArtistsDialogComponent implements OnInit {
  @ViewChild("closeButton") closeButton!: ElementRef<HTMLButtonElement>;
  eventArtists!: EventArtists;

  constructor(
    public dialogRef: MatDialogRef<EventArtistsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.eventArtists = this.data.eventArtists;
  }
  ngAfterViewInit() {
    // Get the close button and align it to the top right corner
    const buttonElement = this.closeButton.nativeElement;
    buttonElement.classList.add("align-top-right");
  }
}
