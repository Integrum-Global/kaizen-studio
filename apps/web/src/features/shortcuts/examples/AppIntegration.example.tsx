/**
 * Example: Integrating keyboard shortcuts in the main App
 *
 * This file shows how to integrate the keyboard shortcuts system
 * into your main application component.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGlobalShortcuts,
  useKeyboardShortcuts,
  ShortcutsDialog,
} from "@/features/shortcuts";

export function App() {
  const navigate = useNavigate();
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Register global shortcuts with default actions
  const { showShortcutsDialog, setShowShortcutsDialog } = useGlobalShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSearch: () => setShowCommandPalette(true),
    onEscape: () => {
      // Close any open dialogs
      setShowCommandPalette(false);
      setShowShortcutsDialog(false);
    },
  });

  // Register navigation shortcuts
  useKeyboardShortcuts([
    {
      id: "nav.dashboard",
      keys: ["Control", "1"],
      description: "Go to dashboard",
      category: "navigation",
      action: () => navigate("/dashboard"),
    },
    {
      id: "nav.agents",
      keys: ["Control", "2"],
      description: "Go to agents",
      category: "navigation",
      action: () => navigate("/agents"),
    },
    {
      id: "nav.pipelines",
      keys: ["Control", "3"],
      description: "Go to pipelines",
      category: "navigation",
      action: () => navigate("/pipelines"),
    },
    {
      id: "nav.deployments",
      keys: ["Control", "4"],
      description: "Go to deployments",
      category: "navigation",
      action: () => navigate("/deployments"),
    },
  ]);

  return (
    <div>
      {/* Your app content */}
      <YourAppRoutes />

      {/* Shortcuts dialog - triggered by Ctrl+/ */}
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />

      {/* Command palette - triggered by Ctrl+K */}
      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}

// Dummy implementations for example
function handleSave() {
  console.log("Save triggered");
}

function handleUndo() {
  console.log("Undo triggered");
}

function handleRedo() {
  console.log("Redo triggered");
}

function YourAppRoutes() {
  return <div>App routes</div>;
}

function CommandPalette({ onClose: _onClose }: { onClose: () => void }) {
  return <div>Command Palette</div>;
}
