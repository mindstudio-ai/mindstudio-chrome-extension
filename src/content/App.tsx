import { useAtom } from "jotai";

import {
  drawerOpenAtom,
  messageAtom,
  viewAtom,
  aiIdxAtom,
  prevViewAtom,
  iframeSrcAtom,
} from "./atom";

import { ACTIONS, VIEWS } from "../utils/constants";

import useMessage from "./hooks/useMessage";
import useSubmit, { SubmitResult } from "./hooks/useSubmit";
import { reloadResults } from "./hooks/useResults";

import RightDrawer from "./components/RightDrawer";
import Main from "./components/Views/Main";
import Settings from "./components/Views/Settings";
import Results from "./components/Views/Results";
import ResultView from "./components/Views/ResultView";
import { getIframeSrcUrl } from "../utils/request";

const App = () => {
  const { submit } = useSubmit();

  const [, setOpen] = useAtom(drawerOpenAtom);
  const [, setMessage] = useAtom(messageAtom);
  const [, setAiIndex] = useAtom(aiIdxAtom);
  const [view, setView] = useAtom(viewAtom);
  const [, setPrevView] = useAtom(prevViewAtom);
  const [, setIframeSrc] = useAtom(iframeSrcAtom);

  /**
   * Listen for messages
   */
  useMessage(async (msg) => {
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

    /**
     * Submit from context menu
     */
    let submitResult: SubmitResult | null = null;

    if (msg.action === ACTIONS.submitSelection) {
      setOpen(true);
      setPrevView(VIEWS.main);
      setView(VIEWS.singleResult);
      submitResult = await submit(Number(msg.aiIndex), msg.selection);
    }

    if (msg.action === ACTIONS.submitUrl) {
      setOpen(true);
      setPrevView(VIEWS.main);
      setView(VIEWS.singleResult);
      submitResult = await submit(Number(msg.aiIndex), msg.url);
    }

    if (submitResult) {
      const { threadId, appId } = submitResult;
      setIframeSrc(getIframeSrcUrl(appId, threadId));

      /**
       * Wait for the threed's name generation
       */
      setTimeout(() => {
        reloadResults();
      }, 700);
    }
  });

  return (
    <RightDrawer>
      {view === VIEWS.main && <Main />}
      {view === VIEWS.results && <Results />}
      {view === VIEWS.settings && <Settings />}
      {view === VIEWS.singleResult && <ResultView />}
    </RightDrawer>
  );
};

export default App;
