require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const app = express()
//const DB_KEY = require('./.env');
const username = encodeURIComponent("admin");
const password = process.env.DB_KEY;
let uri =
  `mongodb+srv://${username}:${password}@backenddb.bdp7m.mongodb.net/Node-API?retryWrites=true&w=majority&appName=backendDB`;
// console.log(`API Key: ${password}`);
// console.log(process.env) // remove this after you've confirmed it is working
app.get('/', (req, res) => {
    res.send('Hello from Node API Server Update');
  });


//mongoose.connect("mongodb+srv://admin:{dbpassword}@backenddb.bdp7m.mongodb.net/Node-API?retryWrites=true&w=majority&appName=backendDB")
mongoose.connect(uri)
.then(() => {
console.log("Connected to the database!");
    app.listen(3000, () => {
        console.log('Server is running on port 3000')
    });
})
.catch(() => {
console.log("Connection failed!");
})