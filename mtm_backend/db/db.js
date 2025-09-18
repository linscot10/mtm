const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

        console.log('Database is up and running')

    } catch (error) {
        console.error(error)
    }
}

module.exports= connectDB