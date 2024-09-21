const express = require('express')
const mongoose = require('mongoose')
const app = express()





app.get('/', (req, res) => {
    res.send('Hello from Node API Server Update');
  });


mongoose.connect("mongodb+srv://admin:UXITXsDKQzhpgCZ5@backenddb.bdp7m.mongodb.net/Node-API?retryWrites=true&w=majority&appName=backendDB")
.then(() => {
console.log("Connected to the database!");
    app.listen(3000, () => {
        console.log('Server is running on port 3000')
    });
})
.catch(() => {
console.log("Connection failed!");
})