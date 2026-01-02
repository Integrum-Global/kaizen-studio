# TODO-012: Connectors

**Status**: PENDING
**Priority**: MEDIUM
**Estimated Effort**: 5 days (Week 12)
**Phase**: 3 - Enterprise Governance
**Pillar**: BUILD, ORCHESTRATE

---

## Objective

Implement data connectors framework with built-in connectors for common data sources, connection testing, and agent integration.

---

## Acceptance Criteria

### Backend
- [ ] Connector framework with base class
- [ ] Built-in connectors: PostgreSQL, MySQL, S3, Salesforce
- [ ] Connector test endpoint
- [ ] Connector usage in agents (tools)
- [ ] Connector permission management

### Frontend
- [ ] Connector list and creation page
- [ ] Connection configuration wizard (per type)
- [ ] Connector test UI
- [ ] Connector assignment to agents

---

## Technical Approach

### DataFlow Models
```python
@db.model
class Connector:
    id: str
    organization_id: str
    name: str
    connector_type: str  # postgresql, mysql, s3, salesforce
    status: str  # connected, error, disabled
    connection_config_encrypted: str  # Encrypted JSON
    allowed_operations: dict  # ["read", "write"]
    allowed_objects: dict  # ["Account", "Contact"]
    mask_pii: bool
    audit_queries: bool
    cache_enabled: bool
    cache_ttl_seconds: int
    queries_per_minute: int
    last_test_at: Optional[str]
    last_test_status: str

@db.model
class ConnectorPermission:
    id: str
    connector_id: str
    agent_id: str
    operations: dict  # ["read"]
```

### Connector Framework
```python
class BaseConnector(ABC):
    @abstractmethod
    async def connect(self) -> bool:
        """Test connection"""
        pass

    @abstractmethod
    async def execute(self, operation: str, params: dict) -> Any:
        """Execute operation"""
        pass

    @abstractmethod
    def get_schema(self) -> dict:
        """Return available objects/tables"""
        pass

class PostgreSQLConnector(BaseConnector):
    async def connect(self) -> bool:
        # Test PostgreSQL connection
        pass

    async def execute(self, operation: str, params: dict):
        if operation == "query":
            return await self.execute_query(params["sql"])
        elif operation == "insert":
            return await self.insert(params["table"], params["data"])
```

### Connector Categories
- **Databases**: PostgreSQL, MySQL, SQL Server, MongoDB
- **Storage**: S3, Azure Blob, GCS
- **SaaS**: Salesforce, HubSpot, Zendesk
- **APIs**: REST, GraphQL

---

## Dependencies

- TODO-010: Gateway Management (connectors used by deployed agents)

---

## Risk Assessment

- **MEDIUM**: Connector reliability - Mitigation: Connection pooling, retry logic
- **MEDIUM**: Security of credentials - Mitigation: Vault encryption, no logging
- **LOW**: PII exposure - Mitigation: Masking, audit logging

---

## Subtasks

### Day 1: Connector Framework
- [ ] Implement Connector DataFlow model (Est: 2h)
- [ ] Create BaseConnector abstract class (Est: 2h)
- [ ] Implement connector factory (Est: 2h)
- [ ] Add encrypted config storage (Est: 2h)

### Day 2: Database Connectors
- [ ] Implement PostgreSQLConnector (Est: 3h)
- [ ] Implement MySQLConnector (Est: 2h)
- [ ] Add schema discovery (Est: 3h)

### Day 3: Cloud Connectors
- [ ] Implement S3Connector (Est: 3h)
- [ ] Implement SalesforceConnector (Est: 4h)
- [ ] Add OAuth flow for Salesforce (Est: 1h)

### Day 4: Agent Integration
- [ ] Implement ConnectorPermission model (Est: 2h)
- [ ] Create connector tools for agents (Est: 3h)
- [ ] Add connector test endpoint (Est: 2h)
- [ ] Implement query auditing (Est: 1h)

### Day 5: Frontend
- [ ] Build connector list page (Est: 2h)
- [ ] Create configuration wizard (Est: 3h)
- [ ] Build connector test UI (Est: 2h)
- [ ] Add connector assignment to agents (Est: 1h)

---

## Testing Requirements

### Tier 1: Unit Tests
- [ ] Connector validation logic
- [ ] Config encryption/decryption
- [ ] Permission checking
- [ ] Schema parsing

### Tier 2: Integration Tests
- [ ] PostgreSQL connector with real database
- [ ] S3 connector with LocalStack
- [ ] Connector test endpoint
- [ ] Query auditing

### Tier 3: E2E Tests
- [ ] Complete connector creation flow
- [ ] Connector testing from UI
- [ ] Agent using connector tool
- [ ] PII masking verification

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (3-tier strategy)
- [ ] 4 connectors fully functional
- [ ] Agents can use connector tools
- [ ] Credentials securely stored
- [ ] Code review completed

---

## Related Documentation

- [06-enterprise-saas-product.md](../../docs/implement/06-enterprise-saas-product.md) - Data Connectors specification
- [07-enterprise-dataflow-models.md](../../docs/implement/07-enterprise-dataflow-models.md) - Connector models
- [08-implementation-roadmap.md](../../docs/implement/08-implementation-roadmap.md) - Week 12 tasks
