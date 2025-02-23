const peerConnections = {};
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const socket = new WebSocket("wss://your-server.com"); // WebSocket Server for signaling

// Handle messages from the signaling server
socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "offer") {
        const peer = new RTCPeerConnection(config);
        peerConnections[message.from] = peer;
        
        peer.ontrack = (event) => {
            document.getElementById("remoteAudio").srcObject = event.streams[0];
        };

        await peer.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        socket.send(JSON.stringify({
            type: "answer",
            answer: peer.localDescription,
            to: message.from
        }));
    }
};

// Call Owner Function
function callOwner(ownerID) {
    const peer = new RTCPeerConnection(config);
    peerConnections[ownerID] = peer;

    // Capture audio
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
    });

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
                to: ownerID
            }));
        }
    };

    peer.createOffer().then((offer) => {
        return peer.setLocalDescription(offer);
    }).then(() => {
        socket.send(JSON.stringify({
            type: "offer",
            offer: peer.localDescription,
            to: ownerID
        }));
    });
}
