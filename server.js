const path = require('path')
const express = require('express')
const app = express()
const router = express.Router()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const nanoid = require('nanoid')
const getNewId = () => nanoid(10)

router.get('/*', (_, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
})
app.use(express.static((path.join(__dirname, 'client', 'build'))))
app.use('/', router)

server.listen(process.env.PORT || 80)

// Socket server

let sockets = []
let waitingID = null
let count = 0

io.on('connection', socket => {
  // let sendFn = socket.send
  // socket.send = function () {
  //   try {
  //     sendFn.apply(socket, arguments)
  //   } catch (err) {}
  // }
  socket.id = getNewId()
  // socket.on('close', handleClose)
  socket.on('disconnect', handleClose(socket))
  socket.on('error', handleClose(socket))
  socket.on('peer', handlePeerReq(socket))
  socket.on('signal', handleSignal(socket))
  socket.on('end', handleEnd(socket))
  socket.on('message', handleMessage(socket))
  welcomePeer(socket)
  sockets[socket.id] = socket
  updateCount(count + 1)
})

const handleClose = (socket) => (metadata) => {
  log('Handle close:', socket.id)
  sockets[socket.id] = null
  if (socket.id === waitingID) {
    waitingID = null
  }
  if (socket.pairID) {
    const pairSocket = sockets[socket.pairID]
    pairSocket.pairID = null
    pairSocket.emit('end')
  }
  updateCount(count - 1)
}

const handlePeerReq = (socket) => (metadata) => {
  log('Peer request from', socket.id)
  if (waitingID && waitingID !== socket.id) {
    const waitingPeerSocket = sockets[waitingID]
    socket.pairID = waitingPeerSocket.id
    waitingPeerSocket.pairID = socket.id
    socket.emit('peer', {
      initiator: true
    })
    waitingPeerSocket.emit('peer')
    log(socket.id, 'was paired with the waiting peer', waitingPeerSocket.id)
    waitingID = null
  } else {
    log('No waiting peer. New waiting peer:', socket.id)
    waitingID = socket.id
  }
  log('END: handlePeerReq')
}

const handleSignal = (socket) => (signalData) => {
  // log('handleSignal', socket.id, socket.pairID)
  if (!socket.pairID) return console.error('unexpected `signal` message')
  const reqPeer = sockets[socket.pairID]
  reqPeer.emit('signal', signalData)
}

const handleEnd = (socket) => (metadata) => {
  log('handleEnd')
  if (!socket.pairID) return console.error('unexpected `end` message')
  const pairPeer = sockets[socket.pairID]
  pairPeer.pairID = null
  socket.pairID = null
  pairPeer.emit('end')
}

const handleMessage = (socket) => (message) => {
  log('New message:', socket.id)
}

const welcomePeer = (socket) => {
  log('New connection:', socket.id)
  socket.emit('welcome', socket.id)
}

const updateCount = (newCount) => {
  count = newCount
  io.emit('count', count)
}

const log = (...args) => {
  console.log(...args)
  if (waitingID) console.log('Waiting peer: ', waitingID)
}
