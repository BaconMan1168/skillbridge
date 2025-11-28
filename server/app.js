require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const userRouter = require('./routes/userRouter');
const skillRouter = require('./routes/skillRouter');
const helpRouter = require('./routes/helpRouter');
const sessionRouter = require('./routes/sessionRouter');
const initializeSocket = require('./socket');

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "*",  
    credentials: true
}));

app.use('/users', userRouter);
app.use('/skills', skillRouter);
app.use('/help', helpRouter);
app.use('/sessions', sessionRouter);

const server = http.createServer(app);
initializeSocket(server);  

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origin: ${process.env.CLIENT_ORIGIN}`);
});