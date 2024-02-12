import { useRef, useState } from "react";

import { ACTIONS } from "../utils/action";

import useMessage from "./hooks/useMessage";

import RightDrawer, { RightDrawerMethods } from "./components/RightDrawer";

enum VIEWS {
  "main" = "main",
  "settings" = "settings",
}

const App = () => {
  const drawerRef = useRef<RightDrawerMethods>(null);

  const [view, setView] = useState<VIEWS>(VIEWS.main);

  /**
   * Listen for messages
   */
  useMessage((msg) => {
    if (msg.action === ACTIONS.openDrawer && drawerRef.current) {
      drawerRef.current.toggleDrawer();
    }
  });

  return (
    <>
      <RightDrawer ref={drawerRef}>
        <h1>Hello world</h1>
      </RightDrawer>
    </>
  );
};

export default App;
