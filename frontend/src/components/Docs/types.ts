/**
 * Docs content model. Articles are plain data rendered by DocRenderer;
 * inline text supports **bold** and `code`.
 */
export type DocBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'formula'; title?: string; expr: string; where?: [string, string][]; note?: string }
  | { type: 'example'; title: string; given: [string, string][]; steps: [string, string][]; result: string }
  | { type: 'table'; head: string[]; rows: string[][]; caption?: string }
  | { type: 'callout'; tone: 'tip' | 'warn' | 'info'; title?: string; text: string }

export interface DocArticle {
  id: string
  title: string
  category: string
  summary: string
  /** Guided calculator scenario that applies this article. */
  scenarioId?: string
  /** App module id that implements the technique (e.g. 'geocal'). */
  moduleId?: string
  blocks: DocBlock[]
}
