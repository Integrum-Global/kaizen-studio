/**
 * Complete example demonstrating all onboarding features
 *
 * This example shows how to integrate:
 * - Welcome dialog for first-time users
 * - Guided tour with interactive overlays
 * - Contextual tooltips for UI hints
 * - Progress checklist for onboarding tasks
 * - Floating help button with resources
 */

import {
  WelcomeDialog,
  TourOverlay,
  OnboardingTooltip,
  HelpButton,
  useOnboarding,
} from "@/features/onboarding";
import { OnboardingChecklist } from "@/features/onboarding";
import type {
  OnboardingTour,
  ChecklistType,
  OnboardingHint,
} from "@/features/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Define the main onboarding tour
 */
const mainTour: OnboardingTour = {
  id: "kaizen-studio-tour",
  title: "Welcome to Kaizen Studio",
  description: "Let's explore the key features together",
  steps: [
    {
      id: "intro",
      title: "Welcome!",
      description:
        "This quick tour will show you how to build, test, and deploy AI agents.",
    },
    {
      id: "agents",
      title: "Agent Designer",
      description:
        "Create AI agents with signature-based programming. Click here to start.",
      target: "#create-agent-btn",
      position: "bottom",
    },
    {
      id: "pipelines",
      title: "Pipeline Canvas",
      description:
        "Build multi-agent workflows with our visual canvas. Drag and drop agents to connect them.",
      target: "#pipeline-canvas",
      position: "right",
    },
    {
      id: "testing",
      title: "Test & Debug",
      description:
        "Test your agents and pipelines in real-time. See execution traces and debug issues.",
      target: "#test-section",
      position: "bottom",
    },
    {
      id: "deploy",
      title: "Deploy",
      description:
        "Deploy your pipelines to production with one click. Choose from multiple environments.",
      target: "#deploy-btn",
      position: "left",
    },
  ],
};

/**
 * Define the getting started checklist
 */
const gettingStartedChecklist: ChecklistType = {
  id: "getting-started",
  title: "Getting Started",
  description:
    "Complete these steps to unlock the full potential of Kaizen Studio",
  steps: [
    {
      id: "create-agent",
      label: "Create your first agent",
      description: "Design an AI agent with custom signatures",
      completed: false,
      href: "/agents/new",
    },
    {
      id: "build-pipeline",
      label: "Build a pipeline",
      description: "Connect agents in a multi-agent workflow",
      completed: false,
      href: "/pipelines/new",
    },
    {
      id: "test-pipeline",
      label: "Test your pipeline",
      description: "Run tests to verify agent behavior",
      completed: false,
      href: "/pipelines/test",
    },
    {
      id: "deploy-pipeline",
      label: "Deploy to environment",
      description: "Push your pipeline to production",
      completed: false,
      href: "/deployments",
    },
    {
      id: "invite-team",
      label: "Invite team members",
      description: "Collaborate with your team",
      completed: false,
      href: "/settings/team",
    },
  ],
};

/**
 * Define contextual hints for UI elements
 */
const contextualHints: OnboardingHint[] = [
  {
    id: "agent-designer-hint",
    target: "#create-agent-btn",
    title: "Create Your First Agent",
    description:
      "Start here to create an AI agent. Define signatures to control agent behavior and responses.",
    position: "right",
    showOnce: true,
    priority: 1,
  },
  {
    id: "pipeline-canvas-hint",
    target: "#pipeline-canvas",
    title: "Visual Pipeline Builder",
    description:
      "Drag and drop agents to create complex workflows. Connect agents to define execution flow.",
    position: "top",
    showOnce: true,
    priority: 2,
  },
  {
    id: "test-hint",
    target: "#test-section",
    title: "Test Your Work",
    description:
      "Use the test panel to verify your agents work correctly. View execution traces and debug issues.",
    position: "left",
    showOnce: true,
    priority: 3,
  },
];

/**
 * Main example component
 */
export function CompleteOnboardingExample() {
  const { isTourActive } = useOnboarding({ tour: mainTour });

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome dialog - shows once on first visit */}
      <WelcomeDialog
        tour={mainTour}
        title="Welcome to Kaizen Studio"
        description="Build, test, and deploy AI agents with ease. Let's get you started!"
      />

      {/* Guided tour overlay */}
      <TourOverlay
        tour={mainTour}
        onComplete={() => console.log("Tour completed!")}
        onSkip={() => console.log("Tour skipped")}
      />

      {/* Main layout */}
      <div className="flex h-screen">
        {/* Sidebar with checklist */}
        <aside className="w-80 border-r p-4 space-y-4">
          <OnboardingChecklist checklist={gettingStartedChecklist} />

          {/* Additional sidebar content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const { start } = useOnboarding({ tour: mainTour });
                  start();
                }}
              >
                Restart Tour
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <div className="flex items-center gap-2">
                {contextualHints[0] && (
                  <OnboardingTooltip hint={contextualHints[0]}>
                    <Button id="create-agent-btn" size="lg">
                      Create Agent
                    </Button>
                  </OnboardingTooltip>
                )}
                <Button id="deploy-btn" variant="outline" size="lg">
                  Deploy
                </Button>
              </div>
            </div>

            {/* Agent section */}
            <section id="agents-section">
              <h2 className="text-2xl font-semibold mb-4">Your Agents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Sample agent description
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Pipeline section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Pipelines</h2>
              {contextualHints[1] && (
                <OnboardingTooltip hint={contextualHints[1]}>
                  <Card id="pipeline-canvas" className="h-96">
                    <CardHeader>
                      <CardTitle>Pipeline Canvas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">
                          Drag and drop to create pipelines
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </OnboardingTooltip>
              )}
            </section>

            {/* Test section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Test & Debug</h2>
              {contextualHints[2] && (
                <OnboardingTooltip hint={contextualHints[2]}>
                  <Card id="test-section">
                    <CardHeader>
                      <CardTitle>Test Panel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Test your agents and view execution traces
                        </p>
                        <Button size="sm">Run Test</Button>
                      </div>
                    </CardContent>
                  </Card>
                </OnboardingTooltip>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Floating help button */}
      <HelpButton variant="floating" />

      {/* Tour active indicator */}
      {isTourActive && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[103]">
          <Card className="shadow-lg">
            <CardContent className="py-2 px-4">
              <p className="text-sm font-medium">Tour in progress...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Simpler example with just the welcome dialog and help button
 */
export function MinimalOnboardingExample() {
  return (
    <div className="min-h-screen bg-background">
      {/* Just the essentials */}
      <WelcomeDialog />

      {/* Your app content */}
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold">My App</h1>
        {/* ... */}
      </div>

      {/* Help button */}
      <HelpButton variant="floating" />
    </div>
  );
}

/**
 * Example with custom tour for a specific feature
 */
export function FeatureTourExample() {
  const agentDesignerTour: OnboardingTour = {
    id: "agent-designer-tour",
    title: "Agent Designer Tour",
    description: "Learn how to design AI agents",
    steps: [
      {
        id: "signatures",
        title: "Signatures",
        description: "Define input and output signatures for your agent",
        target: "#signature-panel",
        position: "right",
      },
      {
        id: "prompts",
        title: "Prompts",
        description: "Customize agent prompts and behavior",
        target: "#prompt-editor",
        position: "bottom",
      },
      {
        id: "save",
        title: "Save & Test",
        description: "Save your agent and run tests",
        target: "#save-btn",
        position: "left",
      },
    ],
  };

  const { start, isTourActive } = useOnboarding({ tour: agentDesignerTour });

  return (
    <div>
      <TourOverlay tour={agentDesignerTour} />

      <div className="flex items-center justify-between mb-4">
        <h1>Agent Designer</h1>
        {!isTourActive && (
          <Button onClick={start} variant="outline" size="sm">
            Show Tour
          </Button>
        )}
      </div>

      {/* Feature content with tour targets */}
      <div id="signature-panel">Signatures</div>
      <div id="prompt-editor">Prompt Editor</div>
      <button id="save-btn">Save</button>
    </div>
  );
}
