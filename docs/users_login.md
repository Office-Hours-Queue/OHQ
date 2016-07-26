#User routes

###GET /user
Returns the current sessions' user info

    {
      id : number
      andrew_id : string
      email : string
      first_name : string
      last_name : string
      role : ['ca', 'student']
      is_online : role === 'ca' ? boolean : null
    }

###POST /user/createlocal
Create a new user

Request body:

    {
      andrew_id : string
      email : string (optional)
      password : string (>8 chars)
      first_name : string
      last_name : string
      registration_code : string
    }

Response: `user` object (see `GET /user`)

###POST /user/edit
Edit the current sessions' user

Request body:

    {
      email : string (optional)
      password : string (>8 chars) (optional)
    }

Response: `user` object (see `GET /user`)

#Login routes

###GET /login/googleauth
Redirects to Google OAuth2 login / CMU Shibboleth login. On success, creates user if it didn't exist, then logs their session in.

###POST /login/localauth
Log a user in locally by setting their session cookie

Request:

    {
      username : string
      password : string
    }

###POST /login/endauth
Logs user out by clearing session cookie
