#!/bin/sh
set -e

# Substitute environment variables in kong.yml
envsubst < /home/kong/temp.yml > /usr/local/kong/kong.yml

# Start Kong
exec kong start
