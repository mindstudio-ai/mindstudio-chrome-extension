import { useAtom } from "jotai";

import { isSubmittingAtom } from "../atom";
import useConfig from "./useConfig";

import { runWorkflow } from "../../utils/request";

const useSubmit = () => {
  const { config } = useConfig();

  const [isSubmitting, setIsSubmitting] = useAtom(isSubmittingAtom);

  const submit = async (
    aiIndex: number = 0,
    message: string
  ): Promise<string> => {
    const chosenAi = config.ais[aiIndex];

    if (!chosenAi) {
      alert("Choose an AI");
      return "";
    }

    setIsSubmitting(true);

    const threadId = await runWorkflow({
      appId: chosenAi.appId,
      apiKey: chosenAi.apiKey,
      message,
    });

    setIsSubmitting(false);

    return threadId;
  };

  return {
    isSubmitting,
    submit,
  };
};

export default useSubmit;
