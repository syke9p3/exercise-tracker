const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

mongoose.connection.on('connected', () => {
  console.log('Mongoose is connected');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose default connection has occured ' + err + ' error');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection is disconnected');
});

// MODEL

const userSchema = new mongoose.Schema({
  username: String,
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
})

const User = mongoose.model('User', userSchema)


const exerciseSchema = new mongoose.Schema({
  username: String,
  user_id: String,
  description: String,
  duration: Number,
  date: String,
})

const Exercise = mongoose.model('Exercise', exerciseSchema)

// ROUTES

app.post('/api/users', async (req, res) => {


  const newUser = new User({
    username: req.body.username
  })

  try {
    const savedNewUser = await newUser.save()
    res.json({
      username: savedNewUser.username,
      _id: savedNewUser._id
    })
  } catch (err) {
    res.json({ error: err })
  }

})

app.get('/api/users', async (req, res) => {

  try {
    const users = await User.find();
    res.json(users)
  } catch (err) {
    console.error(err)
  }
})


const convertYYYYMMDDToDateString = (date) => {
  const [year, month, day] = date.split('-');
  return new Date(year, month - 1, day).toDateString();
}


app.post('/api/users/:_id/exercises', async (req, res) => {

  const user = await User.findById(req.params._id)

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }


  const newExercise = new Exercise({
    username: user.username,
    user_id: user._id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? convertYYYYMMDDToDateString(req.body.date) : new Date().toDateString()
  })

  const savedExercise = await newExercise.save()


  if (!user.exercises) {
    user.exercises = [];
  }

  user.exercises.push(savedExercise);
  const newUser = await user.save();


  res.json({
    _id: savedExercise.user_id,
    username: savedExercise.username,
    date: savedExercise.date,
    duration: savedExercise.duration,
    description: savedExercise.description,
  })

})


app.get('/api/users/:id', async (req, res) => {

  try {
    const user = await User.findById(req.params.id)
    res.status(200).json({ username: user.username, _id: user._id })
    console.log(user)

  } catch (err) {
    console.log(err)
    res.status(404).json({ error: 'User not found' })

  }

})

app.get("/api/users/:id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params.id;

  const user = await User.findById(id).populate('exercises');
  if (!user) {
    res.json({ error: "User not found" });
    return;
  }

  console.log("exercises by user ", user.username)
  let exercises = user.exercises

  if (from) {
    const fromDate = new Date(from);
    exercises = exercises.filter(exercise => new Date(exercise.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    exercises = exercises.filter(exercise => new Date(exercise.date) <= toDate);
  }

  if (limit) {
    exercises = exercises.slice(0, limit);
  }

  const log = exercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  }))

  res.json({
    _id: user._id,
    username: user.username,
    count: exercises.length,
    log
  });



})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


async function getUser(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

