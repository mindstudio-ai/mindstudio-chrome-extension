import { useEffect, useState } from "react";

import {
  ConfigType,
  defaultConfig,
  setLocalConfig,
  getLocalConfig,
} from "./config";

const useConfig = () => {
  const [config, setConfig] = useState<ConfigType>(defaultConfig);

  useEffect(() => {
    const init = async () => {
      const data = await getLocalConfig();
      setConfig(data);
    };

    init();
  }, []);

  const saveConfig = async (newConfig: ConfigType) => {
    setConfig(newConfig); // reload local config
    await setLocalConfig(newConfig); // save config
  };

  return { config, setConfig: saveConfig };
};

export default useConfig;
