// screenshare-app/src/Host.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://10.112.168.197:5001'); 
// Replace 10.112.168.197 with YOUR actual IP if you want LAN access
// Or use 'http://localhost:5000' if you only need local dev

function Host() {
  const [room, setRoom] = useState('myScreenShareRoom'); 
  const pcRef = useRef(null);

  useEffect(() => {
    // Join a room
    socket.emit('join-room', room);

    // When the viewer answers
    socket.on('answer', handleAnswer);

    // When ICE candidate is received
    socket.on('ice-candidate', handleRemoteICE);

    // Cleanup
    return () => {
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleRemoteICE);
    };
  }, [room]);

  const startScreenShare = async () => {
    try {
      // Get display stream (screen)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Add tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Host ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            room,
          });
        }
      };

      // Create offer & set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send to server
      socket.emit('offer', {
        sdp: offer,
        room,
      });
    } catch (err) {
      console.error('Error starting screen share:', err);
    }
  };

  const handleAnswer = async (payload) => {
    const desc = new RTCSessionDescription(payload.sdp);
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(desc);
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
    <div>
      <h2>Host Screen Share</h2>
      <button onClick={startScreenShare}>Start Sharing</button>
      <p>Room: {room}</p>
      <p>
        Share viewer link:
        <code>http://10.112.168.197:3000/viewer?room={room}</code>
      </p>
    </div>
  );
}

export default Host;
