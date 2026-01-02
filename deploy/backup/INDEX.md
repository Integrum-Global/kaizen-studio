# Backup Infrastructure Index

## Quick Navigation

### Getting Started (Choose One)

1. **New to backups?** → Start with [QUICK_START.md](QUICK_START.md)
2. **Need comprehensive guide?** → Read [README.md](README.md)
3. **Looking for deployment info?** → See [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)

### By Task

| I want to... | Go to... |
|--------------|----------|
| Create my first backup | [QUICK_START.md](QUICK_START.md#first-backup-3-steps) |
| Restore a database | [README.md](README.md#recovery-procedures) |
| Verify backup integrity | [README.md](README.md#verification) |
| Set up automated backups | [README.md](README.md#automated-backups-cron) |
| Deploy to Kubernetes | [README.md](README.md#kubernetes-deployment) |
| Handle disaster recovery | [README.md](README.md#disaster-recovery) |
| Troubleshoot issues | [README.md](README.md#troubleshooting) |
| Monitor backup health | [README.md](README.md#monitoring) |
| Configure notifications | [README.md](README.md#slack-notifications) |
| Enable cloud backups | [README.md](README.md#cloud-upload-configuration) |

### Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| [backup.sh](backup.sh) | Create database backups | `./backup.sh [name]` |
| [restore.sh](restore.sh) | Restore from backup | `./restore.sh <file> [db]` |
| [verify-backup.sh](verify-backup.sh) | Verify backup integrity | `./verify-backup.sh <file>` |
| [check-backup-health.sh](check-backup-health.sh) | Health monitoring | `./check-backup-health.sh` |

### Configuration Files

| File | Purpose |
|------|---------|
| [.env.example](.env.example) | Environment variable template |
| [backup-cronjob.yaml](backup-cronjob.yaml) | Kubernetes CronJob definition |
| [backup-pvc.yaml](backup-pvc.yaml) | Kubernetes storage definition |

### Documentation Files

| File | Description | Lines | When to Read |
|------|-------------|-------|--------------|
| [QUICK_START.md](QUICK_START.md) | 1-minute setup guide | 200 | First time setup |
| [README.md](README.md) | Comprehensive documentation | 850 | Detailed procedures |
| [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) | Deployment overview | 400 | Infrastructure review |
| [INDEX.md](INDEX.md) | This file - navigation | 150 | Finding information |

## File Statistics

```
Total Files: 11
- Shell Scripts: 4 (executable)
- Kubernetes YAML: 2
- Documentation: 4 (Markdown)
- Configuration: 1 (.env.example)

Total Lines: ~3,060
- Code: ~1,140 lines
- Documentation: ~1,500 lines
- Configuration: ~420 lines
```

## Features Summary

### Backup Features
- ✅ Compressed backups (custom format, level 6)
- ✅ Automatic rotation (age + count policies)
- ✅ Metadata tracking (JSON format)
- ✅ Cloud upload support (S3/GCS)
- ✅ Comprehensive logging
- ✅ Slack/email notifications

### Restore Features
- ✅ Safety checks (production confirmation)
- ✅ Backup validation (integrity checks)
- ✅ Connection verification
- ✅ Disk space checks
- ✅ Post-restore optimization
- ✅ PITR documentation

### Verification Features
- ✅ Test restore (temporary database)
- ✅ 7 integrity checks
- ✅ Automatic cleanup
- ✅ Detailed reporting
- ✅ Foreign key validation

### Monitoring Features
- ✅ Backup age monitoring
- ✅ Disk space alerts
- ✅ Backup count tracking
- ✅ Size consistency checks
- ✅ Integrity verification
- ✅ Error log monitoring

### Kubernetes Features
- ✅ CronJob (scheduled backups)
- ✅ ConfigMap (embedded scripts)
- ✅ PVC (persistent storage)
- ✅ Resource limits
- ✅ Security context
- ✅ AWS S3 integration

## Common Workflows

### Daily Operations

```bash
# 1. Create backup (automated via cron)
./backup.sh

# 2. Check health
./check-backup-health.sh

# 3. View logs
tail -f backups/backup.log
```

### Weekly Verification

```bash
# Verify latest backup
./verify-backup.sh backups/backup_latest.dump

# Check backup statistics
ls -lh backups/*.dump
du -sh backups/
```

### Emergency Restore

```bash
# 1. Stop services
docker-compose stop backend

# 2. Verify backup
./verify-backup.sh backups/backup_latest.dump

# 3. Restore
./restore.sh backups/backup_latest.dump

# 4. Restart services
docker-compose start backend
```

## Environment Setup

### Required Variables

Add to `/Users/esperie/repos/dev/kailash_kaizen/apps/kaizen-studio/.env`:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kaizen_studio_dev
POSTGRES_USER=kaizen_user
POSTGRES_PASSWORD=secure_password
```

### Optional Variables

```bash
BACKUP_RETENTION_DAYS=30
BACKUP_RETENTION_COUNT=10
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
S3_BACKUP_BUCKET=kaizen-studio-backups
```

## Directory Structure

```
deploy/backup/
├── backup.sh                   # Main backup script
├── restore.sh                  # Restore script
├── verify-backup.sh           # Verification script
├── check-backup-health.sh     # Health monitoring
│
├── backup-cronjob.yaml         # Kubernetes CronJob
├── backup-pvc.yaml            # Kubernetes PVC
│
├── README.md                   # Comprehensive guide (850 lines)
├── QUICK_START.md             # Quick start (200 lines)
├── DEPLOYMENT_SUMMARY.md      # Deployment info (400 lines)
├── INDEX.md                   # This file (150 lines)
│
├── .env.example               # Configuration template
├── .gitignore                 # Git exclusions
│
└── backups/                   # Backup storage
    ├── .gitkeep              # Preserve directory
    ├── *.dump                # Backup files (excluded)
    ├── *.dump.meta           # Metadata (excluded)
    └── *.log                 # Logs (excluded)
```

## Getting Help

### Troubleshooting Steps

1. **Check logs**: `cat backups/backup.log`
2. **Test connection**: `psql -h localhost -U kaizen_user -d kaizen_studio`
3. **Verify environment**: `grep POSTGRES_ ../../.env`
4. **Check disk space**: `df -h`
5. **Run health check**: `./check-backup-health.sh`

### Documentation Sections

- **Backup issues** → [README.md#troubleshooting](README.md#troubleshooting)
- **Restore issues** → [README.md#recovery-procedures](README.md#recovery-procedures)
- **Kubernetes issues** → [README.md#kubernetes-monitoring](README.md#kubernetes-monitoring)
- **Quick fixes** → [QUICK_START.md#troubleshooting](QUICK_START.md#troubleshooting)

## Next Steps

### Initial Setup (First Time)
1. Read [QUICK_START.md](QUICK_START.md)
2. Run `./backup.sh` to create first backup
3. Run `./verify-backup.sh backups/<latest>.dump` to verify
4. Test restore to test database

### Automation Setup
1. Set up cron jobs (Docker Compose) OR
2. Deploy Kubernetes CronJob
3. Configure notifications (Slack/email)
4. Set up health monitoring

### Production Preparation
1. Test disaster recovery procedures
2. Configure cloud backups (S3/GCS)
3. Document custom procedures
4. Train team on restore procedures

## Resources

- PostgreSQL Backup: https://www.postgresql.org/docs/current/backup.html
- pg_dump: https://www.postgresql.org/docs/current/app-pgdump.html
- pg_restore: https://www.postgresql.org/docs/current/app-pgrestore.html
- Kubernetes CronJobs: https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/

---

**Quick Links**:
[Quick Start](QUICK_START.md) |
[Full Documentation](README.md) |
[Deployment Guide](DEPLOYMENT_SUMMARY.md) |
[Configuration](.env.example)

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Created**: 2024-01-15
