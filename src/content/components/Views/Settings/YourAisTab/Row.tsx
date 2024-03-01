import { useState } from "react";
import styled from "styled-components";

import { AiType } from "../../../../../utils/config";

import CrossIcon from "../../../Icons/Cross";
import TextInput from "../../../Inputs/TextInput";

import Primary from "../../../Buttons/Primary";
import Secondary from "../../../Buttons/Secondary";

const AiRow = styled.div`
  padding: 20px;
  background: rgb(247, 248, 248);
  border-radius: 20px;
  margin-bottom: 30px;

  > input {
    margin-bottom: 15px;
  }
`;

const AiTop = styled.div`
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
  gap: 5px;
`;

type RowProps = {
  initData: AiType;
  onRemove: () => void;
  onSave: (newData: AiType) => void;
};

const areObjectsEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

const Row = ({ initData, onRemove, onSave }: RowProps) => {
  const [localData, setLocalData] = useState(initData);

  const onChange = (field: keyof AiType, value: string) => {
    setLocalData({
      ...localData,
      [field]: value,
    });
  };

  const hasChanged = areObjectsEqual(initData, localData) === false;

  return (
    <AiRow>
      <AiTop>
        <Title>{localData.name}</Title>

        <RemoveButton onClick={onRemove}>
          <CrossIcon />
        </RemoveButton>
      </AiTop>

      <TextInput
        value={localData.name}
        placeholder="Name"
        onChange={(e) => onChange("name", e.target.value)}
        fullWidth
      />

      <TextInput
        value={localData.appId}
        placeholder="APP ID"
        onChange={(e) => onChange("appId", e.target.value)}
        fullWidth
      />

      <TextInput
        value={localData.apiKey}
        placeholder="API Key"
        onChange={(e) => onChange("apiKey", e.target.value)}
        fullWidth
      />

      {hasChanged && (
        <Buttons>
          <Secondary rounded onClick={() => setLocalData(initData)}>
            Cancel
          </Secondary>

          <Primary rounded onClick={() => onSave(localData)}>
            Save
          </Primary>
        </Buttons>
      )}
    </AiRow>
  );
};

export default Row;
