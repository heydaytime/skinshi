#!/bin/bash

read -p "Slug: " slug
read -p "ID:   " id

echo ""
echo "npx wrangler d1 execute auth-db-prod --remote --command \"INSERT INTO markets (slug_and_id, status) VALUES ('${slug}-${id}', 'open');\""
