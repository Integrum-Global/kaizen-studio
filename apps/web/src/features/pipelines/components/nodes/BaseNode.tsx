import { ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { X } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface BaseNodeProps {
  id: string;
  data: {
    label: string;
  };
  selected?: boolean;
  icon: ReactNode;
  colorClass: string;
  children?: ReactNode;
  showInputHandle?: boolean;
  showOutputHandle?: boolean;
  multipleInputs?: boolean;
  multipleOutputs?: boolean;
  onDelete?: (id: string) => void;
}

export function BaseNode({
  id,
  data,
  selected = false,
  icon,
  colorClass,
  children,
  showInputHandle = true,
  showOutputHandle = true,
  multipleInputs = false,
  multipleOutputs = false,
  onDelete,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 border-2 rounded-lg shadow-lg min-w-[200px] transition-all",
        selected
          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
          : "border-gray-300 dark:border-gray-600",
        colorClass
      )}
    >
      {/* Input Handle */}
      {showInputHandle && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="input"
            className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500"
          />
          {multipleInputs && (
            <>
              <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500"
              />
              <Handle
                type="target"
                position={Position.Right}
                id="right"
                className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500"
              />
            </>
          )}
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              colorClass
            )}
          >
            {icon}
          </div>
          <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {data.label}
          </div>
        </div>

        {/* Delete Button */}
        {selected && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      {children && (
        <div className="p-3 text-xs text-gray-600 dark:text-gray-400">
          {children}
        </div>
      )}

      {/* Output Handle */}
      {showOutputHandle && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="output"
            className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500"
          />
          {multipleOutputs && (
            <>
              <Handle
                type="source"
                position={Position.Left}
                id="left"
                className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500"
              />
              <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
