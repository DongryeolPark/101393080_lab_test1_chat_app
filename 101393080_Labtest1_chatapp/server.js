const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const port = 3000;

// MongoDB connection string
const dbURI = 'mongodb+srv://DongryeolPark:0ehdfuF@cluster0.vr63o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(dbURI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const server = http.createServer(app);
const io = socketIo(server); // Socket.io setup

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 기본 페이지 설정 (GET `/` 요청 시 login.html 반환)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Signup Route (firstname, lastname 추가)
app.post('/signup', async (req, res) => {
  try {
    const { username, firstname, lastname, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, firstname, lastname, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Login Route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected');
  let currentRoom = '';

  // Join a room
  socket.on('joinRoom', async (room) => {
    currentRoom = room;
    socket.join(room);
    socket.emit('chatMessage', `Welcome to the ${room} room!`);

    // Load previous messages for the room
    const messages = await Message.find({ room }).sort({ timestamp: 1 });
    socket.emit('loadMessages', messages);
  });

  // Send a chat message
  socket.on('chatMessage', async (data) => {
    const { message, sender, room } = data;

    // Save the message to the database
    const newMessage = new Message({ message, sender, room });
    await newMessage.save();

    // Broadcast the message to the room
    io.to(room).emit('chatMessage', { sender, message });
  });

  // Typing indicator
  socket.on('typing', (room) => {
    socket.to(room).emit('typing', 'User is typing...');
  });

  // Stop typing indicator
  socket.on('stopTyping', (room) => {
    socket.to(room).emit('stopTyping', '');
  });

  // Leave a room
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    socket.emit('chatMessage', `You have left the ${room} room.`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
