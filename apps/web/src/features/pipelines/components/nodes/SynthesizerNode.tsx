import { Combine } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { useCanvasStore } from "../../../../store/canvas";

interface SynthesizerNodeProps {
  id: string;
  data: {
    label: string;
    aggregationType?: string;
  };
  selected?: boolean;
}

export function SynthesizerNode({ id, data, selected }: SynthesizerNodeProps) {
  const removeNode = useCanvasStore((state) => state.removeNode);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      icon={<Combine className="w-4 h-4 text-white" />}
      colorClass="bg-green-500"
      multipleInputs={true}
      onDelete={removeNode}
    >
      <div>
        <div className="font-medium">Synthesizer Node</div>
        {data.aggregationType && (
          <div className="mt-1 text-gray-500 dark:text-gray-400">
            Type: {data.aggregationType}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
