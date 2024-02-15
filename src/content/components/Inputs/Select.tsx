import styled, { css } from "styled-components";

const Select = styled.select<{ fullWidth?: boolean }>`
  padding: 13px 15px;
  box-sizing: border-box;
  border-radius: 10px;
  border: 1px solid rgb(204, 204, 204);
  cursor: pointer;
  outline: none;
  background-color: white;

  ${({ fullWidth }) =>
    fullWidth &&
    css`
      display: block;
      width: 100%;
    `}
`;

export default Select;
