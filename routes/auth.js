// backend/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const Asset = require('../models/Asset')
const CircularJSON = require('circular-json');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const NewUser = require('../models/NewUser');
const authCheck = require('../middelware/authCheck');
const config = process.env;

router.get('/', (req, res, next) => {
  return res.status(200).json({ message: 'success' });
});
// API route to Add a user
router.post('/addUser', (req, res) => {
  try {
    const { userName, email, phoneNumber } = req.body;

    // Validate user input (e.g., check for required fields)

    // Create a new user object using the user schema
    const newUser = {
      name: userName,
      email,
      phoneNumber,
    };

    // Push the new user object into the 'users' array
    NewUser.create(newUser);

    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Define a route to fetch user options
router.get('/getUsers', async (req, res) => {
  try {
    const users = await NewUser.find({}, 'name'); // Fetch all user names

    // Extract only the user names and create an array
    const userNames = users.map((user) => user.name);

    // Respond with the user names as JSON
    res.status(200).json({ users: userNames });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch user options' });
  }
});

router.post('/create', async (req, res) => {
  const { email, password } = req.body;
  const emailId = await User.findOne({ email: email });

  if (emailId) {
    res.status(400).json({ "message": "Email already exists.!!", "status": false });
  } else {
    if (email && password) {
      let encryptedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await User.create({
        email:email,
        password: encryptedPassword
      });
      return res.status(200).send(req.body);
    } else {
      res.status(400).json({ "message": "Please insert email and password!!", "status": false });
    }
  }
});


router.put('/updateHistory/:id', async (req, res) => {
  try {
    const { UserName, startDate, endDate } = req.body;
    const id = req.params.id;
    console.log('Received _id:', id)
    console.log('Received formData:', req.body);

    // Find the asset by its _id and use $elemMatch to match the element in empHistory
    const result = await Asset.findByIdAndUpdate(
      id,
      {
        $set: {
          'empHistory.$[elem].UserName': UserName,
          'empHistory.$[elem].startDate': startDate,
          'empHistory.$[elem].endDate': endDate,
        },
      },
      {
        arrayFilters: [{ 'elem.UserName': req.body.oldUserName, 'elem.startDate': req.body.oldStartDate, 'elem.endDate': req.body.oldEndDate }],
      }
    );


    if (result) {
      // The update was successful
      return res.status(200).json({ message: 'History record updated successfully' });
    } else {
      // No document was modified because it doesn't exist
      return res.status(404).json({ error: 'Document not found' });
    }
  } catch (error) {
    // Handle other errors
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/saveHistory/:id', async (req, res) => {
  try {
    const { UserName, startDate, endDate } = req.body;
    const id = req.params.id;
    const data = {
      UserName,
      startDate,
      endDate,
      created_at: new Date(),
    }

    const result = await Asset.updateOne({ _id: id }, { $push: { empHistory: data } });

    if (result.modifiedCount === 1) {
      // The update was successful
      return res.status(201).json({ data: data });
    } else if (result.n === 0) {
      // No document was modified because it doesn't exist
      return res.status(404).json({ error: 'Document not found' });
    } else {
      // Handle unexpected situations where more than one document is modified
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {
    // Handle other errors
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/// Save Asset
router.post('/saveAsset', async (req, res) => {
  try {
    const assetData = req.body;

    console.log(req.body)

    const { SerialNumber, RAM, HDD, Processor, OS, Office, LanNo, AssetType } = assetData;

    if (SerialNumber && RAM && HDD && Processor && OS && Office && LanNo && AssetType) {
      const asset = await Asset.create(assetData);

      if (asset) {
        res.status(201).json({ message: 'Asset saved successfully', status: 201 });
      } else {
        res.status(400).json({ message: 'Failed to save asset', status: 400 });
      }
    } else {
      res.status(400).json({ message: 'Fields has not been filled ', status: 400 });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error', status: 500 });
  }
});

// Fetch Assets Route
router.get('/getAssets', authCheck, async (req, res) => {
  try {
    const assets = await Asset.find();
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset data.' });
  }
});

router.get('/getsystemuser/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const assets = await Asset.findById(id).sort({ 'created_at': -1 });
    res.status(201).json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset data.' });
  }
});


// Login Route
router.post('/login', async (req, res, next) => {
  // const user =await User.findOne({email:req.body.email});

  try {
    // Get user input

    //return res.status(200).send('ji');
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      //res.status(400).send("All input is required");
      return res.status(400).json({ "message": "All input is required", "status": false });
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token        
      const token = jwt.sign(
        { user_id: user._id, email },
        config.TOKEN_KEY,
        {
          expiresIn: "9h",
        }
      );
      const authuser = {
        token: token,
        user_id: user._id,
        email: email,
      };
      return res.status(200).json({ "data": authuser, "status": true });

    } else {
      res.status(400).json({ "message": "Invalid Credentials", "status": false });
    }
  } catch (err) {
    res.status(400).json({ "message": err, "status": false });
  }
});

// Logout Route (if needed)
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
module.exports = router;
