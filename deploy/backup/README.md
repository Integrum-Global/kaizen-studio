# PostgreSQL Backup and Recovery for Kaizen Studio

Comprehensive backup and recovery infrastructure for Kaizen Studio's PostgreSQL database containing organizations, users, workspaces, agents, pipelines, deployments, audit logs, billing records, and trust/EATP data.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Backup Procedures](#backup-procedures)
- [Recovery Procedures](#recovery-procedures)
- [Verification](#verification)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Disaster Recovery](#disaster-recovery)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

### Components

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup.sh` | Create compressed PostgreSQL backups | `./backup.sh [backup_name]` |
| `restore.sh` | Restore database from backup | `./restore.sh <backup_file> [target_db]` |
| `verify-backup.sh` | Verify backup integrity | `./verify-backup.sh <backup_file>` |
| `backup-cronjob.yaml` | Kubernetes scheduled backups | `kubectl apply -f backup-cronjob.yaml` |
| `backup-pvc.yaml` | Persistent storage for backups | `kubectl apply -f backup-pvc.yaml` |

### Features

- **Compressed Backups**: Custom format with level 6 compression
- **Automatic Rotation**: Configurable retention by count and age
- **Integrity Verification**: Test restore to temporary database
- **Safety Checks**: Production environment confirmation
- **Cloud Upload**: Optional S3/GCS integration
- **Monitoring**: Logging with timestamps and notifications
- **Kubernetes-Ready**: CronJob for automated backups

## Quick Start

### Prerequisites

```bash
# PostgreSQL client tools required
sudo apt-get install postgresql-client  # Debian/Ubuntu
brew install postgresql                  # macOS

# Verify installation
pg_dump --version
pg_restore --version
```

### Environment Setup

1. **Copy environment template** (if not already done):
```bash
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio
cp .env.example .env
```

2. **Update database credentials** in `.env`:
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kaizen_studio_dev
POSTGRES_USER=kaizen_user
POSTGRES_PASSWORD=your_secure_password
```

3. **Make scripts executable**:
```bash
chmod +x deploy/backup/*.sh
```

### First Backup

```bash
cd deploy/backup
./backup.sh
```

Output:
```
[2024-01-15 14:30:00] [INFO] Starting backup: backup_20240115_143000
[2024-01-15 14:30:05] [SUCCESS] Backup completed successfully
[2024-01-15 14:30:05] [INFO] Backup file: backups/backup_20240115_143000.dump
[2024-01-15 14:30:05] [INFO] Backup size: 2.3M
```

## Backup Procedures

### Manual Backup

```bash
cd deploy/backup

# Default backup (timestamped)
./backup.sh

# Named backup
./backup.sh pre_migration_backup

# With custom environment
POSTGRES_HOST=prod-db.example.com ./backup.sh production_backup
```

### Automated Backups (Cron)

For Docker Compose environments, add to host crontab:

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /path/to/kaizen-studio/deploy/backup && ./backup.sh >> backups/cron.log 2>&1

# Weekly backup on Sunday at 3 AM
0 3 * * 0 cd /path/to/kaizen-studio/deploy/backup && ./backup.sh weekly_backup >> backups/cron.log 2>&1
```

### Configuration Options

Environment variables for `backup.sh`:

```bash
# Database connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kaizen_studio
POSTGRES_USER=kaizen_user
POSTGRES_PASSWORD=secure_password

# Backup configuration
BACKUP_DIR=/path/to/backups
BACKUP_RETENTION_DAYS=30      # Delete backups older than 30 days
BACKUP_RETENTION_COUNT=10     # Keep last 10 backups

# Notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
BACKUP_EMAIL_RECIPIENT=admin@example.com

# Cloud storage (optional)
S3_BACKUP_BUCKET=kaizen-studio-backups
GCS_BACKUP_BUCKET=kaizen-studio-backups
```

### Cloud Upload Configuration

#### AWS S3

Uncomment S3 section in `backup.sh` and configure:

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Set environment variables
export S3_BACKUP_BUCKET=kaizen-studio-backups
export AWS_DEFAULT_REGION=us-east-1
```

#### Google Cloud Storage

Uncomment GCS section in `backup.sh` and configure:

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login

# Set environment variables
export GCS_BACKUP_BUCKET=kaizen-studio-backups
```

## Recovery Procedures

### Pre-Restore Checklist

- [ ] Verify backup file integrity
- [ ] Confirm target database name
- [ ] Check available disk space
- [ ] Back up current database (if restoring to existing)
- [ ] Notify stakeholders (production environments)
- [ ] Stop application services

### Restore from Backup

```bash
cd deploy/backup

# List available backups
ls -lh backups/*.dump

# Restore to default database
./restore.sh backups/backup_20240115_143000.dump

# Restore to different database
./restore.sh backups/backup_20240115_143000.dump kaizen_studio_restore

# Restore from remote backup
./restore.sh /mnt/s3-backups/backup_20240115_143000.dump
```

### Production Restore

For production environments, the script will prompt for confirmation:

```bash
./restore.sh backups/backup_20240115_143000.dump kaizen_studio

# Output:
[2024-01-15 15:00:00] [WARNING] PRODUCTION ENVIRONMENT DETECTED
[2024-01-15 15:00:00] [WARNING] You are about to restore database: kaizen_studio
[2024-01-15 15:00:00] [WARNING] This will OVERWRITE existing data!
Type 'RESTORE' to continue or Ctrl+C to abort: RESTORE
```

### Post-Restore Verification

After restore, verify database integrity:

```bash
# Connect to database
psql -h localhost -U kaizen_user -d kaizen_studio

# Check table counts
SELECT
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

# Check recent data
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5;
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

# Check foreign key constraints
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE contype = 'f';
```

## Verification

### Verify Backup Integrity

Before relying on a backup, verify it can be restored:

```bash
cd deploy/backup

# Verify backup
./verify-backup.sh backups/backup_20240115_143000.dump
```

Output:
```
[2024-01-15 15:30:00] [INFO] Starting verification...
[2024-01-15 15:30:05] [SUCCESS] Backup file validation passed
[2024-01-15 15:30:10] [INFO] Restoring to temporary database...
[2024-01-15 15:31:00] [SUCCESS] All integrity checks passed
[2024-01-15 15:31:00] [INFO] Backup is valid and can be used for restore
```

### Verification Checks

The verification script performs:

1. **File validation**: Checks backup format and readability
2. **Test restore**: Restores to temporary database
3. **Table count**: Verifies tables were restored
4. **Sequence count**: Checks sequences
5. **Index count**: Verifies indexes
6. **Constraint count**: Checks foreign keys
7. **Row counts**: Samples key tables
8. **Size comparison**: Compares backup vs restored size
9. **Foreign key validation**: Verifies referential integrity

### Scheduled Verification

Verify backups regularly:

```bash
# Add to crontab (verify weekly backups)
0 4 * * 0 cd /path/to/kaizen-studio/deploy/backup && ./verify-backup.sh backups/weekly_backup.dump >> backups/verify.log 2>&1
```

## Kubernetes Deployment

### Prerequisites

```bash
# Create namespace
kubectl create namespace kaizen-studio

# Create secrets (database credentials)
kubectl create secret generic kaizen-secrets \
  --from-literal=postgres-user=kaizen_user \
  --from-literal=postgres-password=secure_password \
  --namespace=kaizen-studio

# Create ConfigMap (database name)
kubectl create configmap kaizen-config \
  --from-literal=POSTGRES_DB=kaizen_studio \
  --namespace=kaizen-studio
```

### Deploy Backup Infrastructure

```bash
cd deploy/backup

# 1. Create PersistentVolumeClaim for backup storage
kubectl apply -f backup-pvc.yaml

# 2. Deploy CronJob for automated backups
kubectl apply -f backup-cronjob.yaml

# 3. Verify deployment
kubectl get cronjobs -n kaizen-studio
kubectl get pvc -n kaizen-studio
```

### Kubernetes Configuration

Update `backup-cronjob.yaml` for your environment:

```yaml
# Update PostgreSQL service name
- name: POSTGRES_HOST
  value: "postgres-service"  # Change to your service name

# Update storage class in backup-pvc.yaml
storageClassName: gp3  # AWS EBS
# storageClassName: standard  # GCP Persistent Disk
# storageClassName: managed-premium  # Azure Disk
```

### Manual Backup in Kubernetes

Trigger manual backup without waiting for schedule:

```bash
# Create one-time job from CronJob
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%s) -n kaizen-studio

# Monitor job
kubectl get jobs -n kaizen-studio
kubectl logs -f job/manual-backup-1234567890 -n kaizen-studio
```

### Access Backups in Kubernetes

```bash
# List backups
kubectl exec -it deployment/postgres -n kaizen-studio -- ls -lh /backups

# Copy backup to local machine
kubectl cp kaizen-studio/postgres-pod:/backups/backup_20240115_143000.dump ./backup.dump

# Copy backup from local to pod
kubectl cp ./backup.dump kaizen-studio/postgres-pod:/backups/backup.dump
```

### S3 Backup in Kubernetes

For S3 uploads, use IAM Roles for Service Accounts (IRSA):

```bash
# 1. Create IAM role with S3 access
aws iam create-role --role-name kaizen-studio-backup-role \
  --assume-role-policy-document file://trust-policy.json

# 2. Attach S3 policy
aws iam attach-role-policy --role-name kaizen-studio-backup-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# 3. Annotate service account in backup-cronjob.yaml
# serviceAccountName: backup-service-account
# annotations:
#   eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/kaizen-studio-backup-role

# 4. Enable S3 upload in backup-cronjob.yaml
# - name: S3_BACKUP_BUCKET
#   value: "kaizen-studio-backups"
```

## Disaster Recovery

### Recovery Time Objective (RTO)

Expected time to restore operations:

- **Database restore**: 10-60 minutes (depends on size)
- **Service restart**: 5-10 minutes
- **Verification**: 10-20 minutes
- **Total RTO**: 30-90 minutes

### Recovery Point Objective (RPO)

Maximum acceptable data loss:

- **Daily backups**: 24 hours RPO
- **Hourly backups**: 1 hour RPO
- **WAL archiving**: Near-zero RPO (requires PITR setup)

### Disaster Recovery Runbook

#### Scenario 1: Database Corruption

```bash
# 1. Stop application services
docker-compose stop backend
# OR
kubectl scale deployment backend --replicas=0 -n kaizen-studio

# 2. Verify latest backup
cd deploy/backup
./verify-backup.sh backups/backup_latest.dump

# 3. Restore database
./restore.sh backups/backup_latest.dump kaizen_studio

# 4. Verify restoration
psql -h localhost -U kaizen_user -d kaizen_studio -c "SELECT COUNT(*) FROM users;"

# 5. Restart services
docker-compose start backend
# OR
kubectl scale deployment backend --replicas=3 -n kaizen-studio

# 6. Monitor logs
docker-compose logs -f backend
# OR
kubectl logs -f deployment/backend -n kaizen-studio
```

#### Scenario 2: Complete Data Loss

```bash
# 1. Restore from cloud backup (if available)
aws s3 cp s3://kaizen-studio-backups/backups/backup_latest.dump ./backup.dump

# 2. Verify backup
./verify-backup.sh ./backup.dump

# 3. Restore to new database instance
POSTGRES_HOST=new-db.example.com ./restore.sh ./backup.dump kaizen_studio

# 4. Update application configuration
# Update DATABASE_URL in .env or Kubernetes secrets

# 5. Restart services and verify
```

#### Scenario 3: Point-in-Time Recovery (PITR)

For PITR, you need WAL archiving enabled (see below).

```bash
# 1. Stop PostgreSQL
docker-compose stop postgres

# 2. Restore base backup
./restore.sh backups/base_backup.dump kaizen_studio

# 3. Configure recovery
cat > recovery.conf <<EOF
restore_command = 'cp /wal_archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
EOF

# 4. Start PostgreSQL in recovery mode
# PostgreSQL will replay WAL logs until target time

# 5. Verify and promote
psql -h localhost -U kaizen_user -d kaizen_studio -c "SELECT pg_is_in_recovery();"
```

### Enable Point-in-Time Recovery (PITR)

To enable PITR, configure PostgreSQL for WAL archiving:

```bash
# 1. Update postgresql.conf
cat >> postgresql.conf <<EOF
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'
archive_timeout = 300  # Archive every 5 minutes
EOF

# 2. Create WAL archive directory
mkdir -p /wal_archive
chown postgres:postgres /wal_archive

# 3. Restart PostgreSQL
docker-compose restart postgres

# 4. Verify archiving
psql -h localhost -U kaizen_user -d kaizen_studio -c "SELECT archived_count, failed_count FROM pg_stat_archiver;"
```

## Monitoring

### Backup Monitoring

Check backup status:

```bash
# View backup log
tail -f deploy/backup/backups/backup.log

# List recent backups
ls -lht deploy/backup/backups/*.dump | head -10

# Check backup sizes
du -h deploy/backup/backups/*.dump

# Verify latest backup
./verify-backup.sh deploy/backup/backups/backup_latest.dump
```

### Kubernetes Monitoring

```bash
# Check CronJob status
kubectl get cronjobs -n kaizen-studio

# View recent jobs
kubectl get jobs -n kaizen-studio --sort-by=.metadata.creationTimestamp

# Check job logs
kubectl logs -l component=backup -n kaizen-studio

# Check PVC usage
kubectl get pvc -n kaizen-studio
kubectl exec -it deployment/postgres -n kaizen-studio -- df -h /backups
```

### Alerts and Notifications

Configure alerts for:

1. **Backup failures**: Script exits with non-zero code
2. **Disk space warnings**: < 10% free space
3. **Backup age**: No backup in 24+ hours
4. **Verification failures**: Backup cannot be restored

Example Prometheus alert:

```yaml
- alert: BackupFailed
  expr: time() - kaizen_backup_last_success_timestamp > 86400
  for: 1h
  labels:
    severity: critical
  annotations:
    summary: "Kaizen Studio backup failed"
    description: "No successful backup in 24 hours"
```

### Slack Notifications

Enable Slack notifications in `.env`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

You'll receive notifications for:
- Backup success with size and duration
- Backup failures with error details
- Verification results

### Email Notifications

Enable email notifications in `.env`:

```bash
BACKUP_EMAIL_RECIPIENT=admin@example.com
```

Requires `mail` command (mailutils):

```bash
# Install mailutils
sudo apt-get install mailutils  # Debian/Ubuntu
```

## Troubleshooting

### Common Issues

#### 1. Cannot connect to database

**Error**: `Cannot connect to database: kaizen_studio@localhost:5432`

**Solutions**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# OR
kubectl get pods -l app=postgres -n kaizen-studio

# Check connection settings
echo $DATABASE_URL

# Test connection manually
psql -h localhost -U kaizen_user -d kaizen_studio

# Check firewall rules
sudo ufw status
```

#### 2. Insufficient disk space

**Error**: `Insufficient disk space. Available: 0GB, Required: 1GB`

**Solutions**:
```bash
# Check disk usage
df -h

# Clean old backups
cd deploy/backup/backups
rm -f backup_old_*.dump

# Increase retention policy (delete more old backups)
export BACKUP_RETENTION_COUNT=5
export BACKUP_RETENTION_DAYS=7
```

#### 3. pg_dump command not found

**Error**: `pg_dump command not found`

**Solutions**:
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client  # Debian/Ubuntu
brew install postgresql                  # macOS
yum install postgresql                   # RHEL/CentOS
```

#### 4. Backup file corrupted

**Error**: `Invalid backup file format or corrupted file`

**Solutions**:
```bash
# Verify file integrity
file backup.dump

# Check file size (should be > 0)
ls -lh backup.dump

# Try to list backup contents
pg_restore --list backup.dump

# Use previous backup
ls -lt backups/*.dump | head -5
./restore.sh backups/backup_previous.dump
```

#### 5. Restore fails with permission errors

**Error**: `ERROR: permission denied for schema public`

**Solutions**:
```bash
# Grant permissions on target database
psql -h localhost -U postgres -d kaizen_studio <<EOF
GRANT ALL ON SCHEMA public TO kaizen_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO kaizen_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO kaizen_user;
EOF

# Or restore as superuser
POSTGRES_USER=postgres ./restore.sh backup.dump
```

#### 6. Kubernetes CronJob not running

**Issue**: Backups not being created

**Solutions**:
```bash
# Check CronJob schedule
kubectl get cronjob postgres-backup -n kaizen-studio

# Check for suspended jobs
kubectl get cronjob postgres-backup -n kaizen-studio -o yaml | grep suspend

# View recent jobs
kubectl get jobs -n kaizen-studio

# Check logs
kubectl logs -l component=backup -n kaizen-studio --tail=100

# Manually trigger job
kubectl create job --from=cronjob/postgres-backup test-backup -n kaizen-studio
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=true

# Run backup with verbose output
bash -x ./backup.sh

# Check detailed logs
cat deploy/backup/backups/backup.log
```

### Support

For additional support:

1. Check logs: `deploy/backup/backups/backup.log`
2. Review PostgreSQL logs: `docker-compose logs postgres`
3. Verify environment: `env | grep POSTGRES`
4. Test database connection: `psql -h localhost -U kaizen_user -d kaizen_studio`

## Best Practices

1. **Test Restores Regularly**: Verify backups monthly
2. **Multiple Retention Policies**: Daily (7 days) + Weekly (4 weeks) + Monthly (12 months)
3. **Off-Site Storage**: Upload to S3/GCS for disaster recovery
4. **Monitor Backup Size**: Alert on unexpected changes
5. **Document Procedures**: Keep runbooks updated
6. **Automate Verification**: Schedule verification after backups
7. **Security**: Encrypt backups at rest and in transit
8. **Access Control**: Restrict backup access to authorized personnel

## Security Considerations

1. **Encrypt backups**: Use `gpg` or cloud encryption
2. **Secure credentials**: Use secrets management (Vault, AWS Secrets Manager)
3. **Audit access**: Log all backup/restore operations
4. **Network security**: Use VPN/private networks for transfers
5. **Retention compliance**: Follow data retention regulations

## Additional Resources

- PostgreSQL Backup Documentation: https://www.postgresql.org/docs/current/backup.html
- Point-in-Time Recovery: https://www.postgresql.org/docs/current/continuous-archiving.html
- pg_dump Reference: https://www.postgresql.org/docs/current/app-pgdump.html
- pg_restore Reference: https://www.postgresql.org/docs/current/app-pgrestore.html

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintainer**: Kaizen Studio Team
