const socket = io();

let local;
let remote;
let peerConnection;

const rtcSettings = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
}

const initialize = async () => {
    socket.on("signalingMessage", handleSignalingMessage);
    local = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    initiateOffer();
    
}

const initiateOffer = async () => {
    await createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("signalingMessage", JSON.stringify({type: 'offer', offer: offer}));
}

const createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(rtcSettings);

    remote = new MediaStream();
    document.querySelector('#remoteVideo').srcObject = remote;
    document.querySelector('#remoteVideo').style.display = 'block';
    document.querySelector('#localVideo').srcObject = local;
    document.querySelector('#localVideo').style.display = 'block';

    local.getTracks().forEach(track => {
        peerConnection.addTrack(track, local);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remote.addTrack(track);
        });
    }

    peerConnection.onicecandidate = (event) => event.candidate && socket.emit("signalingMessage",JSON.stringify({type: 'signaling message', candidate: event.candidate}));
}

const handleSignalingMessage = async (data) => {
    const message = JSON.parse(data);
    if (message.type === 'offer') {
        await createPeerConnection();
        await peerConnection.setRemoteDescription(message.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signalingMessage", JSON.stringify({type: 'answer', answer: answer}));
    } else if (message.type === 'answer') {
        await peerConnection.setRemoteDescription(message.answer);
    } else if (message.type === 'signaling message') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
}

window.addEventListener("beforeunload", () => socket.disconnect());

initialize();