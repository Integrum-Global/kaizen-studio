import { Plug } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface ConnectorNodeProps {
  id: string;
  data: {
    label: string;
    connectorType?: string;
  };
  selected?: boolean;
}

export function ConnectorNode({ id, data, selected }: ConnectorNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Plug className="w-4 h-4 text-white" />}
      colorClass="bg-gray-500"
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Connector Node</div>
        {data.connectorType && (
          <div className="mt-1 text-gray-500 dark:text-gray-400">
            Type: {data.connectorType}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
