import { useAtom } from "jotai";
import styled from "styled-components";
import useSWRImmutable from "swr/immutable";

import { viewAtom, tabAtom } from "../../../atom";

import useConfig from "../../../hooks/useConfig";
import { TABS, VIEWS } from "../../../../utils/constants";

import { getAppData } from "../../../../utils/request";
import { getLocalConfig } from "../../../../utils/config";

import NotFound from "../../Placeholders/NotFound";
import LinkIcon from "../../Icons/Link";

const Container = styled.div`
  padding-bottom: 30px;
`;

const Link = styled.a`
  padding: 20px;
  background: rgb(247, 248, 248);
  border-radius: 20px;
  margin-bottom: 15px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  color: #111;
  text-decoration: unset;

  > svg {
    width: 25px;
    height: 25px;
    color: gray;
    flex-shrink: 0;
    padding-left: 10px;
  }
`;

const Main = styled.div`
  flex-grow: 1;
`;

const ThreadName = styled.div``;

const AppName = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
`;

const Progress = styled.span`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 7px;
  background: orange;
`;

const TopButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
`;

const RefreshButton = styled.div`
  color: #007cff;
  font-weight: bold;
  cursor: pointer;
`;

const LoadingIndicator = styled.div`
  color: #111;
  font-weight: bold;
`;

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
export const fetchAndGroupThreads = async (): Promise<ThreadResult[]> => {
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

      try {
        isInProgress = thread.posts.some(
          (post: any) => post.chatMessage.isInProgress === true
        );
      } catch (e) {}

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

const ResultsTab = () => {
  const { config } = useConfig();

  const [, setView] = useAtom(viewAtom);
  const [, setTab] = useAtom(tabAtom);

  const {
    data: threads,
    isLoading,
    isValidating,
    mutate: reloadThreads,
  } = useSWRImmutable("fetchThreads", fetchAndGroupThreads);

  if (config.ais.length === 0) {
    return (
      <Container>
        <NotFound>
          No AIs added. Go to{" "}
          <a
            onClick={() => {
              setView(VIEWS.settings);
              setTab(TABS.yourAis);
            }}
          >
            Settings
          </a>{" "}
          and add an AI
        </NotFound>
      </Container>
    );
  }

  if (isLoading || !threads) {
    return (
      <Container>
        <TopButtons>
          <LoadingIndicator>Loading...</LoadingIndicator>
        </TopButtons>
      </Container>
    );
  }

  return (
    <Container>
      <TopButtons>
        {isValidating ? (
          <LoadingIndicator>Loading...</LoadingIndicator>
        ) : (
          <RefreshButton onClick={() => reloadThreads()}>Refresh</RefreshButton>
        )}
      </TopButtons>

      {threads.map((t) => {
        let appName = t.appName;

        const localApp = config.ais.find(({ appId }) => appId === t.appId);

        if (localApp) {
          appName = localApp.name;
        }

        return (
          <Link
            href={`https://youai.ai/ais/${t.appId}/use?initialThreadId=${t.threadId}`}
            target="_blank"
            key={t.threadId}
          >
            <Main>
              <AppName>
                {appName} {t.isInProgress && <Progress />}
              </AppName>
              <ThreadName>{t.threadName || "Generating..."}</ThreadName>
            </Main>

            <LinkIcon />
          </Link>
        );
      })}
    </Container>
  );
};

export default ResultsTab;
