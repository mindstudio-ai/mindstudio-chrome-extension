import { useEffect } from "react";
import { useAtom } from "jotai";

import { configAtom } from "../atom";

import { ConfigType, setLocalConfig, getLocalConfig } from "../../utils/config";

const useConfig = () => {
  const [config, setConfig] = useAtom(configAtom);

  useEffect(() => {
    const init = async () => {
      const data = await getLocalConfig();
      setConfig(data);
    };

    init();
  }, []);

  const saveConfig = async (newConfig: ConfigType) => {
    setConfig(newConfig); // reload global state config
    await setLocalConfig(newConfig); // save config in chrome
  };

  return { config, setConfig: saveConfig };
};

export default useConfig;
