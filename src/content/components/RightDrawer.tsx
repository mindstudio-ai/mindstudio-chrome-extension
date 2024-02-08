import React, { useState, forwardRef, useImperativeHandle } from "react";

import styled from "styled-components";

import Logo from "../../components/Logo";
import useConfig from "../../utils/useConfig";

import { runWorkflow, getThreadData, delay } from "../../utils/request";

const drawerWidth = 400;

const DrawerButton = styled.button`
  all: initial;

  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  right: 10px;
  color: #111;
  cursor: pointer;
`;

const DrawerContainer = styled.div<{ open: boolean }>`
  all: initial;

  position: fixed;
  top: 0;
  right: ${({ open }) => (open ? "0" : `-${drawerWidth}px`)};
  height: 100%;
  width: ${drawerWidth}px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease;
  z-index: 999;
`;

const DrawerContent = styled.div`
  all: initial;

  padding: 20px;
`;

const Buttons = styled.div`
  all: initial;

  display: block;
  margin: 0px 20px 20px 20px;
`;

const Main = styled.div`
  all: initial;

  display: block;
  margin: 0px 20px 20px 20px;
`;

const DrawerCloseButton = styled.button`
  all: initial;

  background: gray;
  color: white;
  padding: 5px;
  cursor: pointer;
  border-radius: 5px;
`;

const Title = styled.h1`
  all: initial;

  font-size: 1.5em;
  display: block;
  font-weight: bold;

  margin-bottom: 15px;
`;

const Select = styled.select`
  all: initial;

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
  all: initial;

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

const SubmitButton = styled.button`
  all: initial;

  background: black;
  color: white;
  padding: 5px;
  cursor: pointer;
  border-radius: 5px;
`;

const ResponseDiv = styled.div`
  all: initial;

  display: block;
  margin: 20px 0px;
  box-sizing: border-box;
`;

export type RightDrawerMethods = {
  toggleDrawer: () => void;
  preloadMessage: (value: string) => void;
};

const RightDrawer = forwardRef((props, ref) => {
  const { config } = useConfig();

  const [open, setOpen] = useState(false);
  const [chosenAiIdx, setChosenAiIdx] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const [status, setStatus] = useState("");

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const preloadMessage = (value: string) => setMessage(value);

  useImperativeHandle(ref, () => ({
    toggleDrawer,
    preloadMessage,
  }));

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

    setResponse("");

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
        setResponse(threadResponse.chatMessage.content);
      }
    } catch (e) {}
  };

  return (
    <>
      <DrawerButton onClick={toggleDrawer}>
        <Logo width={30} />
      </DrawerButton>

      <DrawerContainer open={open}>
        <DrawerContent>
          <Buttons>
            <DrawerCloseButton onClick={() => setOpen(false)}>
              Close
            </DrawerCloseButton>
          </Buttons>

          <Main>
            <Title>Run AI Workflow</Title>

            <Select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                if (e.target.value === "") {
                  setChosenAiIdx(null);
                } else {
                  setChosenAiIdx(Number(e.target.value));
                }
              }}
            >
              <option value="">Choose AI</option>

              {config.ais.map((ai, idx) => (
                <option selected={chosenAiIdx === idx} value={idx} key={idx}>
                  {ai.name}
                </option>
              ))}
            </Select>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Input"
              rows={12}
            />

            <SubmitButton onClick={() => onSubmit()}>Submit</SubmitButton>
            <span>{status}</span>

            {response && <ResponseDiv>{response}</ResponseDiv>}
          </Main>
        </DrawerContent>
      </DrawerContainer>
    </>
  );
});

export default RightDrawer;
