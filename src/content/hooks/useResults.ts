import { mutate } from "swr";

import useSWRImmutable from "swr/immutable";

import { getLocalConfig } from "../../utils/config";

import { getAppData } from "../../utils/request";

type ThreadResult = {
  appId: string;
  appName: string;
  threadId: string;
  threadName: string;
  dateCreated: string;
  isInProgress: boolean;
};

/**
 * Load threads of all configured AIs, group and sort by dateCreated
 */
const fetchAndGroupThreads = async (): Promise<ThreadResult[]> => {
  const config = await getLocalConfig();

  const activeAis = config.ais.filter(({ apiKey, appId }) => apiKey && appId);

  if (activeAis.length === 0) {
    return [];
  }

  const results = await Promise.all(
    activeAis.map(({ appId, apiKey }) =>
      getAppData({
        appId: appId,
        apiKey: apiKey,
      })
    )
  );

  const threadResults: ThreadResult[] = results.flatMap((obj) => {
    return obj.threads.map((thread: any) => {
      let isInProgress = false;

      /**
       * If thread's name is missing, treat it as in progress
       */
      if (thread.name === "") {
        isInProgress = true;
      }

      return {
        appId: thread.appId,
        appName: obj.app.name,
        threadId: thread.id,
        threadName: thread.name,
        dateCreated: thread.dateCreated,
        isInProgress,
      };
    });
  });

  threadResults.sort((a, b) => {
    return (
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
  });

  return threadResults;
};

export const reloadResults = () => mutate("fetchThreads", fetchAndGroupThreads);

/**
 * Hook to get thread results
 */
const useResults = () => {
  const {
    data: threads,
    isLoading,
    isValidating,
    mutate: reloadThreads,
  } = useSWRImmutable("fetchThreads", fetchAndGroupThreads);

  return {
    threads,
    isLoading,
    isValidating,
    reloadThreads,
  };
};

export default useResults;
