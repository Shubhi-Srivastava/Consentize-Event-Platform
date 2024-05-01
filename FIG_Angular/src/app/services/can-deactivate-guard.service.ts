import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CanDeactivate } from "@angular/router";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable, Observer } from "rxjs";
import { UnsavedChangesDialogComponent } from "../components/unsaved-changes-dialog/unsaved-changes-dialog.component";
export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}
@Injectable()
export class CanDeactivateGuard
  implements CanDeactivate<CanComponentDeactivate>
{
  constructor(private dialog: MatDialog) {}

  async canDeactivate(component: CanComponentDeactivate) {
    // Allow navigation if the component says that it is OK or it doesn't have a canDeactivate function
    if (!component.canDeactivate || component.canDeactivate()) {
      return true;
    }
    let dialogRef = this.dialog.open(UnsavedChangesDialogComponent, {
      width: "600px",
      height: "220px",
      position: { top: "50px" },
      panelClass: "icon-outside",
      disableClose: true,
      data: {
        message:
          "You have unsaved changes. Are you sure you want to leave this page?",
      },
    });
    const isClosed = await dialogRef.afterClosed().toPromise();
    return isClosed;
  }
}
