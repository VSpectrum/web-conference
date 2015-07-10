$(function() {
	var config = {
	    openSocket: function (config) {
	        var SIGNALING_SERVER = 'http://veydh.com:8888/',
	            defaultChannel = location.href.replace(/\/|:|#|%|\.|\[|\]/g, '');

	        var channel = config.channel || defaultChannel;
	        var sender = Math.round(Math.random() * 999999999) + 999999999;

	        io.connect(SIGNALING_SERVER).emit('new-channel', {
	            channel: channel,
	            sender: sender
	        });

	        var socket = io.connect(SIGNALING_SERVER + channel);
	        socket.channel = channel;
	        socket.on('connect', function () {
	            if (config.callback) config.callback(socket);
	        });

	        socket.send = function (message) {
	            socket.emit('message', {
	                sender: sender,
	                data: message
	            });
	        };

	        socket.on('message', config.onmessage);
	    },
	    onRemoteStream: function (media) {

	    	var vidcontainer = document.createElement('div');
	    	vidcontainer.setAttribute('class', 'vidContainer');

	        var video = media.video;
	        video.width=400;
	        video.setAttribute('controls', true);
	    	video.setAttribute('class', 'vStream');
	        video.setAttribute('id', media.stream.id);
	        video.setAttribute('class', 'vStream');

	        vidcontainer.appendChild(video);

	        remoteStreamIDList[recID] = String(media.stream.id);

//---------------------------------Setting up Recording for Remote Stream------------------------------------------------
	        remoteStream[recID] = media.stream;
	        console.dir(media); //where is audio?
	        var recbtn = document.createElement("button"); 
	        recbtn.setAttribute('type', 'button');
	        recbtn.setAttribute('class', 'RecButton');
	        recbtn.setAttribute('value', recID);
	        recbtn.innerHTML = 'Start Recording';

	        vidcontainer.appendChild(document.createElement('br'));
		    vidcontainer.appendChild(recbtn);


		    var RemoteAddr = document.createElement('div');
	        RemoteAddr.setAttribute('id', 'remoteaddr');
	        RemoteAddr.setAttribute('style', 'font-size: small; float: right; width: 50%;');
	        vidcontainer.appendChild(RemoteAddr);

		    vidcontainer.appendChild(document.createElement('br'));

//---------------------------------Setting up Statistics logging for Remote Stream------------------------------------------------
		    var UpVidstats = document.createElement('div');
	        UpVidstats.setAttribute('id', 'sentvideobitrate');
	        UpVidstats.setAttribute('style', 'font-size: x-small; float: left; width: 50%;');

	        var UpAudstats = document.createElement('div');
	        UpAudstats.setAttribute('id', 'sentaudiobitrate');
	        UpAudstats.setAttribute('style', 'font-size: x-small; float: left; width: 50%;');

	        var DownVidstats = document.createElement('div');
	        DownVidstats.setAttribute('id', 'receivedvideobitrate');
	        DownVidstats.setAttribute('style', 'font-size: x-small;');

	        var DownAudstats = document.createElement('div');
	        DownAudstats.setAttribute('id', 'receivedaudiobitrate');
	        DownAudstats.setAttribute('style', 'font-size: x-small;');

	        var DelayVid = document.createElement('div');
	        DelayVid.setAttribute('id', 'delayvidms');
	        DelayVid.setAttribute('style', 'font-size: x-small; float: left; width: 50%;');

	        var PackLossVid = document.createElement('div');
	        PackLossVid.setAttribute('id', 'packlossvid');
	        PackLossVid.setAttribute('style', 'font-size: x-small;');

	        var DelayAud = document.createElement('div');
	        DelayAud.setAttribute('id', 'delayaudms');
	        DelayAud.setAttribute('style', 'font-size: x-small; float: left; width: 50%;');

	        var PackLossAud = document.createElement('div');
	        PackLossAud.setAttribute('id', 'packlossaud');
	        PackLossAud.setAttribute('style', 'font-size: x-small;');

	        vidcontainer.appendChild(UpVidstats);
	        vidcontainer.appendChild(DownVidstats);
	        vidcontainer.appendChild(DelayVid);
	        vidcontainer.appendChild(PackLossVid);
	        vidcontainer.appendChild(UpAudstats);
	        vidcontainer.appendChild(DownAudstats);
	        vidcontainer.appendChild(DelayAud);
	        vidcontainer.appendChild(PackLossAud);

	        recID=recID+1;
//------------------------------------------------------------------------------------------------------------
			videosContainer.insertBefore(vidcontainer, videosContainer.firstChild);
	        video.play();
	    },
	    onRemoteStreamEnded: function (stream) {
	        var video = document.getElementById(stream.id);
	        if (video)
	        { 
	        	console.log("id: "+String(stream.id)+ " has left");
	        	$("#"+String(stream.id)).parent( ".vidContainer" ).remove();
	        	video.parentNode.removeChild(video);
	    	}
	    },
	    onRoomFound: function (room) {
	        var alreadyExist = document.querySelector('a[data-broadcaster="' + room.broadcaster + '"]');
	        if (alreadyExist) return; // prevents spamming up sidebar with room found

	        $('.join').remove();

	        var li = document.createElement('li');
	        li.setAttribute("id", "joinConfButton");
	        //li.setAttribute("class", "join");
	        li.innerHTML = '<a href="#" class="join">Join Conference</a>';
	        joinRoom.insertBefore(li, joinRoom.childNodes[4]); //insert join room li element before 4th memb

	        var joinRoomButton = li.querySelector('.join');
	        joinRoomButton.setAttribute('data-broadcaster', room.broadcaster);
	        joinRoomButton.setAttribute('data-roomToken', room.broadcaster);
	        joinRoomButton.onclick = function () {
	        	$('#initsetup').hide();
	            this.disabled = true;
	            $("#joinConfButton").toggle();
	            var broadcaster = this.getAttribute('data-broadcaster');
	            var roomToken = this.getAttribute('data-roomToken');
	            captureUserMedia(function () {
	                conferenceUI.joinRoom({
	                    roomToken: roomToken,
	                    joinUser: broadcaster
	                });
	            });
	        };
	    }
	};

	var conferenceUI = conference(config);
	var videosContainer = document.getElementById('videos-container') || document.body;
	var roomsList = document.getElementById('rooms-list');
	var joinRoom = document.getElementById('mainbar');

	document.getElementById('setup-new-room').onclick = function () {
		$('#initsetup').hide();
	    this.disabled = true;
	    captureUserMedia(function () {
	        conferenceUI.createRoom({
	            roomName: sessionname
	        });
	    });
	};

	function captureUserMedia(callback) {
		var vidcontainer = document.createElement('div');
	    vidcontainer.setAttribute('class', 'vidContainer');

	    var video = document.createElement('video');
	    video.setAttribute('autoplay', true);
	    video.setAttribute('controls', true);
	    video.setAttribute('class', 'vStream');
	    video.setAttribute('id', 'myvideostream');

	    vidcontainer.appendChild(video);

	    getUserMedia({
	        video: video,
	        onsuccess: function (stream) {
	            config.attachStream = stream;
	            video.setAttribute('muted', true); //my own created video will be muted
	            
	            remoteStream[0] = stream;
//--------------------------------------Setting up Recording for Local Stream-----------------------------------
		        var recbtn = document.createElement("button"); 
		        recbtn.setAttribute('type', 'button');
		        recbtn.setAttribute('class', 'RecButton');
		        recbtn.setAttribute('value', 0);
		        recbtn.innerHTML = 'Start Recording';

		        vidcontainer.appendChild(document.createElement('br'));
		        vidcontainer.appendChild(recbtn);

//------------------------------------------------------------------------------------------------------------
	            callback();
	        }
	    });

	    videosContainer.insertBefore(vidcontainer, videosContainer.firstChild);
	}

});