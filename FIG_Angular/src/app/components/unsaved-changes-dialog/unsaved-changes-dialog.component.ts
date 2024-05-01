import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-unsaved-changes-dialog",
  templateUrl: "./unsaved-changes-dialog.component.html",
  styleUrls: ["./unsaved-changes-dialog.component.scss"],
})
export class UnsavedChangesDialogComponent {
  constructor(private dialogRef: MatDialogRef<boolean>) {}

  stay() {
    this.dialogRef.close(false);
  }

  leave() {
    this.dialogRef.close(true);
  }
}
