#!/bin/zsh

npm install

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ ! -f config/default.yaml ]; then
    cp config/default.yaml.example config/default.yaml
fi

exit 0
