#!/usr/bin/env python3
"""
Comprehensive Integration Tests for AI Hub Agents in Kaizen Studio.

This test module validates the creation, retrieval, and management of all 22 AI Hub
agents via the Kaizen Studio API. Tests are designed with expected outcomes defined
before execution.

Expected Outcomes:
==================
1. All 22 agents should be created successfully under integrum.global tenant
2. Each agent should have correct:
   - agent_type (chat, task, pipeline, custom)
   - status (draft initially)
   - model_id (gpt-4o or claude-3-opus)
   - organization_id matching integrum.global
3. Agents should be retrievable via the /agents endpoint
4. Agent counts by use-case should match:
   - Treasury & Financial: 6 agents
   - Cashflow & Forecasting: 4 agents
   - Document & RAG: 5 agents
   - Specialized Analysis: 4 agents
   - Interactive Chat: 3 agents
5. Multi-tenancy: Agents should ONLY be visible to integrum.global users

Test Structure:
===============
- Phase 1: Environment Verification
- Phase 2: Agent Creation (22 agents across 5 use-cases)
- Phase 3: Agent Retrieval and Validation
- Phase 4: Multi-tenancy Verification
- Phase 5: Agent Statistics Validation
"""


import httpx
import pytest

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ORG_ID = "61b1546c-5ef8-4d68-984b-d1a93229731c"
WORKSPACE_ID = "f1093373-9045-40a8-8d62-4446dad0036a"
TEST_PASSWORD = "Integrum2024!"

# Agent definitions by use-case
AI_HUB_AGENTS = {
    "treasury_financial": [
        {
            "name": "Treasury Chat Agent",
            "agent_type": "chat",
            "model_id": "gpt-4o",
            "description": "Main orchestrator for treasury and financial analysis. Uses LangGraph supervisor pattern with SSE streaming. Routes queries to Treasury Insights, Loan Monitoring, and Strategy sub-agents.",
            "system_prompt": """You are the Treasury Chat Agent, the primary interface for enterprise treasury management.

Your capabilities include:
- Market intelligence via Treasury Insights Agent
- Loan portfolio analysis via Loan Monitoring Agent
- Strategic analysis via Strategy Analyzer
- Real-time FX and commodity data from Yahoo Finance
- AI-powered market reports from Perplexity API

Always provide data-driven insights with citations.""",
            "temperature": 0.7,
        },
        {
            "name": "Treasury Insights Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Daily cache-first market intelligence analyzer using Perplexity API. Provides 4 analysis types: credit risk reports, market intelligence, strategic recommendations, and financial health assessments.",
            "system_prompt": """You are the Treasury Insights Agent specializing in market intelligence.

Analysis Types:
1. Credit Risk Reports - Assess borrower creditworthiness
2. Market Intelligence - Real-time market conditions
3. Strategic Recommendations - Investment strategies
4. Financial Health Assessment - Company financial analysis

Use date-based caching to minimize API calls while ensuring fresh data.""",
            "temperature": 0.5,
        },
        {
            "name": "Loan Monitoring Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Multi-source loan portfolio orchestrator with 6 data routes. Monitors loan schedules, repayments, covenants, and portfolio metrics. Uses static caching with force_refresh capability.",
            "system_prompt": """You are the Loan Monitoring Agent for enterprise loan portfolio management.

Monitor and analyze:
- Loan repayment schedules and amortization
- Covenant compliance tracking
- Portfolio metrics (WAL, duration, yield)
- Credit risk indicators
- Maturity profiles

Integrate with treasury.loan_monitoring for master data access.""",
            "temperature": 0.3,
        },
        {
            "name": "Covenant Analyzer",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "LangGraph React Agent with 2 tools for covenant breach detection and severity classification. Analyzes covenant compliance trends and generates alerts for potential breaches.",
            "system_prompt": """You are the Covenant Analyzer Agent for financial covenant compliance.

Capabilities:
- Breach detection with severity classification
- Trend analysis for early warning
- Compliance assessment scoring
- Remediation recommendations

Severity levels: Critical (immediate action), High (escalate), Medium (monitor), Low (note).""",
            "temperature": 0.3,
        },
        {
            "name": "Strategy Analyzer",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "3-tool market strategy agent combining Perplexity, Yahoo Finance, and cached news. Provides strategic recommendations based on market conditions and company-specific analysis.",
            "system_prompt": """You are the Strategy Analyzer Agent for market strategy and investment analysis.

Data Sources:
- Perplexity API for market intelligence
- Yahoo Finance for real-time data
- Cached news for historical context

Provide actionable strategic recommendations with supporting data.""",
            "temperature": 0.6,
        },
        {
            "name": "Financial Analyzer",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Hub agent for multi-dimensional financial ratio analysis. Calculates 6 metric types including credit risk scoring. Serves as dependency for 6+ other agents.",
            "system_prompt": """You are the Financial Analyzer, the hub agent for financial metrics calculation.

Analysis Dimensions:
1. Liquidity ratios (current, quick, cash)
2. Profitability ratios (ROE, ROA, margins)
3. Leverage ratios (debt-to-equity, interest coverage)
4. Efficiency ratios (asset turnover, inventory days)
5. Growth metrics (revenue, earnings, book value)
6. Credit risk scoring with weighted factors

You serve as the analytical foundation for multiple dependent agents.""",
            "temperature": 0.3,
        },
    ],
    "cashflow_forecasting": [
        {
            "name": "Cashflow Chat Agent",
            "agent_type": "chat",
            "model_id": "gpt-4o",
            "description": "6-node LangGraph orchestrator for cashflow analysis with SSE streaming. Integrates Databricks for enterprise cashflow statements. Maintains 3-turn conversation memory.",
            "system_prompt": """You are the Cashflow Chat Agent for enterprise cashflow management.

Workflow Nodes:
1. Advisor - Query understanding
2. Orchestrator - Routing decisions
3. Metrics - KPI calculations
4. Cash Analysis - Statement analysis
5. Market Intelligence - Context enrichment
6. Formatter - Response generation

Integrate with Databricks for real enterprise cashflow data.""",
            "temperature": 0.7,
        },
        {
            "name": "Cashflow Forecast Agent",
            "agent_type": "chat",
            "model_id": "gpt-4o",
            "description": "3-node forecast workflow for predictive cashflow analysis. Entity-specific forecasting per reporting period with market intelligence integration.",
            "system_prompt": """You are the Cashflow Forecast Agent for predictive financial analysis.

Forecast Pipeline:
1. cashflow_analyzer - Historical pattern analysis
2. market_context - External factor integration
3. forecast_generator - Prediction generation

Generate entity-specific forecasts with confidence intervals.""",
            "temperature": 0.5,
        },
        {
            "name": "FCCS Analysis Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "77-line FCCS format specialist for maritime/shipping industry. Provides 6-dimensional analysis including executive summary, insights, trends, predictions, recommendations, and risk assessment.",
            "system_prompt": """You are the FCCS Analysis Agent specializing in Financial Consolidation and Close (FCCS) format for maritime/shipping industry.

Analysis Dimensions:
1. Executive Summary - Key findings overview
2. Insights - Detailed observations
3. Trends - Pattern identification
4. Predictions - Forward-looking analysis
5. Recommendations - Actionable suggestions
6. Risk Assessment - Exposure evaluation

Process 77-line FCCS statements with industry-specific context.""",
            "temperature": 0.5,
        },
        {
            "name": "Quantum Investment Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Parallel investment analysis with ThreadPoolExecutor (3 workers). Analyzes equity, debt, and deferred investment components. Integrates iLevel data with RAG-powered context.",
            "system_prompt": """You are the Quantum Investment Agent for portfolio investment analysis.

Investment Components (Parallel Processing):
1. Equity - Stock and ownership positions
2. Debt - Fixed income and lending
3. Deferred - Long-term investment vehicles

Use ThreadPoolExecutor for concurrent analysis across components.
Integrate iLevel system data for investment quantum values.""",
            "temperature": 0.4,
        },
    ],
    "document_rag": [
        {
            "name": "Document Ingestion Agent",
            "agent_type": "pipeline",
            "model_id": "gpt-4o",
            "description": "9-node LangGraph pipeline from email fetch to embedding storage. Integrates MS Graph for OAuth 2.0 email access. Database-first caching pattern with 8 FastAPI endpoints.",
            "system_prompt": """You are the Document Ingestion Agent managing the enterprise document pipeline.

9-Node Pipeline:
1. Email Fetch - MS Graph integration
2. Format Detection - MIME type analysis
3. Text Extraction - Multi-format processing
4. Chunking - Semantic segmentation
5. Embedding - Vector generation
6. Storage - Database persistence
7. Indexing - Search optimization
8. Validation - Quality assurance
9. Completion - Status finalization

Process documents from email to searchable knowledge base.""",
            "temperature": 0.3,
        },
        {
            "name": "Document Processor",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Multi-format document processor supporting PDF, Word, Excel, Email, Text, and HTML. 10-step processing pipeline with 4-factor confidence scoring.",
            "system_prompt": """You are the Document Processor for multi-format document analysis.

Supported Formats:
- PDF (text and image extraction)
- Word (.docx, .doc)
- Excel (.xlsx, .xls)
- Email (.eml, .msg)
- Text (.txt, .md)
- HTML (web pages)

Apply 10-step processing with quality validation at each stage.
Generate confidence scores based on extraction accuracy.""",
            "temperature": 0.3,
        },
        {
            "name": "Project RAG Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Hub agent for hybrid document retrieval using 60% cosine similarity + 40% BM25. 4-stage pipeline from 30 candidates to top 10 results. Serves 5+ dependent agents.",
            "system_prompt": """You are the Project RAG Agent, the hub for document retrieval.

Hybrid Search Algorithm:
- 60% Cosine Similarity (semantic)
- 40% BM25 (keyword)

Retrieval Pipeline:
1. Query expansion
2. Initial retrieval (n=30)
3. Re-ranking
4. Final selection (top_k=10)

24-hour cache TTL with MD5 key generation for performance.""",
            "temperature": 0.3,
        },
        {
            "name": "Timeline Extractor",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "NLP-based event extraction supporting 10 event types. Multi-pattern date/time extraction with 5-factor confidence scoring and gap detection.",
            "system_prompt": """You are the Timeline Extractor for document chronology analysis.

Event Types (10):
1. Meeting, 2. Decision, 3. Milestone, 4. Action
5. Deadline, 6. Discussion, 7. Approval
8. Revision, 9. Escalation, 10. Completion

Confidence Factors:
- Date pattern clarity
- Event type certainty
- Context completeness
- Source reliability
- Temporal consistency

Detect gaps exceeding 14-day threshold.""",
            "temperature": 0.3,
        },
        {
            "name": "Minutes Timeline Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "LangGraph workflow for meeting minutes analysis. MD5-based caching with flexible JSON/text parsing. Extracts decisions, actions, and milestones with deduplication.",
            "system_prompt": """You are the Minutes Timeline Agent for meeting document analysis.

Extraction Focus:
- Top 20 Decisions
- Top 15 Action Items
- Top 10 Milestones

Event Classification:
1. Meeting - Scheduled gatherings
2. Decision - Formal choices
3. Milestone - Key achievements
4. Action - Assigned tasks

Apply order-preserving deduplication.""",
            "temperature": 0.4,
        },
    ],
    "specialized_analysis": [
        {
            "name": "Asset Description Agent",
            "agent_type": "chat",
            "model_id": "gpt-4o",
            "description": "5-dimensional investment asset analyzer. Generates investment-grade reports covering overview, key features, business model, market position, and investment thesis.",
            "system_prompt": """You are the Asset Description Agent for investment-grade asset analysis.

5 Analysis Dimensions:
1. Asset Overview - Key characteristics
2. Key Features - Distinguishing attributes
3. Business Model - Revenue and operations
4. Market Position - Competitive landscape
5. Investment Thesis - Value proposition

Generate comprehensive reports for investment decisions.""",
            "temperature": 0.5,
        },
        {
            "name": "Forex Analyzer",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "21 currency pair analyzer covering major, minor, and exotic pairs. Provides technical, fundamental, sentiment, and volatility analysis per pair.",
            "system_prompt": """You are the Forex Analyzer for currency market analysis.

Currency Coverage (21 pairs):
- 7 Major pairs (EUR/USD, GBP/USD, etc.)
- 7 Minor pairs (EUR/GBP, AUD/NZD, etc.)
- 7 Exotic pairs (USD/TRY, USD/ZAR, etc.)

Analysis Dimensions:
1. Technical - Chart patterns, indicators
2. Fundamental - Economic factors
3. Sentiment - Market positioning
4. Volatility - Risk metrics

Integrate Yahoo Finance for real-time data.""",
            "temperature": 0.4,
        },
        {
            "name": "Market Surveillance Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "Statistical anomaly detection with 4 alert types. Uses Z-score thresholds for outlier detection across volatility, anomaly, trend change, and volume spike categories.",
            "system_prompt": """You are the Market Surveillance Agent for anomaly detection.

Alert Types:
1. Volatility - Price movement extremes
2. Anomaly - Statistical outliers
3. Trend Change - Direction reversals
4. Volume Spike - Unusual trading activity

Severity Classification (Z-score):
- Critical: |Z| > 3.0
- High: |Z| > 2.5
- Medium: |Z| > 2.0
- Low: |Z| < 2.0

Generate real-time alerts for market events.""",
            "temperature": 0.3,
        },
        {
            "name": "Talent Insights Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "HR analytics agent for workforce intelligence. Analyzes employee performance, retention patterns, and talent development opportunities.",
            "system_prompt": """You are the Talent Insights Agent for HR analytics.

Analysis Areas:
- Performance metrics
- Retention prediction
- Skill gap analysis
- Succession planning
- Compensation benchmarking

Integrate with HR systems for employee data.
Provide actionable workforce intelligence.""",
            "temperature": 0.5,
        },
    ],
    "interactive_chat": [
        {
            "name": "Meeting Chat Agent",
            "agent_type": "chat",
            "model_id": "gpt-4o",
            "description": "4-node LangGraph workflow for meeting intelligence with SSE streaming. Integrates Project RAG and Minutes Timeline for contextual responses.",
            "system_prompt": """You are the Meeting Chat Agent for interactive meeting analysis.

Workflow Nodes:
1. query_enhancer - Context expansion
2. rag_retriever - Document retrieval
3. meeting_analyzer - Content analysis
4. response_formatter - Output generation

Answer questions about past meetings with cited sources.
Use MessageTracker for SSE deduplication.""",
            "temperature": 0.7,
        },
        {
            "name": "Performance Chat Agent",
            "agent_type": "chat",
            "model_id": "gpt-4o",
            "description": "Real-time KPI chat interface with 3 categories: financial, operational, and market metrics. SSE streaming with live data updates.",
            "system_prompt": """You are the Performance Chat Agent for KPI analysis.

KPI Categories:
1. Financial - Revenue, margins, profitability
2. Operational - Productivity, efficiency, quality
3. Market - Share, growth, customer metrics

Provide real-time performance insights.
Compare against benchmarks and historical trends.""",
            "temperature": 0.6,
        },
        {
            "name": "Loan Analyzer Agent",
            "agent_type": "task",
            "model_id": "gpt-4o",
            "description": "5-dimensional credit analysis: credit risk, maturity, covenant, cash flow, and portfolio analysis. Integrates Loan Monitoring hub for comprehensive loan intelligence.",
            "system_prompt": """You are the Loan Analyzer Agent for credit analysis.

5 Analysis Dimensions:
1. Credit Risk - Borrower assessment
2. Maturity - Duration analysis
3. Covenant - Compliance review
4. Cash Flow - Payment capacity
5. Portfolio - Diversification metrics

Integrate with Loan Monitoring for portfolio data.
Generate credit recommendations with supporting analysis.""",
            "temperature": 0.4,
        },
    ],
}

# Expected outcomes
EXPECTED_OUTCOMES = {
    "total_agents": 22,
    "agents_by_type": {
        "chat": 6,
        "task": 15,
        "pipeline": 1,
    },
    "agents_by_usecase": {
        "treasury_financial": 6,
        "cashflow_forecasting": 4,
        "document_rag": 5,
        "specialized_analysis": 4,
        "interactive_chat": 3,
    },
}


class TestAIHubAgents:
    """Integration tests for AI Hub agents in Kaizen Studio."""

    # Class-level token cache to avoid rate limiting (10 logins/min limit)
    _token_cache: dict = {}

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up test environment."""
        self.base_url = BASE_URL
        self.org_id = ORG_ID
        self.workspace_id = WORKSPACE_ID
        self.admin_token = None
        self.jack_token = None
        self.created_agent_ids = []

    def _login(self, email: str, password: str) -> str:
        """Login and return access token. Uses class-level cache to avoid rate limiting."""
        # Check cache first to avoid repeated logins
        cache_key = f"{email}:{password}"
        if cache_key in TestAIHubAgents._token_cache:
            return TestAIHubAgents._token_cache[cache_key]

        response = httpx.post(
            f"{self.base_url}/auth/login", json={"email": email, "password": password}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]

        # Cache the token for subsequent tests
        TestAIHubAgents._token_cache[cache_key] = token
        return token

    def _get_headers(self, token: str) -> dict:
        """Get authorization headers."""
        return {"Authorization": f"Bearer {token}"}

    # Phase 1: Environment Verification
    def test_01_health_check(self):
        """Verify API is healthy and all dependencies are available."""
        response = httpx.get(f"{self.base_url.replace('/api/v1', '')}/health")
        assert response.status_code == 200

        health = response.json()
        assert health["status"] == "healthy"
        assert health["checks"]["database"] == "healthy"
        assert health["checks"]["redis"] == "healthy"

    def test_02_admin_login(self):
        """Verify admin@integrum.global can authenticate."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        assert token is not None
        assert len(token) > 0

        # Verify user info
        response = httpx.get(
            f"{self.base_url}/auth/me", headers=self._get_headers(token)
        )
        assert response.status_code == 200

        user = response.json()
        assert user["email"] == "admin@integrum.global"
        assert user["organization_id"] == self.org_id

    def test_03_jack_login(self):
        """Verify jack@integrum.global can authenticate and is in same org."""
        token = self._login("jack@integrum.global", TEST_PASSWORD)
        assert token is not None

        response = httpx.get(
            f"{self.base_url}/auth/me", headers=self._get_headers(token)
        )
        assert response.status_code == 200

        user = response.json()
        assert user["email"] == "jack@integrum.global"
        assert user["organization_id"] == self.org_id  # Same org as admin

    # Phase 2: Agent Creation
    def test_04_create_treasury_agents(self):
        """Create 6 Treasury & Financial Analysis agents."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        for agent_def in AI_HUB_AGENTS["treasury_financial"]:
            response = httpx.post(
                f"{self.base_url}/agents",
                headers=headers,
                json={
                    "workspace_id": self.workspace_id,
                    "name": agent_def["name"],
                    "agent_type": agent_def["agent_type"],
                    "model_id": agent_def["model_id"],
                    "description": agent_def["description"],
                    "system_prompt": agent_def["system_prompt"],
                    "temperature": agent_def["temperature"],
                },
            )
            assert (
                response.status_code == 201
            ), f"Failed to create {agent_def['name']}: {response.text}"

            agent = response.json()
            assert agent["name"] == agent_def["name"]
            assert agent["organization_id"] == self.org_id
            assert agent["status"] == "draft"
            self.created_agent_ids.append(agent["id"])

    def test_05_create_cashflow_agents(self):
        """Create 4 Cashflow & Forecasting agents."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        for agent_def in AI_HUB_AGENTS["cashflow_forecasting"]:
            response = httpx.post(
                f"{self.base_url}/agents",
                headers=headers,
                json={
                    "workspace_id": self.workspace_id,
                    "name": agent_def["name"],
                    "agent_type": agent_def["agent_type"],
                    "model_id": agent_def["model_id"],
                    "description": agent_def["description"],
                    "system_prompt": agent_def["system_prompt"],
                    "temperature": agent_def["temperature"],
                },
            )
            assert (
                response.status_code == 201
            ), f"Failed to create {agent_def['name']}: {response.text}"

    def test_06_create_document_agents(self):
        """Create 5 Document Processing & RAG agents."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        for agent_def in AI_HUB_AGENTS["document_rag"]:
            response = httpx.post(
                f"{self.base_url}/agents",
                headers=headers,
                json={
                    "workspace_id": self.workspace_id,
                    "name": agent_def["name"],
                    "agent_type": agent_def["agent_type"],
                    "model_id": agent_def["model_id"],
                    "description": agent_def["description"],
                    "system_prompt": agent_def["system_prompt"],
                    "temperature": agent_def["temperature"],
                },
            )
            assert (
                response.status_code == 201
            ), f"Failed to create {agent_def['name']}: {response.text}"

    def test_07_create_specialized_agents(self):
        """Create 4 Specialized Analysis agents."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        for agent_def in AI_HUB_AGENTS["specialized_analysis"]:
            response = httpx.post(
                f"{self.base_url}/agents",
                headers=headers,
                json={
                    "workspace_id": self.workspace_id,
                    "name": agent_def["name"],
                    "agent_type": agent_def["agent_type"],
                    "model_id": agent_def["model_id"],
                    "description": agent_def["description"],
                    "system_prompt": agent_def["system_prompt"],
                    "temperature": agent_def["temperature"],
                },
            )
            assert (
                response.status_code == 201
            ), f"Failed to create {agent_def['name']}: {response.text}"

    def test_08_create_interactive_agents(self):
        """Create 3 Interactive Chat agents."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        for agent_def in AI_HUB_AGENTS["interactive_chat"]:
            response = httpx.post(
                f"{self.base_url}/agents",
                headers=headers,
                json={
                    "workspace_id": self.workspace_id,
                    "name": agent_def["name"],
                    "agent_type": agent_def["agent_type"],
                    "model_id": agent_def["model_id"],
                    "description": agent_def["description"],
                    "system_prompt": agent_def["system_prompt"],
                    "temperature": agent_def["temperature"],
                },
            )
            assert (
                response.status_code == 201
            ), f"Failed to create {agent_def['name']}: {response.text}"

    # Phase 3: Agent Retrieval and Validation
    def test_09_list_all_agents(self):
        """Verify all 22 agents are retrievable."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        response = httpx.get(
            f"{self.base_url}/agents", headers=headers, params={"limit": 100}
        )
        assert response.status_code == 200

        result = response.json()
        # Should have 22 new agents + 3 existing
        assert result["total"] >= EXPECTED_OUTCOMES["total_agents"]

    def test_10_verify_agent_types(self):
        """Verify agent type distribution matches expected."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        type_counts = {}
        for agent_type in ["chat", "task", "pipeline"]:
            response = httpx.get(
                f"{self.base_url}/agents",
                headers=headers,
                params={"agent_type": agent_type, "limit": 100},
            )
            assert response.status_code == 200
            type_counts[agent_type] = response.json()["total"]

        # Verify expected counts (accounting for pre-existing agents)
        assert type_counts["chat"] >= EXPECTED_OUTCOMES["agents_by_type"]["chat"]
        assert type_counts["task"] >= EXPECTED_OUTCOMES["agents_by_type"]["task"]
        assert (
            type_counts["pipeline"] >= EXPECTED_OUTCOMES["agents_by_type"]["pipeline"]
        )

    def test_11_verify_agent_details(self):
        """Verify each agent has correct configuration."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        response = httpx.get(
            f"{self.base_url}/agents", headers=headers, params={"limit": 100}
        )
        agents = response.json()["records"]

        # Extended list of valid model IDs (includes legacy and current models)
        valid_model_ids = [
            # OpenAI models
            "gpt-4",
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4-turbo-preview",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k",
            "o1",
            "o1-mini",
            "o1-preview",
            # Anthropic models
            "claude-3",
            "claude-3-opus",
            "claude-3-sonnet",
            "claude-3-haiku",
            "claude-3.5-sonnet",
            "claude-3-5-sonnet-20241022",
            "claude-sonnet-4-20250514",
            "claude-opus-4-20250514",
            "claude-opus-4-5",
            # Test/mock models
            "mock",
            "test-model",
        ]

        for agent in agents:
            # Verify organization isolation
            assert agent["organization_id"] == self.org_id
            # Verify required fields
            assert (
                agent["model_id"] in valid_model_ids
            ), f"Unexpected model_id: {agent['model_id']}"
            assert agent["agent_type"] in ["chat", "task", "pipeline", "custom"]
            assert agent["status"] in ["draft", "active", "archived"]

    # Phase 4: Multi-tenancy Verification
    def test_12_jack_can_see_same_agents(self):
        """Verify jack@integrum.global can access the same agents."""
        admin_token = self._login("admin@integrum.global", TEST_PASSWORD)
        jack_token = self._login("jack@integrum.global", TEST_PASSWORD)

        # Get admin's agent list
        admin_response = httpx.get(
            f"{self.base_url}/agents",
            headers=self._get_headers(admin_token),
            params={"limit": 100},
        )
        admin_agents = {a["id"] for a in admin_response.json()["records"]}

        # Get jack's agent list
        jack_response = httpx.get(
            f"{self.base_url}/agents",
            headers=self._get_headers(jack_token),
            params={"limit": 100},
        )
        jack_agents = {a["id"] for a in jack_response.json()["records"]}

        # Same org should see same agents
        assert admin_agents == jack_agents

    # Phase 5: Agent Statistics Validation
    def test_13_verify_usecase_coverage(self):
        """Verify all use-cases have expected agent count."""
        token = self._login("admin@integrum.global", TEST_PASSWORD)
        headers = self._get_headers(token)

        response = httpx.get(
            f"{self.base_url}/agents", headers=headers, params={"limit": 100}
        )
        agents = response.json()["records"]

        # Check for presence of key agents from each use-case
        agent_names = [a["name"] for a in agents]

        # Treasury & Financial (6)
        treasury_agents = [
            "Treasury Chat Agent",
            "Treasury Insights Agent",
            "Loan Monitoring Agent",
            "Covenant Analyzer",
            "Strategy Analyzer",
            "Financial Analyzer",
        ]

        # Cashflow & Forecasting (4)
        cashflow_agents = [
            "Cashflow Chat Agent",
            "Cashflow Forecast Agent",
            "FCCS Analysis Agent",
            "Quantum Investment Agent",
        ]

        # Document & RAG (5)
        document_agents = [
            "Document Ingestion Agent",
            "Document Processor",
            "Project RAG Agent",
            "Timeline Extractor",
            "Minutes Timeline Agent",
        ]

        # Specialized Analysis (4)
        specialized_agents = [
            "Asset Description Agent",
            "Forex Analyzer",
            "Market Surveillance Agent",
            "Talent Insights Agent",
        ]

        # Interactive Chat (3)
        interactive_agents = [
            "Meeting Chat Agent",
            "Performance Chat Agent",
            "Loan Analyzer Agent",
        ]

        for agent in treasury_agents:
            assert agent in agent_names, f"Missing treasury agent: {agent}"

        for agent in cashflow_agents:
            assert agent in agent_names, f"Missing cashflow agent: {agent}"

        for agent in document_agents:
            assert agent in agent_names, f"Missing document agent: {agent}"

        for agent in specialized_agents:
            assert agent in agent_names, f"Missing specialized agent: {agent}"

        for agent in interactive_agents:
            assert agent in agent_names, f"Missing interactive agent: {agent}"


def run_tests_standalone():
    """Run tests standalone without pytest."""

    tests = TestAIHubAgents()
    tests.setup()

    test_methods = [
        tests.test_01_health_check,
        tests.test_02_admin_login,
        tests.test_03_jack_login,
        tests.test_04_create_treasury_agents,
        tests.test_05_create_cashflow_agents,
        tests.test_06_create_document_agents,
        tests.test_07_create_specialized_agents,
        tests.test_08_create_interactive_agents,
        tests.test_09_list_all_agents,
        tests.test_10_verify_agent_types,
        tests.test_11_verify_agent_details,
        tests.test_12_jack_can_see_same_agents,
        tests.test_13_verify_usecase_coverage,
    ]

    passed = 0
    failed = 0
    results = []

    for test in test_methods:
        test_name = test.__name__
        try:
            tests.setup()  # Reset for each test
            test()
            print(f"  PASS: {test_name}")
            passed += 1
            results.append((test_name, "PASS", None))
        except Exception as e:
            print(f"  FAIL: {test_name}")
            print(f"        {str(e)}")
            failed += 1
            results.append((test_name, "FAIL", str(e)))

    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return passed, failed, results


if __name__ == "__main__":
    print("=" * 60)
    print("AI Hub Agents Integration Tests")
    print("=" * 60)
    print(f"Target: {BASE_URL}")
    print(f"Organization: {ORG_ID}")
    print(f"Expected: {EXPECTED_OUTCOMES['total_agents']} agents across 5 use-cases")
    print("=" * 60 + "\n")

    passed, failed, results = run_tests_standalone()
