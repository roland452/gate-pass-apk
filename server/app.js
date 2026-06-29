import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()
const app = express()
const MONGO_URI = process.env.MONGO_URI
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


mongoose.connect(MONGO_URI).then(() => {
    console.log('mongodb connection successful');
}).catch((err) => {
    console.log('mongodb connection failed');
})


app.use(cors({
    origin: function(origin, callback) {
        callback(null, true)
    },
    credentials: true,
    methods: ['GET','PUT','POST','PATCH','DELETE','OPTIONS'],
    allowedHeaders:['Content-Type','Authorization','Cookie']
}))
app.use(cookieParser())
app.use(express.json())
app.use('/uploads',express.static(path.join(__dirname,'uploads'),{
    setHeaders: (res, path) => {
        res.setHeader('Content-Disposition','attachment')
    }
}))




import userRoutes from './routes/user.js'
import vehicleRoutes from './routes/vehicle.js'
import gatePassRoutes from './routes/gateLog.js' 


app.use(userRoutes)
app.use(vehicleRoutes)
app.use(gatePassRoutes)    



export default app;