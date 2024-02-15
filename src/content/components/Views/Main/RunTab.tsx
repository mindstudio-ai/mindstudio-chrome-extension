import { useState } from "react";
import { useAtom } from "jotai";

import styled from "styled-components";

import useConfig from "../../../hooks/useConfig";

import { messageAtom, aiIdxAtom } from "../../../atom";
import { runWorkflow } from "../../../../utils/request";

import Select from "../../Inputs/Select";
import TextArea from "../../Inputs/TextArea";
import Label from "../../Inputs/Label";
import Button from "../../Buttons/Primary";

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

  const [chosenAiIdx, setChosenAiIdx] = useAtom(aiIdxAtom);
  const [message, setMessage] = useAtom(messageAtom);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!chosenAiIdx) {
      alert("Choose AI");
      return;
    }

    const chosenAi = config.ais[Number(chosenAiIdx)];

    if (!chosenAi) {
      alert("Ai not found");
      return;
    }

    setIsSubmitting(true);

    await runWorkflow({
      appId: chosenAi.appId,
      apiKey: chosenAi.apiKey,
      message,
    });

    setIsSubmitting(false);
  };

  return (
    <Container>
      <Label>Choose AI</Label>

      <StyledSelect
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setChosenAiIdx(e.target.value)
        }
      >
        {config.ais.map((ai, idx) => (
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
          onClick={() => onSubmit()}
        >
          Submit
        </Button>
      </Footer>
    </Container>
  );
};

export default RunTab;
