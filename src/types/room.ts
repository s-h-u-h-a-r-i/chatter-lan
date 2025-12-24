export interface RoomData {
  id: string;
  name: string;
  lastMessage: string | null;
  unreadCount: number;
  createdAt: Date;
}
