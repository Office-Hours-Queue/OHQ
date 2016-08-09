"""
A generic 'student' and 'ca' interface for working with selenium and psycopg2.
Designed to allow parallel testing.
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import psycopg2
from jsonschema import validate
import json
import uuid

class User(object):
	"""
	Represents a queue app user.
	Implements selenium setup, login, logout, helpers, and tear down
	Intended for internal use only.
	"""
	@classmethod
	def load_config(user):
		"Load and validate testing config file."
		schema = open('test_config_schema.json','rt')
		config = open('test_config.json','rt')
		schema_obj = json.load(schema)
		config_obj = json.load(config)
		try:
			validate(config_obj,schema_obj)
			user.Config = config_obj
		except Exception as e:
			print(str(e))
			sys.exit(-1)
		finally:
			schema.close()
			config.close()
	load_config()

	def __init__(self,role):
		"""
		Initialize a user by setting up selenium, 
		psycopg2 and registering them.
		"""
		#Setup selenium
		sel_url = User.Config["selenium_hub_url"]
		browser = User.Config["browser"]
		caps = None
		if (browser == "chrome"):
			caps = DesiredCapabilities.CHROME
		elif (browser == "firefox"):
			caps = DesiredCapabilities.FIREFOX
		else:
			raise Exception("Browser not yet supported")		
		self.driver = webdriver.Remote(command_executor=sel_url,
									   desired_capabilities=caps)
		self.driver.implicitly_wait(15)
		self.driver.maximize_window()

		#Start postgresql client
		db_url = User.Config["db_url"]
		db_name = User.Config["db_name"]
		host = User.Config["db_host"]
		password = User.Config["db_pass"]
		conn_str = "dbname='%s' user='%s' host='%s' password='%s'" % (db_name,
														db_url,db_url,db_pass)
		self.conn = psycopg2.connect(conn_str)
		self.cur = self.conn.cursor()

		#Initialize basic information 
		aid = str(uuid.uuid4())
		self.info = {
			"andrew_id": aid ,
			"email":  aid + "@cmu.edu",
			"first_name":  aid + "fname",
			"last_name":  aid + "lname",
			"password":  "woowoowoowoo",
			"conf_password":  "woowoowoowoo",
			"role":  role,
			"reg_code":  User.Config["queue_reg_code"],
		}
		
		#Insert self into valid_andrew_ids
		role = self.info["role"]
		add_query = "INSERT INTO valid_andrew_ids (andrew_id,role) VALUES ('%s','%s') ; " % (aid,role)
		self.cur.execute(add_query)
		self.conn.commit()

	def tearDown(self):
		"""Exit selenium and psycopg2."""
		#remove questions from user
		get_id = "SELECT id FROM users WHERE andrew_id='%s' ;" % self.info["andrew_id"]
		self.cur.execute(get_id)
		self.conn.commit()
		r = self.cur.fetchone()
		query = "DELETE FROM questions WHERE student_user_id='%i' ;" % r[0]
		self.cur.execute(query)
		self.conn.commit()

		#delete user
		query = "DELETE FROM users WHERE andrew_id='%s' ;" % self.info["andrew_id"]
		self.cur.execute(query)
		self.conn.commit()

		#remove from valid_andrew_ids
		del_query = "DELETE FROM valid_andrew_ids WHERE andrew_id='%s' ; " % self.info["andrew_id"]
        self.cur.execute(del_query)
        self.conn.commit()

        #close selenium and driver
		self.driver.close()
        self.conn.close()

    def register(self,check_fn=None):
    	"""Registers the user."""
        self.driver.get(User.Config["queue_url"])
        no_apps = self.driver.find_element_by_partial_link_text("Don't have Google Apps? Click here.")
        no_apps.click()
        time.sleep(1)
        register = self.driver.find_element_by_partial_link_text("Register")
        register.click()
        time.sleep(1)

        #fill in fields
        for key,val in self.info.items():
        	if (key == "role"): continue
            element = self.driver.find_element_by_id(key)
            element.send_keys(val)

        #click register submit
        register_submit = self.driver.find_element_by_id("reg_submit")
        register_submit.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def login(self,check_fn=None):
		"""Log the user in."""
        self.driver.get(User.Config["queue_url"])

		#click no google apps modal
		no_apps = self.driver.find_element_by_partial_link_text("Don't have Google Apps? Click here.")
		no_apps.click()
		time.sleep(1)

		#enter user/pass
		user_field = self.driver.find_element_by_id("username")
		password_field = self.driver.find_element_by_id("password")
		user_field.send_keys(self.info["andrew_id"])
		password_field.send_keys(self.info["password"])

		#click login
		login = self.driver.find_element_by_name("no_google_submit")
		login.click()
		time.sleep(1)

		#check login
		name = self.driver.find_element_by_partial_link_text(self.info["first_name"])
		assert(self.info["first_name"] in name.text)

        if (check_fn != None): check_fn(self)

	def logout(self,check_fn=None):
		"""Log the user out"""
		logout = self.driver.find_element_by_partial_link_text('Log Out')
		time.sleep(1)
		logout.click()
		time.sleep(1)
		lets_begin = self.driver.find_element_by_id('lets_begin')
		assert("BEGIN" in lets_begin.text)
        if (check_fn != None): check_fn(self)

    def on_ca_page(self):
    	"""Checks if the user is on the CA page."""
        min_rule = self.driver.find_element_by_id("min_rule")
        assert(min_rule.text == "MinRule")

    def on_student_page(self):
    	"""Checks if the user is on the Student page."""
	    q = self.driver.find_element_by_id("your_question")
	    assert(q.text == "Your Question")

	def check_toast(self,expected_text):
		"""Check if there was a toast on the page."""
		toast = self.driver.find_element_by_class_name("toast")
		text = toast.text
		assert(text == expected_text)

	def run(self,run_fn):
		"""Run arbitrary selenium code on the web page."""
		run_fn(self)

class Student(User): 
	"""Represents a User with role 'student'."""
	def __init__(self):
		super().__init__("student")

	def ask_question(self,check_fn=None):
		"""Ask a question."""
		#open question modal
		ask_q_modal = self.driver.find_element_by_id("new_q")
        ask_q_modal.click()
        time.sleep(1)

        #check topics exist
        topics = self.driver.find_elements_by_name("topic_option")
        assert(len(topics) > 0)

        #check location exist
        locs = self.driver.find_elements_by_name("location_option")
        assert(len(locs) > 0)

        #enter description
        desc = self.driver.find_element_by_id("q_desc")
        desc.send_keys("woo")

        #ask question
        ask = self.driver.find_element_by_name("submit_new_q")
        ask.click()

		#check that it showed up
		table_rows = self.driver.find_elements_by_name("q_row")
		assert(len(table_rows) == 1)

		#check the help text
		desc_text = self.driver.find_element_by_id("help_text_table").text
		assert(desc_text == "woo")

		#Try to ask question (hopefully can't)
		ask_q_modal = self.driver.find_element_by_id("new_q")
		ask_q_modal.click()
		time.sleep(1)
		have_q = self.driver.find_element_by_id("have_q").text
		assert(have_q == "You already have a question.")
		ask = self.driver.find_element_by_name("submit_new_q")
		ask.click()

        if (check_fn != None): check_fn(self)

	def edit_quesition(self,check_fn=None):
		"""Edit the student's current question (assumed to exist)."""
        pencil = self.driver.find_element_by_id("pencil_edit")
        pencil.click()
        time.sleep(1)
        desc = self.driver.find_element_by_id("q_desc_update")
        desc.send_keys("secondwoo")
        submit_edit = self.driver.find_element_by_name("submit_edit_q")
        submit_edit.click()
        desc_text = self.driver.find_element_by_id("help_text_table").text
        assert(desc_text == "woosecondwoo")

        if (check_fn != None): check_fn(self)

	def delete_question(self,check_fn=None):
		"""Delete the student's current question."""
		delete = self.driver.find_element_by_id("trash_delete")
		delete.click()
		time.sleep(1)
		do_delete = self.driver.find_element_by_name("do_delete")
		do_delete.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def freeze_question(self,check_fn=None):
		"""Freeze the student's current question."""
        toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
        toggle_freeze.click()
        time.sleep(1)
        self.check_text("Your question was frozen.")()
        freeze_text = self.driver.find_element_by_id("freeze_text").text
        assert(freeze_text == "Unfreeze")

        if (check_fn != None): check_fn(self)

	def unfreeze_question(self,check_fn=None):
		"""Unfreeze the student's current question."""
		toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
		toggle_freeze.click()
		time.sleep(1)
		freeze_text = self.driver.find_element_by_id("freeze_text").text
		assert(freeze_text == "Freeze")
		
        if (check_fn != None): check_fn(self)

	def get_pos(self):
		"""Get the student's position in the queue."""
		pos = self.driver.find_element_by_id("pos_card").text
		return pos

class CA(User):
	"""Represents a User with role 'ca'."""
	def __init__(self):
		super().__init__("ca")

	def go_online(self,check_fn=None):
		"""Mark the CA as online."""
		go_online_btn = self.driver.find_element_by_id("go_online_btn")
		go_online_btn.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def go_offline(self,check_fn=None):
		"""Mark the CA as offline."""
		go_offline_btn = self.driver.find_element_by_id("go_offline_btn")
		go_online_btn.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def close_queue(self,check_fn=None):
		"""Have the CA close the queue. """
		queue_off = self.driver.find_element_by_id("close_queue_btn")
		queue_off.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def open_queue(self,check_fn=None):
		"""Have the CA open the queue."""
		queue_on = self.driver.find_element_by_id("open_queue_btn")
		queue_on.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def get_minute_rule(self):
		"""Get the minute rule displayed on the CA's page."""
        min_rule_text = self.driver.find_element_by_id("min_rule_text")
        return min_rule_text.text

	def update_minute_rule(self,n,check_fn=None):
		"""Have the CA update the minute rule."""
		min_rule_change = self.driver.find_element_by_id("min_rule_change")
		min_rule_change.click()
		time.sleep(1)
		min_rule_input = self.driver.find_element_by_id("minuteRule")
		min_rule_input.clear()
		min_rule_input.send_keys(str(n))
		min_rule_save = self.driver.find_element_by_id("update_rule_btn")
		min_rule_save.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def get_num_cas(self):
		"""Get the number of CAs displayed on the page."""
		n_cas = self.driver.find_element_by_id("numCAs")
		return n_cas.text

	def get_n_questions(self):
		"""Get the number of questions displayed on the page"""
        n_questions = self.driver.find_element_by_id("numQuestions")
		return n_questions.text	

	def answer(self,check_fn=None):
		"""Internal method to click answer_question."""
		answer_btn = self.driver.find_element_by_id("answer-btn")
		answer_btn.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def answer_kick(self,check_fn=None):
		"""Have the CA answer and kick question."""
		kick_btn = self.driver.find_element_by_id("kick_q")
		kick_btn.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def answer_freeze(self,check_fn=None):
		"""Have the CA answer and freeze a question."""
		freeze_btn = self.driver.find_element_by_id("freeze_q")
		freeze_btn.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def answer_finish(self,check_fn=None):
		"""Have the CA finish answering the question."""
		finish_btn = self.driver.find_element_by_id("finish_q")
		finish_btn.click()
		time.sleep(1)

        if (check_fn != None): check_fn(self)

	def get_table(self,check_fn=None):
		"""Get the questions table as python list."""
		rows = self.driver.find_elements_by_name("q_row")
		result = []
		for row in rows:
			vals = []
			fields = row.find_elements_by_tag_name("td")
			for field in fields:
				vals.append(field.text)
			result.append(vals)
		return result
