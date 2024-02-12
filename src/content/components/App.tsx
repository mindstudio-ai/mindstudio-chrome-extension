import { useEffect, useRef } from "react";

import RightDrawer, { RightDrawerMethods } from "./RightDrawer";
import Listener from "./Listener";
import { ACTIONS } from "../../utils/action";

const App = () => {
  const drawerRef = useRef<RightDrawerMethods>(null);

  const onChoose = (text: string) => {
    if (drawerRef.current) {
      drawerRef.current.toggleDrawer();
      drawerRef.current.preloadMessage(text);
    }
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === ACTIONS.openDrawer) {
        if (drawerRef.current) {
          drawerRef.current.toggleDrawer();
        }
      }

      return true;
    });
  }, []);

  return (
    <>
      <RightDrawer ref={drawerRef} />
      {false && <Listener onChoose={onChoose} />}
    </>
  );
};

export default App;
