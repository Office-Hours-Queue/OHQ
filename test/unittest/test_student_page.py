import unittest
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import psycopg2
from test_base import *

class TestStudentPage(QueueTester):
    """
    - Questions 
    - Ask a question -> shows up on page
        - position shows
        - can no longer ask question
    - Freezing questions
        - clicking gives option to unfreeze
        - can only freeze more than once 
    - delete question -> goes away
    - edit question ->  shows up on page
    """
    def test_student_page(self):
        try:
            get_id = "SELECT id FROM users WHERE andrew_id='%s' ;" % CMU_ANDREW
            self.cur.execute(get_id)
            self.conn.commit()
            r = self.cur.fetchone()
            query = "DELETE FROM questions WHERE student_user_id='%i' ;" % r[0]
            self.cur.execute(query)
            self.conn.commit()
        except:
            print("failed delete q")
        self.remove_user_from_users(CMU_ANDREW)
        self.remove_user_from_valid_ids(CMU_ANDREW)
        self.add_user_role(CMU_ANDREW,"student")
        def check_fn():
            #click on ask question
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

            #check position
            pos = self.driver.find_element_by_id("pos_card").text
            assert(pos == "Position: 0")

            #Try to ask question (hopefully can't)
            ask_q_modal = self.driver.find_element_by_id("new_q")
            ask_q_modal.click()
            time.sleep(1)
            have_q = self.driver.find_element_by_id("have_q").text
            assert(have_q == "You already have a question.")
            ask = self.driver.find_element_by_name("submit_new_q")
            ask.click()
            time.sleep(1)

            #edit the question
            pencil = self.driver.find_element_by_id("pencil_edit")
            pencil.click()
            time.sleep(1)
            desc = self.driver.find_element_by_id("q_desc_update")
            desc.send_keys("secondwoo")
            submit_edit = self.driver.find_element_by_name("submit_edit_q")
            submit_edit.click()
            desc_text = self.driver.find_element_by_id("help_text_table").text
            assert(desc_text == "woosecondwoo")
            time.sleep(1)

            #freeze the question
            toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
            toggle_freeze.click()
            self.check_text("Your question was frozen.")()
            freeze_text = self.driver.find_element_by_id("freeze_text").text
            assert(freeze_text == "Unfreeze")

            #unfreeze
            toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
            toggle_freeze.click()
            freeze_text = self.driver.find_element_by_id("freeze_text").text
            assert(freeze_text == "Freeze")

            #attempt to freeze again and fail
            toggle_freeze = self.driver.find_element_by_id("toggle_freeze")
            toggle_freeze.click()
            time.sleep(1)
            freeze_text = self.driver.find_element_by_id("freeze_text").text
            assert(freeze_text == "Freeze")
       
            #delete the question
            delete = self.driver.find_element_by_id("trash_delete")
            delete.click()
            time.sleep(1)
            do_delete = self.driver.find_element_by_name("do_delete")
            do_delete.click()
            time.sleep(1)
            table_rows = self.driver.find_elements_by_name("q_row")
            assert(len(table_rows) == 0)

        self.do_cmu_login(check_fn)


if __name__ == "__main__":
    unittest.main()