import { useAtom } from "jotai";
import styled from "styled-components";

import { tabAtom } from "../../../atom";

import { TABS } from "../../../../utils/constants";

import { topbarHeight } from "../../RightDrawer";
import Tabs, { tabsHeight } from "../../Tabs";
import RunTab from "./RunTab";
import ResultsTab from "./ResultsTab";

const Container = styled.div`
  height: 100%;
`;

const InnerContainer = styled.div`
  padding: 20px;
  height: calc(100% - ${topbarHeight}px - ${tabsHeight}px);
`;

const Main = () => {
  const [tab, setTab] = useAtom(tabAtom);

  return (
    <Container>
      <Tabs
        activeItem={tab}
        onClick={(tabId) => setTab(tabId as TABS)}
        items={[
          { id: TABS.run, label: "Run AI" },
          { id: TABS.results, label: "Results" },
        ]}
      />

      <InnerContainer>
        {tab === TABS.run && <RunTab />}
        {tab === TABS.results && <ResultsTab />}
      </InnerContainer>
    </Container>
  );
};

export default Main;
