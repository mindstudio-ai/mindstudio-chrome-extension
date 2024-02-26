import styled from "styled-components";
import { useAtom } from "jotai";

import { iframeSrcAtom, isSubmittingAtom } from "../../../atom";

const Container = styled.div`
  height: 100%;
  overflow: hidden;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
`;

const SubmittingPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgb(247, 248, 248);
  font-style: italic;
  font-size: 12px;
`;

const ResultView = () => {
  const [isSubmitting] = useAtom(isSubmittingAtom);

  const [iframeSrc] = useAtom(iframeSrcAtom);

  return (
    <Container>
      {isSubmitting ? (
        <SubmittingPage>Submitting...</SubmittingPage>
      ) : (
        <Iframe src={iframeSrc} />
      )}
    </Container>
  );
};

export default ResultView;
