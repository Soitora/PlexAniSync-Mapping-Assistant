FROM node:22

# Create the user and group for app to run as
ARG USER=app
RUN groupadd -f ${USER} && \
    useradd -g ${USER} -m ${USER} -d /home/${USER}

USER ${USER}
WORKDIR /home/${USER}
ADD --chown=${USER}:${USER} ./ /home/${USER}/
RUN npm install

ENTRYPOINT [ "npm", "run", "assistant"]
