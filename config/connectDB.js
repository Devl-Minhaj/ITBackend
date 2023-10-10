const mongoose = require('mongoose');

const ConnectDB = async (DATABASE_URL) => {
  try {
    const DB_OPTIONS = {
      dbName: "infoicon",
    };
    await mongoose.connect(DATABASE_URL, DB_OPTIONS);
    console.log(`Connection Successful on ${DATABASE_URL}`);
  } catch (error) {
    console.log("Database Connection Failed...!!!", error);
  }
};

module.export = ConnectDB;
