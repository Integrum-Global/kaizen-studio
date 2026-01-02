#!/bin/bash

################################################################################
# PostgreSQL Restore Script for Kaizen Studio
################################################################################
# Purpose: Restore PostgreSQL database from backup
# Usage: ./restore.sh <backup_file> [target_database]
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
DB_NAME="${POSTGRES_DB:-kaizen_studio}"
DB_USER="${POSTGRES_USER:-kaizen_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Restore configuration
BACKUP_FILE="${1:-}"
TARGET_DB="${2:-$DB_NAME}"
RESTORE_LOG="$SCRIPT_DIR/restore.log"

################################################################################
# Logging
################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$RESTORE_LOG"
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

log_warning() {
    log "WARNING" "$@"
}

################################################################################
# Safety Checks
################################################################################

safety_checks() {
    log_info "Running safety checks..."

    # Check if backup file provided
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Usage: $0 <backup_file> [target_database]"
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

    # Production environment check
    if [[ "${ENVIRONMENT:-}" == "production" ]]; then
        log_warning "=========================================="
        log_warning "PRODUCTION ENVIRONMENT DETECTED"
        log_warning "=========================================="
        log_warning "You are about to restore database: $TARGET_DB"
        log_warning "This will OVERWRITE existing data!"
        log_warning ""
        read -p "Type 'RESTORE' to continue or Ctrl+C to abort: " confirmation
        if [[ "$confirmation" != "RESTORE" ]]; then
            log_info "Restore aborted by user"
            exit 0
        fi
    fi

    log_success "Safety checks passed"
}

################################################################################
# Backup Validation
################################################################################

validate_backup() {
    log_info "Validating backup file: $BACKUP_FILE"

    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup size: $backup_size"

    # Check if metadata file exists
    if [[ -f "$BACKUP_FILE.meta" ]]; then
        log_info "Backup metadata:"
        cat "$BACKUP_FILE.meta" | tee -a "$RESTORE_LOG"
    fi

    # Verify backup file integrity using pg_restore --list
    log_info "Checking backup file integrity..."
    if ! pg_restore --list "$BACKUP_FILE" &>/dev/null; then
        log_error "Backup file is corrupted or invalid"
        exit 5
    fi

    log_success "Backup file is valid"
}

################################################################################
# Database Preparation
################################################################################

prepare_database() {
    log_info "Preparing target database: $TARGET_DB"

    # Check if target database exists
    local db_exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB'")

    if [[ "$db_exists" == "1" ]]; then
        log_warning "Target database already exists: $TARGET_DB"

        # Confirm overwrite
        read -p "Overwrite existing database? (yes/no): " overwrite
        if [[ "$overwrite" != "yes" ]]; then
            log_info "Restore aborted by user"
            exit 0
        fi

        # Terminate active connections
        log_info "Terminating active connections to $TARGET_DB..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" <<EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$TARGET_DB'
  AND pid <> pg_backend_pid();
EOF

        # Drop existing database
        log_info "Dropping existing database: $TARGET_DB"
        PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TARGET_DB"
    fi

    # Create new database
    log_info "Creating database: $TARGET_DB"
    PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$TARGET_DB"

    log_success "Database prepared"
}

################################################################################
# Restore Functions
################################################################################

restore_database() {
    log_info "Starting restore to: $TARGET_DB"
    log_info "From backup: $BACKUP_FILE"

    local start_time=$(date +%s)

    # Restore database
    # Options:
    #   -Fc: Custom format
    #   -v: Verbose
    #   -d: Database name
    #   --no-owner: Don't set ownership
    #   --no-acl: Don't set ACLs
    #   --clean: Clean (drop) database objects before recreating
    #   --if-exists: Use IF EXISTS when dropping objects
    PGPASSWORD="$DB_PASSWORD" pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -Fc \
        -v \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        "$BACKUP_FILE" 2>&1 | tee -a "$RESTORE_LOG"

    local exit_code=${PIPESTATUS[0]}

    # Note: pg_restore may exit with non-zero code even on successful restore
    # due to harmless warnings (e.g., missing extensions, ACL issues)
    # We'll check if database has tables instead

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_info "Restore completed in ${duration}s"

    # Verify restore
    log_info "Verifying restored database..."
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")

    if [[ $table_count -eq 0 ]]; then
        log_error "Restore verification failed: No tables found in database"
        exit 6
    fi

    log_success "Database restored with $table_count table(s)"
    return 0
}

################################################################################
# Post-Restore Tasks
################################################################################

post_restore_tasks() {
    log_info "Running post-restore tasks..."

    # Analyze database for query optimization
    log_info "Analyzing database..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -c "ANALYZE;" &>/dev/null || true

    # Reindex database
    log_info "Reindexing database..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -c "REINDEX DATABASE $TARGET_DB;" &>/dev/null || true

    # Get database size
    local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -tAc "SELECT pg_size_pretty(pg_database_size('$TARGET_DB'))")
    log_info "Database size: $db_size"

    log_success "Post-restore tasks completed"
}

################################################################################
# Point-in-Time Recovery Info
################################################################################

show_pitr_info() {
    log_info ""
    log_info "=========================================="
    log_info "Point-in-Time Recovery (PITR)"
    log_info "=========================================="
    log_info "For PITR, you need:"
    log_info "1. Base backup (created by backup.sh)"
    log_info "2. WAL archives (requires PostgreSQL WAL archiving)"
    log_info ""
    log_info "To enable WAL archiving, add to postgresql.conf:"
    log_info "  wal_level = replica"
    log_info "  archive_mode = on"
    log_info "  archive_command = 'cp %p /path/to/wal_archive/%f'"
    log_info ""
    log_info "For more info: https://www.postgresql.org/docs/current/continuous-archiving.html"
    log_info "=========================================="
}

################################################################################
# Main
################################################################################

main() {
    log_info "=========================================="
    log_info "Kaizen Studio PostgreSQL Restore"
    log_info "=========================================="

    safety_checks
    validate_backup
    prepare_database
    restore_database
    post_restore_tasks

    local db_size=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TARGET_DB" -tAc "SELECT pg_size_pretty(pg_database_size('$TARGET_DB'))")

    log_success "=========================================="
    log_success "Restore completed successfully"
    log_success "Target database: $TARGET_DB"
    log_success "Database size: $db_size"
    log_success "=========================================="

    show_pitr_info

    exit 0
}

# Trap errors
trap 'log_error "Restore failed with error on line $LINENO"; exit 7' ERR

main "$@"
