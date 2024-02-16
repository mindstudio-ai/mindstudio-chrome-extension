import styled from "styled-components";

import useConfig from "../../../hooks/useConfig";

import Primary from "../../Buttons/Primary";
import TextInput from "../../Inputs/TextInput";
import CrossIcon from "../../Icons/Cross";
import NotFound from "../../Placeholders/NotFound";

const Container = styled.section``;

const AiRow = styled.div`
  padding: 20px;
  background: rgb(247, 248, 248);
  border-radius: 20px;
  margin-bottom: 30px;

  > input {
    margin-bottom: 15px;
  }
`;

const AiButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-between;
  margin-bottom: 15px;
`;

const RemoveButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  width: 20px;
  height: 20px;
`;

const Title = styled.h4`
  margin: 0;
  padding: 0;
  flex-grow: 1;
`;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 15px;
  padding-bottom: 30px;
`;

const YourAisTab = () => {
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
    <Container>
      {config.ais.length === 0 && <NotFound>No AIs added</NotFound>}

      {config.ais.map((ai, idx) => (
        <AiRow key={idx}>
          <AiButtons>
            <Title>{ai.name}</Title>

            <RemoveButton onClick={() => onRemove(idx)}>
              <CrossIcon />
            </RemoveButton>
          </AiButtons>

          <TextInput
            value={ai.name}
            placeholder="Name"
            onChange={(e) => onChange(idx, "name", e.target.value)}
            fullWidth
          />

          <TextInput
            value={ai.appId}
            placeholder="APP ID"
            onChange={(e) => onChange(idx, "appId", e.target.value)}
            fullWidth
          />

          <TextInput
            value={ai.apiKey}
            placeholder="API Key"
            onChange={(e) => onChange(idx, "apiKey", e.target.value)}
            fullWidth
          />
        </AiRow>
      ))}

      <Buttons>
        <Primary rounded onClick={() => onAdd()}>
          +
        </Primary>
      </Buttons>
    </Container>
  );
};
export default YourAisTab;
