/**
 * Category definitions for the condition builder
 */

import type { CategoryDefinition } from "../types";

export const categories: CategoryDefinition[] = [
  {
    id: "user",
    label: "Who",
    description: "Who is making the request (user, team, role)",
    icon: "User",
  },
  {
    id: "resource",
    label: "What",
    description: "What resource they are accessing (agent, gateway, deployment)",
    icon: "Box",
  },
  {
    id: "time",
    label: "When",
    description: "When they can access (hours, days, dates)",
    icon: "Clock",
  },
  {
    id: "context",
    label: "Where",
    description: "Where/how they connect (IP, location)",
    icon: "Globe",
  },
];

export const categoryMap = new Map(categories.map((c) => [c.id, c]));
