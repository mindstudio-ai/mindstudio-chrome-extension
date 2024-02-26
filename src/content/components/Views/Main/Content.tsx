import { useAtom } from "jotai";

import styled from "styled-components";

import useConfig from "../../../hooks/useConfig";
import useResults from "../../../hooks/useResults";
import { TABS, VIEWS } from "../../../../utils/constants";

import { getIframeSrcUrl } from "../../../../utils/request";

import {
  messageAtom,
  aiIdxAtom,
  viewAtom,
  tabAtom,
  iframeSrcAtom,
} from "../../../atom";
import useSubmit from "../../../hooks/useSubmit";

import Select from "../../Inputs/Select";
import TextArea from "../../Inputs/TextArea";
import Label from "../../Inputs/Label";
import Button from "../../Buttons/Primary";
import NotFound from "../../Placeholders/NotFound";

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledSelect = styled(Select)`
  margin-bottom: 15px;
`;

const StyledTextarea = styled(TextArea)`
  flex-grow: 1;
  margin-bottom: 15px;
`;

const Footer = styled.div``;

const RunTab = () => {
  const { config } = useConfig();

  const { reloadThreads } = useResults();
  const { submit, isSubmitting } = useSubmit();

  const [chosenAiIdx, setChosenAiIdx] = useAtom(aiIdxAtom);
  const [message, setMessage] = useAtom(messageAtom);
  const [, setView] = useAtom(viewAtom);
  const [, setTab] = useAtom(tabAtom);
  const [, setIframeSrc] = useAtom(iframeSrcAtom);

  const activeAis = config.ais.filter(({ apiKey, appId }) => apiKey && appId);

  const onSubmitClick = async () => {
    const aiIndex = Number(chosenAiIdx || "0");

    const submitResult = await submit(aiIndex, message);

    if (!submitResult) {
      return;
    }

    const { threadId, appId } = submitResult;

    setView(VIEWS.singleResult);
    setIframeSrc(getIframeSrcUrl(appId, threadId));

    setTimeout(() => {
      reloadThreads();
    }, 1500);
  };

  if (activeAis.length === 0) {
    return (
      <Container>
        <NotFound>
          No AIs added. Go to{" "}
          <a
            onClick={() => {
              setView(VIEWS.settings);
              setTab(TABS.yourAis);
            }}
          >
            Settings
          </a>{" "}
          and add an AI
        </NotFound>
      </Container>
    );
  }

  return (
    <Container>
      <Label>Choose AI</Label>

      <StyledSelect
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setChosenAiIdx(e.target.value)
        }
      >
        {activeAis.map((ai, idx) => (
          <option selected={Number(chosenAiIdx) === idx} value={idx} key={idx}>
            {ai.name}
          </option>
        ))}
      </StyledSelect>

      <Label>Message</Label>

      <StyledTextarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        rows={12}
      />

      <Footer>
        <Button
          fullWidth
          rounded
          disabled={isSubmitting}
          onClick={onSubmitClick}
        >
          {isSubmitting ? "Loading..." : "Submit"}
        </Button>
      </Footer>
    </Container>
  );
};

export default RunTab;
