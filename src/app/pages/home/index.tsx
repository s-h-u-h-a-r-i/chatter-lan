import { useLocation } from "@solidjs/router";
import { Component } from "solid-js";

const Home: Component = () => {
  const location = useLocation();

  return <div>{location.pathname}</div>;
};

export default Home;
