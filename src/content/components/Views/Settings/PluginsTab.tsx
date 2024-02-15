import styled from "styled-components";

import Gmail from "../../Logo/Gmail";
import Youtube from "../../Logo/Youtube";

const Container = styled.div``;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
`;

const Main = styled.div`
  display: flex;
  align-items: center;
`;

const Logo = styled.div`
  flex-shrink: 0;
  margin-right: 10px;

  > svg {
    width: 25px;
    height: 25px;
  }
`;

const Title = styled.div``;

const Status = styled.div`
  background: #111;
  color: white;
  padding: 5px;
  border-radius: 7px;
  font-size: 12px;
`;

const PluginsTab = () => {
  return (
    <Container>
      <Row>
        <Main>
          <Logo>
            <Gmail />
          </Logo>

          <Title>Gmail</Title>
        </Main>

        <Status>Soon</Status>
      </Row>

      <Row>
        <Main>
          <Logo>
            <Youtube />
          </Logo>

          <Title>YouTube</Title>
        </Main>

        <Status>Soon</Status>
      </Row>
    </Container>
  );
};

export default PluginsTab;
