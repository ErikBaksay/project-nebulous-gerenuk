export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function coerceDurationPart(value: string | number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return clampNumber(Math.trunc(parsed), 0, max);
}

export function buildDurationMs(hours: number, minutes: number, seconds: number): number {
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export function formatDigitalDuration(milliseconds: number): string {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalTenths = Math.floor(safeMilliseconds / 100);
  const hours = Math.floor(totalTenths / 36000);
  const minutes = Math.floor((totalTenths % 36000) / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;

  return `${padTimeSegment(hours)}:${padTimeSegment(minutes)}:${padTimeSegment(seconds)}.${tenths}`;
}

export function formatHumanDuration(milliseconds: number): string {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const segments: string[] = [];

  if (hours > 0) {
    segments.push(`${hours} hr`);
  }

  if (minutes > 0 || hours > 0) {
    segments.push(`${minutes} min`);
  }

  segments.push(`${seconds} sec`);

  return segments.join(' ');
}

function padTimeSegment(value: number): string {
  return value.toString().padStart(2, '0');
}
