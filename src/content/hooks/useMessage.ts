import { useEffect } from "react";

const useMessage = (onMessage: (msg: any) => Promise<void>, deps = []) => {
  useEffect(() => {
    const handler = async (msg: any) => {
      await onMessage(msg);

      return false;
    };

    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, deps);
};

export default useMessage;
