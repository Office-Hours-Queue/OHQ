#Features that should be explicitly tested (for now by hand, by selenium eventually)

##Login Page

- Let's begin goes to cmu login then forwards to appropriate /ca or /student page
- Don't have google apps brings up modal, sign in forwards you to correct /ca or /student
- logout!
- Register brings you to a new register page, test:  
	- all fields required!
	- passwords match
	- valid email
	- requires correct reg code
	- able to login on main page after register
	- register twice fails

##Both Student/CA

- works on mobile, firefox, safari, so on...
- resizes reliably 
- connection status updates and reconnects if disconnected 

##Student Page

- Questions 
	- Ask a question -> shows up on page
		- position shows
		- can no longer ask question
	- Freezing questions
		- clicking gives option to unfreeze
		- can only freeze more than once 
	- delete question -> goes away
	- edit question ->  shows up on page

##CA Page

 - number of CAs online shows up, updates, and is accurate
 - number of questions shows up, updates, is accurate 
 - queue shows, updates, does not show frozen questions 
 - minute rule shows and is updatable
 - can open and close queue
 - can answer question:
 	- freeze
 	- kick 
 	- finish  

##Interactions 

- student asks a question -> shows up on ca page in table and # questions
- student deletes question -> removes from ca page
- student freezes question -> hides on ca page
- edit question for student shows on ca page
- ca logout affects other ca's number of cas online
- minute rules updates shows elsewhere
- open and close goes to student, other CAs
- answer, kick, finish , freeze events for student

##Security

 - can't start a socketio connection without login post
 - requires more than one computer to DDOS 
 	- rate limit on ips
 - should be https  (passwords over plain text on basic auth)
 - take student cookie, try to do CA type actions without using the interface (custom scripting)
