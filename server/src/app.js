const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const apiLimiter = require('./middleware/rateLimiter');

// Route files
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const roundRoutes = require('./routes/roundRoutes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting applies to all requests
app.use('/api/', apiLimiter);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rounds', roundRoutes);

// Temporary Seeding Endpoint
// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
