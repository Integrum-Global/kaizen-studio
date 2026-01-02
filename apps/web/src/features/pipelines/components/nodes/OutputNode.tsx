import { ArrowLeft } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface OutputNodeProps {
  id: string;
  data: {
    label: string;
  };
  selected?: boolean;
}

export function OutputNode({ id, data, selected }: OutputNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<ArrowLeft className="w-4 h-4 text-white" />}
      colorClass="bg-rose-500"
      showOutputHandle={false}
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Exit Point</div>
      </div>
    </BaseNode>
  );
}
