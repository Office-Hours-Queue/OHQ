import psycopg2
from socketIO_client import SocketIO,BaseNamespace
import requests
import time
from threading import Thread
import pickle

#Server location
url = "https://queue.edwarddryer.com"

#Add accounts to valid_andrew_ids 
p = open( "andrew_ids.p", "rb" )
info = pickle.load(p)
p.close()

for andrew_id in info:
	#start session
	s = requests.Session()

	#register account
	reg_payload =  {
		"andrew_id" : andrew_id, 
		"email" : andrew_id + "@cmu.edu",
		"password" : "passwords",
		"first_name" : "woo",
		"last_name" : "haa", 
		"registration_code" : "private"
	}
	print("Register: ", s.post(url + "/api/user/createlocal", json=reg_payload))




