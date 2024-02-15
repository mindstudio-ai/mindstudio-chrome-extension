import { useState } from "react";
import { useAtom } from "jotai";
import { useSWRConfig } from "swr";

import styled from "styled-components";

import useConfig from "../../../hooks/useConfig";
import { TABS, VIEWS } from "../../../../utils/constants";

import { messageAtom, aiIdxAtom, viewAtom, tabAtom } from "../../../atom";
import { runWorkflow } from "../../../../utils/request";

import Select from "../../Inputs/Select";
import TextArea from "../../Inputs/TextArea";
import Label from "../../Inputs/Label";
import Button from "../../Buttons/Primary";
import NotFound from "../../Placeholders/NotFound";

import { fetchAndGroupThreads } from "./ResultsTab";

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

  const { mutate } = useSWRConfig();

  const [chosenAiIdx, setChosenAiIdx] = useAtom(aiIdxAtom);
  const [message, setMessage] = useAtom(messageAtom);
  const [, setView] = useAtom(viewAtom);
  const [, setTab] = useAtom(tabAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    const chosenAi = config.ais[Number(chosenAiIdx || "0")];

    if (!chosenAi) {
      alert("Choose an AI");
      return;
    }

    setIsSubmitting(true);

    await runWorkflow({
      appId: chosenAi.appId,
      apiKey: chosenAi.apiKey,
      message,
    });

    setIsSubmitting(false);

    setTab(TABS.results);

    mutate("fetchThreads", fetchAndGroupThreads);
  };

  if (config.ais.length === 0) {
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
        {config.ais
          .filter(({ apiKey, appId }) => apiKey && appId)
          .map((ai, idx) => (
            <option
              selected={Number(chosenAiIdx) === idx}
              value={idx}
              key={idx}
            >
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
          onClick={() => onSubmit()}
        >
          {isSubmitting ? "Loading..." : "Submit"}
        </Button>
      </Footer>
    </Container>
  );
};

export default RunTab;
