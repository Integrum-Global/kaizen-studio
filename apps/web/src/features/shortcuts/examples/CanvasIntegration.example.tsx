/**
 * Example: Canvas editor with keyboard shortcuts
 *
 * This file shows how to integrate keyboard shortcuts
 * in a canvas editor component with context-specific shortcuts.
 */

import { useState } from "react";
import {
  useShortcutContext,
  useKeyboardShortcuts,
  ShortcutBadge,
} from "@/features/shortcuts";

interface Node {
  id: string;
  label: string;
}

export function CanvasEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // Set canvas context so canvas-specific shortcuts are active
  useShortcutContext("canvas");

  // Register canvas-specific shortcuts
  useKeyboardShortcuts([
    {
      id: "canvas.duplicate",
      keys: ["Control", "D"],
      description: "Duplicate selected nodes",
      category: "canvas",
      action: handleDuplicate,
      context: "canvas",
    },
    {
      id: "canvas.delete",
      keys: ["Delete"],
      description: "Delete selected nodes",
      category: "canvas",
      action: handleDelete,
      context: "canvas",
    },
    {
      id: "canvas.select-all",
      keys: ["Control", "A"],
      description: "Select all nodes",
      category: "canvas",
      action: handleSelectAll,
      context: "canvas",
    },
    {
      id: "canvas.deselect",
      keys: ["Escape"],
      description: "Deselect all nodes",
      category: "canvas",
      action: handleDeselect,
      context: "canvas",
    },
    {
      id: "canvas.copy",
      keys: ["Control", "C"],
      description: "Copy selected nodes",
      category: "canvas",
      action: handleCopy,
      context: "canvas",
    },
    {
      id: "canvas.paste",
      keys: ["Control", "V"],
      description: "Paste nodes",
      category: "canvas",
      action: handlePaste,
      context: "canvas",
    },
    {
      id: "canvas.cut",
      keys: ["Control", "X"],
      description: "Cut selected nodes",
      category: "canvas",
      action: handleCut,
      context: "canvas",
    },
    {
      id: "canvas.zoom-in",
      keys: ["Control", "="],
      description: "Zoom in",
      category: "canvas",
      action: handleZoomIn,
      context: "canvas",
    },
    {
      id: "canvas.zoom-out",
      keys: ["Control", "-"],
      description: "Zoom out",
      category: "canvas",
      action: handleZoomOut,
      context: "canvas",
    },
    {
      id: "canvas.fit-view",
      keys: ["Control", "0"],
      description: "Fit view",
      category: "canvas",
      action: handleFitView,
      context: "canvas",
    },
  ]);

  function handleDuplicate() {
    if (selectedNodes.length === 0) return;
    console.log("Duplicating nodes:", selectedNodes);
    // Duplicate logic here
  }

  function handleDelete() {
    if (selectedNodes.length === 0) return;
    console.log("Deleting nodes:", selectedNodes);
    setNodes(nodes.filter((node) => !selectedNodes.includes(node.id)));
    setSelectedNodes([]);
  }

  function handleSelectAll() {
    console.log("Selecting all nodes");
    setSelectedNodes(nodes.map((node) => node.id));
  }

  function handleDeselect() {
    console.log("Deselecting all nodes");
    setSelectedNodes([]);
  }

  function handleCopy() {
    if (selectedNodes.length === 0) return;
    console.log("Copying nodes:", selectedNodes);
    // Copy logic here
  }

  function handlePaste() {
    console.log("Pasting nodes");
    // Paste logic here
  }

  function handleCut() {
    if (selectedNodes.length === 0) return;
    console.log("Cutting nodes:", selectedNodes);
    // Cut logic here
  }

  function handleZoomIn() {
    console.log("Zooming in");
    // Zoom logic here
  }

  function handleZoomOut() {
    console.log("Zooming out");
    // Zoom logic here
  }

  function handleFitView() {
    console.log("Fitting view");
    // Fit view logic here
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar with shortcut hints */}
      <div className="border-b p-2 flex items-center gap-2">
        <button
          onClick={handleDuplicate}
          disabled={selectedNodes.length === 0}
          className="px-3 py-1 rounded hover:bg-muted flex items-center gap-2"
        >
          Duplicate
          <ShortcutBadge keys={["Control", "D"]} size="sm" />
        </button>

        <button
          onClick={handleDelete}
          disabled={selectedNodes.length === 0}
          className="px-3 py-1 rounded hover:bg-muted flex items-center gap-2"
        >
          Delete
          <ShortcutBadge keys={["Delete"]} size="sm" />
        </button>

        <button
          onClick={handleSelectAll}
          className="px-3 py-1 rounded hover:bg-muted flex items-center gap-2"
        >
          Select All
          <ShortcutBadge keys={["Control", "A"]} size="sm" />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-muted/10">
          {/* Canvas content here */}
          <p className="text-center text-muted-foreground p-4">
            Canvas area - Try keyboard shortcuts:
            <br />
            Ctrl+D to duplicate, Delete to remove, Ctrl+A to select all
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t p-2 text-sm text-muted-foreground">
        {selectedNodes.length > 0
          ? `${selectedNodes.length} node(s) selected`
          : "No nodes selected"}
      </div>
    </div>
  );
}
