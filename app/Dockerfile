FROM node:argon-alpine

# Create an unprivileged user to install/run our app
RUN addgroup -S app &&\
    adduser -S -D -h /home/app -s /bin/false app &&\
    mkdir /home/app/queue

WORKDIR /home/app/queue

# Copy over the package.json and install dependencies
# first. As long as package.json doesn't changed, docker
# will cache the result of npm install.
COPY package.json npm-shrinkwrap.json ./
RUN chown -R app:app .
RUN apk add --no-cache g++ make python &&\
    su -s /bin/sh -c "cd /home/app/queue && npm install" - app &&\
    apk del g++ make python

# Copy over our app
COPY . .
RUN chown -R app:app .

# Run our app
USER app
ENTRYPOINT ["npm", "run-script", "start-docker"]
