import { useEffect } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { drawerOpenAtom } from "../../atom";

import FullLogo from "../Logo/Full";
import CrossIcon from "../Icons/Cross";
import CogIcon from "../Icons/Cog";
import BackIcon from "../Icons/Back";

const drawerWidth = 450;
export const topbarHeight = 48;

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
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  background-color: white;
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
    margin-right: 8px;
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

type RightDrawerProps = {
  children: any;
  onSettingsClick?: () => void;
  onBackClick?: () => void;
  showLogo?: boolean;
  showSettings?: boolean;
  showBack?: boolean;
  goBackLabel?: string;
};

const RightDrawer = ({
  children,
  onSettingsClick,
  onBackClick,
  showLogo = false,
  showSettings = false,
  showBack = false,
  goBackLabel = "Go Back",
}: RightDrawerProps) => {
  const [open, setOpen] = useAtom(drawerOpenAtom);

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
        {showBack ? (
          <GoBackButton onClick={onBackClick}>
            <BackIcon /> {goBackLabel}
          </GoBackButton>
        ) : (
          <DrawerButton onClick={() => setOpen(false)}>
            <CrossIcon />
          </DrawerButton>
        )}

        {showLogo ? <FullLogo width={120} /> : <div />}

        {showSettings ? (
          <DrawerButton onClick={onSettingsClick}>
            <CogIcon />
          </DrawerButton>
        ) : (
          <div />
        )}
      </DrawerTopbar>

      <DrawerContent>{children}</DrawerContent>
    </DrawerContainer>
  );
};

export default RightDrawer;
