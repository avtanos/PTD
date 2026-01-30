/**
 * Type declarations for cytoscape (used when package or @types not installed).
 * Install: npm install cytoscape
 */
declare module 'cytoscape' {
  export interface NodeSingular {
    id(): string;
    position(): { x: number; y: number };
    style(name: string, value: string): void;
    addClass(className: string): void;
    removeClass(className: string): void;
  }

  export interface EdgeSingular {
    id(): string;
    source(): NodeSingular;
    target(): NodeSingular;
    style(name: string, value: string): void;
    addClass(className: string): void;
    removeClass(className: string): void;
  }

  export interface NodeCollection {
    forEach(fn: (node: NodeSingular) => void): void;
    removeClass(className: string): void;
  }

  export interface EdgeCollection {
    forEach(fn: (edge: EdgeSingular) => void): void;
    removeClass(className: string): void;
  }

  export interface EventObject {
    target: NodeSingular | EdgeSingular | Core;
  }

  export interface Core {
    nodes(): NodeCollection;
    edges(): EdgeCollection;
    on(events: string, selector: string, handler: (evt: EventObject) => void): this;
    on(events: string, handler: (evt: EventObject) => void): this;
    fit(selector?: unknown, padding?: number): this;
    destroy(): void;
    resize(): void;
    zoom(): number;
  }

  export interface CytoscapeOptions {
    container?: HTMLElement | null;
    elements?: { nodes: unknown[]; edges: unknown[] };
    style?: unknown[];
    layout?: { name: string };
    minZoom?: number;
    maxZoom?: number;
    wheelSensitivity?: number;
  }

  function cytoscape(options?: CytoscapeOptions): Core;
  export default cytoscape;
}
