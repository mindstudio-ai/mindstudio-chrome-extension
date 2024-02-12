import styled from "styled-components";

import useConfig from "../../utils/useConfig";

const Main = styled.section`
  background: white;
  width: 400px;
  padding: 20px;
`;

const Title = styled.h1``;

const AiRow = styled.div`
  border-bottom: 1px solid gray;
  margin-bottom: 30px;

  > input {
    margin-bottom: 15px;
    display: block;
    width: 100%;
  }

  > button {
    margin-bottom: 15px;
  }
`;

const Buttons = styled.div`
  margin-top: 20px;
`;

const AddButton = styled.button``;

const AiButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
`;

const RemoveButton = styled.button``;

const Placeholder = styled.div`
  background: #ededed;
  padding: 35px;
`;

const Input = styled.input`
  padding: 10px 10px;
  box-sizing: border-box;
`;

const Settings = () => {
  const { config, setConfig } = useConfig();

  const onRemove = (index: number) => {
    const newAis = [...config.ais];
    newAis.splice(index, 1);
    setConfig({ ...config, ais: newAis });
  };

  const onAdd = () => {
    setConfig({
      ...config,
      ais: [
        ...config.ais,
        {
          name: "",
          appId: "",
          apiKey: "",
        },
      ],
    });
  };

  const onChange = (index: number, field: string, value: string) => {
    const newAis = [...config.ais];
    newAis[index] = {
      ...newAis[index],
      [field]: value,
    };
    setConfig({ ...config, ais: newAis });
  };

  return (
    <Main>
      <Title>Your Mindstudio AIs</Title>

      {config.ais.length === 0 && <Placeholder>No AIs added</Placeholder>}

      {config.ais.map((ai, idx) => (
        <AiRow key={idx}>
          <Input
            value={ai.name}
            placeholder="Name"
            onChange={(e) => onChange(idx, "name", e.target.value)}
          />

          <Input
            value={ai.appId}
            placeholder="APP ID"
            onChange={(e) => onChange(idx, "appId", e.target.value)}
          />

          <Input
            value={ai.apiKey}
            placeholder="API Key"
            onChange={(e) => onChange(idx, "apiKey", e.target.value)}
          />

          <AiButtons>
            <RemoveButton onClick={() => onRemove(idx)}>Remove</RemoveButton>
          </AiButtons>
        </AiRow>
      ))}

      <Buttons>
        <AddButton
          onClick={() => {
            onAdd();
          }}
        >
          Add AI
        </AddButton>
      </Buttons>
    </Main>
  );
};
export default Settings;
