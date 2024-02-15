import { useEffect } from "react";

const useMessage = (onMessage: (msg: any) => void, deps = []) => {
  useEffect(() => {
    const handler = (msg: any) => {
      onMessage(msg);

      return false;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, deps);
};

export default useMessage;
