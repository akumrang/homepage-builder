#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/bettle-homepage/app}"
DATA_ROOT="${DATA_ROOT:-/opt/bettle-homepage/data}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/bettle-homepage/backups}"
LOG_ROOT="${LOG_ROOT:-/opt/bettle-homepage/logs}"
RUNTIME_ROOT="${RUNTIME_ROOT:-/opt/bettle-homepage/runtime}"
SERVICE_USER="${SERVICE_USER:-bettle-homepage}"
SERVICE_GROUP="${SERVICE_GROUP:-bettle-homepage}"
SERVICE_NAME="${SERVICE_NAME:-bettle-homepage-backend}"
STAGING_DOMAIN="${STAGING_DOMAIN:-staging.bettlesystem.com}"
REPO_URL="${REPO_URL:-https://github.com/akumrang/homepage-builder.git}"
BRANCH="${BRANCH:-master}"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"

ENV_FILE="${RUNTIME_ROOT}/backend.env"
DB_FILE="${DATA_ROOT}/homepage-staging.db"

log() {
  printf '[staging-deploy] %s\n' "$*"
}

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    printf 'Run as root or with sudo.\n' >&2
    exit 1
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command not found: %s\n' "$1" >&2
    exit 1
  }
}

render_template() {
  local source_file="$1"
  local target_file="$2"
  local node_bin="$3"

  sed \
    -e "s#__NODE_BIN__#${node_bin}#g" \
    -e "s#__SERVICE_USER__#${SERVICE_USER}#g" \
    -e "s#__SERVICE_GROUP__#${SERVICE_GROUP}#g" \
    -e "s#__STAGING_DOMAIN__#${STAGING_DOMAIN}#g" \
    "$source_file" > "$target_file"
}

retry_curl() {
  local url="$1"
  shift

  for attempt in $(seq 1 30); do
    if curl --fail --silent --show-error "$@" "$url"; then
      return 0
    fi

    if [ "$attempt" -lt 30 ]; then
      sleep 2
    fi
  done

  return 1
}

ensure_service_user() {
  if id "$SERVICE_USER" >/dev/null 2>&1; then
    return
  fi

  useradd --system \
    --home-dir /opt/bettle-homepage \
    --shell /usr/sbin/nologin \
    --user-group \
    "$SERVICE_USER"
}

ensure_directories() {
  mkdir -p "$APP_ROOT" "$DATA_ROOT" "$BACKUP_ROOT" "$LOG_ROOT" "$RUNTIME_ROOT"
  chown "$SERVICE_USER:$SERVICE_GROUP" "$DATA_ROOT" "$BACKUP_ROOT" "$RUNTIME_ROOT"

  if getent group caddy >/dev/null 2>&1; then
    chown "$SERVICE_USER:caddy" "$LOG_ROOT"
    chmod 0775 "$LOG_ROOT"
  else
    chown "$SERVICE_USER:$SERVICE_GROUP" "$LOG_ROOT"
    chmod 0750 "$LOG_ROOT"
  fi
}

sync_repository() {
  if [ -d "${APP_ROOT}/.git" ]; then
    log "Updating repository in ${APP_ROOT}"
    git -C "$APP_ROOT" fetch --prune origin
    git -C "$APP_ROOT" checkout "$BRANCH"
    git -C "$APP_ROOT" pull --ff-only origin "$BRANCH"
    return
  fi

  if [ "$(find "$APP_ROOT" -mindepth 1 -maxdepth 1 | wc -l)" -gt 0 ]; then
    printf 'APP_ROOT exists but is not an empty git checkout: %s\n' "$APP_ROOT" >&2
    exit 1
  fi

  log "Cloning ${REPO_URL} into ${APP_ROOT}"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_ROOT"
}

ensure_environment_file() {
  if [ -f "$ENV_FILE" ]; then
    chmod 0600 "$ENV_FILE"
    chown root:root "$ENV_FILE"
    return
  fi

  local token
  token="$(openssl rand -hex 32)"

  cat > "$ENV_FILE" <<EOF_ENV
NODE_ENV=production
DATABASE_URL=file:${DB_FILE}
HOMEPAGE_DB_BACKUP_DIR=${BACKUP_ROOT}
HOMEPAGE_CORS_ORIGINS=https://${STAGING_DOMAIN}
HOMEPAGE_INTERNAL_ACCESS_TOKEN=${token}
HOST=127.0.0.1
PORT=4200
EOF_ENV

  chmod 0600 "$ENV_FILE"
  chown root:root "$ENV_FILE"
  log "Created ${ENV_FILE} with a generated staging internal token."
}

load_runtime_env() {
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
}

stop_backend_if_running() {
  if systemctl list-unit-files "${SERVICE_NAME}.service" >/dev/null 2>&1 && systemctl is-active --quiet "$SERVICE_NAME"; then
    log "Stopping ${SERVICE_NAME} before DB backup and migration"
    systemctl stop "$SERVICE_NAME"
  fi
}

backup_existing_database() {
  if [ ! -f "$DB_FILE" ]; then
    log "No existing staging DB found; skipping pre-deploy backup."
    return
  fi

  log "Backing up existing staging DB"
  load_runtime_env
  npm run db:backup -- --label homepage-staging --out-dir "$BACKUP_ROOT"
}

install_backend_service() {
  local node_bin="$1"
  local rendered_unit
  rendered_unit="$(mktemp)"

  render_template \
    "${APP_ROOT}/deploy/ubuntu/bettle-homepage-backend.service.template" \
    "$rendered_unit" \
    "$node_bin"

  install -m 0644 "$rendered_unit" "/etc/systemd/system/${SERVICE_NAME}.service"
  rm -f "$rendered_unit"

  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME" >/dev/null
}

install_caddyfile() {
  local node_bin="$1"
  local rendered_caddyfile
  rendered_caddyfile="$(mktemp)"

  render_template \
    "${APP_ROOT}/deploy/ubuntu/Caddyfile.staging.template" \
    "$rendered_caddyfile" \
    "$node_bin"

  if [ -f "$CADDYFILE" ] && ! cmp -s "$rendered_caddyfile" "$CADDYFILE"; then
    cp "$CADDYFILE" "${CADDYFILE}.bak.$(date -u +%Y%m%dT%H%M%SZ)"
  fi

  install -m 0644 "$rendered_caddyfile" "$CADDYFILE"
  rm -f "$rendered_caddyfile"

  caddy validate --config "$CADDYFILE"
  caddy fmt --overwrite "$CADDYFILE"

  if systemctl is-active --quiet caddy; then
    systemctl reload caddy || systemctl restart caddy
  else
    systemctl enable --now caddy
  fi
}

run_public_checks() {
  local resolve_arg
  local page_file
  resolve_arg="${STAGING_DOMAIN}:443:127.0.0.1"
  page_file="$(mktemp)"

  log "Checking backend health and readiness on localhost"
  retry_curl "http://127.0.0.1:4200/api/health" >/dev/null
  retry_curl "http://127.0.0.1:4200/api/ready" >/dev/null

  log "Checking HTTPS routes through Caddy"
  retry_curl "https://${STAGING_DOMAIN}/api/health" --resolve "$resolve_arg" >/dev/null
  retry_curl "https://${STAGING_DOMAIN}/api/ready" --resolve "$resolve_arg" >/dev/null
  retry_curl "https://${STAGING_DOMAIN}/h/sample-korean-academy" --resolve "$resolve_arg" --output "$page_file" >/dev/null

  grep -q 'id="root"' "$page_file"
  rm -f "$page_file"

  local internal_status
  internal_status="$(
    curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
      --resolve "$resolve_arg" \
      "https://${STAGING_DOMAIN}/api/academies"
  )"

  if [ "$internal_status" != "401" ]; then
    printf 'Internal API guard expected HTTP 401, got %s\n' "$internal_status" >&2
    exit 1
  fi
}

run_optional_inquiry_smoke() {
  if [ "${RUN_INQUIRY_SMOKE:-0}" != "1" ]; then
    log "Skipping inquiry POST smoke. Set RUN_INQUIRY_SMOKE=1 to create one synthetic staging inquiry."
    return
  fi

  log "Creating one synthetic staging inquiry"
  curl --fail --silent --show-error \
    --resolve "${STAGING_DOMAIN}:443:127.0.0.1" \
    --header 'Content-Type: application/json' \
    --request POST \
    --data '{"academySlug":"sample-korean-academy","parentName":"Staging Test Guardian","phone":"010-0000-0000","studentGrade":"Middle 1","subject":"Korean","message":"Staging deployment smoke test inquiry. No real personal information.","privacyAccepted":true}' \
    "https://${STAGING_DOMAIN}/api/inquiries" >/dev/null
}

main() {
  require_root
  require_command git
  require_command node
  require_command npm
  require_command openssl
  require_command caddy
  require_command curl
  require_command systemctl

  local node_bin
  node_bin="$(command -v node)"

  ensure_service_user
  ensure_directories
  sync_repository
  ensure_environment_file

  cd "$APP_ROOT"

  log "Installing dependencies from package-lock.json"
  npm ci

  log "Running full project verification"
  env \
    -u DATABASE_URL \
    -u HOMEPAGE_CORS_ORIGINS \
    -u HOMEPAGE_DB_BACKUP_DIR \
    -u HOMEPAGE_INTERNAL_ACCESS_TOKEN \
    -u NODE_ENV \
    npm run verify

  log "Running production build"
  env \
    -u DATABASE_URL \
    -u HOMEPAGE_CORS_ORIGINS \
    -u HOMEPAGE_DB_BACKUP_DIR \
    -u HOMEPAGE_INTERNAL_ACCESS_TOKEN \
    -u NODE_ENV \
    npm run build

  stop_backend_if_running
  backup_existing_database

  log "Applying Prisma migrations to staging DB"
  load_runtime_env
  npm run db:deploy

  chown -R "$SERVICE_USER:$SERVICE_GROUP" "$DATA_ROOT" "$BACKUP_ROOT"
  chown "$SERVICE_USER:$SERVICE_GROUP" "$RUNTIME_ROOT"

  install_backend_service "$node_bin"
  log "Starting ${SERVICE_NAME}"
  systemctl restart "$SERVICE_NAME"

  install_caddyfile "$node_bin"

  run_public_checks
  run_optional_inquiry_smoke

  log "Staging deployment completed for https://${STAGING_DOMAIN}"
}

main "$@"
