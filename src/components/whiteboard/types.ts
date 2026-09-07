export type WhiteboardTheme =
  | "black-plain"
  | "black-dots"
  | "black-grid"
  | "blue-plain"
  | "blue-dots"
  | "blue-grid"
  | "purple-plain"
  | "purple-dots"
  | "purple-grid"
  | "amber-plain"
  | "amber-dots"
  | "amber-grid"
  | "green-plain"
  | "green-dots"
  | "green-grid"
  | "rose-plain"
  | "rose-dots"
  | "rose-grid"
  | "white-plain"
  | "white-dots"
  | "white-grid";

export type WhiteboardTool =
  | "select"
  | "hand"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "arrow"
  | "line"
  | "draw"
  | "text"
  | "sticky"
  | "eraser";

export interface CanvasElement {
  id: string;
  type: WhiteboardTool;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  roughness?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  points?: { x: number; y: number }[]; // For freehand draw and custom arrows
  pageId: string;
}

export interface WhiteboardPage {
  id: string;
  name: string;
  createdAt: number;
}

export interface WhiteboardDocument {
  version: number;
  pages: WhiteboardPage[];
  activePageId: string;
  elements: CanvasElement[];
  appState: {
    theme: WhiteboardTheme;
    zoom: number;
    scrollX: number;
    scrollY: number;
    gridEnabled: boolean;
  };
}
