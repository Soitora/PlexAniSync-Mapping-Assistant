FROM node:22

# Create the app user and group
RUN groupadd -f app && \
    useradd -g app -m app -d /home/app
USER app
WORKDIR /home/app

# copy app into container
ADD --chown=app:app ./ /home/app/

# install dependencies
RUN npm install

ENTRYPOINT ["npm", "run", "assistant"]
