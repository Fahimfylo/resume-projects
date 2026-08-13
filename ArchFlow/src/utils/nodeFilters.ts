import { EntityNodeData } from '../types';

export const CATEGORY_LABELS: Record<string, string> = {
  page: 'Pages',
  component: 'Components',
  route: 'Routes',
  controller: 'Controllers',
  service: 'Services',
  model: 'Models',
  'external-api': 'External APIs',
  'db-table': 'DB Tables',
  hook: 'Hooks',
  store: 'Stores',
};

const ROOT_DIRS = new Set([
  'src',
  'server',
  'app',
  'api',
  'client',
  'backend',
  'frontend',
  'packages',
]);

export function nodeTagKeys(data: EntityNodeData | undefined): string[] {
  const keys = new Set<string>();
  if (!data) return [];

  if (data.category) keys.add(data.category);

  const p = data.filePath || '';
  const segs = p.split('/').filter(Boolean);
  if (segs.length) {
    const rootIdx = segs.findIndex((s) => ROOT_DIRS.has(s));
    const folder = rootIdx >= 0 ? segs[rootIdx + 1] : segs[0];
    if (folder && !folder.includes('.')) keys.add(folder.toLowerCase());
  }

  return [...keys];
}

export function tagLabel(key: string): string {
  return CATEGORY_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1));
}
