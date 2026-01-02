import { ArrowRight } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface InputNodeProps {
  id: string;
  data: {
    label: string;
  };
  selected?: boolean;
}

export function InputNode({ id, data, selected }: InputNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<ArrowRight className="w-4 h-4 text-white" />}
      colorClass="bg-emerald-500"
      showInputHandle={false}
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Entry Point</div>
      </div>
    </BaseNode>
  );
}
