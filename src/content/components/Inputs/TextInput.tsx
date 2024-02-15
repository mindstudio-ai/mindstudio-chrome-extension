import styled, { css } from "styled-components";

const TextInput = styled.input<{ fullWidth?: boolean }>`
  padding: 13px 15px;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid #111;

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

export default TextInput;
