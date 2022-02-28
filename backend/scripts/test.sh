#!/bin/bash

docker exec -it dev-db mysql -u root -proot -e 'drop database test;'
docker exec -it dev-db mysql -u root -proot -e 'create database test;'
npx prisma migrate deploy
docker exec -it dev sh -c "cd /app/backend && npm run test"
