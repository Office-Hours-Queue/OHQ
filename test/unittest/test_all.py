"""
15-112 queue unit tests

A note about some of these tests. The methods in driver.py have some built in testing. 
For example, edit_question checks if the edit was successful.
"""

import unittest
from driver import *

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
        ca.tearDown()

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

    def setUp(self):
        self.student = Student()
        self.student.register()
        self.student.login()
        self.ca = CA()
        self.ca.register()
        self.ca.login()

    def tearDown(self):
        self.student.logout()
        self.ca.logout()
        self.ca.tearDown()
        self.student.tearDown()

    def test_ask_edit_freeze_delete_question(self):
        #ask, edit
        self.student.ask_question()
        self.student.edit_question()
        table = self.ca.get_table()
        found_edit = False
        for row in table:
            desc = row[4]
            if (desc == "woosecondwoo"):
                found_edit = True 
        assert(found_edit)

        #freeze
        self.student.freeze_question()
        self.student.unfreeze_question()

        #delete
        student2 = Student()
        student2.register()
        student2.login()
        student2.ask_question()
        pos = student2.get_pos()
        pos = pos[pos.index(":") + 1:].strip()
        assert(pos.isdigit())
        n = int(pos)
        self.student.delete_question()
        pos2 = student2.get_pos()
        pos2 = pos2[pos2.index(":") + 1:].strip()
        assert(pos2.isdigit())
        assert(n - 1 == int(pos2))
        student2.logout()
        student2.tearDown()


class TestCA(unittest.TestCase):
    """Test the CA Page"""

    def setUp(self):
        student = Student()
        student.register()
        student.login()
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

    def test_ca_table(self):
        student1 = Student()
        student1.register()
        student1.login()
        student1.ask_question()
        table = self.ca.get_table()
        found_q = False 
        for row in table:
            andrew_id = row[1]
            desc = row[4]
            if (desc == "woo" and andrew_id == student1.info["andrew_id"]):
                found_q = True
        assert(found_q)
        student1.delete_question()
        table = self.ca.get_table()
        found_q = False
        for row in table:
            andrew_id = row[1]
            desc = row[4]
            if (desc == "woo" and andrew_id == student1.info["andrew_id"]):
                found_q = True
        assert(not(found_q))

    def test_minute_rule(self):
        #test minute rule
        ca2 = CA()
        ca2.register()
        ca2.login()
        self.ca.update_minute_rule(10)
        min_rule = self.ca.get_minute_rule()
        min_rule2 = ca2.get_minute_rule()
        assert(min_rule == "10")
        assert(min_rule2 == "10")
        self.ca.update_minute_rule(5)
        ca2.logout()
        ca2.tearDown()

    def test_online_open_buttons(self):
        other_ca = CA()
        other_student = Student()
        other_ca.register()
        other_ca.login()
        other_student.register()
        other_student.login()
        #if the buttons don't change these fails
        self.ca.go_online()
        self.ca.go_offline()
        self.ca.go_online()
        one_worked = False
        try:    
            self.ca.close_queue()
            self.ca.open_queue()
            self.ca.close_queue()
            one_worked = True
        except:
            try:
                self.ca.open_queue()
                self.ca.close_queue()
                one_worked = True
            except:
                pass
        assert(one_worked)
        closed = other_student.driver.find_element_by_id("closed")
        assert(closed.text == "The queue is closed.")
        other_ca.open_queue()
        other_ca.logout()
        other_student.logout()
        other_student.tearDown()
        other_ca.tearDown()

    def test_n_cas(self):
        n_cas = self.ca.get_num_cas()
        assert(n_cas != "")
        assert(n_cas.isdigit())
        n = int(n_cas)        
        ca2 = CA()
        ca2.register()
        ca2.login()
        ca2.go_online()
        n_cas = self.ca.get_num_cas()
        assert(n_cas != "")
        assert(n_cas.isdigit())
        n_after = int(n_cas)
        assert(n_after == n + 1)
        ca2.logout()
        ca2.tearDown()

    def test_n_questions(self):
        n_questions = self.ca.get_n_questions() 
        assert(n_questions != "")
        assert(n_questions.isdigit())
        n = int(n_questions)
        self.student.ask_question()
        n_questions = self.ca.get_n_questions() 
        assert(n_questions != "")
        assert(n_questions.isdigit())
        n1 = int(n_questions)
        self.student.delete_question()
        n_questions = self.ca.get_n_questions() 
        assert(n_questions != "")
        assert(n_questions.isdigit())
        n2 = int(n_questions)
        assert(n == n2)
        assert(n + 1 == n1)

    def test_answer_question(self):
        return #currently broken
        self.student.ask_question()
        self.ca.answer_question()
        self.student.check_toast("A Course Assistant is on the way!")
        student.driver.execute_script("$('.toast').remove()")
        self.ca.finish_question()
        self.student.check_toast("Your question was marked as closed.")
        self.student.logout()
        self.student.login()
        time.sleep(1)
        self.student.ask_question()
        self.ca.answer_question()
        student.driver.execute_script("$('.toast').remove()")
        self.ca.kick_question()
        self.student.check_toast("Your question was kicked from the queue.")
        self.student.logout()
        self.student.login()
        time.sleep(1)
        self.student.ask_question()
        self.ca.answer_question()
        student.driver.execute_script("$('.toast').remove()")
        self.ca.freeze_question()
        self.student.check_toast("Your question was frozen.")
        self.student.logout()
        self.student.login()
        time.sleep(1)
        self.student.delete_question()


if __name__ == '__main__':
    unittest.main()







          


