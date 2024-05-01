import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})

export class LoaderComponent {
  @Output() loaderActivator = new EventEmitter<boolean>();

  //loader close
  public loaderClose() {
      this.loaderActivator.emit(false);
  }
}

