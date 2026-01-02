# Pipeline Patterns User Guide

This guide explains how to use the Pipeline Editor in Kaizen Studio and describes each multi-agent pattern template available.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Using Pattern Templates](#using-pattern-templates)
3. [Pattern Descriptions](#pattern-descriptions)
4. [Building Custom Pipelines](#building-custom-pipelines)
5. [Testing Your Pipeline](#testing-your-pipeline)
6. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Pipeline Editor

1. Log in to Kaizen Studio
2. Navigate to **Pipelines** from the left sidebar
3. Click **+ New Pipeline** to create a new pipeline, or click on an existing pipeline to edit it

### Pipeline Editor Interface

The Pipeline Editor has three main sections:

| Section | Location | Purpose |
|---------|----------|---------|
| **Node Palette** | Left sidebar | Drag individual nodes or apply pattern templates |
| **Canvas** | Center | Visual workspace for building your pipeline |
| **Config Panel** | Right sidebar | Configure selected node properties |

### Toolbar Actions

- **Back**: Return to pipelines list
- **Undo/Redo**: Navigate through edit history (Ctrl+Z / Ctrl+Y)
- **Test**: Run a test execution of your pipeline
- **Save**: Save your pipeline to the server
- **Deploy**: Deploy your pipeline to production

---

## Using Pattern Templates

Pattern templates are pre-built pipeline configurations based on proven multi-agent collaboration patterns from the Kaizen AI framework.

### How to Apply a Pattern

1. In the **Node Palette** (left sidebar), scroll down to **Pattern Templates**
2. Click on any pattern name to apply it
3. The canvas will be populated with the appropriate nodes and connections
4. Customize the nodes by selecting them and modifying properties in the Config Panel

### What the A2A Badge Means

Some patterns display an **A2A** (Agent-to-Agent) badge. These patterns use semantic matching to automatically route tasks to the most appropriate agent based on their capabilities, rather than explicit routing rules.

---

## Pattern Descriptions

### 1. Sequential Pattern

**Best for**: Step-by-step workflows, document processing pipelines, approval chains

```
[Input] → [Agent 1] → [Agent 2] → [Agent 3] → [Output]
```

**Description**: Agents execute in sequence, with each agent's output becoming the next agent's input.

**Example Use Cases**:
- Content creation: Research → Draft → Edit → Publish
- Data processing: Extract → Transform → Validate → Load
- Approval workflows: Request → Review → Approve → Execute

**How to Test**:
1. Apply the Sequential pattern
2. Configure Agent 1 as a "Researcher" (set label and optionally assign an agent)
3. Configure Agent 2 as a "Writer"
4. Configure Agent 3 as a "Editor"
5. Click Test and enter: "Write an article about AI trends in 2025"
6. Observe how the request flows through each stage

---

### 2. Parallel Pattern

**Best for**: Independent analyses, multi-perspective reviews, bulk processing

```
            ┌→ [Agent 1] ─┐
[Input] ─→  ├→ [Agent 2] ─┼→ [Aggregator] → [Output]
            └→ [Agent 3] ─┘
```

**Description**: Multiple agents process the same input concurrently. Results are aggregated into a final output.

**Example Use Cases**:
- Multi-language translation
- Parallel document analysis from different perspectives
- Concurrent API calls to different services

**How to Test**:
1. Apply the Parallel pattern
2. Configure Agent 1 as "Technical Reviewer"
3. Configure Agent 2 as "Business Analyst"
4. Configure Agent 3 as "Security Auditor"
5. Click Test and enter: "Review this proposal for a new cloud migration project"
6. Each agent analyzes from their perspective; results are combined

---

### 3. Supervisor-Worker Pattern (A2A)

**Best for**: Complex task decomposition, managed team workflows, quality-controlled outputs

```
                    ┌→ [Worker 1] ─┐
[Input] → [Super] ─┼→ [Worker 2] ─┼→ [Coordinator] → [Output]
                    └→ [Worker 3] ─┘
```

**Description**: A supervisor agent decomposes tasks and delegates to specialized workers. A coordinator consolidates results.

**Example Use Cases**:
- Project management: PM decomposes into dev, design, QA tasks
- Research papers: Lead author assigns sections to co-authors
- Customer service: Manager routes to specialized agents

**How to Test**:
1. Apply the Supervisor-Worker pattern
2. Configure Supervisor as "Project Manager"
3. Configure Worker 1 as "Frontend Developer"
4. Configure Worker 2 as "Backend Developer"
5. Configure Worker 3 as "QA Engineer"
6. Click Test and enter: "Build a user registration feature"
7. The supervisor breaks down the task and assigns to appropriate workers

---

### 4. Router Pattern (A2A)

**Best for**: Intent classification, specialized handling, dynamic dispatch

```
            ┌→ [Code Agent]  ─┐
[Input] → [Router] ─→ [Data Agent]  ─┼→ [Output]
            └→ [Write Agent] ─┘
```

**Description**: A router agent analyzes input and routes to the most appropriate specialist. Uses semantic matching for intelligent routing.

**Example Use Cases**:
- Customer support: Route to billing, technical, or sales teams
- Development assistance: Route to code, documentation, or testing agents
- Content creation: Route to different content type specialists

**How to Test**:
1. Apply the Router pattern
2. Configure Router with routing strategy "semantic"
3. Keep default agent labels (Code Agent, Data Agent, Write Agent)
4. Click Test and try these inputs:
   - "Fix the bug in my Python function" → Routes to Code Agent
   - "Analyze sales data for Q4" → Routes to Data Agent
   - "Write a blog post about AI" → Routes to Write Agent

---

### 5. Ensemble Pattern (A2A)

**Best for**: Complex decisions, multi-expert analysis, comprehensive reviews

```
            ┌→ [Expert 1] ─┐
[Input] ─→  ├→ [Expert 2] ─┼→ [Synthesizer] → [Output]
            └→ [Expert 3] ─┘
```

**Description**: Multiple expert agents analyze the same input independently. A synthesizer combines their perspectives into a comprehensive response.

**Example Use Cases**:
- Investment analysis: Technical, fundamental, and sentiment analysis
- Medical diagnosis: Multiple specialist opinions
- Risk assessment: Security, compliance, and business risk perspectives

**How to Test**:
1. Apply the Ensemble pattern
2. Configure Expert 1 as "Technical Analyst"
3. Configure Expert 2 as "Financial Analyst"
4. Configure Expert 3 as "Market Analyst"
5. Configure Synthesizer with aggregation type "summarize"
6. Click Test and enter: "Should we invest in this startup?"
7. Each expert provides their perspective; synthesizer creates unified recommendation

---

### 6. Blackboard Pattern (A2A)

**Best for**: Iterative problem-solving, complex reasoning, multi-step solutions

```
                        ┌→ [Analyst]   ─┐
[Problem] → [Controller] ─┼→ [Validator] ─┼→ [Blackboard] → [Solution]
                        └→ [Optimizer] ─┘
```

**Description**: Specialists iteratively contribute to a shared "blackboard" until the problem is solved. The controller coordinates access.

**Example Use Cases**:
- Complex debugging: Different specialists analyze various aspects
- Design reviews: Architecture, UX, and performance specialists iterate
- Strategic planning: Market, product, and financial analysts collaborate

**How to Test**:
1. Apply the Blackboard pattern
2. Keep default agent labels
3. Click Test and enter: "Our website is slow - diagnose and fix"
4. The controller directs specialists to analyze and contribute to the solution

---

### 7. Consensus Pattern

**Best for**: Democratic decisions, risk mitigation, balanced outcomes

```
            ┌→ [Voter 1] ─┐
[Proposal] ├→ [Voter 2] ─┼→ [Aggregator] → [Decision]
            └→ [Voter 3] ─┘
```

**Description**: Multiple agents independently vote on a proposal. An aggregator tallies votes to reach a decision.

**Example Use Cases**:
- Code review approval: Multiple reviewers must approve
- Content moderation: Multiple classifiers vote on appropriateness
- Risk decisions: Multiple risk models provide opinions

**How to Test**:
1. Apply the Consensus pattern
2. Configure Aggregator with aggregation type "vote"
3. Click Test and enter: "Should we deploy this release to production?"
4. Each voter provides their decision; aggregator determines outcome based on majority

---

### 8. Debate Pattern

**Best for**: Critical analysis, adversarial review, thorough exploration

```
           ┌→ [Proponent] ─┐
[Topic] ─→                 ├→ [Judge] → [Judgment]
           └→ [Opponent]  ─┘
```

**Description**: Two agents take opposing positions on a topic. A judge evaluates the arguments and provides a balanced verdict.

**Example Use Cases**:
- Policy decisions: Explore pros and cons thoroughly
- Technical choices: Compare two architectural approaches
- Investment decisions: Bull vs bear case analysis

**How to Test**:
1. Apply the Debate pattern
2. Click Test and enter: "Should we migrate to microservices?"
3. Proponent argues for migration, Opponent argues against
4. Judge evaluates both sides and provides recommendation

---

### 9. Handoff (Escalation) Pattern

**Best for**: Tiered support, complexity-based routing, escalation chains

```
[Request] → [Tier 1] ─→ [Tier 2] ─→ [Tier 3] → [Resolution]
                 ↓           ↓           ↓
              [Output]   [Output]    [Output]
```

**Description**: Tasks start at the lowest tier and escalate to higher tiers only if needed. Each tier can resolve directly or escalate.

**Example Use Cases**:
- Customer support: L1 → L2 → L3 escalation
- Technical support: Generalist → Specialist → Expert
- Approval chains: Team Lead → Manager → Director

**How to Test**:
1. Apply the Handoff pattern
2. Configure Tier 1 as "General Support"
3. Configure Tier 2 as "Technical Specialist"
4. Configure Tier 3 as "Senior Engineer"
5. Click Test and try:
   - "How do I reset my password?" → Resolved at Tier 1
   - "My API is returning 500 errors after deployment" → Escalates to Tier 2 or 3

---

## Building Custom Pipelines

### Drag-and-Drop Nodes

1. In the Node Palette, drag any node type to the canvas
2. Available node types:
   - **Input**: Entry point for your pipeline
   - **Agent**: AI agent that processes data
   - **Supervisor**: Manages and coordinates other agents
   - **Router**: Routes based on conditions
   - **Synthesizer**: Combines multiple inputs
   - **Connector**: External service integration
   - **Output**: Exit point for your pipeline

### Connecting Nodes

1. Hover over a node to see connection handles
2. Drag from an output handle (right side) to an input handle (left side)
3. Connection lines will appear showing data flow

### Configuring Nodes

1. Click on a node to select it
2. The Config Panel (right sidebar) shows configuration options:
   - **Label**: Display name for the node
   - **Agent**: Select an existing agent to use (for Agent nodes)
   - **Temperature**: AI creativity level (0.0 = deterministic, 1.0 = creative)
   - **Routing Strategy**: For Router nodes (round-robin, priority, semantic)
   - **Aggregation Type**: For Synthesizer nodes (merge, vote, summarize)

---

## Testing Your Pipeline

### Running a Test

1. Click the **Test** button in the toolbar
2. A dialog appears showing pipeline info (pattern, nodes, edges)
3. Enter test input in the text area
4. Click **Run Test**
5. View the execution results

### Understanding Test Results

The test output shows:
- **status**: success or error
- **execution_time**: How long the pipeline took
- **steps**: Each node's processing status and output
- **final_output**: The complete pipeline result

### Tips for Testing

- Start with simple inputs to verify connections work
- Test edge cases (empty input, very long input)
- Check that routing works correctly for Router patterns
- Verify aggregation produces expected output format

---

## Best Practices

### Choosing the Right Pattern

| If you need to... | Use this pattern |
|-------------------|------------------|
| Process steps in order | Sequential |
| Get multiple perspectives | Parallel or Ensemble |
| Route to specialists | Router |
| Manage a team of agents | Supervisor-Worker |
| Solve complex problems | Blackboard |
| Make democratic decisions | Consensus |
| Explore both sides | Debate |
| Handle escalations | Handoff |

### Pipeline Design Tips

1. **Start simple**: Begin with a pattern template and customize
2. **Name nodes clearly**: Use descriptive labels like "Security Reviewer" not "Agent 1"
3. **Assign agents**: Select pre-configured agents for consistent behavior
4. **Test incrementally**: Test after each major change
5. **Save frequently**: Use the Save button to preserve your work

### Performance Considerations

- **Parallel patterns** are faster than sequential for independent tasks
- **Fewer nodes** generally means faster execution
- **Expensive operations** should be in specialized agents, not repeated
- **Consider caching** for repeated similar requests

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Nodes not connecting | Ensure you drag from output (right) to input (left) |
| Pipeline not saving | Check network connection; try refreshing the page |
| Test returns empty | Verify all nodes are connected and configured |
| Routing not working | Check Router node has semantic strategy configured |

### Getting Help

- Review this guide for pattern explanations
- Check the Kaizen SDK documentation for agent configuration
- Contact support for persistent issues

---

## Quick Reference Card

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Delete | Remove selected node |
| Escape | Deselect all |

### Node Types at a Glance

| Node | Icon | Purpose |
|------|------|---------|
| Input | → | Entry point |
| Agent | 🤖 | AI processing |
| Supervisor | 👑 | Task coordination |
| Router | ⑂ | Conditional routing |
| Synthesizer | ⊕ | Combine outputs |
| Connector | ⚡ | External integration |
| Output | ← | Exit point |
