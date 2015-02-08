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
	        var video = media.video;
	        video.width=400;
	        video.setAttribute('controls', true);
	        video.setAttribute('id', media.stream.id);
	        videosContainer.insertBefore(video, videosContainer.firstChild);
	        video.play();

	        var video_options = {
		           type: 'video'
		        };
		    videorecordRTC[recID] = RecordRTC(media.stream, video_options);
			videorecordRTC[recID].startRecording();

			var audio_options = {
		           type: 'audio'
		        };
		    audiorecordRTC[recID] = RecordRTC(media.stream, audio_options);
			audiorecordRTC[recID].startRecording();

	        var recbtn = document.createElement("button"); 
	        recbtn.setAttribute('type', 'button');
	        recbtn.setAttribute('class', 'RecButton');
	        recbtn.setAttribute('value', recID);
	        recbtn.innerHTML = 'Stop Recording';
	        videosContainer.insertBefore(recbtn, videosContainer.firstChild);
	        recID=recID+1;
	    },
	    onRemoteStreamEnded: function (stream) {
	        var video = document.getElementById(stream.id);
	        if (video) video.parentNode.removeChild(video);
	    },
	    onRoomFound: function (room) {
	        var alreadyExist = document.querySelector('a[data-broadcaster="' + room.broadcaster + '"]');
	        if (alreadyExist) return;

	        var li = document.createElement('li');
	        li.setAttribute("id", "joinConfButton");
	        li.setAttribute("class", "join");
	        li.innerHTML = '<a href="#" class="join">Join Conference</a>';
	        joinRoom.insertBefore(li, joinRoom.childNodes[4]); //insert join room li element before 4th memb

	        var joinRoomButton = li.querySelector('.join');
	        joinRoomButton.setAttribute('data-broadcaster', room.broadcaster);
	        joinRoomButton.setAttribute('data-roomToken', room.broadcaster);
	        joinRoomButton.onclick = function () {
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
	    this.disabled = true;
	    captureUserMedia(function () {
	        conferenceUI.createRoom({
	            roomName: sessionname
	        });
	    });
	};

	function captureUserMedia(callback) {
	    var video = document.createElement('video');
	    video.setAttribute('autoplay', true);
	    video.setAttribute('controls', true);
	    videosContainer.insertBefore(video, videosContainer.firstChild);

	    getUserMedia({
	        video: video,
	        onsuccess: function (stream) {
	            config.attachStream = stream;
	            video.setAttribute('muted', true); //my own created video will be muted
	            
	            streamme = stream;
//------------------------------------------------------------------------------------------------------------
				var video_options = {
		           type: 'video'
		        };
		        videorecordRTC[0] = RecordRTC(streamme, video_options);
		        videorecordRTC[0].startRecording();

		        var audio_options = {
		           type: 'audio'
		        };

		        audiorecordRTC[0] = RecordRTC(streamme, audio_options);
		        audiorecordRTC[0].startRecording();

		        var recbtn = document.createElement("button"); 
		        recbtn.setAttribute('type', 'button');
		        recbtn.setAttribute('class', 'RecButton');
		        recbtn.setAttribute('value', 0);
		        recbtn.innerHTML = 'Stop Recording';
		        videosContainer.insertBefore(recbtn, videosContainer.firstChild);
//------------------------------------------------------------------------------------------------------------
	            callback();
	        }
	    });
	}

});