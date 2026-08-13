import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(relativeTime);

export function toRelativeTime(iso) {
  if (!iso) return null;
  const date = dayjs(iso);
  if (!date.isValid()) return null;
  const diff = dayjs().diff(date);
  if (diff < 45_000) return 'Just now';
  return date.fromNow();
}
