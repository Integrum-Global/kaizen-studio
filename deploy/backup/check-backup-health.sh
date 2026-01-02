#!/bin/bash

################################################################################
# Backup Health Check Script for Kaizen Studio
################################################################################
# Purpose: Monitor backup health and alert on issues
# Usage: ./check-backup-health.sh
# Suitable for: Monitoring systems, cron, health checks
################################################################################

set -euo pipefail

################################################################################
# Configuration
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
BACKUP_LOG="$BACKUP_DIR/backup.log"

# Health check thresholds
MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-25}"  # Alert if no backup in 25 hours
MIN_DISK_SPACE_GB="${MIN_DISK_SPACE_GB:-5}"         # Alert if less than 5GB free
MIN_BACKUP_COUNT="${MIN_BACKUP_COUNT:-3}"           # Alert if less than 3 backups
MAX_BACKUP_SIZE_CHANGE_PERCENT="${MAX_BACKUP_SIZE_CHANGE_PERCENT:-50}"  # Alert if size changes >50%

# Exit codes
EXIT_OK=0
EXIT_WARNING=1
EXIT_CRITICAL=2
EXIT_UNKNOWN=3

################################################################################
# Functions
################################################################################

log() {
    local level="$1"
    shift
    echo "[$level] $*"
}

check_backup_age() {
    log "INFO" "Checking backup age..."

    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "CRITICAL" "Backup directory not found: $BACKUP_DIR"
        return $EXIT_CRITICAL
    fi

    local latest_backup=$(find "$BACKUP_DIR" -name "*.dump" -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -1 | cut -d' ' -f2-)

    if [[ -z "$latest_backup" ]]; then
        log "CRITICAL" "No backups found in $BACKUP_DIR"
        return $EXIT_CRITICAL
    fi

    local backup_age_seconds=$(( $(date +%s) - $(stat -c%Y "$latest_backup" 2>/dev/null || stat -f%m "$latest_backup") ))
    local backup_age_hours=$(( backup_age_seconds / 3600 ))
    local backup_name=$(basename "$latest_backup")

    log "INFO" "Latest backup: $backup_name"
    log "INFO" "Backup age: ${backup_age_hours}h"

    if [[ $backup_age_hours -gt $MAX_BACKUP_AGE_HOURS ]]; then
        log "CRITICAL" "Latest backup is too old: ${backup_age_hours}h (threshold: ${MAX_BACKUP_AGE_HOURS}h)"
        return $EXIT_CRITICAL
    elif [[ $backup_age_hours -gt $(( MAX_BACKUP_AGE_HOURS - 2 )) ]]; then
        log "WARNING" "Latest backup is getting old: ${backup_age_hours}h"
        return $EXIT_WARNING
    fi

    log "OK" "Backup age is acceptable: ${backup_age_hours}h"
    return $EXIT_OK
}

check_disk_space() {
    log "INFO" "Checking disk space..."

    local available_gb=$(df -BG "$BACKUP_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')

    log "INFO" "Available space: ${available_gb}GB"

    if [[ $available_gb -lt $MIN_DISK_SPACE_GB ]]; then
        log "CRITICAL" "Low disk space: ${available_gb}GB (threshold: ${MIN_DISK_SPACE_GB}GB)"
        return $EXIT_CRITICAL
    elif [[ $available_gb -lt $(( MIN_DISK_SPACE_GB * 2 )) ]]; then
        log "WARNING" "Disk space is low: ${available_gb}GB"
        return $EXIT_WARNING
    fi

    log "OK" "Disk space is sufficient: ${available_gb}GB"
    return $EXIT_OK
}

check_backup_count() {
    log "INFO" "Checking backup count..."

    local backup_count=$(find "$BACKUP_DIR" -name "*.dump" -type f | wc -l)

    log "INFO" "Total backups: $backup_count"

    if [[ $backup_count -lt $MIN_BACKUP_COUNT ]]; then
        log "WARNING" "Low backup count: $backup_count (minimum: $MIN_BACKUP_COUNT)"
        return $EXIT_WARNING
    fi

    log "OK" "Backup count is sufficient: $backup_count"
    return $EXIT_OK
}

check_backup_sizes() {
    log "INFO" "Checking backup size consistency..."

    local backups=($(find "$BACKUP_DIR" -name "*.dump" -type f -printf '%T+ %p\n' | sort -r | head -2 | cut -d' ' -f2-))

    if [[ ${#backups[@]} -lt 2 ]]; then
        log "INFO" "Not enough backups to compare sizes"
        return $EXIT_OK
    fi

    local latest_size=$(stat -c%s "${backups[0]}" 2>/dev/null || stat -f%z "${backups[0]}")
    local previous_size=$(stat -c%s "${backups[1]}" 2>/dev/null || stat -f%z "${backups[1]}")

    if [[ $previous_size -eq 0 ]]; then
        log "WARNING" "Previous backup has zero size"
        return $EXIT_WARNING
    fi

    local size_change_percent=$(( (latest_size - previous_size) * 100 / previous_size ))
    local abs_change=$(( size_change_percent < 0 ? -size_change_percent : size_change_percent ))

    log "INFO" "Latest backup size: $(numfmt --to=iec-i --suffix=B $latest_size)"
    log "INFO" "Previous backup size: $(numfmt --to=iec-i --suffix=B $previous_size)"
    log "INFO" "Size change: ${size_change_percent}%"

    if [[ $abs_change -gt $MAX_BACKUP_SIZE_CHANGE_PERCENT ]]; then
        log "WARNING" "Backup size changed significantly: ${size_change_percent}% (threshold: ±${MAX_BACKUP_SIZE_CHANGE_PERCENT}%)"
        return $EXIT_WARNING
    fi

    log "OK" "Backup size is consistent: ${size_change_percent}%"
    return $EXIT_OK
}

check_backup_integrity() {
    log "INFO" "Checking latest backup integrity..."

    local latest_backup=$(find "$BACKUP_DIR" -name "*.dump" -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -1 | cut -d' ' -f2-)

    if [[ -z "$latest_backup" ]]; then
        log "CRITICAL" "No backups to check"
        return $EXIT_CRITICAL
    fi

    if ! command -v pg_restore &> /dev/null; then
        log "WARNING" "pg_restore not available, skipping integrity check"
        return $EXIT_WARNING
    fi

    log "INFO" "Verifying: $(basename "$latest_backup")"

    if ! pg_restore --list "$latest_backup" &>/dev/null; then
        log "CRITICAL" "Backup file is corrupted: $(basename "$latest_backup")"
        return $EXIT_CRITICAL
    fi

    log "OK" "Backup integrity verified"
    return $EXIT_OK
}

check_recent_errors() {
    log "INFO" "Checking for recent backup errors..."

    if [[ ! -f "$BACKUP_LOG" ]]; then
        log "INFO" "No backup log found"
        return $EXIT_OK
    fi

    local recent_errors=$(grep -i "ERROR\|CRITICAL\|FAILED" "$BACKUP_LOG" | tail -5)

    if [[ -n "$recent_errors" ]]; then
        log "WARNING" "Recent errors found in backup log:"
        echo "$recent_errors"
        return $EXIT_WARNING
    fi

    log "OK" "No recent errors in backup log"
    return $EXIT_OK
}

################################################################################
# Main Health Check
################################################################################

main() {
    log "INFO" "=========================================="
    log "INFO" "Kaizen Studio Backup Health Check"
    log "INFO" "=========================================="

    local exit_code=$EXIT_OK

    # Run all checks
    check_backup_age || exit_code=$?
    echo ""

    check_disk_space || exit_code=$?
    echo ""

    check_backup_count || exit_code=$?
    echo ""

    check_backup_sizes || exit_code=$?
    echo ""

    check_backup_integrity || exit_code=$?
    echo ""

    check_recent_errors || exit_code=$?
    echo ""

    # Summary
    log "INFO" "=========================================="
    case $exit_code in
        $EXIT_OK)
            log "OK" "All health checks passed"
            ;;
        $EXIT_WARNING)
            log "WARNING" "Health check completed with warnings"
            ;;
        $EXIT_CRITICAL)
            log "CRITICAL" "Health check failed with critical issues"
            ;;
        *)
            log "UNKNOWN" "Health check status unknown"
            ;;
    esac
    log "INFO" "=========================================="

    exit $exit_code
}

main "$@"
