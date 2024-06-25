const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false, useUnifiedTopology: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log('Mongoose is connected');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose default connection has occured ' + err + ' error');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection is disconnected');
});

const userSchema = new mongoose.Schema({
  username: String
})

const User = mongoose.model('User', userSchema)

app.post('/api/users', async (req, res) => {

  console.log(req.body)

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


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
