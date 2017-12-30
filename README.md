# 15-112-Queue
Realtime queueing for office hours.

## Running Locally
Run postgresql locally, or run comment out the `nodeapp` parts of `docker-compose.yml` and run `docker-compose up`.
```
cd app
npm install 
npm install knex -g
knex migrate:latest
knex seed:run
npm start
```

Navigate to `localhost:3000`. Don't use `127.0.0.1:3000`. It will break parts of the queue (a cookie domain issue). 

## Testing Procedures
- Run stress test
- Run unit tests on all browser types
- Test on mobile using chrome dev tools

## Database Environmental Variables

- RDS_HOSTNAME 
- RDS_PORT 
- RDS_DB_NAME 
- RDS_USERNAME 
- RDS_PASSWORD 

## Deployment
The preferred way to deploy this app onto a production server is using Docker. The `docker-compose.yml` file builds images for our app and Postgres.

Although the app can be run as a standalone, public webservice, we recommend putting a reverse proxy (like nginx) in front of it to serve static assets. This is advantageous because you can run other web services on port 80/443, and it reduces load on the app. Set up the reverse proxy along the lines of `deploy_configs/nginx.conf`. `/api/` and `/socket.io/` should be forwarded to the app, while everything else should be served statically.

Here's a rough outline of what needs to be done:

 - Install an OS (we recommend CentOS 7 or Debian 8, one with systemd)
 - Create a user account for yourself
 - Create a user account to hold the files
 - Run package manager updates
 - Install docker and add yourself to the `docker` group
 - Start and enable the docker service
 - Get the release you want to deploy from git
 - In the root directory of the repo, `docker-compose up -d`
 - Install certbot
 - Get a certificate
 - Install certbot auto-update systemd timer / cron task
 - Install nginx
 - Copy `deploy_configs/nginx.conf` into nginx's config directory
 - Modify the nginx configuration to match the system
 - Start the nginx service

On CentOS, here are some specific commands:

```
# AS ROOT

# enable the firewall
systemctl enable firewalld
systemctl start firewalld

# add a normal user
adduser kevin
usermod -aG wheel kevin
passwd kevin
logout


# AS KEVIN

# install the things we need
yum update
yum install git nginx docker

# let web traffic through
firewall-cmd --zone=public --permanent --add-service=http
firewall-cmd --zone=public --permanent --add-service=https

# create a user to put the app in
adduser queue

# get this code
cd /home/queue
git clone https://github.com/edwdryer/15-112-Queue.git

# let us use docker
useradd -aG docker kevin
systemctl enable docker
systemctl start docker

# build and start the app service
docker-compose up --build -d

# get a certificate
yum install epel-release
yum install certbot
certbot certonly --webroot -w /home/queue/15-112-Queue/app/static -d queue.edwarddryer.com

# at this point, also install a systemd timer / cron task that auto-renews
# the certificates twice daily by running certbot renew --quiet

# copy the nginx config over
# also edit the main nginx config to make sure this one is included
cp /home/queue/15-112-Queue/deploy_configs/nginx.conf /etc/nginx/conf.d/queue.conf

# start up nginx
systemctl enable nginx
systemctl start nginx
```

A certbot update service would look like this:

`certbot-update.service`

    [Unit]
    Description=Cerbot certificate update
    After=syslog.target network.target

    [Service]
    Type=simple
    ExecStart=/usr/bin/certbot renew --quiet

    [Install]
    WantedBy=multi-user.target

`certbot-update.timer`

    [Unit]
    Description=Twice-daily certbot certificate update

    [Timer]
    OnCalendar=*-*-* 11,23:23:11
    Persistent=true
    Unit=certbot-update.service

    [Install]
    WantedBy=timers.target

`systemctl enable certbot-update.timer`
`systemctl start certbot-update.timer`
