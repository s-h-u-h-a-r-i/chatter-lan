export interface RoomData {
  id: string;
  name: string;
  createdAt: Date;
  salt: string; // * base64-encoded
}
