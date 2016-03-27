'use strict';

var agarClient = require('agario-client'),
	config = require('./bot/config.js'),
	token = null,
	account = new agarClient.Account();

var logFn = require('./bot/logs.js'),
	gameplayFn = require('./bot/gameplay.js');

// Getting Facebook Token
account.c_user = config.c_user;
account.datr = config.datr;
account.xs = config.xs;
account.requestFBToken(function(tkn, info) {
    token = tkn;

    startConnecting(QUEST, token, agarClient, start, config.regions);

	console.log('Agar.io XP gain session successfully started:');
	setInterval(function() { logFn(QUEST, true); }, 1000);
});

// Core
let QUEST = {
	COLLECTED_MASS_TOTAL: 0,
	MAX_BOTS_COUNT: 0,
	MAX_MASS_COUNT: 0,
	LARGEST_BOT_MASS: 0,
	MOVES: {
		DEFENCE: 0,
		ATTACK: 0,
		VIRUS: 0,
		RANDOM: 0
	},
	ACTIONS: {
		SPLITS: 0
	},
	BOTS: {},
	SERVERS: {}
};

var clientIdCounter = 0;
function start(server, key) {
	var client = new agarClient('Client_' + clientIdCounter++);
	QUEST.SERVERS[server] = true;
	client.debug = 0;
	client.auth_token = token;
	client.on('disconnect', function() {
		if (QUEST.BOTS[client.client_name]) delete QUEST.BOTS[client.client_name];
		if (QUEST.SERVERS[server]) delete QUEST.SERVERS[server];
		clearInterval(client.sendInterval);
		client = null;
	});
	client.on('packetError', function(packet, error, preventCrash) {
		preventCrash();
	});
	client.on('connected', function() {
		QUEST.COLLECTED_MASS_TOTAL += 1;
		QUEST.BOTS[client.client_name] = client;
		client.spawn(config.name());
		client.sendInterval = setInterval(function() {
			gameplayFn(QUEST, config, client);
		}, 40);
	});
	client.on('lostMyBalls', function() {
		client.spawn(config.name());
	});

	client.on('scoreUpdate', function(oldScore, newScore) {
		var currentMass = parseInt(newScore),
			previousMass = parseInt(oldScore);
		if (currentMass > previousMass) {
			QUEST.COLLECTED_MASS_TOTAL += ((currentMass - previousMass)/50);
		}
	});
	client.connect('ws://' + server, key);
}

// Starting connection
var startConnecting = require('./bot/connect.js');
