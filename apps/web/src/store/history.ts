import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
}

interface HistoryState {
  past: CanvasState[];
  future: CanvasState[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => CanvasState | undefined;
  redo: () => CanvasState | undefined;
  pushState: (state: CanvasState) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 100;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      past: newPast,
      canUndo: newPast.length > 0,
      canRedo: true,
    });

    return previous;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const next = future[future.length - 1];
    const newFuture = future.slice(0, future.length - 1);

    set({
      future: newFuture,
      canRedo: newFuture.length > 0,
      canUndo: true,
    });

    return next;
  },

  pushState: (state: CanvasState) => {
    const { past } = get();

    const newPast = [...past, state];

    // Limit history size
    if (newPast.length > MAX_HISTORY_SIZE) {
      newPast.shift();
    }

    set({
      past: newPast,
      future: [], // Clear future when new state is pushed
      canUndo: true,
      canRedo: false,
    });
  },

  clearHistory: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
