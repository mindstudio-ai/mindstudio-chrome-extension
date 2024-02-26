import { useAtom } from "jotai";

import {
  drawerOpenAtom,
  messageAtom,
  viewAtom,
  aiIdxAtom,
  tabAtom,
} from "./atom";

import { ACTIONS, TABS, VIEWS } from "../utils/constants";

import useMessage from "./hooks/useMessage";

import RightDrawer from "./components/RightDrawer";
import Main from "./components/Views/Main";
import Settings from "./components/Views/Settings";

const App = () => {
  const [, setOpen] = useAtom(drawerOpenAtom);
  const [, setMessage] = useAtom(messageAtom);
  const [, setAiIndex] = useAtom(aiIdxAtom);
  const [view, setView] = useAtom(viewAtom);
  const [, setTab] = useAtom(tabAtom);

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
      setView(VIEWS.main);
      setTab(TABS.run);
    }

    if (msg.action === ACTIONS.loadHtmlSource) {
      console.log(msg);
    }

    if (msg.action === ACTIONS.loadYouTubeCaptions) {
      console.log(msg);
    }

    if (msg.action === ACTIONS.loadGmailEmail) {
      console.log(msg);
    }
  });

  return (
    <RightDrawer
      showLogo={view === VIEWS.main}
      showSettings={view === VIEWS.main}
      showBack={view !== VIEWS.main}
      onSettingsClick={() => {
        setView(VIEWS.settings);
        setTab(TABS.yourAis);
      }}
      onBackClick={() => {
        if (view === VIEWS.settings) {
          setView(VIEWS.main);
          setTab(TABS.run);
        }
      }}
      goBackLabel={(() => {
        if (view === VIEWS.settings) {
          return "Settings";
        }

        return "Go Back";
      })()}
    >
      {view === VIEWS.main && <Main />}
      {view === VIEWS.settings && <Settings />}
    </RightDrawer>
  );
};

export default App;
