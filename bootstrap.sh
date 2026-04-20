#!/usr/bin/env bash
#
# nagare - remote bootstrap
#
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/florianjs/nagare/main/bootstrap.sh)
#
# Clones the repo into ./nagare then runs install.sh.
#
set -euo pipefail

REPO="${NAGARE_REPO:-https://github.com/florianjs/nagare.git}"
BRANCH="${NAGARE_BRANCH:-main}"
DIR="${NAGARE_DIR:-nagare}"

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; GREEN=$'\033[32m'; RED=$'\033[31m'; RESET=$'\033[0m'
else
  BOLD=""; GREEN=""; RED=""; RESET=""
fi

fail() { echo "${RED}✗${RESET} $1" >&2; exit 1; }

command -v git >/dev/null 2>&1 || fail "git is required. Install it first: https://git-scm.com"

if [[ -e "$DIR" ]]; then
  fail "Directory '$DIR' already exists. Remove it or set NAGARE_DIR=some-other-name."
fi

echo "${BOLD}▸ Cloning $REPO (branch: $BRANCH) into ./$DIR${RESET}"
git clone --branch "$BRANCH" --depth 1 "$REPO" "$DIR"

cd "$DIR"

[[ -x install.sh ]] || chmod +x install.sh

echo "${BOLD}▸ Running install.sh${RESET}"
exec ./install.sh
