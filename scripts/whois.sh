#!/bin/bash

SCRIPT_DIR=$(dirname "$0")
WHOISJSON_API_KEY=$(dotenv --file "$SCRIPT_DIR/../.env" get WHOISJSON_API_KEY)

curl -X GET \
    "https://whoisjson.com/api/v1/whois?domain=whoisjson.com" \
    -H "Authorization: Token=${WHOISJSON_API_KEY}"
