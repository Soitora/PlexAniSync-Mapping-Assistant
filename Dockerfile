FROM node:22-bookworm

# update base os
RUN apt-get update -y -qq && \
  apt-get dist-upgrade -y -qq && \
  apt-get autoremove -y -qq

RUN apt-get install xsel

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
