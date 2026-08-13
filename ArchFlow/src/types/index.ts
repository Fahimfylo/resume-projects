export type NodeCategory =
  | 'page'
  | 'component'
  | 'route'
  | 'controller'
  | 'service'
  | 'model'
  | 'external-api'
  | 'db-table'
  | 'hook'
  | 'store';

export type RelationshipType =
  | 'IMPORTS'
  | 'CALLS'
  | 'ROUTES_TO'
  | 'USES'
  | 'DEPENDS_ON'
  | 'READS_FROM'
  | 'WRITES_TO';

export type AbstractionLevel = 'full' | 'system' | 'modules' | 'components' | 'files';

export interface SubNodeItem {
  id: string;
  label: string;
  category: NodeCategory;
  subtitle?: string;
}

export interface EntityNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  category: NodeCategory;
  filePath?: string;
  summary?: string;
  subNodes?: SubNodeItem[];
  stats?: {
    lines?: number;
    complexity?: string;
    calls?: number;
  };
  childCount?: number;
  isLeaf?: boolean;
  groupId?: string;
  collapsed?: boolean;
  depth?: number;
  parentNodeId?: string;
  width?: number;
  height?: number;
}

export interface GroupNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  category?: NodeCategory;
  expanded?: boolean;
  listMode?: boolean;
  nodeCount?: number;
  childCount?: number;
  childIds?: string[];
  rows?: GroupRowData[];
  filterQuery?: string;
}

export interface GroupRowData {
  id: string;
  label: string;
  subtitle: string;
  category: NodeCategory;
  childCount: number;
}

export interface RelationshipEdgeData extends Record<string, unknown> {
  relationshipType: RelationshipType;
  scopeEdge?: boolean;
  evidence?: {
    filePath: string;
    lineNumber: number;
    codeSnippet: string;
    confidence: number;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  stats: {
    projectsCount: number;
    filesCount: number;
    workflowsCount: number;
  };
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdAt: string;
  stats: {
    filesCount: number;
    modulesCount: number;
    workflowsCount: number;
    lastAnalyzed: string;
  };
}
