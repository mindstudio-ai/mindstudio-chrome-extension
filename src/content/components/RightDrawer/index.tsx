import { useState, forwardRef, useImperativeHandle } from "react";

import styled from "styled-components";

import Logo from "../Logo";

const drawerWidth = 400;

const DrawerButton = styled.button`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  right: 10px;
  color: #111;
  cursor: pointer;
`;

const DrawerContainer = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  right: ${({ open }) => (open ? "0" : `-${drawerWidth}px`)};
  height: 100%;
  width: ${drawerWidth}px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease;
  z-index: 999;
`;

const DrawerContent = styled.div`
  padding: 20px;
`;

const Buttons = styled.div`
  display: block;
  margin: 0px 20px 20px 20px;
`;

const DrawerCloseButton = styled.button`
  background: gray;
  color: white;
  padding: 5px;
  cursor: pointer;
  border-radius: 5px;
`;

type RightDrawerProps = {
  children: any;
};

export type RightDrawerMethods = {
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const RightDrawer = forwardRef(({ children }: RightDrawerProps, ref) => {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen(!open);
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  useImperativeHandle(ref, () => ({
    toggleDrawer,
    openDrawer,
    closeDrawer,
  }));

  return (
    <>
      <DrawerButton onClick={toggleDrawer}>
        <Logo width={30} />
      </DrawerButton>

      <DrawerContainer open={open}>
        <DrawerContent>
          <Buttons>
            <DrawerCloseButton onClick={() => setOpen(false)}>
              Close
            </DrawerCloseButton>
          </Buttons>

          {children}
        </DrawerContent>
      </DrawerContainer>
    </>
  );
});

export default RightDrawer;
