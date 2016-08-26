docker exec 112_queue_nodeapp bash -c 'npm run-script migrate' 
docker exec 112_queue_nodeapp bash -c 'npm run-script seed'
