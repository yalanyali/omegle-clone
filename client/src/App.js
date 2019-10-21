import React from 'react'
import PeerUtils from './PeerUtils'
import './App.css'
import Logo from './app-logo.png'

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      peerCount: 1,
      localId: null,
      channelId: null,
      messages: [],
      currentText: '',
      peerActive: false
    }
    this.localStream = null
    this.remoteStream = null
    this.peer = null
    this.connection = this.initConnection()
  }

  initConnection = () => {
    return new PeerUtils(this.handleConnection, this.handleNewPeer, this.handleCountUpdate)
  }

  handleNewPeer = (peer) => {
    console.log('New peer:', peer)
    this.peer = peer
    this.peer.on('stream', this.handleIncomingStream)
    this.peer.on('data', this.handleIncomingData)
    if (this.localStream) {
      this.peer.addStream(this.localStream)
    }
    this.setState({
      channelId: this.peer.channelName,
      peerActive: true,
      messages: []
    })
  }

  handleConnection = async (ownId) => {
    this.setState({ localId: ownId })
    await this.getUserMedia()
    this.connection.requestPeer()
  }

  handleCountUpdate = (count) => {
    this.setState({
      peerCount: count
    })
  }

  handleIncomingStream = (stream) => {
    this.setRemoteStream(stream)
  }

  handleIncomingData = (data) => {
    this.setState({
      messages: [...this.state.messages, { type: 'remote', text: String(data) }]
    })
  }

  getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      this.setLocalStream(stream)
    } catch (err) {
      console.log('Error on getUserMedia:', err)
    }
  }

  setLocalStream = (stream) => {
    // console.log('New local stream:', stream)
    this.localStream = stream
    this.refs.localStream.srcObject = stream
  }

  setRemoteStream = (stream) => {
    console.log('New incoming stream:', stream)
    this.refs.remoteStream.srcObject = stream
  }

  handleNextButton = () => {
    this.setState({ channelId: '', messages: [] })
    this.connection.requestPeer()
  }

  handleSendButton = (e) => {
    if (e) {
      e.preventDefault()
    }
    const text = this.state.currentText
    if (text.trim()) {
      this.peer.send(text)
      this.setState({
        messages: [...this.state.messages, { text, type: 'local' }],
        currentText: ''
      })
    }
  }

  render() {
    return (
      <div className='App'>
        {/* <div className='left-panel'>
         <div className='video-container'>
           <video src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay></video>
           <video src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay></video>
         </div>
           <button onClick={this.handleNextButton}>Next</button>
       </div>
       <div className='right-panel'>
         <h3>{this.state.peerCount} kişi var.</h3>
         <h3>Local ID: {this.state.localId}</h3>
         <h3>Channel ID: {this.state.channelId}</h3>
         <div className='chat-box'>
           <dl>
             {
               this.state.messages.map((msg, key) => {
                 if (msg.type === 'local') {
                  return (
                    <div key={'chat-bubble-' + key} className='chat-bubble-right'>
                      <dt>You:</dt>
                      <dd>{msg.text}</dd>
                    </div>
                  )
                 } else {
                  return (
                    <div key={'chat-bubble-' + key} className='chat-bubble-left'>
                      <dt>Anon:</dt>
                      <dd>{msg.text}</dd>
                    </div>
                  )
                 }
               })
             }
           </dl>
           <form onSubmit={this.handleSendButton}>
            <input value={this.state.currentText} disabled={!this.state.peerActive} onChange={(e)=>{this.setState({ currentText: e.target.value })}}></input>
           </form>
           <button onClick={this.handleSendButton}>Send</button>
         </div>
       </div> */}

        <div className="top-panel">
          <img className="logo" src={Logo} alt="omegle-clone"></img>
          {/* <h3>{this.state.peerCount} kişi var.</h3>
          <h3>Local ID: {this.state.localId}</h3>
          <h3>Channel ID: {this.state.channelId}</h3> */}
        </div>
        <div className="bottom-panel">
          <div className="left-panel">
            <div className="video-container">
              <div className="tag">stranger</div>
              <video ref='localStream' id='localStream' autoPlay></video>
            </div>
            <div className="video-container">
              <video ref='remoteStream' id='remoteStream' autoPlay></video>
              <div className="tag">you</div>
            </div>
          </div>

          <div className="right-panel">
            <div className="chat">
             {
               this.state.messages.map((msg, key) => {
                 if (msg.type === 'local') {
                  return (
                    <div key={'chat-bubble-' + key} className='chat-bubble-right'>
                      <span className="nickname">You:</span>
                      <span className="message">{msg.text}</span>
                    </div>
                  )
                 } else {
                  return (
                    <div key={'chat-bubble-' + key} className='chat-bubble-left'>
                      <span className="nickname">Stranger:</span>
                      <span className="message">{msg.text}</span>
                    </div>
                  )
                 }
               })
             }

            </div>
            <div className="chat-input">
              <form onSubmit={this.handleSendButton}>
                <input className="text-input" value={this.state.currentText} disabled={!this.state.peerActive} onChange={(e) => { this.setState({ currentText: e.target.value }) }}></input>
                <input className="send-button" type="button" value="Send" onClick={this.handleSendButton} />
                <input className="send-button" type="button" value="Next" onClick={this.handleNextButton} />
              </form>

            </div>
          </div>
        </div>


      </div>
    )
  }
}

export default App
