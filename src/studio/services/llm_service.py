"""
LLM Service

Service for executing agents against various LLM providers.
Supports OpenAI, Anthropic, and Azure OpenAI.
"""

import os
from collections.abc import AsyncGenerator

import httpx


class LLMService:
    """
    LLM execution service for chat completions.

    Supports:
    - OpenAI (gpt-4, gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
    - Anthropic (claude-3-opus, claude-3-sonnet, claude-3-haiku)
    - Azure OpenAI
    """

    # Model to provider mapping
    PROVIDER_MAP = {
        # OpenAI models
        "gpt-4": "openai",
        "gpt-4o": "openai",
        "gpt-4o-mini": "openai",
        "gpt-4-turbo": "openai",
        "gpt-4-turbo-preview": "openai",
        "gpt-3.5-turbo": "openai",
        "gpt-3.5-turbo-16k": "openai",
        # Anthropic models
        "claude-3-opus-20240229": "anthropic",
        "claude-3-sonnet-20240229": "anthropic",
        "claude-3-haiku-20240307": "anthropic",
        "claude-3-5-sonnet-20241022": "anthropic",
        "claude-3-5-haiku-20241022": "anthropic",
        "claude-opus-4-5-20251101": "anthropic",
        # Shortcuts
        "claude-3-opus": "anthropic",
        "claude-3-sonnet": "anthropic",
        "claude-3-haiku": "anthropic",
        "claude-3.5-sonnet": "anthropic",
        "claude-3.5-haiku": "anthropic",
        "claude-opus-4.5": "anthropic",
    }

    # Model name normalization
    MODEL_NORMALIZE = {
        "claude-3-opus": "claude-3-opus-20240229",
        "claude-3-sonnet": "claude-3-sonnet-20240229",
        "claude-3-haiku": "claude-3-haiku-20240307",
        "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
        "claude-3.5-haiku": "claude-3-5-haiku-20241022",
        "claude-opus-4.5": "claude-opus-4-5-20251101",
    }

    def __init__(self):
        """Initialize LLM service with API keys from environment."""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.azure_api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

    def get_provider(self, model_id: str) -> str:
        """Get the provider for a given model ID."""
        return self.PROVIDER_MAP.get(model_id, "openai")

    def normalize_model(self, model_id: str) -> str:
        """Normalize model name to full version string."""
        return self.MODEL_NORMALIZE.get(model_id, model_id)

    async def chat_completion(
        self,
        model_id: str,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        conversation_history: list | None = None,
    ) -> dict:
        """
        Execute a chat completion request.

        Args:
            model_id: Model identifier (e.g., 'gpt-4o', 'claude-3-sonnet')
            system_prompt: System prompt for the agent
            user_message: User's message
            temperature: Temperature setting (0.0-2.0)
            max_tokens: Maximum tokens in response
            conversation_history: Optional list of previous messages

        Returns:
            Dict with 'content', 'model', 'usage', 'finish_reason'
        """
        provider = self.get_provider(model_id)
        model = self.normalize_model(model_id)

        if provider == "anthropic":
            return await self._anthropic_chat(
                model,
                system_prompt,
                user_message,
                temperature,
                max_tokens,
                conversation_history,
            )
        else:
            return await self._openai_chat(
                model,
                system_prompt,
                user_message,
                temperature,
                max_tokens,
                conversation_history,
            )

    async def chat_completion_stream(
        self,
        model_id: str,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        conversation_history: list | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Execute a streaming chat completion request.

        Args:
            model_id: Model identifier
            system_prompt: System prompt for the agent
            user_message: User's message
            temperature: Temperature setting
            max_tokens: Maximum tokens
            conversation_history: Optional previous messages

        Yields:
            Chunks of the response content
        """
        provider = self.get_provider(model_id)
        model = self.normalize_model(model_id)

        if provider == "anthropic":
            async for chunk in self._anthropic_stream(
                model,
                system_prompt,
                user_message,
                temperature,
                max_tokens,
                conversation_history,
            ):
                yield chunk
        else:
            async for chunk in self._openai_stream(
                model,
                system_prompt,
                user_message,
                temperature,
                max_tokens,
                conversation_history,
            ):
                yield chunk

    async def _openai_chat(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        temperature: float,
        max_tokens: int,
        conversation_history: list | None,
    ) -> dict:
        """Execute OpenAI chat completion."""
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens if max_tokens > 0 else None,
                },
            )
            response.raise_for_status()
            data = response.json()

        choice = data["choices"][0]
        return {
            "content": choice["message"]["content"],
            "model": data["model"],
            "usage": data.get("usage", {}),
            "finish_reason": choice.get("finish_reason", "stop"),
        }

    async def _anthropic_chat(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        temperature: float,
        max_tokens: int,
        conversation_history: list | None,
    ) -> dict:
        """Execute Anthropic chat completion."""
        if not self.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        messages = []
        if conversation_history:
            for msg in conversation_history:
                role = msg["role"]
                if role == "system":
                    continue  # Anthropic uses separate system param
                messages.append({"role": role, "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "system": system_prompt if system_prompt else None,
                    "messages": messages,
                    "temperature": min(temperature, 1.0),  # Anthropic max is 1.0
                    "max_tokens": max_tokens if max_tokens > 0 else 4096,
                },
            )
            response.raise_for_status()
            data = response.json()

        content_blocks = data.get("content", [])
        text_content = ""
        for block in content_blocks:
            if block.get("type") == "text":
                text_content += block.get("text", "")

        return {
            "content": text_content,
            "model": data.get("model", model),
            "usage": {
                "prompt_tokens": data.get("usage", {}).get("input_tokens", 0),
                "completion_tokens": data.get("usage", {}).get("output_tokens", 0),
                "total_tokens": (
                    data.get("usage", {}).get("input_tokens", 0)
                    + data.get("usage", {}).get("output_tokens", 0)
                ),
            },
            "finish_reason": data.get("stop_reason", "end_turn"),
        }

    async def _openai_stream(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        temperature: float,
        max_tokens: int,
        conversation_history: list | None,
    ) -> AsyncGenerator[str, None]:
        """Execute streaming OpenAI chat completion."""
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if conversation_history:
            messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens if max_tokens > 0 else None,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            import json

                            chunk = json.loads(data)
                            delta = chunk["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield delta["content"]
                        except Exception:
                            continue

    async def _anthropic_stream(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        temperature: float,
        max_tokens: int,
        conversation_history: list | None,
    ) -> AsyncGenerator[str, None]:
        """Execute streaming Anthropic chat completion."""
        if not self.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        messages = []
        if conversation_history:
            for msg in conversation_history:
                role = msg["role"]
                if role == "system":
                    continue
                messages.append({"role": role, "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "system": system_prompt if system_prompt else None,
                    "messages": messages,
                    "temperature": min(temperature, 1.0),
                    "max_tokens": max_tokens if max_tokens > 0 else 4096,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        try:
                            import json

                            event = json.loads(data)
                            event_type = event.get("type")
                            if event_type == "content_block_delta":
                                delta = event.get("delta", {})
                                if delta.get("type") == "text_delta":
                                    yield delta.get("text", "")
                            elif event_type == "message_stop":
                                break
                        except Exception:
                            continue

    def is_configured(self, model_id: str) -> bool:
        """Check if the required API key is configured for a model."""
        provider = self.get_provider(model_id)
        if provider == "anthropic":
            return bool(self.anthropic_api_key)
        elif provider == "azure":
            return bool(self.azure_api_key and self.azure_endpoint)
        else:
            return bool(self.openai_api_key)
