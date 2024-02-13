import { useState, forwardRef, useImperativeHandle, useEffect } from "react";

import styled from "styled-components";

import FullLogo from "../Logo/Full";
import CrossIcon from "../Icons/Cross";
import CogIcon from "../Icons/Cog";
import BackIcon from "../Icons/Back";

const drawerWidth = 450;
const topbarHeight = 48;

const DrawerContainer = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  right: ${({ open }) => (open ? "0" : `-${drawerWidth}px`)};
  height: 100%;
  width: ${drawerWidth}px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  transition: right 0.3s ease;
  z-index: 2147483647;
`;

const DrawerContent = styled.div`
  height: calc(100% - ${topbarHeight}px);
`;

const DrawerButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgb(205, 206, 206);
  background: white;
  color: rgb(76, 77, 77);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const GoBackButton = styled.div`
  display: flex;
  align-items: center;
  color: #111;
  font-weight: bold;
  cursor: pointer;

  > svg {
    width: 20px;
    height: 20px;
    margin-right: 5px;
  }
`;

const DrawerTopbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid rgb(205, 206, 206);
  background: rgb(247, 248, 248);
  height: ${topbarHeight}px;
`;

const DrawerTopbarButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

type RightDrawerProps = {
  children: any;
  onSettingsClick: () => void;
  onBackClick?: () => void;
};

export type RightDrawerMethods = {
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const RightDrawer = forwardRef(
  ({ children, onSettingsClick, onBackClick }: RightDrawerProps, ref) => {
    const [open, setOpen] = useState(false);

    const toggleDrawer = () => setOpen(!open);
    const openDrawer = () => setOpen(true);
    const closeDrawer = () => setOpen(false);

    useImperativeHandle(ref, () => ({
      toggleDrawer,
      openDrawer,
      closeDrawer,
    }));

    /**
     * Will move the page so the contents are visible and easier to copy
     */
    useEffect(() => {
      const currentPaddingRight = window.getComputedStyle(
        document.body
      ).paddingRight;

      if (open) {
        window.document.body.style.paddingRight = `${drawerWidth}px`;
      } else {
        window.document.body.style.paddingRight = currentPaddingRight;
      }

      return () => {
        window.document.body.style.paddingRight = currentPaddingRight;
      };
    }, [open]);

    return (
      <DrawerContainer open={open}>
        <DrawerTopbar>
          {onBackClick ? (
            <GoBackButton onClick={onBackClick}>
              <BackIcon /> Go Back
            </GoBackButton>
          ) : (
            <FullLogo width={140} />
          )}

          <DrawerTopbarButtons>
            {!onBackClick && (
              <DrawerButton onClick={onSettingsClick}>
                <CogIcon />
              </DrawerButton>
            )}

            <DrawerButton onClick={() => setOpen(false)}>
              <CrossIcon />
            </DrawerButton>
          </DrawerTopbarButtons>
        </DrawerTopbar>

        <DrawerContent>{children}</DrawerContent>
      </DrawerContainer>
    );
  }
);

export default RightDrawer;
