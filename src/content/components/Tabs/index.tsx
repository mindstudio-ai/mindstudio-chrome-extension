import styled, { css } from "styled-components";

export const tabsHeight = 48;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Item = styled.div<{ isActive?: boolean }>`
  flex-grow: 1;
  height: ${tabsHeight}px;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  border-right: 1px solid rgb(205, 206, 206);
  border-bottom: 1px solid rgb(205, 206, 206);
  background: rgb(247, 248, 248);

  &:last-child {
    border-right: unset;
  }

  ${({ isActive }) =>
    isActive &&
    css`
      border-bottom: unset;
      background: white;
    `}
`;

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  onClick: (tabId: string) => void;
  activeItem?: string;
};

const Tabs = ({ items, activeItem, onClick }: TabsProps) => {
  return (
    <Container>
      {items.map(({ id, label }) => (
        <Item key={id} isActive={activeItem === id} onClick={() => onClick(id)}>
          {label}
        </Item>
      ))}
    </Container>
  );
};

export default Tabs;
