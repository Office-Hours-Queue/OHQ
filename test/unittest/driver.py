"""
A generic 'student' and 'ca' interface for working with selenium and psycopg2.
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

    def __init__(self,role,create_user=True):
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
        db_host = User.Config["db_host"]
        db_name = User.Config["db_name"]
        db_user = User.Config["db_user"]
        db_pass = User.Config["db_pass"]
        conn_str = "dbname='%s' user='%s' host='%s' password='%s'" % (db_name,
                                                        db_user,db_host,db_pass)
        self.conn = psycopg2.connect(conn_str)
        self.cur = self.conn.cursor()

        if (create_user):
            #Initialize basic information 
            aid = str(uuid.uuid4())[:8]
            self.info = {
                "andrew_id": aid ,
                "email":  aid + "@cmu.edu",
                "first_name":  aid + "fname",
                "last_name":  aid + "lname",
                "password":  "woowoowoowoo",
                "conf_password":  "woowoowoowoo",
                "role":  role,
                "registration_code":  User.Config["queue_reg_code"],
            }
            
            #Insert self into valid_andrew_ids
            role = self.info["role"]
            add_query = "INSERT INTO valid_andrew_ids (andrew_id,role) VALUES ('%s','%s') ; " % (aid,role)
            self.cur.execute(add_query)
            self.conn.commit()

    def tearDown(self):
        """Exit selenium and psycopg2."""

        #remove questions from user (they may not have registered!)
        try:
            get_id = "SELECT id FROM users WHERE andrew_id='%s' ;" % self.info["andrew_id"]
            self.cur.execute(get_id)
            self.conn.commit()
            r = self.cur.fetchone()
            query = "DELETE FROM questions WHERE student_user_id='%i' ;" % r[0]
            self.cur.execute(query)
            self.conn.commit()
        except:
            self.conn.rollback()
            print("Failed to remove user questions")

        #delete user (they may not have registered!)
        try:
            query = "DELETE FROM users WHERE andrew_id='%s' ;" % self.info["andrew_id"]
            self.cur.execute(query)
            self.conn.commit()
        except:
            self.conn.rollback()
            print("Failed to delete user")

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
        name = self.driver.find_element_by_id("name_brand")
        assert(self.info["first_name"] in name.text)

        if (check_fn != None): check_fn(self)

    def logout(self,check_fn=None):
        """Log the user out"""
        logout = self.driver.find_element_by_partial_link_text('Log out')
        time.sleep(1)
        logout.click()
        time.sleep(1)
        lets_begin = self.driver.find_element_by_id('lets_begin')
        assert("BEGIN" in lets_begin.text)
        if (check_fn != None): check_fn(self)

    def on_ca_page(self):
        """Checks if the user is on the CA page."""
        time.sleep(1)
        min_rule = self.driver.find_element_by_id("answer-btn")

    def on_student_page(self):
        """Checks if the user is on the Student page."""
        time.sleep(1)
        q = self.driver.find_element_by_id("your_question")
        assert(q.text == "Your Question")

    def run(self,run_fn):
        """Run arbitrary selenium code on the web page."""
        run_fn(self)

class Student(User): 
    """Represents a User with role 'student'."""
    def __init__(self):
        super().__init__("student")

    def ask_question(self,check_fn=None):
        """Ask a question."""
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
        ask = self.driver.find_element_by_id("submit_new_q")
        ask.click()
        time.sleep(1)

        #check that it showed up
        self.driver.find_elements_by_id("your_question_student")

        #check the help text
        desc_text = self.driver.find_element_by_id("help_text").text
        assert(desc_text == "woo")

        if (check_fn != None): check_fn(self)

    def edit_question(self,check_fn=None):
        """Edit the student's current question (assumed to exist)."""
        time.sleep(1)
        pencil = self.driver.find_element_by_id("edit_question")
        pencil.click()
        time.sleep(1)
        desc = self.driver.find_element_by_id("edit_question_help_text")
        desc.send_keys("secondwoo")
        submit_edit = self.driver.find_element_by_id("edit_question_submit")
        submit_edit.click()
        desc_text = self.driver.find_element_by_id("help_text").text
        assert(desc_text == "woosecondwoo")

        if (check_fn != None): check_fn(self)

    def delete_question(self,check_fn=None):
        """Delete the student's current question."""
        time.sleep(1)
        delete = self.driver.find_element_by_id("delete_question")
        delete.click()
        time.sleep(1)
        do_delete = self.driver.find_element_by_name("do_delete")
        do_delete.click()
        time.sleep(1)

        if (check_fn != None): check_fn(self)

    def freeze_question(self,check_fn=None):
        """Freeze the student's current question."""
        time.sleep(1)
        toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
        toggle_freeze.click()
        time.sleep(1)
        freeze_text = self.driver.find_element_by_id("question_status").text
        assert(freeze_text == "frozen")

        if (check_fn != None): check_fn(self)

    def unfreeze_question(self,check_fn=None):
        """Unfreeze the student's current question."""
        time.sleep(1)
        toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
        toggle_freeze.click()
        time.sleep(1)
        freeze_text = self.driver.find_element_by_id("question_status").text
        assert(freeze_text == "on the queue")
        
        if (check_fn != None): check_fn(self)

    def get_pos(self):
        """Get the student's position in the queue."""
        time.sleep(1)
        pos = self.driver.find_element_by_id("queue_position").text
        return pos

    def check_ta_alert_text(self,text):
        time.sleep(1)
        status = self.driver.find_element_by_id("question_status_ta").text
        assert(text in status)

    def check_freeze_text(self,text):
        time.sleep(1)
        status = self.driver.find_element_by_id("question_status").text
        assert(status == text)

    def can_ask_question(self):
        time.sleep(1)
        return self.driver.find_element_by_id("can_ask_question").text == "Ask a question"

    def check_toast(self,expected_text):
        """Check if there was a toast on the page."""
        toast = self.driver.find_element_by_class_name("toast")
        text = toast.text
        assert(text == expected_text)


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
        go_offline_btn.click()
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
        time.sleep(1)
        min_rule_text = self.driver.find_element_by_id("min_rule_text")
        return min_rule_text.text

    def update_minute_rule(self,n,check_fn=None):
        """Have the CA update the minute rule."""
        self.driver.get(User.Config["queue_url"]+"/#/admin")
        time.sleep(1)
        min_rule_li = self.driver.find_element_by_id("update_minute_rule_li")
        min_rule_li.click()
        time.sleep(1)
        min_rule_input = self.driver.find_element_by_id("minuteRule")
        min_rule_input.clear()
        min_rule_input.send_keys(str(n))
        min_rule_save = self.driver.find_element_by_id("update_rule_btn")
        min_rule_save.click()
        time.sleep(1)
        self.driver.get(User.Config["queue_url"])

        if (check_fn != None): check_fn(self)

    def get_num_cas(self):
        """Get the number of CAs displayed on the page."""
        n_cas = self.driver.find_element_by_id("numCAs")
        return n_cas.text

    def get_n_questions(self):
        """Get the number of questions displayed on the page"""
        n_questions = self.driver.find_element_by_id("numQuestions")
        return n_questions.text 

    def answer_question(self,check_fn=None):
        """Click answer question button."""
        answer_btn = self.driver.find_element_by_id("answer-btn")
        answer_btn.click()
        time.sleep(1)

        if (check_fn != None): check_fn(self)

    def kick_question(self,check_fn=None):
        """Have the CA answer and kick question."""
        kick_btn = self.driver.find_element_by_id("kick_q")
        kick_btn.click()
        time.sleep(1)

        if (check_fn != None): check_fn(self)

    def freeze_question(self,check_fn=None):
        """Have the CA answer and freeze a question."""
        freeze_btn = self.driver.find_element_by_id("freeze_q")
        freeze_btn.click()
        time.sleep(1)

        if (check_fn != None): check_fn(self)

    def finish_question(self,check_fn=None):
        """Have the CA finish answering the question."""
        finish_btn = self.driver.find_element_by_id("finish_q")
        finish_btn.click()
        time.sleep(1)

        if (check_fn != None): check_fn(self)

    def get_active_questions(self,check_fn=None):
        """Get all active questions as python list."""
        rows = self.driver.find_elements_by_name("active-question")
        result = []
        for row in rows:
            vals = []
            fields = row.find_elements_by_name("active-question-field")
            for field in fields:
                vals.append(field.text)
            result.append(vals)
        return result

    def get_recent_questions(self,check_fn=None):
        """Get all recent questions as python list."""
        rows = self.driver.find_elements_by_name("recent-question")
        result = []
        for row in rows:
            vals = []
            fields = row.find_elements_by_name("recent-question-field")
            for field in fields:
                vals.append(field.text)
            result.append(vals)
        return result

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


class CMULoginCA(User):
    """Represents a User with role 'ca' who logged in through CMU."""
    def __init__(self,should_insert=True):
        super().__init__("ca",create_user=False)
        self.info = {
            "andrew_id": User.Config["cmu_login_andrew"],
            "password": User.Config["cmu_login_pass"],
            "role": "ca"
        }

        if (should_insert):
            aid = User.Config["cmu_login_andrew"]
            try:
                remove_query = "DELETE FROM valid_andrew_ids WHERE andrew_id='%s' ;" % aid
                self.cur.execute(remove_query)
                self.conn.commit()
            except:
                self.conn.rollback()
                pass
            #Insert self into valid_andrew_ids
            role = self.info["role"]
            add_query = "INSERT INTO valid_andrew_ids (andrew_id,role) VALUES ('%s','%s') ; " % (aid,role)
            self.cur.execute(add_query)
            self.conn.commit()

    def login(self,check_fn=None):
        """Log the user in through CMU""" 
        self.driver.get(User.Config["queue_url"])
        lets_begin = self.driver.find_element_by_id('lets_begin')
        lets_begin.click()
        time.sleep(2)
        user_field = self.driver.find_element_by_id("j_username")
        pass_field = self.driver.find_element_by_id("j_password")
        user_field.send_keys(User.Config["cmu_login_andrew"])
        pass_field.send_keys(User.Config["cmu_login_pass"])
        submit = self.driver.find_element_by_name("_eventId_proceed")
        submit.click()
        time.sleep(3)

        #give permission,page doesn't always show up
        try:
            approve = self.driver.find_element_by_id("submit_approve_access")
            approve.click()
        except:
            pass

        if (check_fn != None): check_fn(self)

User.load_config()



