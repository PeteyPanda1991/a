// screenshare-app/src/Viewer.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://10.112.168.197:5001'); 
// Replace 10.112.168.197 with your actual IP or 'localhost'

function Viewer() {
  const [room, setRoom] = useState(null);
  const pcRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Grab ?room=xxx from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const theRoom = urlParams.get('room') || 'myScreenShareRoom';
    setRoom(theRoom);

    // Join room
    socket.emit('join-room', theRoom);

    // Listen for offer
    socket.on('offer', handleOffer);

    // Listen for ICE
    socket.on('ice-candidate', handleRemoteICE);

    return () => {
      socket.off('offer', handleOffer);
      socket.off('ice-candidate', handleRemoteICE);
    };
  }, []);

  const handleOffer = async (payload) => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      videoRef.current.srcObject = remoteStream;
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && room) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          room,
        });
      }
    };

    // Host's offer
    const desc = new RTCSessionDescription(payload.sdp);
    await pc.setRemoteDescription(desc);

    // Create & set answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send answer
    socket.emit('answer', {
      sdp: answer,
      room: payload.room,
    });
  };

  const handleRemoteICE = async (payload) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(payload.candidate);
    } catch (err) {
      console.error('Error adding remote ICE candidate:', err);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Viewer</h2>
      <p>Room: {room}</p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
         position: 'fixed',
         top: 0,
         left: 0,
         width: '100vw',
         height: '100vh',
         objectFit: 'cover'
        }}
      />
    </div>
  );
}

export default Viewer;
