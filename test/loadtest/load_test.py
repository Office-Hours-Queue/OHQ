import psycopg2
from socketIO_client import SocketIO,BaseNamespace
import requests
import time
from threading import Thread
import pickle
import argparse

parser = argparse.ArgumentParser(description='Load Test 15-112 Queue')
parser.add_argument('--start', required=True, dest='start', type=int,  default=0)
parser.add_argument('--end', required=True, dest='end', type=int,  default=1000)
args = parser.parse_args()


def login_as_student_and_wait(andrew_id,password):
	try:
		#start session
		s = requests.Session()

		#login
		user_info = {
			"username": andrew_id,
			"password": password
		}
		login_route = url + "/api/login/localauth"
		logout_route = url + "/api/login/endauth"
		print("Login:", s.post(login_route, json=user_info))

		#start socketio
		session_cookies = s.cookies.get_dict() 
		sio = SocketIO(url + "/socket.io" ,cookies=session_cookies, params={
			'forceNew': True,
		})
		queue_namespace =  sio.define(BaseNamespace, '/queue')
		print("Socketio connected")

		#ask question
		queue_namespace.emit("new_question", {
			"help_text": "woo new question from stress test" + andrew_id,
			"location_id": 1,
			"topic_id": 3, 
		})
		print("question asked")

		#keep connection open
		print("Socketio waiting")
		sio.wait(3)

		#logout 
		print("logout:",s.get(logout_route))
	except:
		print("failed!")

#Server location
# url = "https://queue.edwarddryer.com"
url = "http://localhost:3000"

#Add accounts to valid_andrew_ids 
p = open( "andrew_ids.p", "rb" )
info = pickle.load(p)
p.close()

#start "students"
i = args.start 
for andrew_id in info:
	if (i == args.end): break
	i += 1
	Thread(target=lambda : login_as_student_and_wait(andrew_id,"passwords")).start()
print("threads started")


