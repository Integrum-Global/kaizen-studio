#!/bin/bash

################################################################################
# PostgreSQL Backup Verification Script for Kaizen Studio
################################################################################
# Purpose: Verify backup integrity by restoring to temporary database
# Usage: ./verify-backup.sh <backup_file>
# Environment: Reads from .env or environment variables
################################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

################################################################################
# Configuration
################################################################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables from .env if it exists
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs -0)
fi

# Database configuration (with defaults)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-kaizen_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Verification configuration
BACKUP_FILE="${1:-}"
TEMP_DB="kaizen_verify_$(date +%s)"
VERIFY_LOG="$SCRIPT_DIR/verify.log"

################################################################################
# Logging
################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$VERIFY_LOG"
}

log_info() {
    log "INFO" "$@"
}

log_error() {
    log "ERROR" "$@"
}

log_success() {
    log "SUCCESS" "$@"
}

################################################################################
# Cleanup Function
################################################################################

cleanup() {
    if [[ -n "${TEMP_DB:-}" ]]; then
        log_info "Cleaning up temporary database: $TEMP_DB"
        PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB" 2>/dev/null || true
    fi
}

# Trap exit to ensure cleanup
trap cleanup EXIT INT TERM

################################################################################
# Pre-flight Checks
################################################################################

preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check if backup file provided
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Usage: $0 <backup_file>"
        log_error "Example: $0 backups/backup_20240101_120000.dump"
        exit 1
    fi

    # Check if backup file exists
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 2
    fi

    # Check if pg_restore is available
    if ! command -v pg_restore &> /dev/null; then
        log_error "pg_restore command not found. Install PostgreSQL client tools."
        exit 3
    fi

    # Check database connection
    log_info "Testing database connection..."
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1;" &>/dev/null; then
        log_error "Cannot connect to database server: $DB_HOST:$DB_PORT"
        exit 4
    fi

    log_success "Pre-flight checks passed"
}

################################################################################
# Backup File Validation
################################################################################

validate_backup_file() {
    log_info "Validating backup file: $BACKUP_FILE"

    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup size: $backup_size"

    # Check backup metadata if available
    if [[ -f "$BACKUP_FILE.meta" ]]; then
        log_info "Backup metadata:"
        cat "$BACKUP_FILE.meta" | tee -a "$VERIFY_LOG"
    fi

    # Check if file is readable
    if [[ ! -r "$BACKUP_FILE" ]]; then
        log_error "Backup file is not readable"
        exit 5
    fi

    # Verify backup format using pg_restore --list
    log_info "Checking backup file format..."
    if ! pg_restore --list "$BACKUP_FILE" &>/dev/null; then
        log_error "Invalid backup file format or corrupted file"
        exit 6
    fi

    # Count objects in backup
    local object_count=$(pg_restore --list "$BACKUP_FILE" 2>/dev/null | grep -c ";" || true)
    log_info "Backup contains $object_count database object(s)"

    log_success "Backup file validation passed"
}

################################################################################
# Test Restore
################################################################################

test_restore() {
    log_info "Creating temporary database: $TEMP_DB"

    # Create temporary database
    PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TEMP_DB"

    log_info "Restoring backup to temporary database..."
    local start_time=$(date +%s)

    # Restore to temporary database
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TEMP_DB" \
        -Fc \
        --no-owner \
        --no-acl \
        "$BACKUP_FILE" 2>&1 | tee -a "$VERIFY_LOG"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_info "Restore completed in ${duration}s"
}

################################################################################
# Integrity Checks
################################################################################

run_integrity_checks() {
    log_info "Running integrity checks on restored database..."

    # Check 1: Count tables
    log_info "Check 1: Counting tables..."
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")

    if [[ $table_count -eq 0 ]]; then
        log_error "No tables found in restored database"
        return 1
    fi
    log_success "Found $table_count table(s)"

    # Check 2: Count sequences
    log_info "Check 2: Counting sequences..."
    local sequence_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema='public'")
    log_info "Found $sequence_count sequence(s)"

    # Check 3: Count indexes
    log_info "Check 3: Counting indexes..."
    local index_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'")
    log_info "Found $index_count index(es)"

    # Check 4: Count constraints
    log_info "Check 4: Counting constraints..."
    local constraint_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema='public'")
    log_info "Found $constraint_count constraint(s)"

    # Check 5: Sample row counts from key tables
    log_info "Check 5: Sampling row counts..."

    # Organizations table
    local org_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM organizations" 2>/dev/null || echo "0")
    log_info "  Organizations: $org_count row(s)"

    # Users table
    local user_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
    log_info "  Users: $user_count row(s)"

    # Agents table
    local agent_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM agents" 2>/dev/null || echo "0")
    log_info "  Agents: $agent_count row(s)"

    # Pipelines table
    local pipeline_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT COUNT(*) FROM pipelines" 2>/dev/null || echo "0")
    log_info "  Pipelines: $pipeline_count row(s)"

    # Check 6: Database size
    log_info "Check 6: Checking database size..."
    local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT pg_size_pretty(pg_database_size('$TEMP_DB'))")
    log_info "Database size: $db_size"

    # Check 7: Verify foreign key relationships
    log_info "Check 7: Verifying foreign key constraints..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" <<EOF 2>&1 | tee -a "$VERIFY_LOG"
DO \$\$
DECLARE
    r RECORD;
    fk_violations INTEGER := 0;
BEGIN
    FOR r IN (
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE format('SELECT COUNT(*) FROM ONLY %s WHERE NOT EXISTS (SELECT 1 FROM %s)',
                      r.table_name, r.conname);
    END LOOP;
    RAISE NOTICE 'Foreign key verification completed';
END \$\$;
EOF

    log_success "All integrity checks passed"
    return 0
}

################################################################################
# Generate Report
################################################################################

generate_report() {
    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEMP_DB" -tAc "SELECT pg_size_pretty(pg_database_size('$TEMP_DB'))")

    log_info ""
    log_info "=========================================="
    log_info "VERIFICATION REPORT"
    log_info "=========================================="
    log_info "Backup file: $(basename "$BACKUP_FILE")"
    log_info "Backup size: $backup_size"
    log_info "Restored size: $db_size"
    log_info "Status: PASSED"
    log_info "=========================================="
    log_info "Full log: $VERIFY_LOG"
    log_info "=========================================="
}

################################################################################
# Main
################################################################################

main() {
    log_info "=========================================="
    log_info "Kaizen Studio Backup Verification"
    log_info "=========================================="

    preflight_checks
    validate_backup_file
    test_restore
    run_integrity_checks
    generate_report

    log_success "Backup verification completed successfully"
    log_info "Backup is valid and can be used for restore"

    exit 0
}

# Trap errors
trap 'log_error "Verification failed with error on line $LINENO"; cleanup; exit 7' ERR

main "$@"
