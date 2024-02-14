import { Ref, useState } from "react";
import styled from "styled-components";

import { topbarHeight } from "../../RightDrawer";
import Tabs, { tabsHeight } from "../../Tabs";
import RunTab, { RunTabMethods } from "./RunTab";

const Container = styled.div``;

const InnerContainer = styled.div`
  padding: 20px;

  display: flex;
  flex-direction: column;
  height: calc(100% - ${topbarHeight}px - ${tabsHeight}px);
`;

type MainProps = {
  runTabRef: Ref<RunTabMethods>;
};

enum TabType {
  "run" = "run",
  "results" = "results",
}

const Main = ({ runTabRef }: MainProps) => {
  const [tab, setTab] = useState<TabType>(TabType.run);

  return (
    <Container>
      <Tabs
        activeItem={tab}
        onClick={(tabId) => setTab(tabId as TabType)}
        items={[
          { id: TabType.run, label: "Run AI" },
          { id: TabType.results, label: "Results" },
        ]}
      />

      <InnerContainer>
        {tab === TabType.run && <RunTab ref={runTabRef} />}
      </InnerContainer>
    </Container>
  );
};

export default Main;
