// Last time updated at 26 Feb 2014, 08:32:23

// Muaz Khan     - github.com/muaz-khan
// MIT License   - www.WebRTC-Experiment.com/licence
// Documentation - github.com/muaz-khan/WebRTC-Experiment/tree/master/RTCPeerConnection

window.moz = !!navigator.mozGetUserMedia;
var chromeVersion = !!navigator.mozGetUserMedia ? 0 : parseInt(navigator.userAgent.match( /Chrom(e|ium)\/([0-9]+)\./ )[2]);

function RTCPeerConnection(options) {
    var w = window,
        PeerConnection = w.mozRTCPeerConnection || w.webkitRTCPeerConnection,
        SessionDescription = w.mozRTCSessionDescription || w.RTCSessionDescription,
        IceCandidate = w.mozRTCIceCandidate || w.RTCIceCandidate;

    var iceServers = [];


    if (!moz && chromeVersion >= 28) {
        iceServers.push({
            url: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
        });
    }

    if (!moz && chromeVersion < 28) {
        iceServers.push({
            url: 'turn:homeo@turn.bistri.com:80',
            credential: 'homeo'
        });
    }

    if (moz) {
        console.log("V: Detected Mozilla");
        iceServers.push({
            url: 'stun:stun.services.mozilla.com'
        });
    }

    if (!moz) {
        console.log("V: Detected not Mozilla");
        iceServers.push({
            url: 'stun:stun.l.google.com:19302'
        });

        iceServers.push({
            url: 'stun:stun.anyfirewall.com:3478'
        });
    }

    

    if (options.iceServers) iceServers = options.iceServers;

    iceServers = {
        iceServers: iceServers
    };

    console.debug('ice-servers', JSON.stringify(iceServers.iceServers, null, '\t'));

    var optional = {
        optional: []
    };

    if (!moz) {
        optional.optional = [{
            DtlsSrtpKeyAgreement: true
        }];

        if (options.onChannelMessage)
            optional.optional = [{
                RtpDataChannels: true
            }];
    }

    console.debug('optional-arguments', JSON.stringify(optional.optional, null, '\t'));

    var peer = new PeerConnection(iceServers, optional);

    openOffererChannel();

    peer.onicecandidate = function(event) {
        if (event.candidate)
            options.onICE(event.candidate);
    };

    // attachStream = MediaStream;
    if (options.attachStream) peer.addStream(options.attachStream);

    // attachStreams[0] = audio-stream;
    // attachStreams[1] = video-stream;
    // attachStreams[2] = screen-capturing-stream;
    if (options.attachStreams && options.attachStream.length) {
        var streams = options.attachStreams;
        for (var i = 0; i < streams.length; i++) {
            peer.addStream(streams[i]);
        }
    }

    peer.onaddstream = function(event) {
        var remoteMediaStream = event.stream;

        ///////////////////////////////////////////
        getStats(peer);
        ////////////////////////////////////////////

        // onRemoteStreamEnded(MediaStream)
        remoteMediaStream.onended = function() {
            if (options.onRemoteStreamEnded) options.onRemoteStreamEnded(remoteMediaStream);
        };

        // onRemoteStream(MediaStream)
        if (options.onRemoteStream) options.onRemoteStream(remoteMediaStream);

        console.debug('on:add:stream', remoteMediaStream);
    };

    var constraints = options.constraints || {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };

    console.debug('sdp-constraints', JSON.stringify(constraints.mandatory, null, '\t'));

    // onOfferSDP(RTCSessionDescription)

    function createOffer() {
        if (!options.onOfferSDP) return;

        peer.createOffer(function(sessionDescription) {
            sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
            peer.setLocalDescription(sessionDescription);
            options.onOfferSDP(sessionDescription);

            console.debug('offer-sdp', sessionDescription.sdp);
        }, onSdpError, constraints);
    }

    // onAnswerSDP(RTCSessionDescription)

    function createAnswer() {
        if (!options.onAnswerSDP) return;

        //options.offerSDP.sdp = addStereo(options.offerSDP.sdp);
        console.debug('offer-sdp', options.offerSDP.sdp);
        peer.setRemoteDescription(new SessionDescription(options.offerSDP), onSdpSuccess, onSdpError);
        peer.createAnswer(function(sessionDescription) {
            sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
            peer.setLocalDescription(sessionDescription);
            options.onAnswerSDP(sessionDescription);
            console.debug('answer-sdp', sessionDescription.sdp);
        }, onSdpError, constraints);
    }

    // if Mozilla Firefox & DataChannel; offer/answer will be created later
    if ((options.onChannelMessage && !moz) || !options.onChannelMessage) {
        createOffer();
        createAnswer();
    }

    // options.bandwidth = { audio: 50, video: 256, data: 30 * 1000 * 1000 }
    var bandwidth = options.bandwidth;

    function setBandwidth(sdp) {
        if (moz || !bandwidth /* || navigator.userAgent.match( /Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i ) */) return sdp;

        // remove existing bandwidth lines
        sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');

        if (bandwidth.audio) {
            sdp = sdp.replace( /a=mid:audio\r\n/g , 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
        }

        if (bandwidth.video) {
            sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:' + bandwidth.video + '\r\n');
        }

        if (bandwidth.data) {
            sdp = sdp.replace( /a=mid:data\r\n/g , 'a=mid:data\r\nb=AS:' + bandwidth.data + '\r\n');
        }

        return sdp;
    }

    // DataChannel management
    var channel;

    function openOffererChannel() {
        if (!options.onChannelMessage || (moz && !options.onOfferSDP))
            return;

        _openOffererChannel();

        if (!moz) return;
        navigator.mozGetUserMedia({
                audio: true,
                fake: true
            }, function(stream) {
                peer.addStream(stream);
                createOffer();
            }, useless);
    }

    function _openOffererChannel() {
        channel = peer.createDataChannel(options.channel || 'RTCDataChannel', moz ? { } : {
            reliable: false // Deprecated
        });

        if (moz) channel.binaryType = 'blob';

        setChannelEvents();
    }

    function setChannelEvents() {
        channel.onmessage = function(event) {
            if (options.onChannelMessage) options.onChannelMessage(event);
        };

        channel.onopen = function() {
            if (options.onChannelOpened) options.onChannelOpened(channel);
        };
        channel.onclose = function(event) {
            if (options.onChannelClosed) options.onChannelClosed(event);

            console.warn('WebRTC DataChannel closed', event);
        };
        channel.onerror = function(event) {
            if (options.onChannelError) options.onChannelError(event);

            console.error('WebRTC DataChannel error', event);
        };
    }

    if (options.onAnswerSDP && moz && options.onChannelMessage)
        openAnswererChannel();

    function openAnswererChannel() {
        peer.ondatachannel = function(event) {
            channel = event.channel;
            channel.binaryType = 'blob';
            setChannelEvents();
        };

        if (!moz) return;
        navigator.mozGetUserMedia({
                audio: true,
                fake: true
            }, function(stream) {
                peer.addStream(stream);
                createAnswer();
            }, useless);
    }

    // fake:true is also available on chrome under a flag!

    function useless() {
        console.error('Error in fake:true');
    }

    function onSdpSuccess() {
    }

    function onSdpError(e) {
        var message = JSON.stringify(e, null, '\t');

        if (message.indexOf('RTP/SAVPF Expects at least 4 fields') != -1) {
            message = 'It seems that you are trying to interop RTP-datachannels with SCTP. It is not supported!';
        }

        console.error('onSdpError:', message);
    }


    ////////////////////////////////////////////////////////////////////////////////////;
    var VideoSendDataRate = 0; 
    var VideoReceivedDataRate = 0; 
    var AudioSendDataRate = 0; 
    var AudioReceivedDataRate = 0; 


    var bytessent1=0;
    var bytessent2=0; // need to add one for each property measured

    var vbytesrecv1=0;
    var vbytesrecv2=0;

    var audiosent1=0
    var audiosent2=0

    var audiorecv1=0
    var audiorecv2=0


    var timerep = 2000; //2000ms
    var timerepsec = timerep/1000; //2s
    var krate;

    function getStats(peer) {
        myGetStats(peer, function (results) {
            for (var i = 0; i < results.length; ++i) {
                var res = results[i];
                console.dir(res);
                
                if (!!navigator.mozGetUserMedia == false)
                {
                    if(res.bytesSent && res.googCodecName=="VP8") {
                        console.log('Bytes sent (video): ' + String(res.bytesSent));
                        bytessent1 = parseInt(res.bytesSent) - parseInt(bytessent2);
                        krate = (bytessent1/timerepsec)/1000; //get kB
                        VideoSentBytes = res.bytesSent; //to be used for graph on page
                        VideoDataRate = krate;
                        $("#sentvideobitrate").html(String(res.bytesSent)+"Video Bytes Sent"+"<br/>"+String(krate)+"kBps");
                        bytessent2 = parseInt(res.bytesSent);
                        VideoSendDataRate = VideoDataRate;
                    }
                    
                    else if(res.bytesSent && res.googCodecName=="opus") {
                        console.log('Bytes sent (audio): ' + String(res.bytesSent));
                        audiosent1 = parseInt(res.bytesSent) - parseInt(audiosent2);
                        krate = (audiosent1/timerepsec)/1000;
                        AudioSentBytes = res.bytesSent;
                        AudioSentDataRate = krate;
                        $("#sentaudiobitrate").html(String(res.bytesSent)+"Audio Bytes Sent"+"<br/>"+String(krate)+"kBps");
                        audiosent2 = parseInt(res.bytesSent);
                        AudioSendDataRate = AudioSentDataRate;
                    }
                    
                    else if(res.bytesReceived && res.googCodecName=="opus") {
                        console.log('Bytes recv (audio): ' + String(res.bytesReceived));
                        audiorecv1 = parseInt(res.bytesReceived) - parseInt(audiorecv2);
                        krate = (audiorecv1/timerepsec)/1000;
                        AudioSentBytes = res.bytesReceived;
                        AudioSentDataRate = krate;
                        $("#receivedaudiobitrate").html(String(res.bytesReceived)+"Audio Bytes Received"+"<br/>"+String(krate)+"kBps");
                        audiorecv2 = parseInt(res.bytesReceived);
                        AudioReceivedDataRate = AudioSentDataRate;
                    }
                    
                    else if(res.bytesReceived && res.googFrameRateReceived>0) {
                        console.log('Bytes recv (video): ' + String(res.bytesReceived));
                        vbytesrecv1 = parseInt(res.bytesReceived) - parseInt(vbytesrecv2);
                        krate = (vbytesrecv1/timerepsec)/1000;
                        VideoSentBytes = res.bytesReceived;
                        VideoDataRate = krate;
                        $("#receivedvideobitrate").html(String(res.bytesReceived)+"Video Bytes Received"+"<br/>"+String(krate)+"kBps");
                        vbytesrecv2 = parseInt(res.bytesReceived);
                        VideoReceivedDataRate = VideoDataRate;
                    }
                    
                }
            }

            $.ajax({
                type: "POST",
                url: "/storeSessData/",
                data: {
                    csrfmiddlewaretoken: token,
                    sessionname : sessionname,
                    VideoSentDR: VideoSendDataRate,
                    AudioSentDR: AudioSendDataRate,
                    VideoRecvDR: VideoReceivedDataRate,
                    AudioRecvDR: AudioReceivedDataRate,
                },
                success: function(data) {
                    //alert(data);
                },
                error: function(xhr, textStatus, errorThrown) {
                    //alert("Error Occurred");
                }
            });

            setTimeout(function () {
                getStats(peer);
            }, timerep);
        });
    }

    function myGetStats(peer, callback) {
        if (!!navigator.mozGetUserMedia) {
            peer.getStats(
                //null,
                function (res) {
                    var items = [];
                    res.forEach(function (result) {
                        items.push(result);
                    });
                    callback(items);
                },
                callback
            );
        } 
        else {
            peer.getStats(function (res) {
                var items = [];
                res.result().forEach(function (result) {
                    var item = {};
                    result.names().forEach(function (name) {
                        item[name] = result.stat(name);
                    });
                    item.id = result.id;
                    item.type = result.type;
                    item.timestamp = result.timestamp;
                    items.push(item);
                });
                callback(items);
            });
        }
    };
////////////////////////////////////////////////////////////////////////////////////

    return {
        addAnswerSDP: function(sdp) {
            console.debug('adding answer-sdp', sdp.sdp);
            peer.setRemoteDescription(new SessionDescription(sdp), onSdpSuccess, onSdpError);
        },
        addICE: function(candidate) {
            peer.addIceCandidate(new IceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));

            console.debug('adding-ice', candidate.candidate);
        },

        peer: peer,
        channel: channel,
        sendData: function(message) {
            channel && channel.send(message);
        },
    };
}



// getUserMedia
var video_constraints = {
    mandatory: { 
        //minFrameRate: 30
        //maxWidth: 500,
        //maxHeight: 360,
    },
    optional: []
};

//user's own video
//remote video options in conferencesetup.js (onRemoteStream)
function getUserMedia(options) {
    var n = navigator,
        media;
    n.getMedia = n.webkitGetUserMedia || n.mozGetUserMedia;
    n.getMedia(options.constraints || {
            audio: true,
            video: video_constraints
        }, streaming, options.onerror || function(e) {
            console.error(e);
        });

    function streaming(stream) {
        var video = options.video;
        if (video) {
            video[moz ? 'mozSrcObject' : 'src'] = moz ? stream : window.webkitURL.createObjectURL(stream);
            video.width=400;
            video.play();
        }
        options.onsuccess && options.onsuccess(stream);
        media = stream;
    }

    return media;
}
