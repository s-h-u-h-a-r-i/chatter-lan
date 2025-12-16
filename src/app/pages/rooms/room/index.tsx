import { useParams } from '@solidjs/router';
import { Component } from 'solid-js';

const Room: Component = () => {
  const params = useParams();

  return (
    <div>
      <h3>{params.id ? `Room: ${params.id}` : 'Select Room'}</h3>
    </div>
  );
};

export default Room;
