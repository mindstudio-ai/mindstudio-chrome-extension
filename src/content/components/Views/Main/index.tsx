import styled from "styled-components";

const Container = styled.div`
  display: block;
  margin: 0px 20px 20px 20px;
`;

const Title = styled.h1`
  font-size: 1.5em;
  display: block;
  font-weight: bold;

  margin-bottom: 15px;
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
`;

const SubmitButton = styled.button`
  background: black;
  color: white;
  padding: 5px;
  cursor: pointer;
  border-radius: 5px;
`;

const ResponseDiv = styled.div`
  display: block;
  margin: 20px 0px;
  box-sizing: border-box;
`;

const Main = () => {
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
    <Container>
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
    </Container>
  );
};

export default Main;
