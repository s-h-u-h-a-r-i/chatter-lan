import { useRoomsStore } from '@/store/rooms';
import { useParams } from '@solidjs/router';
import { Component, onMount } from 'solid-js';

const Room: Component = () => {
  const params = useParams();
  const roomsStore = useRoomsStore();

  onMount(() => {
    roomsStore.selectedRoomId = params.id ?? null;
  });

  return (
    <div>
      <h3>{params.id ? `Room: ${roomsStore.selectedRoom}` : 'Select Room'}</h3>
    </div>
  );
};

export default Room;
