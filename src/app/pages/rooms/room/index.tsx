import { useParams } from '@solidjs/router';
import { Component, onMount } from 'solid-js';

import { useRoomsStore } from '@/store/rooms';

const Room: Component = () => {
  const params = useParams();
  const roomsStore = useRoomsStore();

  onMount(() => {
    roomsStore.selectedRoomId = params.id ?? null;
  });

  return (
    <div>
      <h3>
        {roomsStore.selectedRoom
          ? `Room: ${roomsStore.selectedRoom}`
          : 'Select Room'}
      </h3>
    </div>
  );
};

export default Room;
