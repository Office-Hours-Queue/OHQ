import unittest
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

cmu_user = "edryer"
cmu_pass = ""

class TestRegisterLoginLogout(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Remote(command_executor="http://127.0.0.1:4444/wd/hub",desired_capabilities=DesiredCapabilities.CHROME)
        self.driver.implicitly_wait(15)
        self.driver.maximize_window()

    def test_login_andrew(self):
        self.driver.get("http://edwarddryer.com:3000/")
        lets_begin = self.driver.find_element_by_id('lets_begin')
        lets_begin.click()
        user_field = self.driver.find_element_by_id("j_username")
        pass_field = self.driver.find_element_by_id("j_password")
        user_field.send_keys(cmu_user)
        pass_field.send_keys(cmu_pass)
        submit = self.driver.find_element_by_name("_eventId_proceed")
        submit.click()
        name = self.driver.find_element_by_partial_link_text('Edward')
        assert('Edward' in name.text)
        logout = self.driver.find_element_by_partial_link_text('Log Out')
        assert("Log Out" in logout.text)
        logout.click()
        lets_begin = self.driver.find_element_by_id('lets_begin')
        assert("BEGIN" in lets_begin.text)

    def test_register(self):
        self.driver.get("http://edwarddryer.com:3000/")
        no_apps = self.driver.find_element_by_partial_link_text("Don't have Google Apps? Click here.")
        no_apps.click()
        register = self.driver.find_element_by_partial_link_text("Register")
        register.click()
        time.sleep(4)
        andrew_id = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(1) > div > input")
        andrew_id.send_keys("jdryer")
        email = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(2) > div > input")
        email.send_keys("jdryer@cmu.edu")
        password = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(3) > div > input")
        password.send_keys("passwords")
        confirm_pass = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(4) > div > input")
        confirm_pass.send_keys("passwords")
        first_name = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(5) > div > input")
        first_name.send_keys("joey")
        last_name = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(6) > div > input")
        last_name.send_keys("dryer")
        reg_code = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div:nth-child(7) > div > input")
        reg_code.send_keys("private")
        register_submit = self.driver.find_element_by_css_selector("body > main > div > div > div > form > div.center.ng-isolate-scope > div > input")
        register_submit.click()
        self.driver.get("http://edwarddryer.com:3000/")
        no_apps = self.driver.find_element_by_partial_link_text("Don't have Google Apps? Click here.")
        no_apps.click()
        time.sleep(2)
        user_field = self.driver.find_element_by_id("username")
        password_field = self.driver.find_element_by_id("password")
        user_field.send_keys("jdryer")
        password_field.send_keys("passwords")
        login = self.driver.find_element_by_name("no_google_submit")
        login.click()
        name = self.driver.find_element_by_partial_link_text('joey')
        assert('joey' in name.text)
        time.sleep(2)
        logout = self.driver.find_element_by_partial_link_text('Log Out')
        assert("Log Out" in logout.text)
        logout.click()
        lets_begin = self.driver.find_element_by_id('lets_begin')
        assert("BEGIN" in lets_begin.text)


    def tearDown(self):
        self.driver.close()

if __name__ == "__main__":
    unittest.main()
