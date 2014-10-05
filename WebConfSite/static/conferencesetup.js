$(function() {
	var config = {
	    openSocket: function (config) {

	        var SIGNALING_SERVER = 'http://vspectrum.strangled.net:8888/',
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
	        video.setAttribute('controls', true);
	        video.setAttribute('id', media.stream.id);
	        videosContainer.insertBefore(video, videosContainer.firstChild);
	        video.play();
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
	            
	            callback();
	        }
	    });
	}

});