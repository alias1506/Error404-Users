const dns = require('dns');
// Force IPv4 first and set reliable DNS servers to resolve MongoDB Atlas SRV records
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Could not set custom DNS servers:', err.message);
}

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5005;

// Connect to Database
connectDB();

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
