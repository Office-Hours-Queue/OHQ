java -jar selenium-server-standalone-2.53.1.jar -role hub &
sleep 5
java -jar selenium-server-standalone-2.53.1.jar -role node  -hub http://localhost:4444/grid/register -maxSession 100 -browser " 
browserName=chrome,maxSession=100,maxInstances=100,platform=ANY,seleniumProtocol=WebDriver"

