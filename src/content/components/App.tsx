import { useRef } from "react";

import RightDrawer, { RightDrawerMethods } from "./RightDrawer";
import Listener from "./Listener";

const App = () => {
  const drawerRef = useRef<RightDrawerMethods>(null);

  const onChoose = (text: string) => {
    if (drawerRef.current) {
      drawerRef.current.toggleDrawer();
      drawerRef.current.preloadMessage(text);
    }
  };

  return (
    <>
      <RightDrawer ref={drawerRef} />
      <Listener onChoose={onChoose} />
    </>
  );
};

export default App;
