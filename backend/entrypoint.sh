#!/bin/sh
set -e

# Ensure the bind-mounted /data directory is writable by appuser
chown -R appuser:appuser /data 2>/dev/null || true

# Drop privileges and exec the CMD
exec runuser -u appuser -- "$@"
