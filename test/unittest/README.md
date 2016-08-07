#Usage

###Deploy the Webapp
Deploy the webapp. This can't be localhost since the selenium containers need to access it. I used edwarddryer.com. Make sure the google credentials page has the domain you deploy to.  

###Start Selenium 
`docker-compose up --force-recreate &`
`docker-compose scale chrome-node=5 firefox-node=5`

###Run Tests
Edit cmu_user and cmu_pass values in tests.py 
`python3 tests.py`

###Kill Selenium 
```
docker stop $(docker ps -a -q --filter "label=queue_tests")
docker rm $(docker ps -a -q --filter "label=queue_tests")
```

Don't forget to remove your password!


