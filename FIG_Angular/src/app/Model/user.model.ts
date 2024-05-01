export interface User {
  userId: number;
  name: string;
  phoneNumber: string;
  emailAddress: string;
  password: string;
  token: string;
  tokenCreated: string;
  tokenExpires: string;
  refreshToken: string;
  refreshTokenExpires: string;
  resetCode: string;
  profilePhotoUrl: string;
  userEvent: {
    userEventId: number;
    notificationStatus: string;
    digitatWallet: string;
    personalBio: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    personalWebsite: string;
    twitter: string;
  };
}

export interface AccountUpdate {
  phoneNumber: string;
  password: string;
}
