import psycopg2
from socketIO_client import SocketIO,BaseNamespace
import requests
import time
from threading import Thread
import pickle


def login_as_student_and_wait(andrew_id,password):
	#start session
	s = requests.Session()

	#register account
	reg_payload =  {
		"andrew_id" : andrew_id, 
		"email" : andrew_id + "@cmu.edu",
		"password" : password, 
		"first_name" : "woo",
		"last_name" : "haa", 
		"registration_code" : "private"
	}
	print("Register: ", s.post(url + "/user/createlocal", json=reg_payload))

	#login
	user_info = {
		"username": andrew_id,
		"password": password
	}
	login_route = url + "/login/localauth"
	logout_route = url + "/login/endauth"
	print("Login:", s.post(login_route, json=user_info))

	#start socketio
	session_cookies = s.cookies.get_dict() 
	sio = SocketIO(url,3000,cookies=session_cookies, params={
		'forceNew': True,
	})
	queue_namespace =  sio.define(BaseNamespace, '/queue')
	print("Socketio connected")

	#ask question
	queue_namespace.emit("new_question", {
		"help_text": "woo new question from stress test",
		"location_id": 1,
		"topic_id": 3, 
	})

	#keep connection open
	print("Socketio waiting")
	sio.wait(3)

	#logout 
	print("logout:",s.get(logout_route))

#Server location
base_url = "http://localhost"
url = base_url + ":3000"

#Add accounts to valid_andrew_ids 
p = open( "andrew_ids.p", "rb" )
info = pickle.load(p)
p.close()

#start "students"
for andrew_id in info:
	Thread(target=lambda : login_as_student_and_wait(andrew_id,"passwords")).start()
print("threads started")


