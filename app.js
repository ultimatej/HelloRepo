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
var cardDeck = new playingCards();    
var players = [];
var marketAsk = undefined;
var marketBid = undefined;
var marketAskPlayer = undefined;
var marketBidPlayer = undefined;
var maxSpread = 4;

// This button will increment the value
$('.qtyplus').click(function(e){
   // Stop acting like a button
    e.preventDefault();
    var player = getPlayerById(getUserHangoutId());
    player.incrementBidAsk();
    updateMarket();
});
// This button will decrement the value till 0
$(".qtyminus").click(function(e) {
    // Stop acting like a button
    e.preventDefault();
    var player = getPlayerById(getUserHangoutId());
    player.decrementBidAsk();
    updateMarket();
});

$(".buy").click(function(e) {
    // Stop acting like a button
    e.preventDefault();
    var player = getPlayerById(getUserHangoutId());
    if (player === marketAskPlayer) {
        console.log("Can't buy from yourself");
        player.setAsk(undefined);
        updateMarket();
    }
    player.setBid(marketAsk);
    player.setAsk(marketAsk + maxSpread);
    player.buy(marketAsk);
    marketAskPlayer.sell(marketAsk);
    updateMarket();
});

$(".sell").click(function(e) {
    // Stop acting like a button
    e.preventDefault();
    var player = getPlayerById(getUserHangoutId());
    if (player === marketBidPlayer) {
        console.log("Can't sell to yourself");
        player.setBid(undefined);
        updateMarket();
    }
    player.setAsk(marketBid);
    player.setBid(marketBid - maxSpread);
    player.sell(marketBid);
    marketAskPlayer.sell(marketBid);
    updateMarket();
});

function updateMarket() {
    var bids = [];
    var asks = [];
    for (var i = 0; i < players.length; i++) {
        bids[i] = players[i].getBid();
        asks[i] = players[i].getAsk();
    }
    var minAsk = Math.min.apply(null, asks);
    var minAskPlayer = players[asks.indexOf(minAsk)];
    var maxBid = Math.max.apply(null, bids);
    var maxBidPlayer = players[bids.indexOf(maxBid)];
    setMarketAsk(minAsk, minAskPlayer);
    setMarketBid(maxBid, maxBidPlayer);
}

function getPlayerById(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].getId() === id)
            return players[i];
    }
    return undefined;
}

function getUserHangoutId() {
  return gapi.hangout.getLocalParticipantId();
}

function initPlayers() {
enabledParticipants = gapi.hangout.getEnabledParticipants(); 
for (var i = 0; i < enabledParticipants.length; i++) {
        console.log("Participant id: " + enabledParticipants[i].id + "...G+ id: " + enabledParticipants[i].person.id)
        players[players.length] = new Player(enabledParticipants[i].id, enabledParticipants[i].person.displayName);        
    }
}

function calculateExpectedValue() {
    var numPlayers = players.length;
    var expectedValue = 7 * 2 * numPlayers;
    $('#expectedValue').html("(Expected: " + expectedValue + ")");
    return expectedValue;
}

function setMarketAsk(ask, player) {
    marketAskPlayer = player;
    marketAsk = ask;
    $('#marketAsk').html("Market Ask: " + marketAsk);
    $('#marketAskPlayer').html("(" + marketAskPlayer.getName() + ")");

}

function setMarketBid(bid, player) {
    marketBidPlayer = player;
    marketBid = bid;
    $('#marketBid').html("Market Bid: " + marketBid);
    $('#marketBidPlayer').html("(" + marketBidPlayer.getName() + ")");
}

function resetButtonClick() {
  console.log('Resetting count to 0');
  gapi.hangout.data.submitDelta({'count': '0'});
}

var forbiddenCharacters = /[^a-zA-Z!0-9_\- ]/;
function setText(element, text) {
  element.innerHTML = typeof text === 'string' ?
      text.replace(forbiddenCharacters, '') :
      '';
}


function updateStateUi(state) {
  var countElement = document.getElementById('count');
  var stateCount = state['count'];
  if (!stateCount) {
    setText(countElement, 'Probably 0');
  } else {
    setText(countElement, stateCount.toString());
  }
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

      // gapi.hangout.data.onStateChanged.add(function(eventObj) {
      //   updateStateUi(eventObj.state);
      // });
      //  gapi.hangout.onParticipantsChanged.add(function(eventObj) {
      //  updateParticipantsUi(eventObj.participants);
      // });
      // updateStateUi(gapi.hangout.data.getState());
      //  updateParticipantsUi(gapi.hangout.getParticipants());
        initPlayers();
        var expectedValue = calculateExpectedValue();
        for (var i = 0; i < players.length; i++) {
            players[i].dealHand();
            players[i].setBid(expectedValue - maxSpread / 2);
            players[i].setAsk(expectedValue + maxSpread / 2);
        }
        updateMarket();
        gapi.hangout.onApiReady.remove(apiReady);
    }
  };

  // This application is pretty simple, but use this special api ready state
  // event if you would like to any more complex app setup.
  gapi.hangout.onApiReady.add(apiReady);
}

gadgets.util.registerOnLoadHandler(init);
