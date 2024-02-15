import { useAtom } from "jotai";

import { drawerOpenAtom, messageAtom, viewAtom, aiIdxAtom } from "./atom";

import { ACTIONS, VIEWS } from "../utils/constants";

import useMessage from "./hooks/useMessage";

import RightDrawer from "./components/RightDrawer";
import Main from "./components/Views/Main";
import Settings from "./components/Views/Settings";
import GmailPlugin from "./components/Plugins/Gmail";
import YouTubePlugin from "./components/Plugins/YouTube";

const App = () => {
  const [, setOpen] = useAtom(drawerOpenAtom);
  const [, setMessage] = useAtom(messageAtom);
  const [, setAiIndex] = useAtom(aiIdxAtom);
  const [view, setView] = useAtom(viewAtom);

  /**
   * Listen for messages
   */
  useMessage((msg) => {
    if (msg.action === ACTIONS.openDrawer) {
      setOpen(true);
    }

    if (msg.action === ACTIONS.loadSelection) {
      setOpen(true);
      setMessage(msg.selection);
      setAiIndex(msg.aiIndex);
    }
  });

  return (
    <>
      <RightDrawer
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

      <GmailPlugin />
      <YouTubePlugin />
    </>
  );
};

export default App;
