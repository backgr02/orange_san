#!/usr/bin/env bash
set -euxo pipefail
cd "$(dirname "$0")"

./zip.sh my_deployment_package.zip

aws lambda update-function-code --function-name orange_san --zip-file fileb://my_deployment_package.zip

rm -f my_deployment_package.zip
