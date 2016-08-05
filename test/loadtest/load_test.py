import psycopg2
from socketIO_client import SocketIO, LoggingNamespace
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
	print(s.post(url + "/user/createlocal", json=reg_payload).json())

	#login
	user_info = {
		"username": andrew_id,
		"password": password
	}
	login_route = url + "/login/localauth"
	logout_route = url + "/login/endauth"
	print(s.post(login_route, json=user_info))

	#start socketio
	session_cookies = s.cookies.get_dict() 
	sio = SocketIO(url,3000,cookies=session_cookies)
	print("Socketio connected")

	#keep connection open
	sio.wait()
	print("Socketio waiting")

	#logout 
	s.post(logout_route)

#Server location
base_url = "http://127.0.0.1"
url = base_url + ":3000"

#Connect to db
conn = psycopg2.connect("dbname='queue' user='queue' host='127.0.0.1' password='supersecret'")
cur = conn.cursor()

#Add accounts to valid_andrew_ids 
number_students = 1000  #number of students to simulate
info = []
for x in range(number_students):
	andrew_id = str(uuid.uuid4())
	password = "passwords"
	cur.execute("INSERT INTO valid_andrew_ids (andrew_id,role) VALUES ('%s','student')" % andrew_id)
	info.append((andrew_id,password))
conn.commit()
conn.close()
print("valid_andrew_ids added")

#start "students"
for (andrew_id,password) in info:
	Thread(target=lambda : login_as_student_and_wait(andrew_id,password)).start()
print("threads started")


