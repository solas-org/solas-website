/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DocPage {
  id: string;
  title: string;
  folder?: string;
  path?: string;
}

export interface DocCategory {
  category: string;
  icon: string;
  pages: DocPage[];
}

export interface EdlComponent {
  id: string;
  name: string;
  type: 'data' | 'logic';
  description: string;
}

export type EntityType = 'Config' | 'System' | 'Composition';

export interface SpaceNode {
  id: string;
  name: string;
  type: 'global' | 'local';
  parentId?: string;
  entities: string[];
}

export interface RoadmapModule {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'planned';
  description: string;
  tags: string[];
}

export interface DependencyInjectNode {
  id: string;
  name: string;
  category: 'Service' | 'Logic' | 'Data';
  injectType: 'Inject' | 'AutoInject';
  injectedFrom?: string; // ID of the node it is injected from
  status: 'valid' | 'missing';
}

// #region EngineConfig
export interface EngineConfig {
  serializerName: string;
  vfsRoot: string;
  targetFps: number;
}
// #endregion
