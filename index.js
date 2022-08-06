const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
const mongoose = require('mongoose');
var bodyParser = require('body-parser')
const { request } = require('express')
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


mongoose.connect('mongodb+srv://ilaydadem:alfa164@cluster0.datnjrt.mongodb.net/userexercise?retryWrites=true&w=majority');
const database = mongoose.connection;

database.on('error', (error) => {
  console.log(error)
});

database.once('connected', () => {
  console.log('Database Connected');
});
const defDate = new Date().toDateString();

var dateCheck = (input) => {
  if (!input || isNaN(Date.parse(input))) {
    return defDate;
  } else {
    return new Date(input).toDateString();
  }
}

const exerciseSchema = new mongoose.Schema({
  description: {
      required: true,
      type: String
  }, duration: {
    required: true,
    type: Number
}, date: String
});

const userSchema = new mongoose.Schema({
  username: {
      required: true,
      type: String
  },
  log: [exerciseSchema]
});

let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);

app.post('/api/users', (req, res) => {
  const newUser = new User({
      username: req.body.username,
  });
  newUser.save((error,savedUser) => {
    if(!error){
      res.json({
        username: savedUser.username,
        _id: savedUser._id,
      })
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (error, allUsers) =>{
    console.log(allUsers)
    if(!error){
      res.json(
        allUsers
      )
    }
  })
})

app.post('/api/users/:_id/exercises', (req,res) => {
  const newExercise = new Exercise({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: dateCheck(req.body.date),
  })
  User.findByIdAndUpdate(req.params._id, 
    {$push: {log: newExercise}},
    {new: true},
    (error, updatedUser) => {
    if(!error){
          res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            date: newExercise.date,
            description: newExercise.description,
            duration: newExercise.duration
          })
    }
  })
});

/*
app.get('/api/users/:_id/logs', (req,res) => {
  User.findById(req.params._id, (error, user) => {
    if(!error){
      res.json({
      username: user.username,
      count: user.log.length,
      log: user.log,
    });
  }
  });
});

*/


app.get('/api/users/:_id/logs', (req,res) => {
  User.findById(req.params._id, (error, user) => {
    if(!error){
      let responseObject = user

      if(req.query.from || req.query.to){
        let fromDate = new Date(0)
        let toDate = new Date()

        if(req.query.from){
          fromDate = new Date(req.query.from);
          responseObject['from'] = dateCheck(fromDate);
        }
        if(req.query.to){
          toDate = new Date(req.query.to)
          responseObject['to'] = dateCheck(toDate);
        }

        fromDate = fromDate.getTime();
        toDate = toDate.getTime();
        responseObject.log = responseObject.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime();
          return sessionDate >= fromDate && sessionDate <= toDate
        });
      }
      if(req.query.limit){
        responseObject.log = responseObject.log.slice(0, req.query.limit);
      }
      responseObject = responseObject.toJSON()
      responseObject['count'] = user.log.length
      res.json(responseObject);
  }
  });
})