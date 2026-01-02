import { Bot } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface AgentNodeProps {
  id: string;
  data: {
    label: string;
    agentId?: string;
  };
  selected?: boolean;
}

export function AgentNode({ id, data, selected }: AgentNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Bot className="w-4 h-4 text-white" />}
      colorClass="bg-blue-500"
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Agent Node</div>
        {data.agentId && (
          <div className="mt-1 text-gray-500 dark:text-gray-400">
            Agent ID: {data.agentId}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
