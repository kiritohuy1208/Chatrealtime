const express = require('express')
const app = express()
const socketio = require('socket.io')
const http = require('http')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')
const router = require('./router')

const server = http.createServer(app)

corsOptions={
    cors: true,
    origins:["http://localhost:3000"],
   }
const io = socketio(server,corsOptions)
io.on('connection',(socket)=>{
    // create socket when user join room
    socket.on('join',({name,room},callback)=>{
           const { error, user } = addUser({id:socket.id, name ,room})
           if(error){
            return callback(error)
            }
           socket.join(user.room)

           socket.emit('message',{user: 'admin', text:`${user.name}, Welcome to the room ${user.room}`})
        // To send emit message send user's room
        // broadcast:Cho tất cả các máy khách được kết nối ngoại trừ người gửi
           socket.broadcast.to(user.room).emit('message',{user:'admin',text:` ${user.name}, has joined!`})
         
            io.to(user.room).emit('roomData',{room: user.room, users: getUsersInRoom(user.room)})
            // callback to callback funtion of client
            callback()
        })
    // socket that user can send message
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('message',{user:user.name, text:message})
        io.to(user.room).emit('message',{room:user.room, users: getUsersInRoom(user.room)})

        callback()
    })
    // socket when user disconnect
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',{user:"Admin", text:`${user.name} has left.`})
            io.to(user.room).emit('roomData',{room:user.room, users:getUsersInRoom(user.room)})

        }
    })
})

app.use(router)
app.use(cors)


const PORT = process.env.Port || 5000
server.listen(PORT,()=>{
    console.log("Server Chat realtime start port: "+PORT)
   
})