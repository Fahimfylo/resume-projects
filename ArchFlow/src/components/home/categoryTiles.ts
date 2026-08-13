import { NodeCategory } from '../../types';
import {
  LayoutTemplate,
  Component,
  Network,
  Cpu,
  Server,
  Database,
  Globe,
  Table,
  Anchor,
  Layers,
  FileCode,
  LucideIcon,
} from 'lucide-react';

export interface CategoryTileConfig {
  icon: LucideIcon;
  label: string;
  tint: string;
  bg: string;
  border: string;
}

/**
 * Category tile styling sourced entirely from the app's --cat-* tokens so the
 * marketing page and the product's node icons literally share a palette.
 */
export const categoryTileConfig: Record<NodeCategory, CategoryTileConfig> = {
  page: {
    icon: LayoutTemplate,
    label: 'Page View',
    tint: 'text-[var(--cat-page)]',
    bg: 'bg-[var(--cat-page)]/15',
    border: 'border-[var(--cat-page)]/30',
  },
  component: {
    icon: Component,
    label: 'React Component',
    tint: 'text-[var(--cat-component)]',
    bg: 'bg-[var(--cat-component)]/15',
    border: 'border-[var(--cat-component)]/30',
  },
  route: {
    icon: Network,
    label: 'API Route',
    tint: 'text-[var(--cat-route)]',
    bg: 'bg-[var(--cat-route)]/15',
    border: 'border-[var(--cat-route)]/30',
  },
  controller: {
    icon: Cpu,
    label: 'Controller',
    tint: 'text-[var(--cat-controller)]',
    bg: 'bg-[var(--cat-controller)]/15',
    border: 'border-[var(--cat-controller)]/30',
  },
  service: {
    icon: Server,
    label: 'Service',
    tint: 'text-[var(--cat-service)]',
    bg: 'bg-[var(--cat-service)]/15',
    border: 'border-[var(--cat-service)]/30',
  },
  model: {
    icon: Database,
    label: 'ORM Model',
    tint: 'text-[var(--cat-model)]',
    bg: 'bg-[var(--cat-model)]/15',
    border: 'border-[var(--cat-model)]/30',
  },
  'external-api': {
    icon: Globe,
    label: 'External API',
    tint: 'text-[var(--cat-external-api)]',
    bg: 'bg-[var(--cat-external-api)]/15',
    border: 'border-[var(--cat-external-api)]/30',
  },
  'db-table': {
    icon: Table,
    label: 'DB Table',
    tint: 'text-[var(--cat-db-table)]',
    bg: 'bg-[var(--cat-db-table)]/15',
    border: 'border-[var(--cat-db-table)]/30',
  },
  hook: {
    icon: Anchor,
    label: 'React Hook',
    tint: 'text-[var(--cat-hook)]',
    bg: 'bg-[var(--cat-hook)]/15',
    border: 'border-[var(--cat-hook)]/30',
  },
  store: {
    icon: Layers,
    label: 'State Store',
    tint: 'text-[var(--cat-store)]',
    bg: 'bg-[var(--cat-store)]/15',
    border: 'border-[var(--cat-store)]/30',
  },
};

export const FALLBACK_CATEGORY: CategoryTileConfig = {
  icon: FileCode,
  label: 'Entity',
  tint: 'text-[var(--text-3)]',
  bg: 'bg-[var(--bg-inset)]',
  border: 'border-[var(--border-2)]',
};
