#!/usr/bin/env bash

GREEN="\033[1;32m"
YELLOW="\033[1;33m"

echo -e "${GREEN}Start cleanup..."

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_DEFAULT_REGION=$(aws configure get region)

cdk --app "npx ts-node bin/pipeline-stack.ts" destroy --require-approval never
cdk --app "npx ts-node bin/container-image-stack.ts" destroy --require-approval never

echo -e "${GREEN}Cleanup completed..."
