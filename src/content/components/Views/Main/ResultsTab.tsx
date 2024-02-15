import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { viewAtom, tabAtom } from "../../../atom";

import useConfig from "../../../hooks/useConfig";
import { TABS, VIEWS } from "../../../../utils/constants";

import { getAppData } from "../../../../utils/request";

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
  width: 5px;
  height: 5px;
  border-radius: 50%;
  display: inline-block;
  margin-left: 4px;
  background: orange;
`;

type ThreadResult = {
  appId: string;
  appName: string;
  threadId: string;
  threadName: string;
  dateCreated: string;
  isInProgress: boolean;
};

const ResultsTab = () => {
  const { config } = useConfig();

  const [, setView] = useAtom(viewAtom);
  const [, setTab] = useAtom(tabAtom);

  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState<ThreadResult[]>([]);

  /**
   * Load threads of all AIs, group and sort by dateCreated
   */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const results = await Promise.all(
        config.ais.map(({ appId, apiKey }) =>
          getAppData({
            appId: appId,
            apiKey: apiKey,
          })
        )
      );

      setIsLoading(false);

      const threadResults: ThreadResult[] = results.flatMap((obj) => {
        return obj.threads.map((thread: any) => {
          return {
            appId: thread.appId,
            appName: obj.app.name,
            threadId: thread.id,
            threadName: thread.name,
            dateCreated: thread.dateCreated,
            isInProgress: thread.posts.some((post: any) => post.isInProgress),
          };
        });
      });

      threadResults.sort((a, b) => {
        return (
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        );
      });

      setThreads(threadResults);
    };

    if (config.ais.length > 0) {
      init();
    }
  }, []);

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

  if (isLoading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container>
      {threads.map((t) => {
        let appName = t.appName;

        const localApp = config.ais.find(({ appId }) => appId === t.appId);

        if (localApp) {
          appName = localApp.name;
        }

        return (
          <Link
            href={`https://youai.ai/ais/${t.appId}/use?threadId=${t.threadId}`}
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
