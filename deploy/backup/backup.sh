#!/bin/bash

################################################################################
# PostgreSQL Backup Script for Kaizen Studio
################################################################################
# Purpose: Create compressed PostgreSQL backups with rotation
# Usage: ./backup.sh [backup_name]
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

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
BACKUP_NAME="${1:-backup_$(date +%Y%m%d_%H%M%S)}"
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.dump"
BACKUP_LOG="$BACKUP_DIR/backup.log"

# Retention policy
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-10}"

# Notification configuration (optional)
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENT="${BACKUP_EMAIL_RECIPIENT:-}"

################################################################################
# Logging
################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$BACKUP_LOG"
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
# Notification Functions
################################################################################

send_slack_notification() {
    local status="$1"
    local message="$2"

    if [[ -z "$SLACK_WEBHOOK_URL" ]]; then
        return 0
    fi

    local color="good"
    if [[ "$status" == "failure" ]]; then
        color="danger"
    fi

    local payload=$(cat <<EOF
{
    "attachments": [{
        "color": "$color",
        "title": "Kaizen Studio PostgreSQL Backup",
        "fields": [
            {
                "title": "Status",
                "value": "$status",
                "short": true
            },
            {
                "title": "Database",
                "value": "$DB_NAME",
                "short": true
            },
            {
                "title": "Message",
                "value": "$message",
                "short": false
            },
            {
                "title": "Timestamp",
                "value": "$(date '+%Y-%m-%d %H:%M:%S %Z')",
                "short": true
            }
        ]
    }]
}
EOF
)

    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || true
}

send_email_notification() {
    local subject="$1"
    local body="$2"

    if [[ -z "$EMAIL_RECIPIENT" ]]; then
        return 0
    fi

    # Requires mail command (mailutils)
    if command -v mail &> /dev/null; then
        echo "$body" | mail -s "$subject" "$EMAIL_RECIPIENT" || true
    fi
}

notify() {
    local status="$1"
    local message="$2"

    send_slack_notification "$status" "$message"
    send_email_notification "Kaizen Studio Backup: $status" "$message"
}

################################################################################
# Pre-flight Checks
################################################################################

preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump command not found. Install PostgreSQL client tools."
        exit 1
    fi

    # Check if backup directory exists
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi

    # Check database connection
    log_info "Testing database connection..."
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        log_error "Cannot connect to database: $DB_NAME@$DB_HOST:$DB_PORT"
        notify "failure" "Cannot connect to database: $DB_NAME@$DB_HOST:$DB_PORT"
        exit 2
    fi

    # Check available disk space (require at least 1GB)
    local available_space=$(df -BG "$BACKUP_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $available_space -lt 1 ]]; then
        log_error "Insufficient disk space. Available: ${available_space}GB, Required: 1GB"
        notify "failure" "Insufficient disk space for backup"
        exit 3
    fi

    log_success "Pre-flight checks passed"
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    log_info "Starting backup: $BACKUP_NAME"
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    log_info "Backup file: $BACKUP_FILE"

    local start_time=$(date +%s)

    # Create backup with custom format (allows parallel restore)
    # Options:
    #   -Fc: Custom format (compressed)
    #   -v: Verbose
    #   -Z 6: Compression level 6 (balanced)
    #   --no-owner: Don't set ownership in dump
    #   --no-acl: Don't set ACLs in dump
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -Fc \
        -v \
        -Z 6 \
        --no-owner \
        --no-acl \
        -f "$BACKUP_FILE" 2>&1 | tee -a "$BACKUP_LOG"

    local exit_code=${PIPESTATUS[0]}

    if [[ $exit_code -ne 0 ]]; then
        log_error "Backup failed with exit code: $exit_code"
        notify "failure" "Backup failed for $DB_NAME"
        exit 4
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)

    log_success "Backup completed in ${duration}s"
    log_info "Backup size: $backup_size"

    # Create metadata file
    cat > "$BACKUP_FILE.meta" <<EOF
{
    "backup_name": "$BACKUP_NAME",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "port": "$DB_PORT",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "duration_seconds": $duration,
    "size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
    "compression": "6",
    "format": "custom"
}
EOF

    return 0
}

################################################################################
# Rotation Functions
################################################################################

rotate_backups() {
    log_info "Rotating old backups..."
    log_info "Retention policy: $RETENTION_DAYS days or $RETENTION_COUNT backups"

    local deleted_count=0

    # Delete backups older than RETENTION_DAYS
    if [[ $RETENTION_DAYS -gt 0 ]]; then
        while IFS= read -r old_backup; do
            log_info "Deleting old backup: $(basename "$old_backup")"
            rm -f "$old_backup" "$old_backup.meta"
            ((deleted_count++))
        done < <(find "$BACKUP_DIR" -name "*.dump" -type f -mtime +$RETENTION_DAYS)
    fi

    # Keep only last N backups
    if [[ $RETENTION_COUNT -gt 0 ]]; then
        local backup_count=$(find "$BACKUP_DIR" -name "*.dump" -type f | wc -l)
        if [[ $backup_count -gt $RETENTION_COUNT ]]; then
            local to_delete=$((backup_count - RETENTION_COUNT))
            find "$BACKUP_DIR" -name "*.dump" -type f -printf '%T+ %p\n' | \
                sort | \
                head -n $to_delete | \
                cut -d' ' -f2- | \
                while IFS= read -r old_backup; do
                    log_info "Deleting excess backup: $(basename "$old_backup")"
                    rm -f "$old_backup" "$old_backup.meta"
                    ((deleted_count++))
                done
        fi
    fi

    if [[ $deleted_count -gt 0 ]]; then
        log_info "Deleted $deleted_count old backup(s)"
    else
        log_info "No backups to delete"
    fi
}

################################################################################
# Cloud Upload (Optional)
################################################################################

upload_to_cloud() {
    log_info "Cloud upload not configured (optional)"

    # Uncomment and configure for S3 upload:
    # if command -v aws &> /dev/null; then
    #     local s3_bucket="${S3_BACKUP_BUCKET:-}"
    #     if [[ -n "$s3_bucket" ]]; then
    #         log_info "Uploading to S3: s3://$s3_bucket/backups/$BACKUP_NAME.dump"
    #         aws s3 cp "$BACKUP_FILE" "s3://$s3_bucket/backups/$BACKUP_NAME.dump"
    #         aws s3 cp "$BACKUP_FILE.meta" "s3://$s3_bucket/backups/$BACKUP_NAME.dump.meta"
    #         log_success "Uploaded to S3"
    #     fi
    # fi

    # Uncomment and configure for GCS upload:
    # if command -v gsutil &> /dev/null; then
    #     local gcs_bucket="${GCS_BACKUP_BUCKET:-}"
    #     if [[ -n "$gcs_bucket" ]]; then
    #         log_info "Uploading to GCS: gs://$gcs_bucket/backups/$BACKUP_NAME.dump"
    #         gsutil cp "$BACKUP_FILE" "gs://$gcs_bucket/backups/$BACKUP_NAME.dump"
    #         gsutil cp "$BACKUP_FILE.meta" "gs://$gcs_bucket/backups/$BACKUP_NAME.dump.meta"
    #         log_success "Uploaded to GCS"
    #     fi
    # fi
}

################################################################################
# Main
################################################################################

main() {
    log_info "=========================================="
    log_info "Kaizen Studio PostgreSQL Backup"
    log_info "=========================================="

    preflight_checks
    create_backup
    rotate_backups
    upload_to_cloud

    local final_size=$(du -h "$BACKUP_FILE" | cut -f1)
    local backup_count=$(find "$BACKUP_DIR" -name "*.dump" -type f | wc -l)

    log_success "=========================================="
    log_success "Backup completed successfully"
    log_success "Backup file: $BACKUP_FILE"
    log_success "Backup size: $final_size"
    log_success "Total backups: $backup_count"
    log_success "=========================================="

    notify "success" "Backup completed: $BACKUP_NAME ($final_size)"

    exit 0
}

# Trap errors and send notifications
trap 'log_error "Backup failed with error on line $LINENO"; notify "failure" "Backup failed with error on line $LINENO"; exit 5' ERR

main "$@"
