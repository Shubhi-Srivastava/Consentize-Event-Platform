import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-team',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  
  eventId: number = 0;

  constructor(
    private router: Router,
    private eventService: EventsService) { }

  ngOnInit(): void {
    localStorage.removeItem("current_event");
    localStorage.removeItem("current_event_name");
    localStorage.removeItem("current_event_ticket")
    this.getEvent();
  }

  getEvent(): void {
    this.eventService.getCurrentEvent().subscribe(
      (data) => {
        this.eventId = data.eventId,
        localStorage.setItem("current_event", data.eventId);
        localStorage.setItem("current_event_name",data.eventName)
        localStorage.setItem("current_event_ticket",data.ticketLink)
        this.router.navigateByUrl(`/home/${this.eventId}`,{ state: data });
      },
      error => console.log(error)
    );
  }
}
