"""
15-112 queue unit tests
"""

import unittest
from driver import *

class TestRegister(unittest.TestCase):
    """Test registration."""

     def test_register_student_then_login(self):
        student = Student()
        student.register()
        student.login()
        student.logout()
        student.tearDown()
      
    def test_register_ca_then_login(self):
        ca = CA()
        ca.register()
        ca.login()
        ca.logout()
        ca.tearDown()

    def test_register_andrew_id_used(self):
        student = Student()
        student.register()
        student.register()
        student.check_toast("Andrew ID already registered.")
        student.tearDown()

    def test_register_not_in_course(self):
        student = Student()
        student.info["andrew_id"] = "notincourse"
        student.register()
        student.check_toast("Your Andrew ID is not marked as in 15-112.")
        student.tearDown()

    def test_register_passwords_dont_match(self):
        student = Student()
        student.info["conf_password"] = "badpass"
        student.register()
        student.check_toast("Passwords did not match!")
        student.tearDown()

    def test_register_invalid_email(self):
        student = Student()
        student.info["email"] = "bademail"
        student.register()
        student.check_toast("Invalid email.")
        student.tearDown()

    def test_register_incorrect_reg_code(self):
        student = Student()
        student.info["registration_code"] += "woo" 
        student.register()
        student.check_toast("Invalid registration code.")
        student.tearDown()

class TestStudent(unittest.TestCase):
    """Test the student page."""

    def test_student(self):
        student = Student()
        student.register()
        student.login()
        student.ask_question()
        student.edit_question()
        student.freeze_question()
        student.unfreeze_question()
        pos = student.get_pos()
        assert (pos == "0")
        student.delete_question()
        student.logout()
        student.tearDown()

class TestCA(unittest.TestCase):
    """Test the CA Page"""

    def setUp(self):
        student = Student()
        student.register()
        student.login()
        student.ask_question()
        self.student = student
        ca = CA()
        ca.register()
        ca.login()
        self.ca = ca

    def tearDown(self):
        self.ca.logout()
        self.ca.tearDown()
        self.student.logout()
        self.student.tearDown()

    def test_minute_rule(self):
        #test minute rule
        self.ca.update_minute_rule(10)
        min_rule = self.ca.get_minute_rule()
        assert(min_rule == "10")
        self.ca.update_minute_rule(5)

    def test_online_open_buttons(self):
        #if the buttons don't change these fails
        self.ca.go_online()
        self.ca.go_offline()
        self.ca.go_online()
        self.ca.open_queue()
        self.ca.close_queue()
        self.ca.open_queue()

    def test_n_cas(self):
        n_cas = self.ca.get_num_cas()
        assert(n_cas == "1")
        ca2 = CA()
        ca2.register()
        ca2.login()
        n_cas = self.ca.get_num_cas()
        assert(n_cas == "1")
        ca2.go_online()
        n_cas = self.ca.get_num_cas()
        assert(n_cas == "2")
        ca2.logout()
        ca2.tearDown()

    def test_n_questions(self):
        n_questions = self.ca.get_n_questions() 
        assert(n_questions == "0")
        self.student.ask_question()
        n_questions = self.ca.get_n_questions() 
        assert(n_questions == "1")
        self.student.delete_question()
        n_questions = self.ca.get_n_questions() 
        assert(n_questions == "0")

    def test_answer_question(self):
        self.student.ask_question()
        self.ca.answer_question()
        self.ca.finish_question()
        self.student.ask_question()
        self.ca.answer_question()
        self.ca.kick_question()
        self.student.ask_question()
        self.ca.answer_question()
        self.ca.freeze_question()
        self.student.delete_question()

class TestCMULogin(unittest.TestCase):
    """Test CMU login."""
    def test_cmu_login_ca(self):
        #check success
        ca = CMULoginCA()
        ca.login()
        ca.on_ca_page()
        ca.logout()
        ca.tearDown()

        #check fail
        ca = CMULoginCA(should_insert=False) 
        def check_fail(user):
            header = user.driver.find_element_by_partial_link_text('Login Failed')
            assert('Login Failed' in  header.text)
        ca.login(check_fn=check_fail)

class TestInteractions(unittest.TestCase):
    """Test interactions between CA + Student, CA + CA, and Student + Student."""
    """
    - student asks a questions
        -> updates other student position
        -> shows up on both ca pages
        -> #questions updates on both ca pages
    - student deletes question 
        -> #questions updates on both ca pages
        -> disappears on both ca pages
        -> position for other student updates
    - student freezes question 
        -> hides on both ca pages
    - student edits question
        -> updates on both ca pages
    - ca goes offline, shows on both ca pages
    - ca updates minute rule, shows on both pages
    - ca open/close Queue
        -> show on other ca pages
        -> show on student pages
    - ca answer question
        -> student get's notification
        -> number of questions only decreases by 1
    - ca finish,kick,freeze quesiotn
        -> student notify
    """

    def setUp(self):
        pass

    def tearDown(self):
        pass

if __name__ == '__main__':
    unittest.main()







          


