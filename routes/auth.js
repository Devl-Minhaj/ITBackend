// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Asset = require('../models/Asset')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const NewUser = require('../models/NewUser');
const authCheck = require('../middelware/authCheck');
const config = process.env;

router.get('/', (req, res, next) => {
  return res.status(200).json({ message: 'success' });
});

router.get('/getAsset/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const asset = await Asset.findById(id);
    if (asset) {
      res.status(200).json(asset);
    } else {
      res.status(404).json({ error: 'Asset not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/updateAsset/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedAsset = req.body;    
    const result = await Asset.findByIdAndUpdate(id, { $set: updatedAsset }, { new: true });
    if (result) {
      res.status(200).json({ message: 'Asset updated successfully' });
    } else {
      res.status(404).json({ error: 'Asset not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/updateUser/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { email, password, role } = req.body;    
    const updatedUser = {
      email,
      role
    };
    if (password) {      
      updatedUser.password = await bcrypt.hash(password, 10);
    }
    const result = await User.findByIdAndUpdate(id, updatedUser);
    if (result) {      
      return res.status(200).json({ message: 'User updated successfully' });
    } else {      
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {   
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getUsers', async (req, res) => {
  try {
    const users = await User.find({}, 'name email role'); 
    res.status(200).json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch user options' });
  }
});
router.delete('/deleteuser/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Received _id:', id); // Add this line to log the received _id

    // Add this block to check if a user with the received _id exists
    const userExists = await User.findById(id);
    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await User.findByIdAndRemove(id);
    if (result) {
      return res.status(200).json({ message: 'User deleted successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// API route to Add a user
router.post('/addUser', (req, res) => {
  try {
    const { userName, email, phoneNumber ,Designation} = req.body;   
    const newUser = {
      name: userName,
      email,
      phoneNumber,
      Designation,
    };

    // Push the new user object into the 'users' array
    NewUser.create(newUser);
    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

//  Route to fetch user options
// router.get('/get_Users', async (req, res) => {
//   try {
//     const users = await NewUser.find({}, 'name'); 
//     const userNames = users.map((user) => user.name);
//     res.status(200).json({ users: userNames });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to fetch user options' });
//   }
// });
router.get('/get_Users', async (req, res) => {
  try {
    const users = await NewUser.find({}, 'name Designation');
    console.log(users);
    const userOptions = users.map((user) => ({ label: user.name, value: user.name, designation: user.Designation }));
    res.status(200).json({ users: userOptions });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch user options' });
  }
});





router.post('/create', async (req, res) => {
  const { name, email, password, role } = req.body;
  const emailId = await User.findOne({ email: email });
  if (emailId) {
    res.status(400).json({ "message": "Email already exists.!!", "status": false });
  } else {
    if (name && email && password && role) { 
      let encryptedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await User.create({
        name:name,
        email: email,
        password: encryptedPassword,
        role: role
      });
      return res.status(200).send(req.body);
    } else {
      res.status(400).json({ "message": "Please insert email, password, and role!!", "status": false });
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
      return res.status(200).json({ message: 'History record updated successfully' });
    } else {      
      return res.status(404).json({ error: 'Document not found' });
    }
  } catch (error) {    
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/saveHistory/:id', async (req, res) => {
  try {
    const { UserName, startDate, endDate,designation  } = req.body;
    const id = req.params.id;
    const data = {
      UserName,
      startDate,
      endDate,
      designation ,
      created_at: new Date(),
    }
    const result = await Asset.updateOne({ _id: id }, { $push: { empHistory: data } });
    if (result.modifiedCount === 1) {      
      return res.status(201).json({ data: data });
    } else if (result.n === 0) {      
      return res.status(404).json({ error: 'Document not found' });
    } else {      
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {   
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Asset
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

router.post('/login', async (req, res, next) => {
    try {
    const { email, password } = req.body;    
    if (!(email && password)) {     
      return res.status(400).json({ "message": "All input is required", "status": false });
    }
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
        role: user.role
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
