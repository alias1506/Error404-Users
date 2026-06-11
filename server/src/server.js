const dns = require('dns');
// Force IPv4 first and set reliable DNS servers to resolve MongoDB Atlas SRV records
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Could not set custom DNS servers:', err.message);
}

require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');

// Import models to watch
const Round = require('./models/Round');
const Question = require('./models/Question');
const User = require('./models/User');
const Submission = require('./models/Submission');

const PORT = process.env.PORT || 5005;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`User connected via socket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Connect to Database
connectDB().then(() => {
  console.log('MongoDB connected. Setting up change streams...');

  try {
    // Watch Rounds Collection
    const roundStream = Round.watch();
    roundStream.on('change', (change) => {
      console.log('Round change detected, emitting event...');
      io.emit('round-updated', change);
    });

    // Watch Questions Collection
    const questionStream = Question.watch();
    questionStream.on('change', (change) => {
      console.log('Question change detected, emitting event...');
      io.emit('question-updated', change);
    });

    // Watch Users Collection
    const userStream = User.watch();
    userStream.on('change', (change) => {
      console.log('User change detected, emitting event...');
      io.emit('user-updated', change);
    });

    // Watch Submissions Collection
    const submissionStream = Submission.watch();
    submissionStream.on('change', (change) => {
      console.log('Submission change detected, emitting event...');
      io.emit('submission-updated', change);
    });
  } catch (err) {
    console.error('Error setting up change streams (might not be a replica set):', err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
