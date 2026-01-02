#!/usr/bin/env python3
"""
AI Hub Pipeline Configuration Script

Creates 5 use-case pipelines for the AI Hub architecture.

Usage:
    cat scripts/create_ai_hub_pipelines.py | docker exec -i kaizen_backend python -
"""

import asyncio
import json
import uuid

# Import models to register DataFlow nodes
import studio.models  # noqa: F401
from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Organization ID for Integrum Global
ORGANIZATION_ID = "808b334a-994c-4604-a5df-7acf4b6d2f12"
WORKSPACE_ID = "ws-ai-hub"

# Agent IDs mapping (will be populated from database)
AGENT_IDS = {}

# Pipeline definitions based on AI Hub architecture
PIPELINES = {
    "Treasury Analysis Pipeline": {
        "description": "Enterprise treasury intelligence with multi-agent routing. Orchestrates loan portfolio analysis, covenant compliance monitoring, and strategic market intelligence.",
        "pattern": "supervisor",
        "nodes": [
            {"type": "input", "label": "User Query", "position": (100, 200)},
            {
                "type": "agent",
                "label": "Treasury Chat Agent",
                "agent_name": "Treasury Chat Agent",
                "position": (300, 200),
            },
            {
                "type": "agent",
                "label": "Loan Monitoring",
                "agent_name": "Loan Monitoring Agent",
                "position": (550, 100),
            },
            {
                "type": "agent",
                "label": "Covenant Analyzer",
                "agent_name": "Covenant Analyzer",
                "position": (550, 200),
            },
            {
                "type": "agent",
                "label": "Strategy Analyzer",
                "agent_name": "Strategy Analyzer",
                "position": (550, 300),
            },
            {"type": "merge", "label": "Response Aggregator", "position": (750, 200)},
            {"type": "output", "label": "Treasury Response", "position": (950, 200)},
        ],
        "connections": [
            {"source": "User Query", "target": "Treasury Chat Agent"},
            {
                "source": "Treasury Chat Agent",
                "target": "Loan Monitoring",
                "condition": '{"intent": "loan"}',
            },
            {
                "source": "Treasury Chat Agent",
                "target": "Covenant Analyzer",
                "condition": '{"intent": "covenant"}',
            },
            {
                "source": "Treasury Chat Agent",
                "target": "Strategy Analyzer",
                "condition": '{"intent": "strategy"}',
            },
            {"source": "Loan Monitoring", "target": "Response Aggregator"},
            {"source": "Covenant Analyzer", "target": "Response Aggregator"},
            {"source": "Strategy Analyzer", "target": "Response Aggregator"},
            {"source": "Response Aggregator", "target": "Treasury Response"},
        ],
    },
    "Cashflow Intelligence Pipeline": {
        "description": "Multi-node cashflow analysis orchestrator with Databricks integration. Provides cashflow forecasting, FCCS analysis, and quantum investment analysis.",
        "pattern": "supervisor",
        "nodes": [
            {"type": "input", "label": "User Query", "position": (100, 200)},
            {
                "type": "agent",
                "label": "Cashflow Chat Agent",
                "agent_name": "Cashflow Chat Agent",
                "position": (300, 200),
            },
            {
                "type": "agent",
                "label": "Cashflow Forecast",
                "agent_name": "Cashflow Forecast Agent",
                "position": (550, 100),
            },
            {
                "type": "agent",
                "label": "FCCS Analysis",
                "agent_name": "FCCS Analysis Agent",
                "position": (550, 200),
            },
            {
                "type": "agent",
                "label": "Quantum Investment",
                "agent_name": "Quantum Investment Agent",
                "position": (550, 300),
            },
            {"type": "merge", "label": "Response Aggregator", "position": (750, 200)},
            {"type": "output", "label": "Cashflow Response", "position": (950, 200)},
        ],
        "connections": [
            {"source": "User Query", "target": "Cashflow Chat Agent"},
            {
                "source": "Cashflow Chat Agent",
                "target": "Cashflow Forecast",
                "condition": '{"intent": "forecast"}',
            },
            {
                "source": "Cashflow Chat Agent",
                "target": "FCCS Analysis",
                "condition": '{"intent": "fccs"}',
            },
            {
                "source": "Cashflow Chat Agent",
                "target": "Quantum Investment",
                "condition": '{"intent": "investment"}',
            },
            {"source": "Cashflow Forecast", "target": "Response Aggregator"},
            {"source": "FCCS Analysis", "target": "Response Aggregator"},
            {"source": "Quantum Investment", "target": "Response Aggregator"},
            {"source": "Response Aggregator", "target": "Cashflow Response"},
        ],
    },
    "Document Processing Pipeline": {
        "description": "9-node document processing pipeline with email integration, multi-format extraction, AI analysis, and RAG embedding generation.",
        "pattern": "sequential",
        "nodes": [
            {"type": "input", "label": "Document Input", "position": (100, 200)},
            {
                "type": "agent",
                "label": "Document Ingestion",
                "agent_name": "Document Ingestion Agent",
                "position": (300, 200),
            },
            {
                "type": "agent",
                "label": "Document Processor",
                "agent_name": "Document Processor",
                "position": (500, 200),
            },
            {
                "type": "agent",
                "label": "Timeline Extractor",
                "agent_name": "Timeline Extractor",
                "position": (700, 150),
            },
            {
                "type": "agent",
                "label": "Minutes Timeline",
                "agent_name": "Minutes Timeline Agent",
                "position": (700, 250),
            },
            {
                "type": "agent",
                "label": "Project RAG",
                "agent_name": "Project RAG Agent",
                "position": (900, 200),
            },
            {"type": "output", "label": "Processed Output", "position": (1100, 200)},
        ],
        "connections": [
            {"source": "Document Input", "target": "Document Ingestion"},
            {"source": "Document Ingestion", "target": "Document Processor"},
            {"source": "Document Processor", "target": "Timeline Extractor"},
            {"source": "Document Processor", "target": "Minutes Timeline"},
            {"source": "Timeline Extractor", "target": "Project RAG"},
            {"source": "Minutes Timeline", "target": "Project RAG"},
            {"source": "Project RAG", "target": "Processed Output"},
        ],
    },
    "Specialized Analysis Pipeline": {
        "description": "Ensemble analysis pipeline combining asset description, forex analysis, market surveillance, and talent insights for comprehensive enterprise intelligence.",
        "pattern": "ensemble",
        "nodes": [
            {"type": "input", "label": "Analysis Request", "position": (100, 200)},
            {
                "type": "agent",
                "label": "Asset Description",
                "agent_name": "Asset Description Agent",
                "position": (350, 100),
            },
            {
                "type": "agent",
                "label": "Forex Analyzer",
                "agent_name": "Forex Analyzer",
                "position": (350, 200),
            },
            {
                "type": "agent",
                "label": "Market Surveillance",
                "agent_name": "Market Surveillance Agent",
                "position": (350, 300),
            },
            {
                "type": "agent",
                "label": "Talent Insights",
                "agent_name": "Talent Insights Agent",
                "position": (350, 400),
            },
            {
                "type": "agent",
                "label": "Financial Analyzer",
                "agent_name": "Financial Analyzer",
                "position": (600, 150),
            },
            {
                "type": "agent",
                "label": "Treasury Insights",
                "agent_name": "Treasury Insights Agent",
                "position": (600, 300),
            },
            {"type": "merge", "label": "Analysis Synthesizer", "position": (800, 200)},
            {
                "type": "output",
                "label": "Comprehensive Analysis",
                "position": (1000, 200),
            },
        ],
        "connections": [
            {"source": "Analysis Request", "target": "Asset Description"},
            {"source": "Analysis Request", "target": "Forex Analyzer"},
            {"source": "Analysis Request", "target": "Market Surveillance"},
            {"source": "Analysis Request", "target": "Talent Insights"},
            {"source": "Asset Description", "target": "Financial Analyzer"},
            {"source": "Forex Analyzer", "target": "Treasury Insights"},
            {"source": "Market Surveillance", "target": "Treasury Insights"},
            {"source": "Talent Insights", "target": "Financial Analyzer"},
            {"source": "Financial Analyzer", "target": "Analysis Synthesizer"},
            {"source": "Treasury Insights", "target": "Analysis Synthesizer"},
            {"source": "Analysis Synthesizer", "target": "Comprehensive Analysis"},
        ],
    },
    "Interactive Chat Pipeline": {
        "description": "Interactive chat orchestration with meeting intelligence, performance metrics, and loan analysis capabilities.",
        "pattern": "router",
        "nodes": [
            {"type": "input", "label": "Chat Input", "position": (100, 200)},
            {
                "type": "condition",
                "label": "Intent Router",
                "position": (300, 200),
                "config": {"routing_type": "intent_classification"},
            },
            {
                "type": "agent",
                "label": "Meeting Chat",
                "agent_name": "Meeting Chat Agent",
                "position": (550, 100),
            },
            {
                "type": "agent",
                "label": "Performance Chat",
                "agent_name": "Performance Chat Agent",
                "position": (550, 200),
            },
            {
                "type": "agent",
                "label": "Loan Analyzer",
                "agent_name": "Loan Analyzer",
                "position": (550, 300),
            },
            {"type": "output", "label": "Chat Response", "position": (800, 200)},
        ],
        "connections": [
            {"source": "Chat Input", "target": "Intent Router"},
            {
                "source": "Intent Router",
                "target": "Meeting Chat",
                "condition": '{"intent": "meeting"}',
            },
            {
                "source": "Intent Router",
                "target": "Performance Chat",
                "condition": '{"intent": "performance"}',
            },
            {
                "source": "Intent Router",
                "target": "Loan Analyzer",
                "condition": '{"intent": "loan"}',
            },
            {"source": "Meeting Chat", "target": "Chat Response"},
            {"source": "Performance Chat", "target": "Chat Response"},
            {"source": "Loan Analyzer", "target": "Chat Response"},
        ],
    },
}


async def get_agent_ids():
    """Get all AI Hub agent IDs from database."""
    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()
    workflow.add_node(
        "AgentListNode",
        "list",
        {
            "filter": {"organization_id": ORGANIZATION_ID},
            "limit": 100,
        },
    )
    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})

    agent_ids = {}
    for agent in results.get("list", {}).get("records", []):
        agent_ids[agent["name"]] = agent["id"]

    return agent_ids


async def get_existing_pipelines():
    """Get existing pipelines in the organization."""
    runtime = AsyncLocalRuntime()
    workflow = WorkflowBuilder()
    workflow.add_node(
        "PipelineListNode",
        "list",
        {
            "filter": {"organization_id": ORGANIZATION_ID},
            "limit": 100,
        },
    )
    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
    return {p["name"]: p for p in results.get("list", {}).get("records", [])}


async def create_pipeline(name: str, config: dict):
    """Create a new pipeline with nodes and connections."""
    runtime = AsyncLocalRuntime()
    pipeline_id = str(uuid.uuid4())

    # Create the pipeline
    workflow = WorkflowBuilder()
    workflow.add_node(
        "PipelineCreateNode",
        "create",
        {
            "id": pipeline_id,
            "organization_id": ORGANIZATION_ID,
            "workspace_id": WORKSPACE_ID,
            "name": name,
            "description": config["description"],
            "pattern": config["pattern"],
            "status": "active",
            "created_by": "system",
        },
    )
    await runtime.execute_workflow_async(workflow.build(), inputs={})

    # Create nodes
    node_id_map = {}  # label -> id
    for node in config["nodes"]:
        node_id = str(uuid.uuid4())
        node_id_map[node["label"]] = node_id

        agent_id = ""
        if node["type"] == "agent":
            agent_name = node.get("agent_name", "")
            agent_id = AGENT_IDS.get(agent_name, "")
            if not agent_id:
                print(f"    Warning: Agent '{agent_name}' not found")

        node_config = json.dumps(node.get("config", {}))

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineNodeCreateNode",
            "create",
            {
                "id": node_id,
                "pipeline_id": pipeline_id,
                "node_type": node["type"],
                "agent_id": agent_id,
                "label": node["label"],
                "position_x": float(node["position"][0]),
                "position_y": float(node["position"][1]),
                "config": node_config,
            },
        )
        await runtime.execute_workflow_async(workflow.build(), inputs={})

    # Create connections
    for conn in config["connections"]:
        conn_id = str(uuid.uuid4())
        source_id = node_id_map.get(conn["source"], "")
        target_id = node_id_map.get(conn["target"], "")

        if not source_id or not target_id:
            print(
                f"    Warning: Connection {conn['source']} -> {conn['target']} has missing nodes"
            )
            continue

        condition = conn.get("condition", "")

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PipelineConnectionCreateNode",
            "create",
            {
                "id": conn_id,
                "pipeline_id": pipeline_id,
                "source_node_id": source_id,
                "target_node_id": target_id,
                "source_handle": "output",
                "target_handle": "input",
                "condition": condition,
            },
        )
        await runtime.execute_workflow_async(workflow.build(), inputs={})

    return pipeline_id


async def main():
    """Main function to create all AI Hub pipelines."""
    global AGENT_IDS

    print("=" * 60)
    print("AI Hub Pipeline Configuration Script")
    print("=" * 60)
    print(f"Organization: {ORGANIZATION_ID}")
    print(f"Total pipelines to configure: {len(PIPELINES)}")
    print()

    # Get agent IDs
    print("Fetching agent IDs...")
    AGENT_IDS = await get_agent_ids()
    print(f"Found {len(AGENT_IDS)} agents")
    print()

    # Get existing pipelines
    print("Checking existing pipelines...")
    existing = await get_existing_pipelines()
    print(f"Found {len(existing)} existing pipelines")
    print()

    # Track results
    created = []
    skipped = []
    errors = []

    for name, config in PIPELINES.items():
        try:
            if name in existing:
                print(f"Skipping: {name} (already exists)")
                skipped.append(name)
            else:
                print(f"Creating: {name}")
                pipeline_id = await create_pipeline(name, config)
                created.append(name)
                print(f"  ✓ Created (ID: {pipeline_id[:12]}...)")
        except Exception as e:
            errors.append((name, str(e)))
            print(f"  ✗ Error: {e}")

    # Summary
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Created: {len(created)}")
    print(f"Skipped: {len(skipped)}")
    print(f"Errors: {len(errors)}")

    if errors:
        print()
        print("Errors:")
        for name, error in errors:
            print(f"  - {name}: {error}")

    print()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
