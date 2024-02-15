import styled, { css } from "styled-components";

const Button = styled.button<{ fullWidth?: boolean; rounded?: boolean }>`
  background: black;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  padding: 10px 15px;
  border: unset;

  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}

  ${({ rounded }) =>
    rounded &&
    css`
      border-radius: 30px;
    `}
`;

export default Button;
