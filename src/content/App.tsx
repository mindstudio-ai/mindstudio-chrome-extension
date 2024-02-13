import { useRef, useState } from "react";

import { ACTIONS } from "../utils/action";

import useMessage from "./hooks/useMessage";

import RightDrawer, { RightDrawerMethods } from "./components/RightDrawer";

import Main from "./components/Views/Main";
import Settings from "./components/Views/Settings";

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
    <RightDrawer
      ref={drawerRef}
      showLogo={view === VIEWS.main}
      showSettings={view === VIEWS.main}
      showBack={view !== VIEWS.main}
      onSettingsClick={() => setView(VIEWS.settings)}
      onBackClick={() => {
        if (view === VIEWS.settings) {
          setView(VIEWS.main);
        }
      }}
    >
      {view === VIEWS.main && <Main />}
      {view === VIEWS.settings && <Settings />}
    </RightDrawer>
  );
};

export default App;
