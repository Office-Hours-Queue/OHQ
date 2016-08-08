import unittest
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import psycopg2
from test_base import *

class TestRegisterLoginLogout(QueueTester):
    """
    - google login:
        - let's begin to student page
        - let's begin to ca page
        - let's begin to not in course page
    - register student then login 
    - register ca then login
    - register fail cases:
        - andrew id used
        - not in course 
        - missing field -> not testing, each says <input required>
        - passwords don't match 
        - invalid email
        - incorrect login code
    - logout in all of these cases!
    """

    def test_googlelogin_student(self):
        self.remove_user_from_users(CMU_ANDREW)
        self.remove_user_from_valid_ids(CMU_ANDREW)
        self.add_user_role(CMU_ANDREW,"student")
        self.do_cmu_login(lambda : self.on_student_page() )

    def test_googlelogin_ca(self):
        self.remove_user_from_users(CMU_ANDREW)
        self.remove_user_from_valid_ids(CMU_ANDREW)
        self.add_user_role(CMU_ANDREW,"ca")
        self.do_cmu_login(lambda : self.on_ca_page())

    def test_googlelogin_not_in_course(self):
        self.remove_user_from_users(CMU_ANDREW)
        self.remove_user_from_valid_ids(CMU_ANDREW)
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
        header = self.driver.find_element_by_partial_link_text('Login Failed')
        assert('Login Failed' in  header.text)

   

    def test_register_student_then_login(self):
        reg = self.get_default_register()
        self.remove_user_from_users("jdryer")
        self.remove_user_from_valid_ids("jdryer")
        self.add_user_role("jdryer","student")
        self.register_user(reg,login_check_fn=lambda : self.on_student_page(),attempt_login=True)

    def test_register_ca_then_login(self):
        reg = self.get_default_register()
        self.register_user(reg,login_check_fn=lambda : self.on_ca_page(),attempt_login=True)

    def test_register_andrew_id_used(self):
        reg = self.get_default_register()
        self.register_user(reg,login_check_fn=lambda : self.on_ca_page(),attempt_login=True)
        time.sleep(2)
        reg = {
            "andrew_id": "jdryer",
            "email": "jdryer@cmu.edu",
            "password": "woowoowoowoo",
            "conf_password": "woowoowoowoo",
            "first_name": "joey",
            "last_name": "dryer",
            "registration_code": REG_CODE
        }
        f = self.check_text("Andrew ID already registered.")
        self.register_user(reg,reg_check_fn=f)

    def test_register_not_in_course(self):
        r = self.get_default_register()
        self.remove_user_from_users("jdryer")
        self.remove_user_from_valid_ids("jdryer")
        f = self.check_text("Your Andrew ID is not marked as in 15-112.")
        self.register_user(r,reg_check_fn=f)

    def test_register_passwords_dont_match(self):
        r = self.get_default_register()
        f = self.check_text("Passwords did not match!")
        r["conf_password"] = "woo"
        self.register_user(r,reg_check_fn=f)

    def test_register_invalid_email(self):
        r = self.get_default_register()
        f = self.check_text("Invalid email.")
        r["email"] = "woo"
        self.register_user(r,reg_check_fn=f)

    def test_register_incorrect_login_code(self):
        r = self.get_default_register()
        f = self.check_text("Invalid registration code.")
        r["registration_code"] = "woo"
        self.register_user(r,reg_check_fn=f)


if __name__ == "__main__":
    unittest.main()

