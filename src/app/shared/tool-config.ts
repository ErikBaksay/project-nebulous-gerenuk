import { ToolId } from './tool.types';

export type ToolWindowConfig = {
  readonly id: ToolId;
  readonly label: string;
  readonly popupWidth: number;
  readonly popupHeight: number;
  readonly focusWidth: number;
};

export const TOOL_WINDOW_CONFIG: Record<ToolId, ToolWindowConfig> = {
  timer: {
    id: 'timer',
    label: 'Timer',
    popupWidth: 430,
    popupHeight: 400,
    focusWidth: 680,
  },
  countdown: {
    id: 'countdown',
    label: 'Countdown',
    popupWidth: 430,
    popupHeight: 400,
    focusWidth: 760,
  },
  counter: {
    id: 'counter',
    label: 'Counter',
    popupWidth: 430,
    popupHeight: 400,
    focusWidth: 920,
  },
};
