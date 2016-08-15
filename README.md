# 15-112-Queue
Realtime queueing for office hours.

#Running Locally
Run postgresql locally, or run comment out the `nginx/nodeapp` parts of `docker-compose.yml` and run `docker-compose up`.
```
cd node
npm install 
npm install knex -g
knex migrate:latest
knex seed:run
npm start 
```

Navigate to `localhost:3000`. Don't use `127.0.0.1:3000`. It will break parts of the queue (a cookie domain issue). 


#Deployment on CentOS7 Digital Ocean Droplet

```
yum install -y git
cd /root
git clone https://github.com/edwdryer/scripts.git
cd scripts/centos7
sh install_base.sh
sh install_docker.sh
reboot #ssh is now on port 15112
cd /root
git clone https://github.com/edwdryer/15-112-Queue.git
cd 15-112-Queue
cd systemd
sh install_service.sh
```

