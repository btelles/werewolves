var werewolvesApp = angular.module('werewolvesApp', [])

werewolvesApp.service('Cards', function() {
  var WEREWOLF_CARD = Card('Werewolf');
  var Card = function(name) {
    return {
      name: name,
      eq: function(otherCard) { return this.name == otherCard.name },
      selected: false,
      position: 0,
      visibility: 'hidden',
      isCenterCard: false,
      show: function() {
        this.visibility = 'show'; },
      isShown: function() {
        return this.visibility == 'show';
      },
      hide: function() {
        this.visibility = 'hidden';
      }
    }
  }

  var GameCards = function(centerCards, playerCards) {
    return {
      centerCards: centerCards,
      playerCards: playerCards
    };
  }

  var _list = [
      Card('Werewolf'),
      Card('Werewolf'),
      Card('Villager'),
      Card('Villager'),
      Card('Seer'),
      Card('Drunk'),
      Card('Troublemaker'),
      Card('Village Idiot'),
      Card('Apprentice Seer'),
      Card('Minion'),
      Card('Doppleganger'),
      Card('Mason'),
      Card('Mason'),
      Card('Insomniac'),
      Card('Robber')
    ];

  this.list = function() {
    return _list;
  }

  this.errors = [];

  this.selectedCards = function() {
    return _.filter(this.list(), function(n) {return n.selected})
  }
  this.totalSelectedCards = function() {
    return this.selectedCards().length;
  }
  this.getCenterAndPlayerCards = function() {
    /**
     * Separates cards into a GameCard object, and guarantees
     * at least one player card will be a werewolf.
     */
    var selected = this.selectedCards();

    // Remove one werewolf card from the list of user-selected cards.
    var firstWerewolf = _.remove(selected, function(card) {
      return card.eq(WEREWOLF_CARD);
    })[0];

    // Shuffle the deck (which now has one missing werewolf card)
    // then select the 3 center cards.
    var shuffledCards = _.shuffle(selected);
    var centerCards = shuffledCards.splice(3);

    // Put the werewolf card back in the shuffledCards deck, and
    // reshuffle. These become the player cards.
    var playerCards = _.shuffle(shuffledCards.push(firstWerewolf));

    return GameCards(centerCards, playerCards);
  }

  this.validate = function() {
    this._validateWerewolfSelected();
    this._validateMinimumPlayers();
    return !this.errors.length;
  }

  /* VALIDATION SECTION */
  this.addError = function(errorName) {
    this.errors.push(errorName);
  }

  this._validateWerewolfSelected = function() {
    var totalWerewolves = _.count(this.selectedCards(), function(card) {
      return card.eq(WEREWOLF_CARD);
    });
    if (totalWerewolves == 0) {
      this.addError("You must select at least one werewolf.");
    }
  }

  this._validateMinimumPlayers = function() {
    if (this.totalSelectedCards() < 6) {
      this.addError("You must select at least 6 cards");
    }
  }
});

werewolvesApp.service('Turn', function(Cards) {
  this.gameStarted = false;
  this.currentCard = 0;
  this._gameCards = [];
  this.startGame = function() {
    if (!Cards.validate()) {
      console.log(Cards.errors);
      return false;
    };

    var cards = Cards.getCenterAndPlayerCards();
    this._playerCards = cards.playerCards;
    this._centerCards = cards.centerCards;
    this.gameStarted = true;
  }
  this.advance = function() {
    if (this.gameStarted) {
      if (this.currentCardIsShown()) {
        this.hideCurrentCard();
        this.currentCard += 1;
        if (this.lastCardWasShown()) {
          return false;
        }
        return true;
      } else if (this.lastCardWasShown()) {
        return false;
      } else {
        this.showCurrentCard();
        return true;
      };
    }
  }
  this.hideCurrentCard = function() {
    this._playerCards[this.currentCard].hide();
  }
  this.showCurrentCard = function() {
    this._playerCards[this.currentCard].show();
  }
  this.currentCardIsShown = function() {
    return (this._playerCards[this.currentCard] &&
            this._playerCards[this.currentCard].isShown());
  }
  this.lastCardWasShown = function() {
    return this.currentCard >= this._playerCards.length;
  }
  this.playerCards = function () {
    return this._playerCards;
  }
  this.centerCards = function () {
    return this._centerCards;
  }
});

werewolvesApp.controller('AvailableCardsCtrl', function($scope, Cards, Turn) {
  $scope.showCardSelection = true;
  $scope.cardList = Cards.list();
  $scope.selectedCards = Cards.selectedCards();
  $scope.totalSelected = Cards.totalSelectedCards();
  $scope.$watch(function() {
    return Cards.totalSelectedCards()
  }, function (newValue, oldValue) {
    $scope.totalSelected = newValue;
  })

  var justStartedPlaying = true;

  $scope.startGame = function() {
    $scope.showCardSelection = false;
    $scope.showIntro = true;
    $scope.showGamePlay = true;
    $scope.showNextButton = true;
    Turn.startGame();
    $scope.playerCards = Turn.centerCards();
    $scope.centerCards = Turn.centerCards();
  }

  $scope.toggleVisibility = function(card) {
    if (card.visibility == 'show') {
      card.visibility = 'hidden';
    } else {
      card.visibility = 'show';
    }
  }

  $scope.advanceGame = function(keyEvent) {
    if (justStartedPlaying) {
      justStartedPlaying = false;
      $scope.showIntro = false;
      $scope.showGamePlay = true;
      $scope.showInstructions = true;
    }
    if (!Turn.advance()) {
      $scope.showInstructions = false;
      $scope.showNextButton = false;
      $scope.showClosingStatements = true;
    };
  }
});

function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  ev.dataTransfer.setData('text', ev.target.id);
}
function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData('text');
  ev.target.appendChild(document.getElementById(data));
}
