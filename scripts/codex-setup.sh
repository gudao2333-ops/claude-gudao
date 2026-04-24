#!/usr/bin/env bash
set -euo pipefail

DB_NAME="gudao_ai_chat"
DB_USER="gudao"
DB_PASS="gudao123456"
DB_HOST="127.0.0.1"
DB_PORT="5432"

log() {
  echo "[codex-setup] $*"
}

if ! command -v psql >/dev/null 2>&1; then
  log "PostgreSQL 未安装，尝试安装 postgresql + postgresql-contrib ..."
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y postgresql postgresql-contrib
  else
    log "当前环境不支持 apt-get 自动安装 PostgreSQL。"
    log "请改用外部 PostgreSQL，并手动设置 DATABASE_URL。"
    exit 0
  fi
fi

if command -v pg_lsclusters >/dev/null 2>&1; then
  if pg_lsclusters | grep -qE '\sdown\s'; then
    log "检测到 PostgreSQL cluster 为 down，尝试启动..."
    while read -r version name _; do
      if [[ -n "${version:-}" && -n "${name:-}" ]]; then
        pg_ctlcluster "$version" "$name" start || true
      fi
    done < <(pg_lsclusters --no-header | awk '{print $1" "$2" "$4}')
  fi
fi

if command -v service >/dev/null 2>&1; then
  service postgresql start >/dev/null 2>&1 || true
fi

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
  log "本地 PostgreSQL 仍未就绪，尝试使用外部 DATABASE_URL 方案。"
  log "请提供外部 PostgreSQL 连接串并写入 .env:"
  log "DATABASE_URL=\"postgresql://<user>:<password>@<host>:<port>/<db>?schema=public\""
  exit 0
fi

log "创建用户/数据库（若不存在）..."
su postgres -c "psql -v ON_ERROR_STOP=1 -c \"DO \\\$\\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}' CREATEDB; ELSE ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' CREATEDB; END IF; END \\\$\\\$;\""

su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1 || \
  su postgres -c "createdb -O ${DB_USER} ${DB_NAME}"

su postgres -c "psql -v ON_ERROR_STOP=1 -c \"GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};\""

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

if [[ -f .env ]]; then
  if grep -q '^DATABASE_URL=' .env; then
    sed -i "s#^DATABASE_URL=.*#DATABASE_URL=\"${DATABASE_URL}\"#" .env
  else
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
  fi
else
  cp .env.example .env
  sed -i "s#^DATABASE_URL=.*#DATABASE_URL=\"${DATABASE_URL}\"#" .env
fi

log "DATABASE_URL 已写入 .env"
log "${DATABASE_URL}"
log "下一步可运行："
log "  npx prisma migrate dev --name init"
log "  npm run db:seed"
