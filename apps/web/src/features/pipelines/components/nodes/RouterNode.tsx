import { GitBranch } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface RouterNodeProps {
  id: string;
  data: {
    label: string;
    conditions?: string[];
  };
  selected?: boolean;
}

export function RouterNode({ id, data, selected }: RouterNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<GitBranch className="w-4 h-4 text-white" />}
      colorClass="bg-orange-500"
      multipleOutputs={true}
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Router Node</div>
        {data.conditions && (
          <div className="mt-1 text-gray-500 dark:text-gray-400">
            {data.conditions.length} routing conditions
          </div>
        )}
      </div>
    </BaseNode>
  );
}
