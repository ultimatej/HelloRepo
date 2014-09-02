/*
* Copyright (c) 2011 Google Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not
* use this file except in compliance with the License. You may obtain a copy of
* the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
*/

// A generic "smart reviver" function.
// Looks for object values with a `ctor` property and
// a `data` property. If it finds them, and finds a matching
// constructor that has a `fromJSON` property on it, it hands
// off to that `fromJSON` function, passing in the value.
function Reviver(key, value) {
  var ctor;

  if (typeof value === "object" &&
      typeof value.ctor === "string" &&
      typeof value.data !== "undefined") {
    ctor = Reviver.constructors[value.ctor] || window[value.ctor];
    
    if (typeof ctor === "function" &&
        typeof ctor.fromJSON === "function") {
        //console.log("In Reviver. Key: " + key + "value: " + JSON.stringify(value) + " " + ctor);
        return ctor.fromJSON(value);
    }
  }
  return value;
}
Reviver.constructors = {}; // A list of constructors the smart reviver should know about  
Reviver.constructors.Player = Player;
Reviver.constructors.playingCards = playingCards;
Reviver.constructors.playingCards_card = playingCards.card;

// A generic "toJSON" function that creates the data expected
// by Reviver.
// `ctorName`  The name of the constructor to use to revive it
// `obj`       The object being serialized
// `keys`      (Optional) Array of the properties to serialize,
//             if not given then all of the objects "own" properties
//             that don't have function values will be serialized.
//             (Note: If you list a property in `keys`, it will be serialized
//             regardless of whether it's an "own" property.)
// Returns:    The structure (which will then be turned into a string
//             as part of the JSON.stringify algorithm)
function Generic_toJSON(ctorName, obj, keys) {
  var data, index, key;

  if (!keys) {
    keys = Object.keys(obj); // Only "own" properties are included
  }

  data = {};
  for (index = 0; index < keys.length; ++index) {
    key = keys[index];
    data[key] = obj[key];
  }
  return {ctor: ctorName, data: data};
}

// A generic "fromJSON" function for use with Reviver: Just calls the
// constructor function with no arguments, then applies all of the
// key/value pairs from the raw data to the instance. Only useful for
// constructors that can be reasonably called without arguments!
// `ctor`      The constructor to call
// `data`      The data to apply
// Returns:    The object
function Generic_fromJSON(ctor, data) {
  var obj, name;

  obj = new ctor();
  for (name in data) {
    obj[name] = data[name];
  }
  return obj;
}
    
function startCountdown(minutes, seconds) {
    var endTime, msLeft, time;
    endTime = (new Date().getTime()) + 1000 * (60*minutes + seconds) + 500;
    updateTimer();

    function updateTimer() {
        msLeft = endTime - (new Date().getTime());
        gapi.hangout.data.submitDelta({'countdown': '' + msLeft});
        if ( msLeft >= 1000 ) {
            time = new Date( msLeft );
            setTimeout( updateTimer, time.getUTCMilliseconds() + 500 );
        }
    }
}

function setCountdown(milliseconds)
{
    var element, hours, mins, secs, msLeft, time;
    element = $('#countdown');
    
    msLeft = milliseconds;

    function twoDigits( n )
    {
        return (n <= 9 ? "0" + n : n);
    }

    if (msLeft >= 1000) {
        time = new Date( msLeft );
        hours = time.getUTCHours();
        mins = time.getUTCMinutes();
        secs = time.getUTCSeconds();
        element.html((hours ? hours + ':' + twoDigits(mins) : mins) + ':' + twoDigits(secs));
        
    }
    else {
        //stop the game in all clients, clear canvas, figure out score, post info.
        element.html("game over!");
        scoreGame();

    }
}

function scoreGame() {
    console.log("game over!");
    state = gapi.hangout.data.getState();
    var players = JSON.parse(state['players'], Reviver);
    var scores = [];
    for (var i = 0; i < players.length; i++) {
        players[i].closePositions(state['contractValue']);
        scores[i] = players[i].getBalance();
    }
    var maxScore = Math.max.apply(null, scores);
    var winner = players[scores.indexOf(maxScore)];
    console.log("winner: " + winner);
    //$('container').empty();
    alert("Congratulations winner: " + winner.getName() + "...Score: " + maxScore + 
        "\n" + players[0].getName() + "...Score: " + scores[0] + 
        "\n" + players[1].getName() + "...Score: " + scores[1] +
        "\n" + players[2].getName() + "...Score: " + scores[2]);
}

function startButtonClick() {
    var cardDeck = new playingCards();
    var updates = {};
    var players = [];
    var maxSpread = 4;    
    var enabledParticipants = gapi.hangout.getEnabledParticipants();
    var numPlayers = enabledParticipants.length;
    var expectedValue = numPlayers * 2 * 7;
    var startingBid = expectedValue - maxSpread / 2;
    var startingAsk = expectedValue + maxSpread / 2;
    var minutes = 2;
    var seconds = 30;
    var contractValue = 0;

    for (var i = 0; i < numPlayers; i++) {
        var currParticipant = enabledParticipants[i];
        console.log("Participant name: " + currParticipant.person.displayName + "Participant id: " + currParticipant.person.id);
        var currPlayer = new Player(currParticipant.id, currParticipant.person.displayName);
        currPlayer.dealHand(cardDeck);
        contractValue += currPlayer.getHandRankSum();
        currPlayer.setBid(startingBid);
        currPlayer.setAsk(startingAsk);
        players[i] = currPlayer;        
    }
    var randomPlayerName = enabledParticipants[Math.floor(Math.random() * numPlayers)].person.displayName;
    updates['players'] = JSON.stringify(players);
    updates['cardDeck'] = JSON.stringify(cardDeck);
    updates['expectedValue'] = '' + expectedValue;
    updates['maxSpread'] = '' + maxSpread;
    updates['marketAsk'] = '' + startingAsk;
    updates['marketBid'] = '' + startingBid;
    updates['marketAskPlayer'] = '' + randomPlayerName;
    updates['marketBidPlayer'] = '' + randomPlayerName;
    updates['contractValue'] = '' + contractValue;
    updates['countdown'] = '' + 1000 * (minutes * 60 + seconds);
    gapi.hangout.data.submitDelta(updates);
    startCountdown(minutes, seconds );
}

// This button will increment the value
function plusButtonClick() {
   // Stop acting like a button
    //e.preventDefault();
    //var updates = {};
    var state = gapi.hangout.data.getState();
    var players = JSON.parse(state['players'], Reviver);
    var player = getPlayerById(players, getUserHangoutId());
    player.incrementBidAsk();
    //updates['players'] = JSON.stringify(players);
    //gapi.hangout.data.submitDelta(updates);
    updateMarket(players);
}
// This button will decrement the value till 0
function minusButtonClick() {
    // Stop acting like a button
    //e.preventDefault();
    //var updates = {};
    var state = gapi.hangout.data.getState();
    var players = JSON.parse(state['players'], Reviver);
    var player = getPlayerById(players, getUserHangoutId());
    player.decrementBidAsk();
    //updates['players'] = JSON.stringify(players);
    //gapi.hangout.data.submitDelta(updates);
    updateMarket(players);
}

function buyButtonClick() {
    // Stop acting like a button
    //e.preventDefault();
    var state = gapi.hangout.data.getState();
    var players = JSON.parse(state['players'], Reviver);
    var player = getPlayerById(players, getUserHangoutId());
    var marketAsk = parseInt(state['marketAsk']);
    var marketAskPlayer = state['marketAskPlayer'];
    var maxSpread = parseInt(state['maxSpread']);
    if (player.getName() === marketAskPlayer) {
        console.log("Can't buy from yourself, increase bid/ask");
        //player.setAsk(undefined);
        //updateMarket(players);
    }
    else {
        player.setBid(marketAsk);
        player.setAsk(marketAsk + maxSpread);
        player.buy(marketAsk);
        getPlayerByName(players, marketAskPlayer).sell(marketAsk);
        updateMarket(players);
    }
}

function sellButtonClick() {
    // Stop acting like a button
    //e.preventDefault();
    var state = gapi.hangout.data.getState();
    var players = JSON.parse(state['players'], Reviver);
    var player = getPlayerById(players, getUserHangoutId());
    var marketBid = parseInt(state['marketBid']);
    var marketBidPlayer = state['marketBidPlayer'];
    var maxSpread = parseInt(state['maxSpread']);
    if (player.getName() === marketBidPlayer) {
        console.log("Can't sell to yourself, decrease bid/ask");
        //player.setAsk(undefined);
        //updateMarket(players);
    }
    else {
        player.setAsk(marketBid);
        player.setBid(marketBid - maxSpread);
        player.sell(marketBid);
        getPlayerByName(players, marketBidPlayer).buy(marketBid);
        updateMarket(players);
    }
}

function updateMarket(players) {
    var updates = {};
    //var state = gapi.hangout.data.getState();
    //console.log(state);
    //var players = JSON.parse(state['players'], Reviver);
    console.log("updateMarket_players: " + JSON.stringify(players))
    var bids = [];
    var asks = [];
    for (var i = 0; i < players.length; i++) {
        bids[i] = players[i].getBid();
        asks[i] = players[i].getAsk();
    }
    var minAsk = Math.min.apply(null, asks);
    var minAskPlayer = players[asks.indexOf(minAsk)];
    var maxBid = Math.max.apply(null, bids);
    console.log("maxBid: " + maxBid);
    var maxBidPlayer = players[bids.indexOf(maxBid)];
    console.log("maxBidPlayer: " + JSON.stringify(maxBidPlayer));
    updates['marketAsk'] = '' + minAsk;
    updates['marketAskPlayer'] = '' + minAskPlayer.getName();
    updates['marketBid'] = '' + maxBid;
    updates['marketBidPlayer'] = '' + maxBidPlayer.getName();
    updates['players'] = JSON.stringify(players);
    gapi.hangout.data.submitDelta(updates);
}

function getPlayerById(players, id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].getId() === id)
            return players[i];
    }
    return undefined;
}

function getPlayerByName(players, name) {
    for (var i = 0; i < players.length; i++) {
        //console.log("Player Name: " + players[i].getName() + "name" + name);
        if (players[i].getName() === name)
            //console.log("matches: " + name);
            return players[i];
    }
    return undefined;
}

function getUserHangoutId() {
  return gapi.hangout.getLocalParticipantId();
}


var forbiddenCharacters = /[^a-zA-Z!0-9_\- ]/;
function setText(element, text) {
  element.innerHTML = typeof text === 'string' ?
      text.replace(forbiddenCharacters, '') :
      '';
}

function updateStateUi(state) {
    console.log(state);
    var players = JSON.parse(state['players'], Reviver);
    var player = getPlayerById(players, getUserHangoutId());
    //var cardDeck = JSON.parse(state['cardDeck'], Reviver);
    //console.log("player: " + JSON.stringify(player));
    //console.log("cardDeck: " + JSON.stringify(cardDeck));

    //console.log("work please: " + player.getName() + "playerID: " + player.getId());
    $('#startButton').hide();
    player.updateUI();
    $('#marketBid').html("Market Bid: " + state['marketBid']);
    $('#marketBidPlayer').html("(" + state['marketBidPlayer'] + ")");
    $('#marketAsk').html("Market Ask: " + state['marketAsk']);
    $('#marketAskPlayer').html("(" + state['marketAskPlayer'] + ")");
    $('#expectedValue').html("(Expected: " + state['expectedValue'] + ")");
    setCountdown(parseInt(state['countdown']));
}

function updateParticipantsUi(participants) {
    console.log('Participants count: ' + participants.length);
    var participantsListElement = document.getElementById('participants');
    setText(participantsListElement, participants.length.toString());
}

// A function to be run at app initialization time which registers our callbacks
function init() {
  console.log('Init app.');

  var apiReady = function(eventObj) {
    if (eventObj.isApiReady) {
        console.log('API is ready');

        gapi.hangout.data.onStateChanged.add(function(eventObj) {
            updateStateUi(eventObj.state);
        });
      //  gapi.hangout.onParticipantsChanged.add(function(eventObj) {
      //  updateParticipantsUi(eventObj.participants);
      // });
      // updateStateUi(gapi.hangout.data.getState());
      //  updateParticipantsUi(gapi.hangout.getParticipants());
        
        gapi.hangout.onApiReady.remove(apiReady);
    }
  };

  // This application is pretty simple, but use this special api ready state
  // event if you would like to any more complex app setup.
  gapi.hangout.onApiReady.add(apiReady);
}

gadgets.util.registerOnLoadHandler(init);
