import { useRoomsStore } from '@/lib/rooms';
import { Component } from 'solid-js';

export const ChatArea: Component = () => {
  const roomsStore = useRoomsStore();
  return <div>{roomsStore.rooms.length}</div>;
};
