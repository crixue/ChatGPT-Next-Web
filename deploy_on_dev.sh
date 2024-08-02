#!/usr/bin/bash

git pull

#docker build --no-cache -t art.local:8081/docker-local/lingro-web:latest .
docker build -t art.local:8081/docker-local/lingro-web:latest .

docker push art.local:8081/docker-local/lingro-web:latest