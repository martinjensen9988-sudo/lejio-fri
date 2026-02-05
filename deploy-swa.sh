#!/bin/bash
# Usage: ./deploy-swa.sh <deployment-token>
# Example: ./deploy-swa.sh 14b98...

if [ -z "$1" ]; then
  echo "Usage: $0 <deployment-token>"
  exit 1
fi

export SWA_CLI_DEPLOYMENT_TOKEN="$1"
swa deploy ./dist --api-location ./api --swa-config-location ./dist --env production --api-language node --api-version 18 --verbose
