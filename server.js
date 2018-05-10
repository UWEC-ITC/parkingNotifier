// require all the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// import environment variables from .env file
require('dotenv').config()

// create an instance of express
const app = express();
var port = process.env.PORT || 8080;

// import data models
var User = require('./models/user'); // get our mongoose model
var Status = require('./models/status'); // get our mongoose model

// connect to the database
mongoose.connect('mongodb://' + process.env.DB_HOST, {
  auth: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
})
.catch((err) => console.error(err));

// configure app to use bodyParser
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var apiRouter = express.Router();
apiRouter.get('/', function(req, res) {
    res.json({
        apiDocumentation: 'https://github.com/UWEC-ITC/parkingNotifier-API',
    });
});

apiRouter.get('/status', function(req, res) {
    // get most recent record in the list of records
    Status.findOne().sort({'timestamp': 'desc'}).exec(function(err, status) {
        res.json({
            alternateSideParking: status.alternateSideParking,
            message: status.message,
            timestamp: status.timestamp
        });
    });
});

app.use('/', apiRouter);

/***** ERROR PAGES *****/
app.use(function(req, res) {
    res.status(404);
    res.json({
        status: "404"
    });
})

app.use(function(error, req, res, next) {
    res.status(500);
    res.json({
        status: "500"
    });
})

app.listen(port, function() {
    console.log('API listening on port ', port);
});

// exporting the app module
module.exports = app;
