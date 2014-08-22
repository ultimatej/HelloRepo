function Player(id, name) {
	
	this.id = id;
	this.name = name;
	this.hand = [];
	this.handRankSum = undefined;
	this.bid = undefined;
	this.ask = undefined;
	this.currPosition = 0;
	this.currBalance = 0; 
}

Player.prototype.getId = function() {
	return this.id;
}

Player.prototype.getName = function() {
	return this.name;
}

Player.prototype.dealHand = function(cardDeck) {
    for (var i = 0; i < 2; i++) {
        var c = cardDeck.draw();
        if(!c) {
        console.log('no more cards');
        return;
    }
        this.hand[this.hand.length] = c;  
    }
    
    //showHand(this.hand);
    calculateHandRankSum(this.hand);
}

//Player.prototype.showHand = function() {
function showHand(hand) {
    var card1 = $('#cardOne')
    var card2 = $('#cardTwo')
    card1.html('');
    card2.html('');
    card1.append(hand[0].getHTML());
    card2.append(hand[1].getHTML());
}

//Player.prototype.calculateHandRankSum = function() {
function calculateHandRankSum(hand) {
    handRankSum = 0;
    for (var i = 0; i < hand.length; i++) {
        handRankSum += hand[i].numericRank();
    }
    console.log(handRankSum);
    this.handRankSum = handRankSum;
    //$('#handRankSum').html(handRankSum);
}

Player.prototype.getBid = function() {
	return this.bid;
}

Player.prototype.getAsk = function() {
	return this.ask;
}

Player.prototype.setBid = function(bid) {
	this.bid = bid;
	//$('#yourBid').val(bid);
}

Player.prototype.setAsk = function(ask) {
	this.ask = ask;
	//$('#yourAsk').val(ask);
}

Player.prototype.decrementBidAsk = function() {
  console.log('Update Bid/Ask clicked.');
  this.setBid(this.bid - 1);
  this.setAsk(this.ask - 1);
  console.log('New bid ' + this.getBid() + '...New ask ' + this.getAsk());
}

Player.prototype.incrementBidAsk = function() {
  console.log('Update Bid/Ask clicked.');
  this.setBid(this.bid + 1);
  this.setAsk(this.ask + 1);
  console.log('New bid ' + this.getBid() + '...New ask ' + this.getAsk());
}

Player.prototype.buy = function(price) {
	this.currPosition++;
	this.currBalance -= price;
}

Player.prototype.sell = function(price) {
	this.currPosition--;
	this.currBalance += price;
}