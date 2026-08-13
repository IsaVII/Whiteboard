import UserBadge from "../components/UserBadge";
import Canvas from "../components/whiteboard/Canvas";
import Toolbar from "../components/whiteboard/Toolbar.jsx";

const Whiteboard = () => {
  return (
    <>
      <UserBadge />
      <Toolbar />
      <Canvas />
    </>
  );
};

export default Whiteboard;
