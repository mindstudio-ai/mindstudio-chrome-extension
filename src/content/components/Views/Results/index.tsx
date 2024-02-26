import styled from "styled-components";

import { topbarHeight } from "../../RightDrawer";

import Content from "./Content";

const Container = styled.div`
  height: 100%;
`;

const InnerContainer = styled.div`
  padding: 20px;
  height: calc(100% - ${topbarHeight}px);
`;

const Results = () => {
  return (
    <Container>
      <InnerContainer>
        <Content />
      </InnerContainer>
    </Container>
  );
};

export default Results;
