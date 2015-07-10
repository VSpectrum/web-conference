/*
    Modified by Veydh Gooljar (vgooljar@gmail.com)
    Configured Different STUN/TURN servers
    Adapted 
        WebRTC Statistics API
        Recording (variables on session html page)
            ---Adapt: Synced recording
        SDP - Fixing session's upload datarate with pre-fetched value
*/

window.moz = !!navigator.mozGetUserMedia;
var chromeVersion = !!navigator.mozGetUserMedia ? 0 : parseInt(navigator.userAgent.match( /Chrom(e|ium)\/([0-9]+)\./ )[2]);

function RTCPeerConnection(options) {
    var w = window,
        PeerConnection = w.mozRTCPeerConnection || w.webkitRTCPeerConnection,
        SessionDescription = w.mozRTCSessionDescription || w.RTCSessionDescription,
        IceCandidate = w.mozRTCIceCandidate || w.RTCIceCandidate;

    var iceServers = [];

    if (moz) {
        console.log("VRTC: Detected Mozilla");
        if($("#p2pconnect").is(':checked')){
            iceServers.push({
                url: 'stun:stun.services.mozilla.com'
            });
        }
    }

    if (!moz) {
        console.log("VRTC: Detected NOT Mozilla");
        if($("#p2pconnect").is(':checked')){
            iceServers.push({
                url: 'stun:stun.l.google.com:19302'
            });

            iceServers.push({
                url: 'stun:veydh.com:3478'
            });

            iceServers.push({
                url: 'stun:stun.anyfirewall.com:3478'
            });
            /////
            iceServers.push({
                url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
            });

            iceServers.push({
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            });

            iceServers.push({
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            });
        }
        else
        {
            iceServers.push({
                url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                credential: 'webrtc',
                username: 'webrtc'
            });

            iceServers.push({
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            });

            iceServers.push({
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            });
            
        }
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
        try {
            getStats(peer);
        }
        catch(err) {}
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
    //-------------------------------------------------------------------------------------

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


    var vidbandwidth = $('#videoband').val();
    var audbandwidth = $('#audioband').val();

    var vbisnum = /^\d+$/.test(String(vidbandwidth));
    var abisnum = /^\d+$/.test(String(audbandwidth));

    if(!vbisnum || vidbandwidth=='') vidbandwidth = 1500;
    if(!abisnum || audbandwidth=='') audbandwidth = 50;


    options.bandwidth = { audio: audbandwidth, video: vidbandwidth};  //kbps
    var bandwidth = options.bandwidth;

    function setBandwidth(sdp) {
        if (moz || !bandwidth /* || navigator.userAgent.match( /Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i ) */) return sdp;

        // remove existing bandwidth lines
        sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');

        if (bandwidth.audio) {
            $('#AudUpRate').html('Aud: '+String(bandwidth.audio)+' kbps');
            $('#liAudUpRate').css('display', 'block');
            sdp = sdp.replace( /a=mid:audio\r\n/g , 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
        }

        if (bandwidth.video) {
            $('#VidUpRate').html('Vid: '+String(bandwidth.video)+' kbps');
            $('#liVidUpRate').css('display', 'block');
            console.log('Video Bandwidth set to: '+bandwidth.video+' kbps');
            sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:' + bandwidth.video + '\r\n');
        }
        sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:' + bandwidth.video + '\r\n');
        console.log("bandwidth set: "+bandwidth.video+', '+ bandwidth.audio);
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

    var CurrentDelayMs_aud; //recv
    var CurrentDelayMs_vid; //recv
    var packetsLost_aud; //recv
    var packetsLost_vid; //recv


    var timerep = 1000; //2000ms
    var timerepsec = timerep/1000; //ms to seconds
    var krate;
    var foundaddr = false;


    function getStats(peer) {
        myGetStats(peer, function (results) {
            for (var i = 0; i < results.length; ++i) {
                var res = results[i];

                //console.log(i);
                //console.dir(res);

                var sdpdesc = String(peer.remoteDescription.sdp);

                var inca = 0;
                var IDcontainer = 0;
                var getthestats = false;
                for (inca=1; inca<20; ++inca)
                {
                    if( sdpdesc.indexOf(remoteStreamIDList[inca]) > -1)
                    {
                        foundID = document.getElementById(remoteStreamIDList[inca]);
                        if(foundID != null) {
                            IDcontainer = foundID.parentNode.children;
                            //console.dir(IDcontainer);
                            getthestats = true;
                        }
                        break;
                    }
                }
                
                if (!!navigator.mozGetUserMedia == false && getthestats)
                {
                    //console.dir(res);
                    if(res.bytesSent>0 && res.bytesReceived>0 && res.googRemoteAddress) {
                        try {
                            
                            //myLocalAddress = String(res.googLocalAddress);
                            
                            IDcontainer.remoteaddr.innerHTML = "Addr: "+String(res.googRemoteAddress);
                        }
                        catch(err) {}
                    }

                    if(res.bytesSent && res.googCodecName=="VP8") {
                        //console.log('Bytes sent (video): ' + String(res.bytesSent));
                        bytessent1 = parseInt(res.bytesSent) - parseInt(bytessent2);
                        krate = (bytessent1/timerepsec)/1024; //get kB
                        VideoSentBytes = res.bytesSent; //to be used for graph on page
                        VideoDataRate = krate;
                        
                        IDcontainer.sentvideobitrate.innerHTML = "Up Vid: "+String(krate*8)+" kbps";
                        //$("#sentvideobitrate").html(String(res.bytesSent)+" Video Bytes Sent"+"<br/>"+String(krate*8)+"kbps");
                        bytessent2 = parseInt(res.bytesSent);
                        VideoSendDataRate = VideoDataRate;
                    }
                    
                    else if(res.bytesSent && res.googCodecName=="opus") {
                        //console.log('Bytes sent (audio): ' + String(res.bytesSent));
                        audiosent1 = parseInt(res.bytesSent) - parseInt(audiosent2);
                        krate = (audiosent1/timerepsec)/1024;
                        AudioSentBytes = res.bytesSent;
                        AudioSentDataRate = krate;
                        IDcontainer.sentaudiobitrate.innerHTML = "Up Aud: "+String(krate*8)+" kbps";
                        audiosent2 = parseInt(res.bytesSent);
                        AudioSendDataRate = AudioSentDataRate;
                    }
                    
                    else if(res.bytesReceived && res.googCodecName=="opus") {
                        //console.log('Bytes recv (audio): ' + String(res.bytesReceived));
                        audiorecv1 = parseInt(res.bytesReceived) - parseInt(audiorecv2);
                        CurrentDelayMs_aud = parseInt(res.googCurrentDelayMs);
                        packetsLost_aud = parseInt(res.packetsLost);
                        IDcontainer.delayaudms.innerHTML = "Aud Current Delay: "+String(CurrentDelayMs_aud)+" ms";
                        IDcontainer.packlossaud.innerHTML = "Aud Packets Lost: "+String(packetsLost_aud)+" pkts";

                        krate = (audiorecv1/timerepsec)/1024;
                        AudioSentBytes = res.bytesReceived;
                        AudioSentDataRate = krate;
                        IDcontainer.receivedaudiobitrate.innerHTML = "DL Aud: "+String(krate*8)+" kbps";
                        audiorecv2 = parseInt(res.bytesReceived);
                        AudioReceivedDataRate = AudioSentDataRate;
                    }
                    
                    else if(res.bytesReceived && res.googFrameRateReceived>0) { //getgoogreceivedjitter
                        //console.log('Bytes recv (video): ' + String(res.bytesReceived));
                        vbytesrecv1 = parseInt(res.bytesReceived) - parseInt(vbytesrecv2);
                        CurrentDelayMs_vid = parseInt(res.googCurrentDelayMs);
                        packetsLost_vid = parseInt(res.packetsLost);
                        IDcontainer.delayvidms.innerHTML = "Vid Current Delay: "+String(CurrentDelayMs_aud)+" ms";
                        IDcontainer.packlossvid.innerHTML = "Vid Packets Lost: "+String(packetsLost_aud)+" pkts";


                        krate = (vbytesrecv1/timerepsec)/1024;
                        VideoSentBytes = res.bytesReceived;
                        VideoDataRate = krate;
                        IDcontainer.receivedvideobitrate.innerHTML = "DL Vid: "+String(krate*8)+" kbps";
                        vbytesrecv2 = parseInt(res.bytesReceived);
                        VideoReceivedDataRate = VideoDataRate;
                    }


                    
                }
            }
            
            if($("#LogStats").is(':checked'))
                $('.vidContainer').each(function(i, obj) {
                    var peerstreamid = $(this).children('video').attr('id');
                    var peeraddr = $(this).children('div#remoteaddr').html()
                    var vidrecv, audrecv, vidsend, audsend;
                    if(peerstreamid != 'myvideostream'){

                        //console.dir($(this).children('div#receivedvideobitrate').html());
                        vidrecv = $(this).children('div#receivedvideobitrate').html();
                        audrecv = $(this).children('div#receivedaudiobitrate').html();
                        audsend = $(this).children('div#sentaudiobitrate').html();
                        vidsend = $(this).children('div#sentvideobitrate').html();

                        viddelay = $(this).children('div#delayvidms').html();
                        auddelay = $(this).children('div#delayaudms').html();
                        vidPL = $(this).children('div#packlossvid').html();
                        audPL = $(this).children('div#packlossaud').html();

                        $.ajax({
                            type: "POST",
                            url: "/storeSessData/",
                            data: {
                                csrfmiddlewaretoken: token,
                                sessionname : sessionname,
                                ToID: peeraddr,
                                VideoSentDR: vidsend.replace(/[^0-9\.]+/g,""),
                                AudioSentDR: audsend.replace(/[^0-9\.]+/g,""),
                                VideoRecvDR: vidrecv.replace(/[^0-9\.]+/g,""),
                                AudioRecvDR: audrecv.replace(/[^0-9\.]+/g,""),
                                VidDelay: viddelay.replace(/[^0-9\.]+/g,""),
                                AudDelay: auddelay.replace(/[^0-9\.]+/g,""),
                                VidPL: vidPL.replace(/[^0-9\.]+/g,""),
                                AudPL: audPL.replace(/[^0-9\.]+/g,""),
                            },
                            success: function(data) {
                                //alert(data);
                            },
                            error: function(xhr, textStatus, errorThrown) {
                                //alert("Error Occurred");
                            }
                        });
                       
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
        //minFrameRate: 30,
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

    var permissvideo = false;
    var permissaudio = false;

    if($("#vidpermiss").is(':checked'))
        permissvideo = true;

    if($("#audpermiss").is(':checked'))
        permissaudio = true;

    if(!$("#audpermiss").is(':checked') && !$("#vidpermiss").is(':checked'))
    {
        alert('One resource (Audio or Video) must be chosen!');
        location.reload();
    }

    n.getMedia(options.constraints || {
        audio: permissaudio,
        video: permissvideo,//video_constraints,

        }, streaming, options.onerror || function(e) {
            console.error(e);
        });

    function streaming(stream) {
        console.log("Our Video Stream. ");
        console.dir(stream);
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
