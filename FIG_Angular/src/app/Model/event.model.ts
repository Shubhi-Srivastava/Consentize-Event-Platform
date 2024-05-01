export interface Event {
  eventClass: {
    eventName: string;
    eventLocation: string;
    eventStartTime: any;
    eventId: 0;
    eventEndTime: any;
    ticketLink: string;
    eventBio: string;
    currentEvent: string;
    publishEvent: string;
    booths: number;
  };
  eventDesigners: {
    designers: [
      {
        name: string;
        emailAddress: string;
        userType: string;
      }
    ];
  };
}
export interface EventPreview {
  eventClass: {
    eventName: string;
    eventLocation: string;
    eventStartTime: any;
    eventId: 0;
    eventEndTime: any;
    ticketLink: string;
    eventBio: string;
    currentEvent: string;
    publishEvent: string;
    artists: Artist[];
    booths: number;
  };
}

export interface Artist {
  name: string;
  emailAddress: string;
  boothNumber: number;
  designerName: string;
  qrCodeURL: string;
}

export interface ArtistBoothSave {
  totalBooths: number;
  eventId: number;
  artistBooths: ArtistBooth[];
}

export interface EventArtists {
  eventID: number;
  eventName: string;
  eventLocation: string;
  eventStartTime: Date;
  eventEndTime: Date;
  ticketLink: string;
  eventBio: string;
  currentEvent: boolean;
  artists: ArtistBooth[];
  artifacts: EventArtifact[];
}
export interface uploadFiles {
  files: FormData;
  description: any[];
}
export interface ArtistBooth {
  name: string;
  emailAddress: string;
  boothNumber: number;
  qrCodeURL: string;
}

export interface EventArtifact {
  link: string;
  linkDescription: string;
}

export interface Attendee {
  userId: number;
  name: string;
  phoneNumber: string;
  emailAddress: string;
  notificationStatus: string;
  digitatWallet: string;
  userType: string;
  boothNoCount: number;
}

export interface ArtistPortfolio {
  userId: number;
  name: string;
  personalBio?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  email: string;
  personalWebsite?: string;
  designerArtifacts?: any[];
  boothNumber: any;
}

export interface ArtistEventInfo {
  name: string;
  email: string;
  approvalStatus: string;
}

export interface AttendeesBooths {
  userId: number;
  name: string;
  email: string;
  digitalWallet: string;
  notificationStatus: string;
  boothsVisited: number[];
}

export interface QRCodeEdit {
  eventId: number;
  start: number;
  end: number;
}
