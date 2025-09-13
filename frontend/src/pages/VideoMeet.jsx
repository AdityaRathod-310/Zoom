// [UNCHANGED IMPORTS AND CONSTANTS]
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import {
  Badge,
  IconButton,
  TextField,
  Button,
} from "@mui/material";
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import styles from "../styles/videoComponent.module.css";

const server_url = "http://localhost:8000";
const peerConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const connections = {};

export default function VideoMeetComponent() {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([]);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [showModal, setModal] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    if (screen) {
      startScreenShare();
    } else {
      getUserMedia();
    }
  }, [screen]);

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setVideoAvailable(true);
      setAudioAvailable(true);
      window.localStream = stream;
      if (localVideoref.current) localVideoref.current.srcObject = stream;
      if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
    } catch (err) {
      console.error("Permission error:", err);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  const stopTracks = () => {
    window.localStream?.getTracks().forEach((track) => track.stop());
  };

  const getUserMedia = () => {
    navigator.mediaDevices
      .getUserMedia({ video, audio })
      .then((stream) => {
        replaceStream(stream);
      })
      .catch((err) => console.error("UserMedia error:", err));
  };

  const startScreenShare = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        stream.getVideoTracks()[0].onended = () => {
          setScreen(false);
        };
        replaceStream(stream);
      })
      .catch((err) => {
        console.error("ScreenShare error:", err);
        setScreen(false);
      });
  };

  const replaceStream = (newStream) => {
    stopTracks();
    window.localStream = newStream;
    if (localVideoref.current) localVideoref.current.srcObject = newStream;

    for (let id in connections) {
      const pc = connections[id];

      const senders = pc.getSenders();

      newStream.getTracks().forEach((track) => {
        const existingSender = senders.find((s) => s.track?.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, newStream);
        }
      });

      pc.createOffer()
        .then((desc) => pc.setLocalDescription(desc))
        .then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: pc.localDescription })
          );
        });
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url);

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.href);

      socketRef.current.on("user-joined", handleUserJoined);
      socketRef.current.on("user-left", handleUserLeft);
      socketRef.current.on("chat-message", addMessage);
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (!connections[fromId]) return;

      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((desc) =>
                  connections[fromId]
                    .setLocalDescription(desc)
                    .then(() =>
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({ sdp: desc })
                      )
                    )
                );
            }
          });
      }

      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
      }
    }
  };

const handleUserJoined = (id, clients) => {
  clients.forEach((socketListId) => {
    if (
      connections[socketListId] || 
      socketListId === socketIdRef.current // <-- Skip your own socket
    ) return;

    const pc = new RTCPeerConnection(peerConfig);
    connections[socketListId] = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit(
          "signal",
          socketListId,
          JSON.stringify({ ice: e.candidate })
        );
      }
    };

    pc.ontrack = (e) => {
      setVideos((prev) => {
        const exists = prev.find((v) => v.socketId === socketListId);
        if (exists) return prev;

        return [...prev, { socketId: socketListId, stream: e.streams[0] }];
      });
    };

    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, window.localStream);
      });
    }
  });
};


  const handleUserLeft = (id) => {
    delete connections[id];
    setVideos((prev) => prev.filter((v) => v.socketId !== id));
  };

  const handleVideo = () => {
    const track = window.localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideo(track.enabled);
    }
  };

  const handleAudio = () => {
    const track = window.localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudio(track.enabled);
    }
  };

  const handleScreen = () => {
    setScreen((prev) => !prev);
  };

  const handleEndCall = () => {
    stopTracks();
    window.location.href = "/home";
  };

  const sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const addMessage = (data, sender, senderId) => {
    setMessages((prev) => [...prev, { sender, data }]);
    if (senderId !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const connect = () => {
    setAskForUsername(false);
    connectToSocketServer();
    getUserMedia();
  };

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter into Lobby </h2>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={connect}>Connect</Button>
          <video ref={localVideoref} autoPlay muted></video>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div key={index} style={{ marginBottom: 20 }}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>
                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    label="Enter Your chat"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}
            <Badge badgeContent={newMessages} color="error">
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
          ></video>

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
