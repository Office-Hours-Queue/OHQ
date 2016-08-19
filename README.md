# 15-112-Queue
Realtime queueing for office hours.

#Running Locally
Run postgresql locally, or run comment out the `nodeapp` parts of `docker-compose.yml` and run `docker-compose up`.
```
cd app
npm install 
npm install knex -g
knex migrate:latest
knex seed:run
npm run-script start-dev
```

Navigate to `localhost:3000`. Don't use `127.0.0.1:3000`. It will break parts of the queue (a cookie domain issue). 

#Testing Procedures
- Run stress test
- Run unit tests on all browser types
- Test on mobile using chrome dev tools


