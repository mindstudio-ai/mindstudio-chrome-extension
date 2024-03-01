type RunWorkFlowProps = {
  appId: string;
  apiKey: string;
  message: string;
  variableName: string;
  workflow?: string;
};

export const runWorkflow = async ({
  appId,
  message,
  variableName,
  workflow,
  apiKey,
}: RunWorkFlowProps): Promise<string> => {
  const response = await fetch("https://api.youai.ai/developer/v1/apps/run", {
    method: "POST",
    body: JSON.stringify({
      appId,
      variables: {
        [variableName]: message,
      },
      workflow,
    }),
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();

  return data.threadId;
};

type GetThreadDataProps = {
  appId: string;
  apiKey: string;
  threadId: string;
};

export const getThreadData = async ({
  appId,
  apiKey,
  threadId,
}: GetThreadDataProps): Promise<any> => {
  const response = await fetch(
    "https://api.youai.ai/developer/v1/apps/load-thread",
    {
      method: "POST",
      body: JSON.stringify({
        appId,
        threadId,
      }),
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();

  return data.thread;
};

export const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

type GetAppDataProps = {
  appId: string;
  apiKey: string;
};

export const getAppData = async ({ appId, apiKey }: GetAppDataProps) => {
  const response = await fetch(
    "https://api.youai.ai/developer/v1/apps/load?appId=" + appId,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();

  return data;
};

export const getIframeSrcUrl = (appId: string, threadId: string) =>
  `https://youai.ai/ais/${appId}/use?initialThreadId=${threadId}&__displayContext=embedded`;
