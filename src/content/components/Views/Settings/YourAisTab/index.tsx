import styled from "styled-components";

import useConfig from "../../../../hooks/useConfig";
import { AiType } from "../../../../../utils/config";

import Plus from "../../../Icons/Plus";

import Secondary from "../../../Buttons/Secondary";

import NotFound from "../../../Placeholders/NotFound";

import Row from "./Row";

const Container = styled.section``;

const Buttons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 15px;
  padding-bottom: 30px;
`;

const AddButton = styled(Secondary)`
  background: rgb(247, 248, 248);
  display: flex;
  align-items: center;
  justify-content: center;

  > svg {
    width: 17px;
    height: 17px;
    margin-right: 4px;
  }
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

  const onChange = (index: number, newData: AiType) => {
    const newAis = [...config.ais];

    newAis[index] = newData;

    setConfig({ ...config, ais: newAis });
  };

  return (
    <Container>
      {config.ais.length === 0 && <NotFound>No AIs added</NotFound>}

      {config.ais.map((ai, idx) => (
        <Row
          key={idx}
          initData={ai}
          onRemove={() => onRemove(idx)}
          onSave={(newData) => onChange(idx, newData)}
        />
      ))}

      <Buttons>
        <AddButton fullWidth rounded onClick={() => onAdd()}>
          <Plus /> Add New AI
        </AddButton>
      </Buttons>
    </Container>
  );
};
export default YourAisTab;
