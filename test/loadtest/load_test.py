import psycopg2
from socketIO_client import SocketIO,BaseNamespace
import requests
import time
import uuid
from threading import Thread


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
		"location_id": 54321,
		"topic_id": 5432
	})

	#keep connection open
	print("Socketio waiting")
	sio.wait(3)

	#logout 
	print("logout:",s.get(logout_route))

#Server location
base_url = "http://localhost"
url = base_url + ":3000"

#Connect to db
conn = psycopg2.connect("dbname='queue' user='queue' host='127.0.0.1' password='supersecret'")
cur = conn.cursor()

#Add accounts to valid_andrew_ids 
number_students = 500 #number of students to simulate
info = []
for x in range(number_students):
	andrew_id = str(uuid.uuid4())
	password = "passwords"
	cur.execute("INSERT INTO valid_andrew_ids (andrew_id,role) VALUES ('%s','student')" % andrew_id)
	info.append((andrew_id,password))
conn.commit()
print("valid_andrew_ids added")

#Add a topic
try:
	cur.execute("INSERT INTO topics (id,topic,enabled) VALUES ('5432','wootopic1','true') ;")
	conn.commit()
	print("Added topic")
except:
	conn.rollback()

#Add a location 
try:
	cur.execute("INSERT INTO locations (id,location,enabled) VALUES ('54321','wooloc1', 'true') ;")
	conn.commit()
	print("Added location")
except:
	conn.rollback()

#start "students"
conn.close()
for (andrew_id,password) in info:
	Thread(target=lambda : login_as_student_and_wait(andrew_id,password)).start()
print("threads started")


