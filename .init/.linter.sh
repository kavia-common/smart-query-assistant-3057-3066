#!/bin/bash
cd /home/kavia/workspace/code-generation/smart-query-assistant-3057-3066/frontend_react
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

