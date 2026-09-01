# Kyros System

A minimal deployment smoke test for a future Kyros application. It provides a responsive status page with a visible release marker and is intended for Dockerfile deployment platforms such as Coolify.

## Current scope

- Static, dependency-free status page
- Release marker: `smoke-001`
- Search indexing disabled with a `noindex, nofollow` page directive
- Docker and Nginx configuration will be added separately

## Expected verification

Once the Dockerfile and Nginx configuration are added, the container should serve the status page at `/` and return HTTP 200 JSON from `/health`.

No secrets, API tokens, or deployment domains are stored in this repository.
