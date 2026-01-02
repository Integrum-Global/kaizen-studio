import { Crown } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface SupervisorNodeProps {
  id: string;
  data: {
    label: string;
    config?: Record<string, unknown>;
  };
  selected?: boolean;
}

export function SupervisorNode({ id, data, selected }: SupervisorNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Crown className="w-4 h-4 text-white" />}
      colorClass="bg-purple-500"
      multipleOutputs={true}
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Supervisor Node</div>
        {data.config && (
          <div className="mt-1 text-gray-500 dark:text-gray-400">
            Config: {Object.keys(data.config).length} items
          </div>
        )}
      </div>
    </BaseNode>
  );
}
