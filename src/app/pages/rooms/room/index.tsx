import { useParams } from '@solidjs/router';
import { Component } from 'solid-js';

const Room: Component = () => {
  const params = useParams();
  return <>{params.id ?? 'Select a Room'}</>;
};

export default Room;
