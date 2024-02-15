import styled, { css } from "styled-components";

const TextArea = styled.textarea<{ fullWidth?: boolean }>`
  padding: 13px 15px;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid rgb(204, 204, 204);

  &:focus {
    outline: none;
  }

  ${({ fullWidth }) =>
    fullWidth &&
    css`
      display: block;
      width: 100%;
    `}
`;

export default TextArea;
