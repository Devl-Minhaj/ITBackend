// backend/index.js or app.js
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
//let connectDB = require('./config/connectDB')
const cors = require('cors');
const app = express();
require('dotenv').config();


// Middleware
//app.use(bodyParser.urlencoded({ extended: true  }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.disable("x-powered-by"); // For security
app.use(cors({ origin: true, credentials: true }));

mongoose.set("strictQuery", true);
const DATABASE_URL = process.env.DATABASE_URL;
const DB_OPTIONS = {
  dbName: "project-gadget-db",
};
mongoose.connect(DATABASE_URL, DB_OPTIONS);
console.log(`Connection Successful on ${DATABASE_URL}`);



// Passport Configuration (for user authentication)
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.use('/api', require('./routes/auth'));

// ... other routes for your project

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
