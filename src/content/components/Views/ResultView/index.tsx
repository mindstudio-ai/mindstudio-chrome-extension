import styled from "styled-components";
import { useAtom } from "jotai";

import { iframeSrcAtom } from "../../../atom";

const Container = styled.div`
  height: 100%;
  overflow: hidden;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
`;

const ResultView = () => {
  const [iframeSrc] = useAtom(iframeSrcAtom);

  return (
    <Container>
      <Iframe src={iframeSrc} />
    </Container>
  );
};

export default ResultView;
