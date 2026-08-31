#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

case "${1:-}" in
  create:package)
    node --import tsx/esm "$ROOT/tools/cli/src/createPackage.ts" "${@:2}"
  ;;
  *)
    echo "Usage: ./tools/cli/bin/cli.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  create:package <name> [apps|packages] [node|react|lib]"
    exit 1
  ;;
esac
