import { Component, Output, Input, EventEmitter } from "@angular/core";
import { imageurl } from "src/app/Model/constants";

@Component({
  selector: "app-image-multi-upload",
  templateUrl: "./image-multi-upload.component.html",
  styleUrls: ["./image-multi-upload.component.scss"],
})
export class ImageMultiUploadComponent {
  plusIcon = imageurl + "plus-icon.svg";
  deleteIcon = imageurl + "delete-icon.svg";

  @Input()
  imagesList: any[] = [];

  @Input()
  disableUpload: boolean = false;
  @Input()
  hideUpload: boolean = false;
  @Input()
  disableDelete: boolean = false;

  @Output() onFileChangeEvent = new EventEmitter();
  @Output() onClearFileEvent = new EventEmitter();

  public onFileChange(e: any) {
    this.onFileChangeEvent.emit(e);
  }

  public clearFile(indexOfElement: number) {
    this.onClearFileEvent.emit(indexOfElement);
  }
}
