import { useEffect } from "react";

const useMessage = (onMessage: (msg: any) => void) => {
  useEffect(() => {
    const handler = (msg: any) => {
      onMessage(msg);

      return true;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, []);
};

export default useMessage;
