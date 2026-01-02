# Quick Start Guide - PostgreSQL Backup for Kaizen Studio

## 1-Minute Setup

### Prerequisites Check
```bash
# Check PostgreSQL client tools
pg_dump --version
pg_restore --version

# If not installed:
# macOS:    brew install postgresql
# Ubuntu:   sudo apt-get install postgresql-client
# RHEL:     sudo yum install postgresql
```

### First Backup (3 Steps)

```bash
# 1. Navigate to backup directory
cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/deploy/backup

# 2. Verify environment variables (ensure .env exists in project root)
grep POSTGRES_ ../../.env

# 3. Run backup
./backup.sh
```

**Expected Output:**
```
[2024-01-15 14:30:00] [INFO] Starting backup: backup_20240115_143000
[2024-01-15 14:30:05] [SUCCESS] Backup completed successfully
[2024-01-15 14:30:05] [INFO] Backup size: 2.3M
```

Backup saved to: `backups/backup_20240115_143000.dump`

## Common Commands

### Create Backup
```bash
# Default (timestamped)
./backup.sh

# Named backup
./backup.sh pre_migration_backup

# Different environment
POSTGRES_HOST=prod-db.example.com ./backup.sh
```

### Verify Backup
```bash
# Always verify critical backups!
./verify-backup.sh backups/backup_20240115_143000.dump
```

### Restore Backup
```bash
# List available backups
ls -lh backups/*.dump

# Restore to default database
./restore.sh backups/backup_20240115_143000.dump

# Restore to different database
./restore.sh backups/backup_20240115_143000.dump kaizen_studio_test
```

## Automated Backups

### Docker Compose Environment

Add to host system crontab:

```bash
# Edit crontab
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * cd /Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/deploy/backup && ./backup.sh >> backups/cron.log 2>&1
```

### Kubernetes Environment

```bash
# 1. Create namespace and secrets (if not exists)
kubectl create namespace kaizen-studio
kubectl create secret generic kaizen-secrets \
  --from-literal=postgres-user=kaizen_user \
  --from-literal=postgres-password=secure_password \
  --namespace=kaizen-studio

# 2. Deploy backup infrastructure
kubectl apply -f backup-pvc.yaml
kubectl apply -f backup-cronjob.yaml

# 3. Verify
kubectl get cronjobs -n kaizen-studio
```

## Configuration

### Environment Variables

Required in `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/.env`:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kaizen_studio_dev
POSTGRES_USER=kaizen_user
POSTGRES_PASSWORD=your_secure_password
```

### Optional Settings

```bash
# Retention policy
BACKUP_RETENTION_DAYS=30      # Delete backups older than 30 days
BACKUP_RETENTION_COUNT=10     # Keep last 10 backups

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
BACKUP_EMAIL_RECIPIENT=admin@example.com

# Cloud storage
S3_BACKUP_BUCKET=kaizen-studio-backups
GCS_BACKUP_BUCKET=kaizen-studio-backups
```

## Troubleshooting

### Issue: "pg_dump command not found"

**Solution:**
```bash
# Install PostgreSQL client tools
brew install postgresql                  # macOS
sudo apt-get install postgresql-client  # Ubuntu
sudo yum install postgresql              # RHEL/CentOS
```

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Check if database is running
docker-compose ps postgres

# Test connection
psql -h localhost -U kaizen_user -d kaizen_studio

# Check environment variables
echo $POSTGRES_HOST
echo $POSTGRES_USER
```

### Issue: "Insufficient disk space"

**Solution:**
```bash
# Check disk usage
df -h

# Remove old backups
rm backups/backup_old_*.dump

# Or reduce retention
export BACKUP_RETENTION_COUNT=5
./backup.sh
```

## Emergency Recovery

### Quick Restore Process

```bash
# 1. Stop services
docker-compose stop backend

# 2. Verify backup
./verify-backup.sh backups/backup_latest.dump

# 3. Restore
./restore.sh backups/backup_latest.dump

# 4. Restart services
docker-compose start backend

# 5. Verify
docker-compose logs -f backend
```

## File Locations

| File | Location |
|------|----------|
| Backup scripts | `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/deploy/backup/` |
| Backups | `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/deploy/backup/backups/` |
| Logs | `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/deploy/backup/backups/backup.log` |
| Environment | `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/.env` |

## Next Steps

1. **Test the backup**: Run `./backup.sh` to create first backup
2. **Verify it works**: Run `./verify-backup.sh backups/<latest>.dump`
3. **Test restore**: Restore to a test database
4. **Schedule backups**: Set up cron or Kubernetes CronJob
5. **Configure notifications**: Add Slack/email alerts
6. **Enable cloud uploads**: Configure S3/GCS for off-site backups

## Documentation

For detailed information, see [README.md](README.md):
- Advanced configuration
- Disaster recovery procedures
- Point-in-time recovery (PITR)
- Kubernetes deployment
- Monitoring and alerts

---

**Need Help?**
- Check logs: `cat backups/backup.log`
- Test connection: `psql -h localhost -U kaizen_user -d kaizen_studio`
- Verify environment: `grep POSTGRES_ ../../.env`
