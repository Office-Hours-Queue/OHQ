import unittest
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import psycopg2

CMU_ANDREW = "edryer"
CMU_PASS = "extradrivearoundcaveMec1721530@cua"
BASE_URL = "http://localhost"
WEB_URL = BASE_URL + ":3000"
REG_CODE = "private"

#Testing class that all tests share
class QueueTester(unittest.TestCase):
    #Init test
    def setUp(self):
        #Setup selenium
        self.driver = webdriver.Remote(command_executor="http://127.0.0.1:4444/wd/hub",desired_capabilities=DesiredCapabilities.CHROME)
        self.driver.implicitly_wait(15)
        self.driver.maximize_window()

        #Start postgresql client
        self.conn = psycopg2.connect("dbname='queue' user='queue' host='%s' password='supersecret'" % ("127.0.0.1"))
        self.cur = self.conn.cursor()

    #helper function to clear questions for given user
    def remove_questions_from_user(self,andrewid):
        try:
            get_id = "SELECT id FROM users WHERE andrew_id='%s' ;" % andrewid 
            self.cur.execute(get_id)
            self.conn.commit()
            r = self.cur.fetchone()
            query = "DELETE FROM questions WHERE student_user_id='%i' ;" % r[0]
            self.cur.execute(query)
            self.conn.commit()
        except:
            print("failed delete questions")

    #helper function to remove user from users table 
    def remove_user_from_users(self,andrewid):
        self.remove_questions_from_user(andrewid)
        try:
            #the user may not exist, don't want tests to crash for this reason
            query = "DELETE FROM users WHERE andrew_id='%s' ;" % andrewid
            self.cur.execute(query)
            self.conn.commit()
        except:
            print("FAILED REMOVE USER")
            pass


    #helper function to remove a user from valid_andrew_ids 
    def remove_user_from_valid_ids(self,andrewid):
        try:
            #entry in valid_andrew_ids may not exist, don't want to crash for that reason
            del_query = "DELETE FROM valid_andrew_ids WHERE andrew_id='%s' ; " %andrewid
            self.cur.execute(del_query)
            self.conn.commit()
        except:
            print("FAILED REMOVE VALID")
            pass

    #helper function, set the user's role in valid_andrew_ids
    def add_user_role(self,andrewid,new_role):
        add_query = "INSERT INTO valid_andrew_ids (andrew_id,role) VALUES ('%s','%s') ; " % (andrewid,new_role)
        self.cur.execute(add_query)
        self.conn.commit()

    #helper function that checks if we are on the ca page
    def on_ca_page(self):
        min_rule = self.driver.find_element_by_id("min_rule")
        assert(min_rule.text == "MinRule")

    #helper function that checks if we are on the student page
    def on_student_page(self):
        ask = self.driver.find_element_by_id("ask")
        assert(ask.text == "Ask a Question")

    #helper function to login via CMU
    def do_cmu_login(self,checkFn): 
        #login
        self.driver.get(WEB_URL)
        lets_begin = self.driver.find_element_by_id('lets_begin')
        lets_begin.click()
        user_field = self.driver.find_element_by_id("j_username")
        pass_field = self.driver.find_element_by_id("j_password")
        user_field.send_keys(CMU_ANDREW)
        pass_field.send_keys(CMU_PASS)
        submit = self.driver.find_element_by_name("_eventId_proceed")
        submit.click()
        time.sleep(4)

        #give permission,page doesn't always show up
        try:
            approve = self.driver.find_element_by_id("submit_approve_access")
            approve.click()
        except:
            pass

        #Check page
        name = self.driver.find_element_by_partial_link_text('Edward')
        assert('Edward' in name.text)

        #Run supplied check function
        checkFn()

        #Logout
        logout = self.driver.find_element_by_partial_link_text('Log Out')
        assert("Log Out" in logout.text)
        logout.click()
        lets_begin = self.driver.find_element_by_id('lets_begin')

        #Check page after logout
        assert("BEGIN" in lets_begin.text)

    #helper function for registering tests
    def register_user(self,values,reg_check_fn=None, login_check_fn=None,attempt_login=False):
        #click the register button
        self.driver.get(WEB_URL)
        no_apps = self.driver.find_element_by_partial_link_text("Don't have Google Apps? Click here.")
        no_apps.click()
        time.sleep(1)
        register = self.driver.find_element_by_partial_link_text("Register")
        register.click()
        time.sleep(1)

        #fill in fields
        for key,val in values.items():
            element = self.driver.find_element_by_id(key)
            element.send_keys(val)

        #click register submit
        register_submit = self.driver.find_element_by_id("reg_submit")
        register_submit.click()

        #do a check
        if (reg_check_fn != None): 
            reg_check_fn()

        #attempt to use the account
        if (attempt_login):
            self.driver.get(WEB_URL)
            no_apps = self.driver.find_element_by_partial_link_text("Don't have Google Apps? Click here.")
            no_apps.click()
            time.sleep(2)
            user_field = self.driver.find_element_by_id("username")
            password_field = self.driver.find_element_by_id("password")
            user_field.send_keys(values["andrew_id"])
            password_field.send_keys(values["password"])
            login = self.driver.find_element_by_name("no_google_submit")
            login.click()
            name = self.driver.find_element_by_partial_link_text(values["first_name"])
            assert(values["first_name"] in name.text)
            if (login_check_fn != None):
                login_check_fn()
            logout = self.driver.find_element_by_partial_link_text('Log Out')
            assert("Log Out" in logout.text)
            logout.click()
            lets_begin = self.driver.find_element_by_id('lets_begin')
            assert("BEGIN" in lets_begin.text)

    #helper function to get register fields
    def get_default_register(self,):
        self.remove_user_from_users("jdryer")
        self.remove_user_from_valid_ids("jdryer")
        self.add_user_role("jdryer","ca")
        return {
            "andrew_id": "jdryer",
            "email": "jdryer@cmu.edu",
            "password": "woowoowoowoo",
            "conf_password": "woowoowoowoo",
            "first_name": "joey",
            "last_name": "dryer",
            "registration_code": REG_CODE
        }

    #helper function that returns a function that checks for a toast
    def check_text(self,toast_text):
        def f():
            toast = self.driver.find_element_by_class_name("toast")
            text = toast.text
            assert(text == toast_text)
        return f  

    def tearDown(self):
        self.driver.close()
        self.conn.close()

