#!/usr/bin/bash

cd ../

git pull

docker build -t art.local:8081/docker-local/lingro-web:latest .

docker push art.local:8081/docker-local/lingro-web:latest