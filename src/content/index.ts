import { FrameService } from './services/frame.service';

const initialize = () => {
  // Only initialize in top frame
  if (window.self !== window.top) {
    return;
  }

  const frameService = FrameService.getInstance();
  frameService.injectFrames();
};

initialize();
