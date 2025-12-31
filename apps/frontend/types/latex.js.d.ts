declare module 'latex.js' {
    export class HtmlGenerator {
      constructor(options?: { hyphenate?: boolean });
    }
  
    export interface ParsedDocument {
      htmlDocument(baseURL?: string): Document;
      stylesAndScripts(baseURL?: string): DocumentFragment;
      domFragment(): DocumentFragment;
    }
  
    export function parse(
      latex: string,
      options?: { generator?: HtmlGenerator }
    ): ParsedDocument;
  }