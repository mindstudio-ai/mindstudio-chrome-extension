import styled from "styled-components";

import useConfig from "../../../hooks/useConfig";

import { runWorkflow, delay, getThreadData } from "../../../../utils/request";

import { useState } from "react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;

  height: calc(100% - 48px); // TEMPORARY FOR THE DEMO
`;

const Select = styled.select`
  font-size: 16px;
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 8px;
  margin: 4px 0;
  width: 100%;
  text-align: left;
  outline: none;
  cursor: pointer;
  border-radius: 4px;
  box-sizing: border-box;

  margin-bottom: 15px;
`;

const Textarea = styled.textarea`
  font-size: 16px;
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 8px;
  margin: 4px 0;
  width: 100%;
  text-align: left;
  outline: none;
  cursor: pointer;
  border-radius: 4px;
  box-sizing: border-box;

  margin-bottom: 15px;

  flex-grow: 1;
`;

const SubmitButton = styled.button`
  background: black;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  width: 100%;
  padding: 10px;
  border: unset;
`;

const StatusLabel = styled.div`
  margin: 5px 0px;
`;

type MainProps = {
  onResponse: (content: string) => void;
};

const Main = ({ onResponse }: MainProps) => {
  const { config } = useConfig();

  const [chosenAiIdx, setChosenAiIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (chosenAiIdx === null) {
      alert("Choose AI");
      return;
    }

    const chosenAi = config.ais[chosenAiIdx];

    if (!chosenAi) {
      alert("Ai not found");
      return;
    }

    setIsSubmitting(true);

    setStatus("Running workflow...");

    const threadId = await runWorkflow({
      appId: chosenAi.appId,
      apiKey: chosenAi.apiKey,
      message,
    });

    setStatus("Waiting 20 seconds...");

    await delay(20000);

    const data = await getThreadData({
      appId: chosenAi.appId,
      apiKey: chosenAi.apiKey,
      threadId,
    });

    setStatus("Done");

    try {
      const threadResponse = data.posts.find(
        (p: any) => p.chatMessage.source === "system"
      );

      if (threadResponse && threadResponse.chatMessage.isInProgress === false) {
        onResponse(threadResponse.chatMessage.content);
      }
    } catch (e) {
      setStatus("Unknown error");
    }

    setIsSubmitting(false);
  };

  return (
    <Container>
      <label>Choose AI</label>

      <Select
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          if (e.target.value === "") {
            setChosenAiIdx(null);
          } else {
            setChosenAiIdx(Number(e.target.value));
          }
        }}
      >
        {config.ais.map((ai, idx) => (
          <option selected={chosenAiIdx === idx} value={idx} key={idx}>
            {ai.name}
          </option>
        ))}
      </Select>

      <label>Message</label>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        rows={12}
      />

      <SubmitButton disabled={isSubmitting} onClick={() => onSubmit()}>
        Submit
      </SubmitButton>

      <StatusLabel>{status}</StatusLabel>
    </Container>
  );
};

export default Main;
