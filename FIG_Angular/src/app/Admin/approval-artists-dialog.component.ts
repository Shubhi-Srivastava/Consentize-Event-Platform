import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ArtistPortfolio, EventArtists } from "../Model/event.model";
import { EventsService } from "../services/events.service";
import { imageurl } from "../Model/constants";

@Component({
  selector: "app-approval-artists-dialog",
  templateUrl: "./approval-artists-dialog.component.html",
  styleUrls: ["./approval-artists-dialog.component.scss"],
})
export class ApprovalArtistsDialogComponent implements OnInit {
  @ViewChild("closeButton") closeButton!: ElementRef<HTMLButtonElement>;
  eventArtists!: ArtistPortfolio;

  constructor(
    public eventService: EventsService,
    public dialogRef: MatDialogRef<ApprovalArtistsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  logoimageurl = ''
  eventIdCurrent: number = 0;


  ngOnInit() {
    this.eventArtists = this.data.eventArtists;
    var id = localStorage.getItem("current_event")
    if(id) this.eventIdCurrent = parseInt(id,10);

    this.logoimageurl = imageurl + this.eventIdCurrent.toString() + '-logo.jpeg'
  }
  ngAfterViewInit() {
    // Get the close button and align it to the top right corner
    const buttonElement = this.closeButton.nativeElement;
    buttonElement.classList.add("align-top-right");
  }
}
