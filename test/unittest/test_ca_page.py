import unittest
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import psycopg2
from test_base import *

class TestCAPage(QueueTester):
    """
     - number of CAs online shows up, updates, and is accurate
     - queue shows, updates, does not show frozen questions 
     - minute rule shows and is updatable
     - can open and close queue

    Tested in CA/Student Interaction:
     - number of questions shows up, updates, is accurate 
     - can answer question:
        - freeze
        - kick 
        - finish 
    """
    def test_ca_page(self):
        self.remove_user_from_users(CMU_ANDREW)
        self.remove_user_from_valid_ids(CMU_ANDREW)
        self.add_user_role(CMU_ANDREW,"ca")
        self.set_all_offline()
        self.update_min_rule(5)
        self.set_queue_off()
        def check_fn():
            #0 cas online
            n_cas = self.driver.find_element_by_id("numCAs")
            assert(n_cas.text == "0")

            #0 questions
            n_questions = self.driver.find_element_by_id("numQuestions")
            assert(n_questions.text == "0")

            #click go_online, check that number online is 1
            go_online_btn = self.driver.find_element_by_id("go_online_btn")
            go_online_btn.click()
            n_cas = self.driver.find_element_by_id("numCAs")
            assert(n_cas.text == "1")

            #check min_rule
            min_rule_text = self.driver.find_element_by_id("min_rule_text")
            assert(min_rule_text.text == "5")
            min_rule_change = self.driver.find_element_by_id("min_rule_change")
            min_rule_change.click()
            time.sleep(1)
            min_rule_input = self.driver.find_element_by_id("minuteRule")
            min_rule_input.clear()
            min_rule_input.send_keys("8")
            min_rule_save = self.driver.find_element_by_id("update_rule_btn")
            min_rule_save.click()
            min_rule_text = self.driver.find_element_by_id("min_rule_text")
            assert(min_rule_text.text == "8")

            #turn queue on 
            queue_on = self.driver.find_element_by_id("open_queue_btn")
            queue_on.click()
            time.sleep(1)
            #turn off, if the button is here it worked
            queue_off = self.driver.find_element_by_id("close_queue_btn")
            queue_off.click()
            time.sleep(1)
            queue_on = self.driver.find_element_by_id("open_queue_btn")
            queue_on.click()
          
        self.do_cmu_login(check_fn)


if __name__ == "__main__":
    unittest.main()

