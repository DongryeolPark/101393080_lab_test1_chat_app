# 101393080_lab_test1_chat_app

The login page allows users to authenticate themselves before accessing the chat room.

Users enter their username and password in the input fields.
When they click the "Login" button, a POST request is sent to http://localhost:3000/login.
If the credentials are correct, the user is redirected to the chat room (chatroom.html).
If login fails, an error message is displayed


Chat Room (chatroom.html) - Explanation
The chat room page enables real-time messaging using Socket.io.

Users can join a room (e.g., DevOps, Cloud, Sports) by clicking a button.
Once in a room, they can send and receive messages in real time.
Messages appear in the chat window, and typing indicators show when someone is typing.
Users can leave a room at any time.
