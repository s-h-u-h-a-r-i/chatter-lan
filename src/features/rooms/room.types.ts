export interface RoomData {
  id: string;
  name: string;
  createdAt: Date;
  salt: string; // * base64-encoded
  verificationToken: string; // * base64-encoded
  verificationIV: string; // * base64-encoded
}
