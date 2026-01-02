"""
Agent Execution API

Endpoints for executing agents with real LLM calls.
"""

import json
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from studio.api.auth import get_current_user
from studio.services.agent_service import AgentService
from studio.services.llm_service import LLMService

router = APIRouter(prefix="/agents", tags=["agent-execution"])


class ExecuteAgentRequest(BaseModel):
    """Request model for agent execution."""

    message: str = Field(..., description="User message to send to the agent")
    conversation_history: list | None = Field(
        default=None, description="Previous conversation messages"
    )
    stream: bool = Field(default=False, description="Whether to stream the response")


class ExecuteAgentResponse(BaseModel):
    """Response model for agent execution."""

    content: str = Field(..., description="Agent's response content")
    model: str = Field(..., description="Model used for generation")
    usage: dict = Field(default_factory=dict, description="Token usage statistics")
    finish_reason: str = Field(..., description="Reason for completion")
    thread_id: str = Field(..., description="Conversation thread ID")
    timestamp: str = Field(..., description="Response timestamp")


@router.post("/{agent_id}/execute", response_model=ExecuteAgentResponse)
async def execute_agent(
    agent_id: str,
    request: ExecuteAgentRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Execute an agent with a user message.

    This endpoint sends the message to the configured LLM (OpenAI, Anthropic, etc.)
    using the agent's system prompt and configuration.
    """
    agent_service = AgentService()
    llm_service = LLMService()

    # Get agent details
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check organization access
    if agent.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied to this agent")

    # Validate agent is active
    if agent.get("status") == "archived":
        raise HTTPException(status_code=400, detail="Cannot execute archived agent")

    model_id = agent.get("model_id", "gpt-4o")

    # Check if LLM is configured
    if not llm_service.is_configured(model_id):
        provider = llm_service.get_provider(model_id)
        raise HTTPException(
            status_code=503,
            detail=f"LLM provider '{provider}' not configured. Please set the API key.",
        )

    # Execute chat completion
    try:
        result = await llm_service.chat_completion(
            model_id=model_id,
            system_prompt=agent.get("system_prompt", ""),
            user_message=request.message,
            temperature=agent.get("temperature", 0.7),
            max_tokens=agent.get("max_tokens", 4096),
            conversation_history=request.conversation_history,
        )

        return ExecuteAgentResponse(
            content=result["content"],
            model=result["model"],
            usage=result["usage"],
            finish_reason=result["finish_reason"],
            thread_id=str(uuid.uuid4()),
            timestamp=datetime.now(UTC).isoformat(),
        )

    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM execution failed: {str(e)}")


@router.post("/{agent_id}/execute/stream")
async def execute_agent_stream(
    agent_id: str,
    request: ExecuteAgentRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Execute an agent with streaming response.

    Returns a Server-Sent Events stream of the agent's response.
    """
    agent_service = AgentService()
    llm_service = LLMService()

    # Get agent details
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check organization access
    if agent.get("organization_id") != current_user.get("organization_id"):
        raise HTTPException(status_code=403, detail="Access denied to this agent")

    # Validate agent is active
    if agent.get("status") == "archived":
        raise HTTPException(status_code=400, detail="Cannot execute archived agent")

    model_id = agent.get("model_id", "gpt-4o")

    # Check if LLM is configured
    if not llm_service.is_configured(model_id):
        provider = llm_service.get_provider(model_id)
        raise HTTPException(
            status_code=503,
            detail=f"LLM provider '{provider}' not configured. Please set the API key.",
        )

    async def generate():
        """Generate SSE events from LLM stream."""
        thread_id = str(uuid.uuid4())

        try:
            # Send start event
            start_event = {
                "type": "start",
                "thread_id": thread_id,
                "model": model_id,
                "timestamp": datetime.now(UTC).isoformat(),
            }
            yield f"event: start\ndata: {json.dumps(start_event)}\n\n"

            # Stream content
            async for chunk in llm_service.chat_completion_stream(
                model_id=model_id,
                system_prompt=agent.get("system_prompt", ""),
                user_message=request.message,
                temperature=agent.get("temperature", 0.7),
                max_tokens=agent.get("max_tokens", 4096),
                conversation_history=request.conversation_history,
            ):
                chunk_event = {
                    "type": "content",
                    "content": chunk,
                    "thread_id": thread_id,
                }
                yield f"event: content\ndata: {json.dumps(chunk_event)}\n\n"

            # Send done event
            done_event = {
                "type": "done",
                "thread_id": thread_id,
                "timestamp": datetime.now(UTC).isoformat(),
            }
            yield f"event: done\ndata: {json.dumps(done_event)}\n\n"

        except Exception as e:
            error_event = {
                "type": "error",
                "error": str(e),
                "thread_id": thread_id,
            }
            yield f"event: error\ndata: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{agent_id}/execute/status")
async def check_agent_execution_status(
    agent_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Check if an agent can be executed.

    Returns configuration status for the agent's LLM provider.
    """
    agent_service = AgentService()
    llm_service = LLMService()

    # Get agent details
    agent = await agent_service.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    model_id = agent.get("model_id", "gpt-4o")
    provider = llm_service.get_provider(model_id)
    is_configured = llm_service.is_configured(model_id)

    return {
        "agent_id": agent_id,
        "agent_name": agent.get("name"),
        "model_id": model_id,
        "provider": provider,
        "is_configured": is_configured,
        "status": agent.get("status"),
        "can_execute": is_configured and agent.get("status") != "archived",
        "message": (
            "Ready to execute"
            if is_configured
            else f"Please configure {provider.upper()}_API_KEY environment variable"
        ),
    }
