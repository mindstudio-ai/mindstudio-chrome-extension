import { useAtom } from "jotai";

import { isSubmittingAtom } from "../atom";

import { runWorkflow } from "../../utils/request";
import { DEFAULT_VARIABLE, getLocalConfig } from "../../utils/config";

export type SubmitResult = {
  threadId: string;
  appId: string;
};

const useSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useAtom(isSubmittingAtom);

  const submit = async (
    aiIndex: number = 0,
    message: string
  ): Promise<SubmitResult | null> => {
    const config = await getLocalConfig();

    const chosenAi = config.ais[aiIndex];

    if (!chosenAi) {
      alert("Choose an AI");
      return null;
    }

    setIsSubmitting(true);

    const threadId = await runWorkflow({
      appId: chosenAi.appId,
      apiKey: chosenAi.apiKey,
      message,
      variableName: chosenAi.variableName || DEFAULT_VARIABLE,
      workflow: chosenAi.workflow || undefined,
    });

    setIsSubmitting(false);

    return {
      threadId,
      appId: chosenAi.appId,
    };
  };

  return {
    isSubmitting,
    submit,
  };
};

export default useSubmit;
