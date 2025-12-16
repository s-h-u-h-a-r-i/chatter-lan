import { ParentComponent } from 'solid-js';

const Rooms: ParentComponent = (props) => {
  return (
    <div>
      <h1>Parent</h1>
      {props.children}
    </div>
  );
};

export default Rooms;
