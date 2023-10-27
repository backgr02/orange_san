#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

./zip.sh .venv/function.zip

aws lambda update-function-code --function-name replyTownworkByMisskeyNote --zip-file fileb://.venv/function.zip
