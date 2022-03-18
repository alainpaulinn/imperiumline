const iceServers = [
    // Test some STUN server
    { "url": "stun:stun.l.google.com:19302" },

    {
        "url": "turn:stun.imperiumline.com.5349",
        credential: 'guest',
        username: 'somepassword'
    },
    {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:turn.bistri.com:80',
        credential: 'homeo',
        username: 'homeo'
    },
    {
        url: 'turn:turn.anyfirewall.com:443?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc'
    }
];

const pc = new RTCPeerConnection({
    iceServers
});

let resultsDiv = document.getElementById("results");

pc.onicecandidate = (e) => {
    if (!e.candidate) return;

    // Display candidate string e.g
    // candidate:842163049 1 udp 1677729535 XXX.XXX.XX.XXXX 58481 typ srflx raddr 0.0.0.0 rport 0 generation 0 ufrag sXP5 network-cost 999
    console.log(e.candidate.candidate);

    // If a srflx candidate was found, notify that the STUN server works!
    if (e.candidate.type == "srflx") {
        console.log(e)
        console.log("The STUN server is reachable!");
        console.log(`   Your Public IP Address is: ${e.candidate.address}`);
        
        //resultsDiv.innerHTML += JSON.stringify(e)
    }

    // If a relay candidate was found, notify that the TURN server works!
    if (e.candidate.type == "relay") {
        console.log(e)
        console.log("The TURN server is reachable !");
    }
};

// Log errors:
// Remember that in most of the cases, even if its working, you will find a STUN host lookup received error
// Chrome tried to look up the IPv6 DNS record for server and got an error in that process. However, it may still be accessible through the IPv4 address
pc.onicecandidateerror = (e) => {
    console.error(e);
};

pc.createDataChannel('ourcodeworld-rocks');
pc.createOffer().then(offer => pc.setLocalDescription(offer));