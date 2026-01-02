import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GatewayList } from "./GatewayList";
import { GatewayHealth } from "./GatewayHealth";
import { PromotionDialog } from "./PromotionDialog";
import { PromotionHistory } from "./PromotionHistory";
import { ScalingPolicyList } from "./ScalingPolicyList";
import { ScalingEventTimeline } from "./ScalingEventTimeline";
import { ManualScaleControls } from "./ManualScaleControls";
import type { Gateway } from "../types";

export function GatewayDashboard() {
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "details">("list");

  const handleViewDetails = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setActiveTab("details");
  };

  const handlePromote = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setPromotionOpen(true);
  };

  const handleScale = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setActiveTab("details");
  };

  const handleBackToList = () => {
    setSelectedGateway(null);
    setActiveTab("list");
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "list" | "details")}
      >
        <TabsList>
          <TabsTrigger value="list">All Gateways</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedGateway}>
            {selectedGateway?.name || "Details"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <GatewayList
            onViewDetails={handleViewDetails}
            onPromote={handlePromote}
            onScale={handleScale}
          />
          <div className="mt-6">
            <PromotionHistory showActions />
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          {selectedGateway && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToList}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to list
                </button>
                <h2 className="text-2xl font-bold">{selectedGateway.name}</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <GatewayHealth
                  gatewayId={selectedGateway.id}
                  gatewayName={selectedGateway.name}
                />
                <ManualScaleControls gateway={selectedGateway} />
              </div>

              <ScalingPolicyList gatewayId={selectedGateway.id} />

              <div className="grid gap-6 lg:grid-cols-2">
                <ScalingEventTimeline gatewayId={selectedGateway.id} />
                <PromotionHistory gatewayId={selectedGateway.id} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PromotionDialog
        gateway={selectedGateway}
        open={promotionOpen}
        onOpenChange={setPromotionOpen}
      />
    </div>
  );
}
