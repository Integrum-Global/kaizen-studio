"""
ABAC Service

Handles attribute-based access control operations.
"""

import json
import uuid
from datetime import UTC, datetime
from typing import Any

from kailash.runtime import AsyncLocalRuntime
from kailash.workflow.builder import WorkflowBuilder

# Condition operators for policy evaluation
CONDITION_OPERATORS = {
    "eq": lambda a, b: a == b,
    "ne": lambda a, b: a != b,
    "gt": lambda a, b: a > b if a is not None and b is not None else False,
    "gte": lambda a, b: a >= b if a is not None and b is not None else False,
    "lt": lambda a, b: a < b if a is not None and b is not None else False,
    "lte": lambda a, b: a <= b if a is not None and b is not None else False,
    "in": lambda a, b: a in b if b is not None else False,
    "not_in": lambda a, b: a not in b if b is not None else True,
    "contains": lambda a, b: b in a if a is not None else False,
    "starts_with": lambda a, b: str(a).startswith(str(b)) if a is not None else False,
    "ends_with": lambda a, b: str(a).endswith(str(b)) if a is not None else False,
    "matches": lambda a, b: _regex_match(a, b),
    "exists": lambda a, b: a is not None,
    "not_exists": lambda a, b: a is None,
}


def _regex_match(value: Any, pattern: str) -> bool:
    """Helper for regex matching."""
    import re

    try:
        return bool(re.match(pattern, str(value)))
    except Exception:
        return False


class ABACService:
    """
    ABAC service for managing attribute-based access control.

    Features:
    - Policy CRUD operations
    - Policy assignment to users, teams, and roles
    - Condition evaluation with multiple operators
    - Priority-based policy evaluation
    - Support for allow/deny effects
    """

    def __init__(self, runtime=None):
        """Initialize the ABAC service."""
        self.runtime = runtime or AsyncLocalRuntime()

    # ==================== Policy CRUD ====================

    async def create_policy(
        self,
        organization_id: str,
        name: str,
        resource_type: str,
        action: str,
        effect: str,
        conditions: dict,
        created_by: str,
        description: str | None = None,
        priority: int = 0,
        status: str = "active",
    ) -> dict:
        """
        Create a new ABAC policy.

        Args:
            organization_id: Organization ID
            name: Policy name
            resource_type: Resource type (agent, deployment, pipeline, *)
            action: Action (create, read, update, delete, *)
            effect: Effect (allow, deny)
            conditions: Condition dictionary
            created_by: User ID who created the policy
            description: Optional description
            priority: Evaluation priority (higher = first)
            status: Policy status (active, inactive)

        Returns:
            Created policy record
        """
        policy_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyCreateNode",
            "create_policy",
            {
                "id": policy_id,
                "organization_id": organization_id,
                "name": name,
                "description": description or "",
                "resource_type": resource_type,
                "action": action,
                "effect": effect,
                "conditions": json.dumps(conditions),
                "priority": priority,
                "status": status,
                "created_by": created_by,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create_policy")

    async def get_policy(self, policy_id: str) -> dict | None:
        """
        Get a policy by ID.

        Args:
            policy_id: Policy ID

        Returns:
            Policy record or None
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyReadNode",
            "read_policy",
            {
                "id": policy_id,
                "raise_on_not_found": False,  # Return None instead of raising
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        policy = results.get("read_policy")
        # When raise_on_not_found=False, ReadNode returns {'id': ..., 'found': False}
        if policy and policy.get("found") is False:
            return None
        if policy and policy.get("conditions"):
            policy["conditions"] = json.loads(policy["conditions"])
        return policy

    async def update_policy(self, policy_id: str, data: dict) -> dict | None:
        """
        Update a policy.

        Args:
            policy_id: Policy ID
            data: Fields to update

        Returns:
            Updated policy record
        """
        update_data = {**data}

        # Serialize conditions if present
        if "conditions" in update_data:
            update_data["conditions"] = json.dumps(update_data["conditions"])

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyUpdateNode",
            "update_policy",
            {
                "filter": {"id": policy_id},
                "fields": update_data,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        # Return updated policy
        return await self.get_policy(policy_id)

    async def delete_policy(self, policy_id: str) -> bool:
        """
        Delete a policy and its assignments.

        Args:
            policy_id: Policy ID

        Returns:
            True if deleted
        """
        # First delete all assignments for this policy
        await self._delete_policy_assignments(policy_id)

        # Then delete the policy
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyDeleteNode",
            "delete_policy",
            {
                "id": policy_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
        return True

    async def _delete_policy_assignments(self, policy_id: str) -> None:
        """Delete all assignments for a policy."""
        # Get assignments
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyAssignmentListNode",
            "list_assignments",
            {
                "filter": {"policy_id": policy_id},
                "enable_cache": False,  # Disable cache for fresh data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        assignments = results.get("list_assignments", {}).get("records", [])

        # Delete each assignment
        for assignment in assignments:
            delete_workflow = WorkflowBuilder()
            delete_workflow.add_node(
                "PolicyAssignmentDeleteNode",
                "delete_assignment",
                {
                    "id": assignment["id"],
                },
            )
            await self.runtime.execute_workflow_async(
                delete_workflow.build(), inputs={}
            )

    async def list_policies(
        self,
        organization_id: str,
        status: str | None = None,
        resource_type: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict]:
        """
        List policies for an organization.

        Args:
            organization_id: Organization ID
            status: Filter by status
            resource_type: Filter by resource type
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            List of policy records
        """
        filter_dict = {"organization_id": organization_id}
        if status:
            filter_dict["status"] = status
        if resource_type:
            filter_dict["resource_type"] = resource_type

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyListNode",
            "list_policies",
            {
                "filter": filter_dict,
                "limit": limit,
                "offset": offset,
                "enable_cache": False,  # Disable cache for fresh data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        policies = results.get("list_policies", {}).get("records", [])

        # Parse conditions for each policy
        for policy in policies:
            if policy.get("conditions"):
                policy["conditions"] = json.loads(policy["conditions"])

        return policies

    # ==================== Policy Assignments ====================

    async def assign_policy(
        self,
        policy_id: str,
        principal_type: str,
        principal_id: str,
    ) -> dict:
        """
        Assign a policy to a principal.

        Args:
            policy_id: Policy ID
            principal_type: Type of principal (user, team, role)
            principal_id: ID of the principal

        Returns:
            Created assignment record
        """
        assignment_id = str(uuid.uuid4())

        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyAssignmentCreateNode",
            "create_assignment",
            {
                "id": assignment_id,
                "policy_id": policy_id,
                "principal_type": principal_type,
                "principal_id": principal_id,
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("create_assignment")

    async def unassign_policy(self, assignment_id: str) -> bool:
        """
        Remove a policy assignment.

        Args:
            assignment_id: Assignment ID

        Returns:
            True if removed
        """
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyAssignmentDeleteNode",
            "delete_assignment",
            {
                "id": assignment_id,
            },
        )

        await self.runtime.execute_workflow_async(workflow.build(), inputs={})
        return True

    async def get_user_policies(self, user_id: str) -> list[dict]:
        """
        Get all policies applicable to a user.

        This includes:
        - Policies assigned directly to the user
        - Policies assigned to the user's teams
        - Policies assigned to the user's role

        Args:
            user_id: User ID

        Returns:
            List of policy records
        """
        policies = []
        seen_ids = set()

        # Get user info for role
        user_workflow = WorkflowBuilder()
        user_workflow.add_node(
            "UserReadNode",
            "read_user",
            {
                "id": user_id,
            },
        )

        user_results, _ = await self.runtime.execute_workflow_async(
            user_workflow.build(), inputs={}
        )
        user = user_results.get("read_user")

        # Get policies assigned directly to user
        user_assignments = await self._get_assignments_for_principal("user", user_id)
        for assignment in user_assignments:
            if assignment["policy_id"] not in seen_ids:
                policy = await self.get_policy(assignment["policy_id"])
                if policy and policy.get("status") == "active":
                    policies.append(policy)
                    seen_ids.add(assignment["policy_id"])

        # Get policies assigned to user's teams
        team_workflow = WorkflowBuilder()
        team_workflow.add_node(
            "TeamMembershipListNode",
            "list_memberships",
            {
                "filter": {"user_id": user_id},
                "enable_cache": False,  # Disable cache for fresh data
            },
        )

        team_results, _ = await self.runtime.execute_workflow_async(
            team_workflow.build(), inputs={}
        )

        memberships = team_results.get("list_memberships", {}).get("records", [])
        for membership in memberships:
            team_assignments = await self._get_assignments_for_principal(
                "team", membership["team_id"]
            )
            for assignment in team_assignments:
                if assignment["policy_id"] not in seen_ids:
                    policy = await self.get_policy(assignment["policy_id"])
                    if policy and policy.get("status") == "active":
                        policies.append(policy)
                        seen_ids.add(assignment["policy_id"])

        # Get policies assigned to user's role
        if user and user.get("role"):
            role_assignments = await self._get_assignments_for_principal(
                "role", user["role"]
            )
            for assignment in role_assignments:
                if assignment["policy_id"] not in seen_ids:
                    policy = await self.get_policy(assignment["policy_id"])
                    if policy and policy.get("status") == "active":
                        policies.append(policy)
                        seen_ids.add(assignment["policy_id"])

        # Sort by priority (higher first)
        policies.sort(key=lambda p: p.get("priority", 0), reverse=True)

        return policies

    async def _get_assignments_for_principal(
        self, principal_type: str, principal_id: str
    ) -> list[dict]:
        """Get all assignments for a principal."""
        workflow = WorkflowBuilder()
        workflow.add_node(
            "PolicyAssignmentListNode",
            "list_assignments",
            {
                "filter": {
                    "principal_type": principal_type,
                    "principal_id": principal_id,
                },
                "enable_cache": False,  # Disable cache for fresh data
            },
        )

        results, _ = await self.runtime.execute_workflow_async(
            workflow.build(), inputs={}
        )

        return results.get("list_assignments", {}).get("records", [])

    # ==================== Policy Evaluation ====================

    async def evaluate(
        self,
        user_id: str,
        resource_type: str,
        action: str,
        resource: dict | None = None,
        context: dict | None = None,
    ) -> bool:
        """
        Evaluate if a user is allowed to perform an action on a resource.

        The evaluation follows these rules:
        1. Policies are evaluated in priority order (highest first)
        2. Explicit deny takes precedence over allow
        3. If no matching policies, default is ALLOW (to not break existing RBAC flow)

        This is designed to work as an additional layer on top of RBAC.
        RBAC must pass first, then ABAC policies can further restrict access.

        Args:
            user_id: User ID
            resource_type: Type of resource (agent, deployment, etc.)
            action: Action to perform (create, read, update, delete)
            resource: Resource attributes for condition evaluation
            context: Additional context (time, IP, etc.)

        Returns:
            True if action is allowed, False otherwise
        """
        # Get all applicable policies for the user
        policies = await self.get_user_policies(user_id)

        # If no policies exist, allow by default (RBAC already passed)
        if not policies:
            return True

        # Build evaluation context
        eval_context = self._build_evaluation_context(
            user_id, resource or {}, context or {}
        )

        # Track explicit allow/deny and whether any policy matched
        has_explicit_allow = False
        has_explicit_deny = False
        any_policy_matched = False

        for policy in policies:
            # Check if policy applies to this resource/action
            if not self._policy_matches_request(policy, resource_type, action):
                continue

            any_policy_matched = True

            # Evaluate conditions
            conditions = policy.get("conditions", {})
            if self._evaluate_conditions(conditions, eval_context):
                effect = policy.get("effect", "deny")
                if effect == "deny":
                    has_explicit_deny = True
                    # Explicit deny is final
                    return False
                elif effect == "allow":
                    has_explicit_allow = True

        # If no policies matched this resource/action, allow by default
        if not any_policy_matched:
            return True

        # If policies matched but none explicitly allowed, deny
        # (unless there was an explicit deny, which already returned False)
        return has_explicit_allow

    def _build_evaluation_context(
        self, user_id: str, resource: dict, context: dict
    ) -> dict:
        """Build the evaluation context with resource, user, and context data."""
        now = datetime.now(UTC)
        return {
            "resource": resource,
            "user": {"id": user_id},
            "context": {
                "time": {
                    "hour": now.hour,
                    "minute": now.minute,
                    "day_of_week": now.weekday(),
                    "day": now.day,
                    "month": now.month,
                    "year": now.year,
                },
                **context,
            },
        }

    def _policy_matches_request(
        self, policy: dict, resource_type: str, action: str
    ) -> bool:
        """Check if a policy matches the requested resource and action."""
        policy_resource = policy.get("resource_type", "")
        policy_action = policy.get("action", "")

        # Check resource type match
        if policy_resource != "*" and policy_resource != resource_type:
            return False

        # Check action match
        if policy_action != "*" and policy_action != action:
            return False

        return True

    def _evaluate_conditions(self, conditions: dict, context: dict) -> bool:
        """
        Evaluate policy conditions against the context.

        Supports:
        - "all": All conditions must be true (AND)
        - "any": At least one condition must be true (OR)
        - Single condition objects

        Args:
            conditions: Condition dictionary
            context: Evaluation context

        Returns:
            True if conditions are satisfied
        """
        if not conditions:
            return True

        # Handle "all" (AND)
        if "all" in conditions:
            return all(
                self._evaluate_single_condition(cond, context)
                for cond in conditions["all"]
            )

        # Handle "any" (OR)
        if "any" in conditions:
            return any(
                self._evaluate_single_condition(cond, context)
                for cond in conditions["any"]
            )

        # Single condition
        if "field" in conditions:
            return self._evaluate_single_condition(conditions, context)

        return True

    def _evaluate_single_condition(self, condition: dict, context: dict) -> bool:
        """
        Evaluate a single condition.

        Condition format:
        {
            "field": "resource.status",
            "op": "eq",
            "value": "active"
        }

        Args:
            condition: Single condition dict
            context: Evaluation context

        Returns:
            True if condition is satisfied
        """
        field_path = condition.get("field", "")
        operator = condition.get("op", "eq")
        expected_value = condition.get("value")

        # Get actual value from context
        actual_value = self._get_nested_value(context, field_path)

        # Get operator function
        op_func = CONDITION_OPERATORS.get(operator)
        if not op_func:
            return False

        try:
            return op_func(actual_value, expected_value)
        except Exception:
            return False

    def _get_nested_value(self, data: dict, path: str) -> Any:
        """
        Get a nested value from a dictionary using dot notation.

        Args:
            data: Source dictionary
            path: Dot-separated path (e.g., "resource.status")

        Returns:
            Value at path or None
        """
        if not path:
            return None

        parts = path.split(".")
        current = data

        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None

            if current is None:
                return None

        return current

    async def evaluate_conditions(
        self, conditions: dict, resource: dict, context: dict
    ) -> bool:
        """
        Public method to evaluate conditions for testing/debugging.

        Args:
            conditions: Condition dictionary
            resource: Resource attributes
            context: Additional context

        Returns:
            True if conditions are satisfied
        """
        eval_context = {
            "resource": resource,
            "context": context,
        }
        return self._evaluate_conditions(conditions, eval_context)

    # ==================== Reference Management ====================

    async def validate_conditions(
        self, conditions: dict, organization_id: str
    ) -> dict:
        """
        Validate policy conditions structure and resource references.

        Args:
            conditions: Conditions dictionary to validate
            organization_id: Organization ID for resource lookups

        Returns:
            Validation result with is_valid, errors, and warnings
        """
        errors = []
        warnings = []
        references = []

        # Extract resource references from conditions
        refs = self._extract_resource_references(conditions)

        # Validate each reference
        for ref in refs:
            ref_status = await self._validate_resource_reference(
                ref, organization_id
            )
            references.append(ref_status)

            if ref_status["status"] == "orphaned":
                warnings.append(
                    f"Resource not found: {ref_status['type']} '{ref_status.get('name', ref_status['id'])}'"
                )
            elif ref_status["status"] == "changed":
                warnings.append(
                    f"Resource may have changed: {ref_status['type']} '{ref_status.get('name', ref_status['id'])}'"
                )

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "references": references,
        }

    async def get_policy_references(
        self, policy_id: str, organization_id: str
    ) -> list[dict]:
        """
        Get resource references used in a policy's conditions.

        Args:
            policy_id: Policy ID
            organization_id: Organization ID for resource lookups

        Returns:
            List of resource references with current status
        """
        policy = await self.get_policy(policy_id)
        if not policy:
            return []

        conditions = policy.get("conditions", {})

        # Check for stored references first
        stored_refs_str = policy.get("resource_refs")
        if stored_refs_str:
            stored_refs = json.loads(stored_refs_str)
        else:
            stored_refs = []

        # Extract current references from conditions
        current_refs = self._extract_resource_references(conditions)

        # Validate each reference
        validated_refs = []
        for ref in current_refs:
            ref_status = await self._validate_resource_reference(ref, organization_id)
            validated_refs.append(ref_status)

        return validated_refs

    def _extract_resource_references(self, conditions: dict) -> list[dict]:
        """
        Extract resource references from conditions.

        Looks for $ref: "resource" patterns in condition values.

        Args:
            conditions: Conditions dictionary

        Returns:
            List of resource reference dictionaries
        """
        refs = []

        def extract_from_value(value: Any) -> None:
            if isinstance(value, dict):
                if value.get("$ref") == "resource":
                    refs.append({
                        "type": value.get("type", "unknown"),
                        "id": value.get("selector", {}).get("id"),
                        "ids": value.get("selector", {}).get("ids"),
                        "name": value.get("display", {}).get("name"),
                    })
                else:
                    for v in value.values():
                        extract_from_value(v)
            elif isinstance(value, list):
                for item in value:
                    extract_from_value(item)

        extract_from_value(conditions)
        return refs

    async def _validate_resource_reference(
        self, ref: dict, organization_id: str
    ) -> dict:
        """
        Validate a single resource reference.

        Args:
            ref: Resource reference dict with type, id/ids
            organization_id: Organization ID

        Returns:
            Reference status dict with status field
        """
        now = datetime.now(UTC).isoformat()
        ref_type = ref.get("type", "unknown")
        ref_id = ref.get("id")
        ref_ids = ref.get("ids", [])

        # Handle single ID
        if ref_id:
            exists = await self._check_resource_exists(ref_type, ref_id, organization_id)
            return {
                "type": ref_type,
                "id": ref_id,
                "name": ref.get("name"),
                "status": "valid" if exists else "orphaned",
                "validated_at": now,
            }

        # Handle multiple IDs
        if ref_ids:
            all_exist = True
            for rid in ref_ids:
                if not await self._check_resource_exists(ref_type, rid, organization_id):
                    all_exist = False
                    break

            return {
                "type": ref_type,
                "ids": ref_ids,
                "name": ref.get("name"),
                "status": "valid" if all_exist else "orphaned",
                "validated_at": now,
            }

        # No ID provided
        return {
            "type": ref_type,
            "id": None,
            "name": ref.get("name"),
            "status": "orphaned",
            "validated_at": now,
        }

    async def _check_resource_exists(
        self, resource_type: str, resource_id: str, organization_id: str
    ) -> bool:
        """
        Check if a resource exists.

        Args:
            resource_type: Type of resource (agent, team, deployment, etc.)
            resource_id: Resource ID
            organization_id: Organization ID

        Returns:
            True if resource exists
        """
        # Map resource types to their read nodes
        node_map = {
            "agent": "AgentReadNode",
            "deployment": "DeploymentReadNode",
            "pipeline": "PipelineReadNode",
            "gateway": "GatewayReadNode",
            "team": "TeamReadNode",
            "user": "UserReadNode",
            "workspace": "WorkspaceReadNode",
        }

        node_name = node_map.get(resource_type)
        if not node_name:
            # Unknown resource type - assume exists to avoid false orphans
            return True

        try:
            workflow = WorkflowBuilder()
            workflow.add_node(
                node_name,
                "check_resource",
                {
                    "id": resource_id,
                    "raise_on_not_found": False,
                },
            )

            results, _ = await self.runtime.execute_workflow_async(
                workflow.build(), inputs={}
            )

            result = results.get("check_resource")
            if result and result.get("found") is False:
                return False
            return result is not None

        except Exception:
            # On error, assume exists to avoid false orphans
            return True
