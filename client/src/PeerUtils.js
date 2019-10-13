import io from 'socket.io-client'
import Peer from 'simple-peer'

const SOCKET_SERVER = window.location.origin.replace('3000', window.location.pathname.replace('/', ''))

const ICE_SERVERS = [
  { 'urls': 'stun:stun.schlund.de' },
  { 'urls': 'stun:stun.sipgate.net' },
  { 'url': 'turn:numb.viagenie.ca', 'username': 'y.alanyali@gmail.com', 'credential': 'testserver', 'credentialType': 'password' },
  { 'urls': 'turn:192.155.84.88', 'username': 'easyRTC', 'credential': 'easyRTC@pass', 'credentialType': 'password' }
]

export default class PeerUtils {
  constructor (onSocketConnection, onNewPeer, onCountUpdate) {
    this.socket = io(SOCKET_SERVER)
    this.available = true
    this.peer = null

    this.socket.on('connect', () => {
      console.log('Connected to socket server.')
    })

    this.socket.once('welcome', (peerId) => {
      console.log('Got id from the server:', peerId)
      onSocketConnection(peerId)
    })

    this.socket.on('peer', this.handleNewPeer)
    this.socket.on('signal', this.handleSignal)
    this.socket.on('end', this.handleEnd)
    this.socket.on('count', onCountUpdate)

    this.onNewPeer = onNewPeer
  }

  requestPeer = () => {
    if (this.peer) {
      console.log('A peer exists:', this.peer)
      this.socket.emit('end')
      this.peer.destroy()
      // this.peer = null
    }
    console.log('Asking for a peer...')
    this.socket.emit('peer')
  }

  handleNewPeer = (data = {}) => {
    this.peer = new Peer({
      initiator: !!data.initiator,
      config: {
        iceServers: ICE_SERVERS
      }
    })
    this.peer.on('signal', data => {
      this.socket.emit('signal', data)
    })
    this.peer.on('connect', () => {
      this.onNewPeer(this.peer)
    })
  }

  handleSignal = (signalData) => {
    this.peer.signal(signalData)
  }

  handleEnd = (data) => {
    console.log('handleEnd', data)
    this.requestPeer()
  }
}
