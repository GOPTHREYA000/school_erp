#!/bin/bash
set -e

# Can add custom startup scripts, pinging DB, or migrations checks here in the future
# Currently simply hands over the CMD argument passed by docker-compose

exec "$@"
