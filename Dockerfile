FROM debian:stable-slim

RUN apt-get update \
  && apt-get install -y \
  curl \
  ca-certificates \
  --no-install-recommends

WORKDIR /app

VOLUME db/
VOLUME data/

COPY package.json yarn.lock tsconfig.json /app/

ENV VOLTA_HOME /root/.volta
ENV PATH $VOLTA_HOME/bin:$PATH
RUN curl https://get.volta.sh | bash || echo 'okay'

RUN yarn install

COPY src/ /app/src
COPY config.yml /app/

CMD ["yarn", "start"]
