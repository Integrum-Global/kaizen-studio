  Why kaizen-studio needed scripts/create_tables_sql.py:

  The default auto_migrate=True creates database tables synchronously during @db.model registration. In Docker/FastAPI, module imports happen when uvicorn starts - but the event loop may already be running, causing:

  RuntimeError: Cannot run the event loop while another loop is running

  The Solution (v0.10.7+)

  # Step 1: Disable auto_migrate
  db = DataFlow("postgresql://...", auto_migrate=False)

  # Step 2: Register models (no tables created)
  @db.model
  class User:
      id: str
      ...

  # Step 3: Create tables in FastAPI lifespan
  @asynccontextmanager
  async def lifespan(app: FastAPI):
      await db.create_tables_async()  # Event loop is ready
      yield
      await db.close_async()

  # Step 4: Use Express for 23x faster CRUD
  await db.express.create("User", data)

  When to Use Each Pattern

  | Context        | Pattern                                    | Reason                       |
  |----------------|--------------------------------------------|------------------------------|
  | Docker/FastAPI | auto_migrate=False + create_tables_async() | Event loop running at import |
  | CLI Scripts    | auto_migrate=True (default)                | No event loop, sync is safe  |
  | pytest (sync)  | auto_migrate=True (default)                | No async fixtures            |
  | pytest (async) | auto_migrate=False + create_tables_async() | Same as FastAPI              |

  DataFlow Express Performance

  | Operation | Workflow | Express | Speedup |
  |-----------|----------|---------|---------|
  | Create    | ~6.3ms   | ~0.27ms | 23x     |
  | Read      | ~5.8ms   | ~0.24ms | 24x     |
  | Update    | ~6.1ms   | ~0.26ms | 23x     |
  | Delete    | ~5.9ms   | ~0.25ms | 24x     |

  Now kaizen-studio (and future projects) can remove the raw SQL workaround and use the proper DataFlow pattern directly.
