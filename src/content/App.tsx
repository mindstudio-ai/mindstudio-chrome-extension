import { useAtom } from "jotai";

import { drawerOpenAtom, messageAtom, viewAtom, aiIdxAtom } from "./atom";

import { ACTIONS, VIEWS } from "../utils/constants";

import useMessage from "./hooks/useMessage";

import RightDrawer from "./components/RightDrawer";
import Main from "./components/Views/Main";
import Settings from "./components/Views/Settings";
import Results from "./components/Views/Results";

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

    if (msg.action === ACTIONS.useSelection) {
      setOpen(true);
      setMessage(msg.selection);
      setAiIndex(msg.aiIndex);
      setView(VIEWS.main);
    }

    if (msg.action === ACTIONS.useUrl) {
      setOpen(true);
      setMessage(msg.url);
      setAiIndex(msg.aiIndex);
      setView(VIEWS.main);
    }

    if (msg.action === ACTIONS.submitSelection) {
      console.log(msg.selection);
    }

    if (msg.action === ACTIONS.submitUrl) {
      console.log(msg);
    }
  });

  return (
    <RightDrawer>
      {view === VIEWS.main && <Main />}
      {view === VIEWS.results && <Results />}
      {view === VIEWS.settings && <Settings />}
    </RightDrawer>
  );
};

export default App;
