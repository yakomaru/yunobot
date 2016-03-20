module.exports = function(localData){
	'use strict';
	var Promise = require('bluebird');
	var request = Promise.promisifyAll(Promise.promisify(require('request')));

	function checkRoom(room){
		return room === localData.privateroom;
	}

	var defaultResponses = [
		['how do i ', '? :confused:'],
		['*tries her best to ', '.*'],
		['how about you ', '. :smirk:']
	];

	function getDefaultResponse(message){
		var num = Math.floor(Math.random() * (defaultResponses.length + 1));
		return defaultResponses[num][0] + message + defaultResponses[num][1];
	}

	var command = {
		find: function(name, room, arr){
			var search = arr.slice(2).join(' ');
			request.getAsync({
				url: 'https://discordapp.com/api/channels/' + room + '/messages?limit=100',
				headers: {Authorization: localData.token}
			}).then(function(res){
				var body = JSON.parse(res.body);
				body = body.filter(function(message){
					return message.author.username !== 'yunobot' && message.content.toLowerCase().slice(0, 4) !== 'yuno';
				});
				var found = body.filter(function(message){
					return message.content.toLowerCase().indexOf(search) !== -1;
				});
				var message;
				if(found.length > 0){
					message = 'i found it for you! "' + search + '" was mentioned in ' + found.length + 
					' of the last ' + body.length + ' messages and the last was by ' + found[0].author.username + ' who said: "' + found[0].content + '" on ' + Date(found.timestamp) + '.';
				}else{
					message = 'i couldn\'t find it for you, i\'ll look harder next time. :anguished:';
				}
				send(room, message);
			}).catch(function(err){
				console.log(err);
			});
		},
		good: function(name, room, arr){
			var message = name + ' praised me! :smile:';
			send(room, message);
		},
		protect: function(name, room, arr){
			name = arr[2] === 'me' || arr[2] === undefined ? name : arr[2];
			var message = 'don\'t worry ' + name + ', yuno will protect you. :revolving_hearts:';
			send(room, message);
		},
		roomid: function(name, room, arr){
			var message = 'i checked for you and the room id is ' + room + '.';
			send(room, message);
		}
	};

	var privateCommand = {

	};

	function parse(message){
		message = message.replace(/[,\*]/g, '');
		message = message.toLowerCase();
		return message.split(' ');
	}

	function send(room, message){
		request.postAsync({
			url: 'https://discordapp.com/api/channels/' + room + '/messages',
			form: {content: message},
			headers: {Authorization: localData.token}
		}).then(function(res){
			console.log('yuno: ' + message);
		}).catch(function(err){
			console.log(err);
		});
	}

	return function(userID, name, room, message){
		var arr = parse(message);
		if(checkRoom(room)) console.log('private command room');
		if(checkRoom(room) && privateCommand[arr[1]]) privateCommand[arr[1]](name, room, arr); 
		else if(command[arr[1]]) command[arr[1]](name, room, arr);
		else if(!arr[1]) send(room, 'hmm?');
		else send(room, getDefaultResponse(arr.slice(1).join(' ')));
	};
};