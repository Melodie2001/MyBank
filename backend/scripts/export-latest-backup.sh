#!/bin/bash
# Installed root-owned at /usr/local/sbin/nexo-export-backups.
# Writes only the latest complete backup pair to stdout for a restricted SSH key.
set -euo pipefail
cd /home/ubuntu/MyBank/backups
shopt -s nullglob
archives=(mysql_????????_??????.sql.gz)
for ((i=${#archives[@]}-1; i>=0; i--)); do
    mysql="${archives[$i]}"
    stamp="${mysql#mysql_}"
    stamp="${stamp%.sql.gz}"
    [[ "$stamp" =~ ^[0-9]{8}_[0-9]{6}$ ]] || continue
    mongo="mongo_${stamp}.archive.gz"
    if [[ -f "$mongo" && ! -L "$mongo" && ! -L "$mysql" ]]; then
        gzip -t "$mysql" "$mongo"
        exec tar -cf - -- "$mysql" "$mongo"
    fi
done
echo 'No complete backup pair found' >&2
exit 1
