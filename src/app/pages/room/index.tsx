import { useParams } from "@solidjs/router";
import { Component } from "solid-js";

const Room: Component = () => {
  const params = useParams();
  return <p>{params.id}</p>;
};

export default Room;
