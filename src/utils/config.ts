export const DEFAULT_VARIABLE = "message";

export type AiType = {
  name: string;
  appId: string;
  apiKey: string;
  variableName: string;
  workflow: string;
};

export type ConfigType = {
  ais: AiType[];
};

export const defaultConfig: ConfigType = {
  ais: [],
};

export const getLocalConfig = (): Promise<ConfigType> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(defaultConfig, (data) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data as ConfigType);
      }
    });
  });
};

export const setLocalConfig = (configData: ConfigType): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(configData, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};
