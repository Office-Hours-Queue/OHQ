FROM node:argon

# Create an unprivileged user to install/run our app
RUN useradd --user-group --create-home --shell /bin/false app &&\
    mkdir /home/app/queue

WORKDIR /home/app/queue

# Copy over the package.json and install dependencies
# first. As long as package.json doesn't changed, docker
# will cache the result of npm install.
COPY package.json .
RUN chown -R app:app .
USER app
RUN npm install

# Copy over our app
USER root
COPY . .
RUN chown -R app:app .

# Run our app
USER app
ENTRYPOINT ["npm", "start"]
