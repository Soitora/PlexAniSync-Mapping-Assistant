FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

USER root

RUN apt-get update -y -qq && \
    apt-get dist-upgrade -y -qq && \
    apt-get install sudo && \
    apt-get autoremove -y -qq

# git safe directories
RUN git config --global --add safe.directory /workspaces/plexanisync-mapping-assistant

RUN apt-get -y -qq install \
    fzf \
    jq \
    yq \
    zsh

