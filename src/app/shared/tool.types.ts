export const TOOL_IDS = ['timer', 'countdown', 'counter'] as const;

export type ToolId = (typeof TOOL_IDS)[number];
export type ToolPanelViewMode = 'dashboard' | 'focus';

export function isToolId(value: string | null | undefined): value is ToolId {
  return value !== null && value !== undefined && TOOL_IDS.includes(value as ToolId);
}
