/* ### TODO ###
- Refactor code :) Always

Optional Features:
- HTML Drag & Drop API
- Limit How Many Times Stock Can Be Reloaded (3x)
- 3 Card Draw
- High score
- Options panel for user
- Sound Fx

*/

// 0. DECLARE VARS

   // document
   var d = document;

   // build deck
   var deck = [];

   // build suits
   var suits = [];
   suits['spades'] = [
      // spades
      ['A','spade'],
      ['2','spade'],
      ['3','spade'],
      ['4','spade'],
      ['5','spade'],
      ['6','spade'],
      ['7','spade'],
      ['8','spade'],
      ['9','spade'],
      ['10','spade'],
      ['J','spade'],
      ['Q','spade'],
      ['K','spade']
   ];
   suits['hearts'] = [
      // hearts
      ['A','heart'],
      ['2','heart'],
      ['3','heart'],
      ['4','heart'],
      ['5','heart'],
      ['6','heart'],
      ['7','heart'],
      ['8','heart'],
      ['9','heart'],
      ['10','heart'],
      ['J','heart'],
      ['Q','heart'],
      ['K','heart']
   ];
   suits['diamonds'] = [
      // diamonds
      ['A','diamond'],
      ['2','diamond'],
      ['3','diamond'],
      ['4','diamond'],
      ['5','diamond'],
      ['6','diamond'],
      ['7','diamond'],
      ['8','diamond'],
      ['9','diamond'],
      ['10','diamond'],
      ['J','diamond'],
      ['Q','diamond'],
      ['K','diamond']
   ];
   suits['clubs'] = [
      // clubs
      ['A','club'],
      ['2','club'],
      ['3','club'],
      ['4','club'],
      ['5','club'],
      ['6','club'],
      ['7','club'],
      ['8','club'],
      ['9','club'],
      ['10','club'],
      ['J','club'],
      ['Q','club'],
      ['K','club']
   ];

   // build stock pile
   var s = [];

   // build waste pile
   var w = [];

   // build foundations
   var spades = [];
   var hearts = [];
   var diamonds = [];
   var clubs = [];

   // build tableau
   var t = [];
   t[1] = t[2] = t[3] = t[4] = t[5] = t[6] = t[7] = [];

   // build table
   var table = [];
   table['stock'] = s;
   table['waste'] = w;
   table['spades'] = spades;
   table['hearts'] = hearts;
   table['diamonds'] = diamonds;
   table['clubs'] = clubs;
   table['tab'] = t;

   // initial face up cards
   var playedCards =
   '#waste .card,' +
   '#fnd .card,' +
   '#tab .card:last-child';

   // cache selectors
   var $timer = d.querySelector('#score .timer');
   var $timerSpan = d.querySelector('#score .timer span');
   var $moveCount = d.querySelector('#score .move-count');
   var $moveCountSpan = d.querySelector('#score .move-count span');
   var $score = d.querySelector('#score .score');
   var $scoreSpan = d.querySelector('#score .score span');
   var $playPause = d.querySelector('#play-pause');
   var $table = d.querySelector('#table');
   var $upper = d.querySelector('#table .upper-row');
   var $lower = d.querySelector('#table .lower-row');
   var $stock = d.querySelector('#stock');
   var $waste = d.querySelector('#waste');
   var $fnd = d.querySelector('#fnd');
   var $tab = d.querySelector('#tab');
   var $autoWin = d.querySelector('#auto-win');

   // other global vars
   var clock = 0;
   var time = 0;
   var moves = 0;
   var score = 0;
   var bonus = 0;
   var lastEventTime = 0;
   var unplayedTabCards = [];
   var lastSavedScore = null;

   // KV sync vars
   var kvWorkerUrl = localStorage.getItem('solitaire_kv_url') || '';
   var kvToken = localStorage.getItem('solitaire_kv_token') || '';
   var kvUsername = localStorage.getItem('solitaire_kv_username') || '';
   var kvFriends = [];
   try {
      var storedFriends = localStorage.getItem('solitaire_kv_friends');
      if (storedFriends) kvFriends = JSON.parse(storedFriends);
   } catch(e) { kvFriends = []; }

// 1. CREATE DECK
   deck = create(deck, suits);

// 2. SHUFFLE DECK
   deck = shuffle(deck);

// 3. DEAL DECK
   table = deal(deck, table);

// 4. RENDER TABLE
   render(table, playedCards);

// 5. START GAMEPLAY
   play(table);

// ### EVENT HANDLERS ###
   window.onresize = function(event) {
      sizeCards();
   };

// ### FUNCTIONS ###

   // create deck
      function create(deck, suits) {
         console.log('Creating Deck...');
         // loop through each suit
         for (var suit in suits) {
            suit = suits[suit];
            // loop through each card in suit
            for (var card in suit) {
               card = suit[card];
               deck.push(card); // push card to deck
            }
         }
         return deck;
      }

   // shuffle deck
      function shuffle(deck) {
         console.log('Shuffling Deck...');
         // declare vars
         var i = deck.length, temp, rand;
         // while there remain elements to shuffle
         while (0 !== i) {
            // pick a remaining element
            rand = Math.floor(Math.random() * i);
            i--;
            // and swap it with the current element
            temp = deck[i];
            deck[i] = deck[rand];
            deck[rand] = temp;
         }
         return deck;
      }

   // deal deck
      function deal(deck, table) {
         console.log('Dealing Deck...');
         // move all cards to stock
         table['stock'] = deck;
         // build tableau
            var tabs = table['tab'];
            // loop through 7 tableau rows
            for (var row = 1; row <= 7; row++) {
               // loop through 7 piles in row
               for (var pile = row; pile <= 7; pile++) {
                  // build blank pile on first row
                  if (row === 1) tabs[pile] = [];
                  // deal card to pile
                  move(table['stock'], tabs[pile], false);
               }
            }
         return table;
      }

   // move card
      function move(source, dest, pop, selectedCards = 1) {
         if (pop !== true) {
            var card = source.shift(); // take card from bottom
            dest.push(card); // push card to destination pile
         } else {
            while (selectedCards) {
               // take card from the top of selection
               var card = source[source.length - selectedCards];
               // remove it from the selected pile
               source.splice(source.length - selectedCards, 1);
               // put it in the destination pile
               dest.push(card);
               // decrement
               selectedCards--; 
            }
         }
         return;
      }

   // render table
      function render(table, playedCards) {
         console.log('Rendering Table...');

         // check for played cards
         playedCards = checkForPlayedCards(playedCards);

         // check for empty piles
         emptyPiles = checkForEmptyPiles(table);

         // update stock pile
         update(table['stock'], '#stock ul', playedCards, true);
         // update waste pile
         update(table['waste'], '#waste ul', playedCards);
         // update spades pile
         update(table['spades'], '#spades ul', playedCards);
         // update hearts pile
         update(table['hearts'], '#hearts ul', playedCards);
         // update diamonds pile
         update(table['diamonds'], '#diamonds ul', playedCards);
         // update clubs pile
         update(table['clubs'], '#clubs ul', playedCards);
         // update tableau
         var tabs = table['tab'];
         // loop through tableau piles
         for (var i = 1; i <= 7; i++) {
            // update tableau pile
            update(tabs[i], '#tab li:nth-child('+i+') ul', playedCards, true);
         }

         // get unplayed tab cards
         unplayedTabCards = getUnplayedTabCards();

         // size cards
         sizeCards();

         // show table
         $table.style.opacity = '100';

         console.log('Table Rendered:', table);
         return;
      }

   // update piles
      function update(pile, selector, playedCards, append) {
         var e = d.querySelector(selector);
         var children = e.children; // get children
         var grandParent = e.parentElement.parentElement; // get grand parent
         // reset pile
         e.innerHTML = '';
         // loop through cards in pile
         for (var card in pile) {
            card = pile[card];
            // get html template for card
            var html = getTemplate(card);
            // create card in pile
            createCard(card, selector, html, append);
         }
         // turn cards face up
         flipCards(playedCards, 'up');
         // count played cards
         var played = countPlayedCards(children);
         e.parentElement.dataset.played = played;
         // count all played cards for #tab and #fnd piles
         if ( grandParent.id === 'tab' || grandParent.id === 'fnd' ) {
            var playedAll = parseInt(grandParent.dataset.played);
            if ( isNaN(playedAll) ) playedAll = 0;
            grandParent.dataset.played = playedAll + played;
         }
         // count unplayed cards
         var unplayed = countUnplayedCards(children);
         e.parentElement.dataset.unplayed = unplayed;
         // count all unplayed cards for #tab and #fnd piles
         if ( grandParent.id === 'tab' || grandParent.id === 'fnd' ) {
            var unplayedAll = parseInt(grandParent.dataset.unplayed);
            if ( isNaN(unplayedAll) ) unplayedAll = 0;
            grandParent.dataset.unplayed = unplayedAll + unplayed;
         }
         return pile;
      }

   // get html template for card
      function getTemplate(card) {
         var r = card[0]; // get rank
         var s = card[1]; // get suit
         // get html template
         var html = d.querySelector('.template li[data-rank="'+r+'"]').innerHTML;
         // search and replace suit variable
         html = html.replace('{{suit}}', s);
         return html;
      }

   // create card in pile
      function createCard(card, selector, html, append) {
         var r = card[0]; // get rank
         var s = card[1]; // get suit
         // get pile based on selector
         if ( selector.includes('#stock') ) var p = 'stock';
         if ( selector.includes('#waste') ) var p = 'waste';
         if ( selector.includes('#spades') ) var p = 'spades';
         if ( selector.includes('#hearts') ) var p = 'hearts';
         if ( selector.includes('#diamonds') ) var p = 'diamonds';
         if ( selector.includes('#clubs') ) var p = 'clubs';
         if ( selector.includes('#tab') ) var p = 'tab';
         var e = d.createElement('li'); // create li element
         e.className = 'card'; // add .card class to element
         e.dataset.rank = r; // set rank atribute
         e.dataset.suit = s; // set suit attribute
         e.dataset.pile = p; // set pile attribute;
         e.dataset.selected = 'false'; // set selected attribute
         e.innerHTML = html; // insert html to element
         // query for pile
         var pile = d.querySelector(selector);
         // append to pile
         if (append) pile.appendChild(e);
         // or prepend to pile
         else pile.insertBefore(e, pile.firstChild);
         return;
      }

   // check for played cards
      function checkForPlayedCards(playedCards) {
         // query
         var els = d.querySelectorAll('.card[data-played="true"]');
         for (var e in els) { // loop through elements
            e = els[e];
            if (e.nodeType) {
               var r = e.dataset.rank;
               var s = e.dataset.suit;
               playedCards += ', .card[data-rank="'+r+'"][data-suit="'+s+'"]' ;
            }
         }
         return playedCards;
      }

   // check for empty piles
      function checkForEmptyPiles(table) {
         // reset empty data on all piles
         var els = d.querySelectorAll('.pile'); // query elements
         for (var e in els) { // loop through elements
            e = els[e];
            if (e.nodeType) {
               delete e.dataset.empty;
            }
         }
         // declare var with fake pile so we always have one
         var emptyPiles = '#fake.pile';
         // check spades pile
         if ( table['spades'].length === 0 ) {
            emptyPiles += ', #fnd #spades.pile';
         }
         // check hearts pile
         if ( table['hearts'].length === 0 ) {
            emptyPiles += ', #fnd #hearts.pile';
         }
         // check diamonds pile
         if ( table['diamonds'].length === 0 ) {
            emptyPiles += ', #fnd #diamonds.pile';
         }
         // check clubs pile
         if ( table['clubs'].length === 0 ) {
            emptyPiles += ', #fnd #clubs.pile';
         }
         // check tableau piles
         var tabs = table['tab'];
            // loop through tableau piles
            for (var i = 1; i <= 7; i++) {
               // check tabeau pile
               if ( tabs[i].length === 0 ) {
                  emptyPiles += ', #tab li:nth-child('+i+').pile';
               }
            }
         // mark piles as empty
         els = d.querySelectorAll(emptyPiles); // query elements
         for (var e in els) { // loop through elements
            e = els[e];
            if (e.nodeType) {
               e.dataset.empty = 'true'; // mark as empty
            }
         }
         return emptyPiles;
      }

   // count played cards
      function countPlayedCards(cards) {
         var played = 0;
            // loop through cards
            for (var card in cards) {
               card = cards[card];
               if (card.nodeType) {
                  // check if card has been played
                  if (card.dataset.played === 'true') played++;
               }
            }
         return played;
      }

   // count unplayed cards
      function countUnplayedCards(cards) {
         var unplayed = 0;
            // loop through cards
            for (var card in cards) {
               card = cards[card];
               if (card.nodeType) {
                  // check if card has been played
                  if (card.dataset.played !== 'true') unplayed++;
               }
            }
         return unplayed;
      }

   // flip cards
      function flipCards(selectors, direction) {
         var els = d.querySelectorAll(selectors); // query all elements
         for (var e in els) { // loop through elements
            e = els[e];
            if (e.nodeType) {
               switch(direction) {
                  case 'up' :
                     if (e.dataset.played !== 'true') {
                        // if flipping over tableau card
                        if (e.dataset.pile === 'tab') {
                           // loop through unplayed cards
                           for (var card in unplayedTabCards) {
                              card = unplayedTabCards[card];
                              // if rank and suit matches
                              if (  e.dataset.rank === card[0] &&
                                    e.dataset.suit === card[1] )
                              // score 5 points
                              updateScore(5);
                           }
                        }
                        e.className += ' up'; // add class
                        e.dataset.played = 'true'; // mark as played
                     }
                     break;
                  case 'down' :
                     e.className = 'card'; // reset class
                     delete e.dataset.played; // reset played data attribute
                  default : break;
               }
            }
         }
         return;
      }

   // get face down cards in tableau pile
      function getUnplayedTabCards() {
         // reset array
         unplayedTabCards = [];
         // get all face down card elements
         var els = d.querySelectorAll('#tab .card:not([data-played="true"])');
         for (var e in els) { // loop through elements
            e = els[e];
            if (e.nodeType) {
               unplayedTabCards.push( [ e.dataset.rank, e.dataset.suit ] );
            }
         }
         return unplayedTabCards;
      }

   // size cards
      function sizeCards(selector = '.pile', ratio = 1.4) {
         var s = selector;
         var r = ratio;
         var e = d.querySelector(s); // query element
         var h = e.offsetWidth * r; // get height of element
         // set row heights
         $upper.style.height = h + 10 + 'px';
         $lower.style.height = h + 120 + 'px';
         // set height of elements
         var els = d.querySelectorAll(s); // query all elements
         for (var e in els) { // loop through elements
            e = els[e];
            if (e.nodeType) e.style.height = h + 'px'; // set height in css
         }
      }

   // gameplay
      function play(table) {
         // check for winning table
         if ( checkForWin(table) ) return;
         // check for autowin
         checkForAutoWin(table);
         // bind click events
         bindClick(
            '#stock .card:first-child,' +
            '#waste .card:first-child,' +
            '#fnd .card:first-child,' +
            '#tab .card[data-played="true"]'
         );
         // bind dbl click events
         bindClick(
            '#waste .card:first-child,' +
            '#tab .card:last-child',
            'double'
         );
         // bind drag/touch events
         bindDrag();
         console.log('Make Your Move...');
         console.log('......');
      }

   // bind click events
      function bindClick(selectors, double) {
         var elements = d.querySelectorAll(selectors); // query all elements
         // loop through elements
         for (var e in elements) {
            e = elements[e];
            // add event listener
            if (e.nodeType) {
               if (!double) e.addEventListener('click', select);
               else e.addEventListener('dblclick', select);
            }
         }
         return;
      }

   // unbind click events
      function unbindClick(selectors, double) {
         var elements = d.querySelectorAll(selectors); // query all elements
         // loop through elements
         for (var e in elements) {
            e = elements[e];
            // remove event listener
            if (e.nodeType) {
               if (!double) e.removeEventListener('click', select);
               else e.removeEventListener('dblclick', select);
            }
         }
         return;
      }

   // drag and drop (mouse + touch always bound; they do not interfere)
      var dragClone = null;
      var dragOffsetX = 0;
      var dragOffsetY = 0;
      var touchDragCard = null;
      var touchDragRank = null;
      var touchDragSuit = null;
      var touchDragSource = null;
      var touchStartX = 0;
      var touchStartY = 0;
      var isDragging = false;

      function bindDrag() {
         bindMouseDrag();
         bindTouch();
      }

      // mouse drag and drop
      function bindMouseDrag() {
         var draggables = d.querySelectorAll(
            '#waste .card:first-child,' +
            '#fnd .card:first-child,' +
            '#tab .card[data-played="true"]'
         );
         for (var i = 0; i < draggables.length; i++) {
            draggables[i].setAttribute('draggable', 'true');
            draggables[i].addEventListener('dragstart', onDragStart);
            draggables[i].addEventListener('dragend', onDragEnd);
         }
         var targets = d.querySelectorAll('#fnd .pile, #tab .pile');
         for (var i = 0; i < targets.length; i++) {
            targets[i].addEventListener('dragover', onDragOver);
            targets[i].addEventListener('dragleave', onDragLeave);
            targets[i].addEventListener('drop', onDrop);
         }
      }

      function onDragStart(event) {
         var e = event.target;
         var rank = e.dataset.rank;
         var suit = e.dataset.suit;
         if (!rank || !suit) return;
         $table.dataset.move = 'true';
         $table.dataset.selected = rank + ',' + suit;
         $table.dataset.source = e.closest('.pile').dataset.pile;
         e.dataset.selected = 'true';
         event.dataTransfer.effectAllowed = 'move';
         event.dataTransfer.setData('text/plain', rank + ',' + suit);
      }

      function onDragEnd(event) {
         if ($table.dataset.move) {
            reset(table);
            render(table, playedCards);
            play(table);
         }
      }

      function onDragOver(event) {
         event.preventDefault();
         event.dataTransfer.dropEffect = 'move';
         event.currentTarget.classList.add('drag-over');
      }

      function onDragLeave(event) {
         event.currentTarget.classList.remove('drag-over');
      }

      function onDrop(event) {
         event.preventDefault();
         var destPile = event.currentTarget;
         destPile.classList.remove('drag-over');
         executeDrop(destPile);
      }

      // touch drag and drop
      function bindTouch() {
         var touchables = d.querySelectorAll(
            '#waste .card:first-child,' +
            '#fnd .card:first-child,' +
            '#tab .card[data-played="true"]'
         );
         for (var i = 0; i < touchables.length; i++) {
            touchables[i].addEventListener('touchstart', onTouchStart, {passive: false});
         }
      }

      function onTouchStart(event) {
         var e = event.target;
         if (!e.classList.contains('card')) e = e.closest('.card');
         if (!e) return;
         touchDragRank = e.dataset.rank;
         touchDragSuit = e.dataset.suit;
         touchDragCard = e;
         if (!touchDragRank || !touchDragSuit) return;
         touchDragSource = e.closest('.pile').dataset.pile;
         touchStartX = event.touches[0].clientX;
         touchStartY = event.touches[0].clientY;
         isDragging = false;
		 if (dragClone) {
		    try { d.body.removeChild(dragClone); } catch(err) {}
		    dragClone = null;
		 }
         e.classList.add('touching');
         d.addEventListener('touchmove', onTouchMove, {passive: false});
         d.addEventListener('touchend', onTouchEnd, {passive: false});
         d.addEventListener('touchcancel', onTouchCancel, {passive: false});
      }

      function onTouchMove(event) {
         var dx = event.touches[0].clientX - touchStartX;
         var dy = event.touches[0].clientY - touchStartY;
         var dist = Math.sqrt(dx * dx + dy * dy);
         if (!isDragging && dist > 8) {
            isDragging = true;
            if ($timer.dataset.action !== 'start') timer('start');
            $table.dataset.move = 'true';
            $table.dataset.selected = touchDragRank + ',' + touchDragSuit;
            $table.dataset.source = touchDragSource;
            touchDragCard.dataset.selected = 'true';
            touchDragCard.classList.remove('touching');
            var rect = touchDragCard.getBoundingClientRect();
            dragOffsetX = touchStartX - rect.left;
            dragOffsetY = touchStartY - rect.top;
            dragClone = touchDragCard.cloneNode(true);
            dragClone.style.position = 'fixed';
            dragClone.style.width = rect.width + 'px';
            dragClone.style.height = rect.height + 'px';
            dragClone.style.zIndex = '9999';
            dragClone.style.opacity = '0.85';
            dragClone.style.pointerEvents = 'none';
            dragClone.style.borderRadius = '10px';
            dragClone.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
            d.body.appendChild(dragClone);
         }
         if (isDragging) {
            event.preventDefault();
            dragClone.style.left = (event.touches[0].clientX - dragOffsetX) + 'px';
            dragClone.style.top = (event.touches[0].clientY - dragOffsetY) + 'px';
            var highlighted = d.querySelectorAll('.drag-over');
            for (var i = 0; i < highlighted.length; i++) {
               highlighted[i].classList.remove('drag-over');
            }
            dragClone.style.display = 'none';
            var el = d.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);
            dragClone.style.display = '';
            if (el) {
               var pile = el.closest('.pile');
               if (pile && (pile.closest('#fnd') || pile.closest('#tab'))) {
                  pile.classList.add('drag-over');
               }
            }
         }
      }

      function onTouchEnd(event) {
         d.removeEventListener('touchmove', onTouchMove);
         d.removeEventListener('touchend', onTouchEnd);
         d.removeEventListener('touchcancel', onTouchCancel);
         if (touchDragCard) touchDragCard.classList.remove('touching');
         var highlighted = d.querySelectorAll('.drag-over');
         for (var i = 0; i < highlighted.length; i++) {
            highlighted[i].classList.remove('drag-over');
         }
         if (!isDragging) return;
         if (dragClone) {
            d.body.removeChild(dragClone);
            dragClone = null;
         }
         var x = event.changedTouches[0].clientX;
         var y = event.changedTouches[0].clientY;
         var el = d.elementFromPoint(x, y);
         if (el) {
            var destPile = el.closest('.pile');
            if (destPile && (destPile.closest('#fnd') || destPile.closest('#tab'))) {
               executeDrop(destPile);
               return;
            }
         }
         reset(table);
         render(table, playedCards);
         play(table);
      }

      function onTouchCancel(event) {
         d.removeEventListener('touchmove', onTouchMove);
         d.removeEventListener('touchend', onTouchEnd);
         d.removeEventListener('touchcancel', onTouchCancel);
         if (touchDragCard) touchDragCard.classList.remove('touching');
         var highlighted = d.querySelectorAll('.drag-over');
         for (var i = 0; i < highlighted.length; i++) {
            highlighted[i].classList.remove('drag-over');
         }
         if (dragClone) {
            try { d.body.removeChild(dragClone); } catch(e) {}
            dragClone = null;
         }
         isDragging = false;
         touchDragCard = null;
         if ($table.dataset.move) {
            reset(table);
            render(table, playedCards);
            play(table);
         }
      }

      // shared drop logic for mouse and touch
      function executeDrop(destPile) {
         var pileId = destPile.dataset.pile;
         $table.dataset.dest = pileId;
         var isFnd = ['spades','hearts','diamonds','clubs'].indexOf(pileId) >= 0;
         var dest;
         var destCard;
         if (isFnd) {
            destCard = destPile.querySelector('ul .card:first-child');
            dest = destCard ? [destCard.dataset.rank, destCard.dataset.suit] : pileId;
         } else {
            destCard = destPile.querySelector('ul .card:last-child');
            dest = (destCard && destCard.dataset.played === 'true') ? [destCard.dataset.rank, destCard.dataset.suit] : pileId;
         }
         var selected = $table.dataset.selected ? $table.dataset.selected.split(',') : null;
         if (!selected) {
            reset(table);
            render(table, playedCards);
            play(table);
            return;
         }
         // If dropping on a foundation pile, the grabbed card must be the actual
         // top card of its source pile — not a middle card with cards stacked on top.
         if (isFnd) {
            var sourcePile = $table.dataset.source;
            var sourcePileData;
            if (sourcePile && !isNaN(sourcePile)) {
               sourcePileData = table['tab'][parseInt(sourcePile)];
            } else if (sourcePile) {
               sourcePileData = table[sourcePile];
            }
            if (sourcePileData && sourcePileData.length > 0) {
               var topCard = sourcePileData[sourcePileData.length - 1];
               if (topCard[0] !== selected[0] || topCard[1] !== selected[1]) {
                  reset(table);
                  render(table, playedCards);
                  play(table);
                  return;
               }
            }
         }
         if (validateMove(selected, dest)) {
            makeMove();
            reset(table);
            render(table, playedCards);
            play(table);
         } else {
            reset(table);
            render(table, playedCards);
            play(table);
         }
      }

   // on click handler: select
      var clicks = 0; // set counter for counting clicks
      var clickDelay = 200; // set delay for double click
      var clickTimer = null; // set timer for timeout function
      function select(event) {

         // prevent default
         event.preventDefault();

         // start timer
         if ( $timer.dataset.action !== 'start' ) {
            timer('start');
         }

         // if timestamp matches then return false
         var time = event.timeStamp; // get timestamp
         if ( time === lastEventTime ) {
            console.log('Status: Timestamp Matches, False Click');
            return false;
         }
         else {
            lastEventTime = time; // cache timestamp
         }

         // get variables
         var e = event.target; // get element
         var isSelected = e.dataset.selected; // get selected attribute
         var rank = e.dataset.rank; // get rank attribute
         var suit = e.dataset.suit; // get suit attribute
         var pile = e.dataset.pile; // get pile attribute
         var action = e.dataset.action; // get action attribute

         // create card array
         if (rank && suit) var card = [rank,suit];

         // count clicks
         clicks++;

         // single click
         if (clicks === 1 && event.type === 'click') {
            clickTimer = setTimeout(function() {
               console.log('Single Click Detected', event);

               // reset click counter
               clicks = 0;

               // if same card is clicked
               if (e.dataset.selected === 'true') {
                  console.log('Status: Same Card Clicked');
                  // deselect card
                  delete e.dataset.selected;
                  delete $table.dataset.move;
                  delete $table.dataset.selected;
                  delete $table.dataset.source;
                  console.log('Card Deselected', card, e);
               }

               // if move is in progress
               else if ($table.dataset.move) {
                  console.log('Status: A Move Is In Progess');
                  // get selected
                  var selected = $table.dataset.selected.split(',');
                  // update table dataset with destination pile
                  $table.dataset.dest = e.closest('.pile').dataset.pile;
                  // get destination card or pile
                  if ( card ) var dest = card;
                  else var dest = $table.dataset.dest;
                  // validate move
                  if ( validateMove(selected, dest) ) {
                     // make move
                     makeMove();
                     reset(table);
                     render(table, playedCards);
                     play(table);
                  } else {
                     console.log('Move is Invalid. Try again...');
                     reset(table);
                     render(table, playedCards);
                     play(table);
                     console.log('Card Deselected', card, e);
                  }
               }

               // if stock is clicked
               else if (pile === 'stock') {
                  console.log('Status: Stock Pile Clicked');
                  // if stock isn't empty
                  if (table['stock'].length) {
                     // move card from stock to waste
                     move(table['stock'], table['waste']);
                     reset(table);
                     render(table, playedCards);
                     // if empty, then bind click to stock pile element
                     if (table['stock'].length === 0) bindClick('#stock .reload-icon');
                     // count move
                     countMove(moves++);
                     // return to play
                     play(table);
                  }
               }

               // if stock reload icon is clicked
               else if (action === 'reload') {
                  console.log('Reloading Stock Pile');
                  // remove event listener
                  unbindClick('#stock .reload-icon');
                  // reload stock pile
                  if (table['waste'].length) {
                     table['stock'] = table['waste']; // move waste to stock
                     table['waste'] = [] // empty waste
                  }
                  // render table
                  render(table, playedCards);
                  // turn all stock cards face down
                  flipCards('#stock .card', 'down');
                  // update score by -100 pts
                  updateScore(-100);
                  // return to play
                  play(table);
               }

               // if no move is in progress
               else {
                  // select card
                  e.dataset.selected = 'true';
                  $table.dataset.move = 'true';
                  $table.dataset.selected = card;
                  $table.dataset.source = e.closest('.pile').dataset.pile;
                  // if ace is selected
                  if (rank === 'A') {
                     console.log('Ace Is Selected');
                     bindClick('#fnd .pile[data-empty="true"]');
                  }
                  if (rank === 'K') {
                     console.log('King Is Selected');
                     bindClick('#tab .pile[data-empty="true"]');
                  }
               }

            }, clickDelay);
         }

         // double click
         else if (event.type === 'dblclick') {
            console.log('Double Click Detected', event);
            clearTimeout(clickTimer); // prevent single click
            clicks = 0; // reset click counter
            // select card
            e.dataset.selected = 'true';
            $table.dataset.move = 'true';
            $table.dataset.selected = card;
            $table.dataset.source = e.closest('.pile').dataset.pile;
            // get destination foundation pile
            if ( card ) var dest = findFoundationDest(card);
            // if no valid foundation pile found, cancel move
            if ( !dest ) {
               console.log('No valid foundation pile found');
               reset(table);
               render(table, playedCards);
               play(table);
               return;
            }
            // update table dataset with destination
            $table.dataset.dest = dest;
            // validate move
            if ( validateMove(card, dest) ) {
               // make move
               makeMove();
               reset(table);
               render(table, playedCards);
               play(table);
            } else {
               console.log('Move is Invalid. Try again...');
               reset(table);
               render(table, playedCards);
               play(table);
               console.log('Card Deselected', card, e);
            }

         }

      }

   // validate move
      function validateMove(selected, dest) {
         console.log ('Validating Move...', selected, dest);

         // if selected card exists
         if (selected) {
            var sRank = parseRankAsInt(selected[0]);
            var sSuit = selected[1];
         }

         // if destination is another card
         if (dest.constructor === Array) {
            console.log('Desitination appears to be a card');
            var dRank = parseRankAsInt(dest[0]);
            var dSuit = dest[1];
            var dPile = $table.dataset.dest;
            // if destination pile is foundation
            if (['spades','hearts','diamonds','clubs'].indexOf(dPile) >= 0) {
               // if rank isn't in sequence then return false
               if (dRank - sRank !== -1) {
                 console.log('Rank sequence invalid');
                 console.log(dRank - sRank)
                 return false;
               }
               // if suit isn't in sequence then return false
               if ( sSuit !== dSuit ) {
                  console.log('Suit sequence invalid');
                  return false;
               }
            }
            // if destination pile is tableau
            else {
               // if rank isn't in sequence then return false
               if (dRank - sRank !== 1) {
                 console.log('Rank sequence invalid');
                 return false;
               }
               // if suit isn't in sequence then return false
               if ( ( (sSuit === 'spade' || sSuit === 'club') &&
                  (dSuit === 'spade' || dSuit === 'club') ) ||
                  ( (sSuit === 'heart' || sSuit === 'diamond') &&
                  (dSuit === 'heart' || dSuit === 'diamond') ) ) {
                 console.log('Suit sequence invalid');
                 return false;
               }
            }
            // else return true
            console.log('Valid move');
            return true;

         }

         // if destination is foundation pile
         if (['spades','hearts','diamonds','clubs'].indexOf(dest) >= 0) {
            console.log('Destination appears to be a foundation pile');

            // get top card in destination pile
            var lastCard = d.querySelector('#'+dest+' .card:first-child');
            if (lastCard) {
               var dRank = parseRankAsInt(lastCard.dataset.rank);
               var dSuit = lastCard.dataset.suit;
               // pile has cards: suit must match and rank must be sequential
               if ( sSuit !== dSuit ) {
                  console.log('Suit sequence invalid');
                  return false;
               }
               if ( sRank - dRank !== 1 ) {
                  console.log('Rank sequence invalid');
                  return false;
               }
               console.log('Valid move');
               return true;
            } else {
               // pile is empty: any ace is allowed
               if ( sRank !== 1 ) {
                  console.log('Only aces can start a foundation pile');
                  return false;
               }
               console.log('Valid Move');
               return true;
            }
         }

         // if destination is empty tableau pile
		 if ( dest >= 1 && dest <= 7 ) {
			console.log('Destination appears to be empty tableau');
			if ( sRank !== 13 ) {
				console.log('Only kings can be placed on empty tableau piles');
				return false;
			}
			return true;
		 }
	  }

   // make move
      function makeMove() {
         console.log('Making Move...');

         // get source and dest
         var source = $table.dataset.source;
         var dest = $table.dataset.dest;
         console.log('From '+source+' pile to '+dest+' pile');

         // if pulling card from waste pile
         if ( source === 'waste') {
            // if moving card to foundation pile
            if ( isNaN(dest) ) {
               console.log('Moving To Foundation Pile');
               move(table[source], table[dest], true);
               updateScore(10); // score 10 pts
            }
            // if moving card to tableau pile
            else {
               console.log('Moving To Tableau Pile');
               move(table[source], table['tab'][dest], true);
               updateScore(5); // score 5 pts
            }
         }

         // if pulling card from foundation pile
         else if (['spades','hearts','diamonds','clubs'].indexOf(source) >= 0) {
            // if moving ace to another foundation pile
            if (['spades','hearts','diamonds','clubs'].indexOf(dest) >= 0) {
               console.log('Moving Ace To Another Foundation Pile');
               move(table[source], table[dest], true);
            }
            // if moving card to tableau pile
            else if ( !isNaN(dest) ) {
               console.log('Moving To Tableau Pile');
               move(table[source], table['tab'][dest], true);
               updateScore(-15); // score -15 pts
            }
            // otherwise not allowed
            else {
               console.log('That move is not allowed');
               return false;
            }
         }

         // if pulling card from tableau pile
         else {
            // if moving card to foundation pile
            if ( isNaN(dest) ) {
               console.log('Moving To Foundation Pile');
               move(table['tab'][source], table[dest], true);
               updateScore(10); // score 10 pts
            }
            // if moving card to tableau pile
            else {
               console.log('Moving To Tableau Pile');
               // get selected card
               var selected = d.querySelector('.card[data-selected="true"');
               // get cards under selected card
               var selectedCards = [selected];
               while ( selected = selected['nextSibling'] ) {
                  if (selected.nodeType) selectedCards.push(selected);
               }
               // move card(s)
               move(
                  table['tab'][source],
                  table['tab'][dest],
                  true,
                  selectedCards.length
               );
            }
         }

         // unbind click events
         unbindClick(
            '#stock .card:first-child,' +
            '#waste .card:first-child,' +
            '#fnd .card:first-child,' +
            '#fnd #spades.pile[data-empty="true"],' +
            '#fnd #hearts.pile[data-empty="true"],' +
            '#fnd #diamonds.pile[data-empty="true"],' +
            '#fnd #clubs.pile[data-empty="true"],' +
            '#tab .card[data-played="true"],' +
            '#tab .pile[data-empty="true"]'
         );
         // unbind double click events
         unbindClick(
            '#waste .card:first-child' +
            '#tab .card:last-child',
            'double'
         )

         // count move
         countMove(moves++);

         // reset table
         console.log('Ending Move...');

         return;
      }

   // parse rank as integer
      function parseRankAsInt(rank) {
         // assign numerical ranks to letter cards
         switch (rank) {
            case 'A' : rank = '1'; break;
            case 'J' : rank = '11'; break;
            case 'Q' : rank = '12'; break;
            case 'K' : rank = '13'; break;
            default : break;
         }
         // return integer value for rank
         return parseInt(rank);
      }

   // find the right foundation pile for a card
      function findFoundationDest(card) {
         var rank = parseRankAsInt(card[0]);
         var suit = card[1];
         var fndPiles = ['spades', 'hearts', 'diamonds', 'clubs'];
         // look for a pile that already has this suit
         for (var i = 0; i < fndPiles.length; i++) {
            var topCard = d.querySelector('#' + fndPiles[i] + ' .card:first-child');
            if (topCard && topCard.dataset.suit === suit) {
               return fndPiles[i];
            }
         }
         // for aces, find any empty pile
         if (rank === 1) {
            for (var i = 0; i < fndPiles.length; i++) {
               if (!d.querySelector('#' + fndPiles[i] + ' .card:first-child')) {
                  return fndPiles[i];
               }
            }
         }
         return null;
      }

   // parse integer as rank
      function parseIntAsRank(int) {
         // parse as integer
         rank = parseInt(int);
         // assign letter ranks to letter cards
         switch(rank) {
            case 1 : rank = 'A'; break;
            case 11 : rank = 'J'; break;
            case 12 : rank = 'Q'; break;
            case 13 : rank = 'K'; break;
            default : break;
         }
         return rank;
      }

   // reset table
      function reset(table) {
		 delete $table.dataset.move;
	     delete $table.dataset.selected;
	     delete $table.dataset.source;
	     delete $table.dataset.dest;
	     delete $fnd.dataset.played;
	     delete $fnd.dataset.unplayed;
	     delete $tab.dataset.played;
	     delete $tab.dataset.unplayed;
	     var selectedCards = d.querySelectorAll('.card[data-selected="true"]');
	     for (var i = 0; i < selectedCards.length; i++) {
		    delete selectedCards[i].dataset.selected;
	     }
	     console.log('Table reset');
	  }

   // timer funcion
      function timer(action) {
         // declare timer vars
         var minutes = 0;
         var seconds = 0;
         var gameplay = d.body.dataset.gameplay;
         // set timer attribute
         $timer.dataset.action = action;
         // switch case
         switch (action) {
            // start timer
            case 'start' :
               console.log('Starting Timer...');
               // looping function
               clock = setInterval(function() {
                  // increment
                  time++;
                  // parse minutes and seconds
                  minutes = parseInt(time / 60, 10);
                  seconds = parseInt(time % 60, 10);
                  minutes = minutes < 10 ? "0" + minutes : minutes;
                  seconds = seconds < 10 ? "0" + seconds : seconds;
                  // output to display
                  $timerSpan.textContent = minutes + ':' + seconds;
                  // if 10 seconds has passed decrement score by 2 pts
                  if ( time % 10 === 0 ) updateScore(-2);
               }, 1000);
               // add dataset to body
               d.body.dataset.gameplay = 'active';
               // unbind click to play button
               if ( gameplay === 'paused')
               $playPause.removeEventListener('click', playTimer);
               // bind click to pause button
               $playPause.addEventListener('click', pauseTimer = function(){
                  timer('pause');
               });
            break;
            // pause timer
            case 'pause' :
               console.log('Pausing Timer...');
               clearInterval(clock);
               d.body.dataset.gameplay = 'paused';
               // unbind click to pause button
               if ( gameplay === 'active')
               $playPause.removeEventListener('click', pauseTimer);
               // bind click tp play button
               $playPause.addEventListener('click', playTimer = function(){
                  timer('start');
               });
            break;
            // stop timer
            case 'stop' :
               console.log('Stoping Timer...');
               clearInterval(clock);
               d.body.dataset.gameplay = 'over';
            break;
            // default
            default : break;
         }
         console.log(time);
         return;
      }

   // move counter
      function countMove(moves) {
         console.log('Move Counter', moves);
         // set move attribute
         $moveCount.dataset.moves = moves + 1;
         // output to display
         $moveCountSpan.textContent = moves + 1;
         return;
      }

   // scoring function
      /*
         Standard scoring is determined as follows:
         - Waste to Tableau  5
         - Waste to Foundation  10
         - Tableau to Foundation   10
         - Turn over Tableau card  5
         - Foundation to Tableau   −15
         - Recycle waste when playing by ones  −100
         (minimum score is 0)

         Moving cards directly from the Waste stack to a Foundation awards 10 points. However, if the card is first moved to a Tableau, and then to a Foundation, then an extra 5 points are received for a total of 15. Thus in order to receive a maximum score, no cards should be moved directly from the Waste to Foundation.

         For every 10 seconds of play, 2 points are taken away. Bonus points are calculated with the formula of 700,000 / (seconds to finish) if the game takes more than 30 seconds. If the game takes less than 30 seconds, no bonus points are awarded.
      */
      function updateScore(points) {
         console.log('Updating Score', points);
         // get score
         score = parseInt($score.dataset.score) + points;
         // set minimum score to 0
         score = score < 0 ? 0 : score;
         // parse as integer
         score = parseInt(score);
         // set score attribute
         $score.dataset.score = score;
         // output to display
         $score.children[1].textContent = score;
         return score;
      }

   // calculate bonus points
      function getBonus() {
         if (time >= 30) bonus = parseInt(700000 / time);
         console.log(bonus);
         return bonus;
      }
	  
	  // KV sync functions
      function kvRequest(endpoint, method, body) {
         var url = kvWorkerUrl.replace(/\/$/, '') + endpoint;
         var opts = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
         };
         if (body) opts.body = JSON.stringify(body);
         return fetch(url, opts).then(function(r) { return r.json(); });
      }

      function kvCheckStatus() {
         if (!kvWorkerUrl) return;
         kvRequest('/user/' + kvUsername, 'GET')
            .then(function(data) {
               setKvIndicator(data.success ? 'green' : 'red');
            })
            .catch(function() { setKvIndicator('red'); });
      }

      function setKvIndicator(status) {
         var wrap = d.getElementById('kv-status');
         var dot = d.getElementById('kv-indicator');
         if (!kvWorkerUrl) {
            wrap.style.display = 'none';
            return;
         }
         wrap.style.display = 'flex';
         dot.className = 'kv-indicator ' + status;
      }

      function kvSync(newScore) {
         if (!kvWorkerUrl || !kvToken) return Promise.resolve(null);
         var scoresToSend = (newScore !== null && newScore !== undefined) ? [newScore] : [];
         return kvRequest('/sync', 'POST', { token: kvToken, scores: scoresToSend })
            .then(function(data) {
               if (data.success) {
                  setKvIndicator('green');
                  // merge returned scores with local
                  var merged = data.scores;
                  merged.sort(function(a, b) { return b - a; });
                  merged = merged.slice(0, 100);
                  localStorage.setItem('solitaire-scores', JSON.stringify(merged));
                  return merged;
               } else {
                  setKvIndicator('red');
                  return null;
               }
            })
            .catch(function() { setKvIndicator('red'); return null; });
      }
	  
	  function kvSyncPrefs(prefs, timestamp) {
         if (!kvWorkerUrl || !kvToken) return Promise.resolve(null);
         return kvRequest('/prefs', 'POST', {
            token: kvToken,
            prefs: prefs,
            timestamp: timestamp
         }).then(function(data) {
            if (data.success && data.source === 'server' && data.prefs) {
               // KV has newer prefs — apply them locally
               applyPrefs(data.prefs, data.timestamp);
            }
            return data;
         }).catch(function() { return null; });
      }

      function applyPrefs(prefs, timestamp) {
         if (prefs.table) {
            localStorage.setItem('solitaire_table', prefs.table);
            localStorage.setItem('solitaire_table_time', timestamp);
            applyTable(prefs.table);
            var feltMap = {
               'green_felt.jpg': 'green', 'vines_felt.jpg': 'green',
               'blue_felt.jpg': 'blue', 'ocean_felt.jpg': 'blue',
               'red_felt.jpg': 'red', 'deco_felt.jpg': 'red',
               'brown_felt.jpg': 'brown', 'desert_felt.jpg': 'brown',
               'grey_felt.jpg': 'grey', 'gothic_felt.jpg': 'grey',
               'purple_felt.jpg': 'purple', 'moonlight_felt.jpg': 'purple'
            };
            document.body.dataset.felt = feltMap[prefs.table] || 'green';
            d.getElementById('bg-select').value = prefs.table;
         }
         if (prefs.card) {
            localStorage.setItem('solitaire_card', prefs.card);
            localStorage.setItem('solitaire_card_time', timestamp);
            applyCardBack(prefs.card);
            d.getElementById('card-back-select').value = prefs.card;
         }
      }

      function kvFetchFriendScores() {
         if (!kvWorkerUrl || kvFriends.length === 0) return Promise.resolve([]);
         var promises = kvFriends.map(function(username) {
            return kvRequest('/user/' + username, 'GET')
               .then(function(data) {
                  if (data.success) {
                     return data.scores.map(function(s) {
                        return { score: s, username: username };
                     });
                  }
                  return [];
               })
               .catch(function() { return []; });
         });
         return Promise.all(promises).then(function(results) {
            var all = [];
            results.forEach(function(r) { all = all.concat(r); });
            return all;
         });
      }
	  
	  // save score to storage
	   function saveScore(score) {
		  var scores = [];
	      try {
		     var stored = localStorage.getItem('solitaire-scores');
		     if (stored) scores = JSON.parse(stored);
	      } catch(e) { scores = []; }
	      if (lastSavedScore !== null) {
		     var idx = scores.indexOf(lastSavedScore);
		     if (idx !== -1) scores.splice(idx, 1);
	      }
	      scores.push(score);
	      scores.sort(function(a, b) { return b - a; });
	      if (scores.length > 100) scores = scores.slice(0, 100);
	      try {
		     localStorage.setItem('solitaire-scores', JSON.stringify(scores));
	      } catch(e) {}
	      lastSavedScore = score;
	      return scores;
	   }

	// show win modal
	   function showWinModal(currentScore) {
		  kvFetchFriendScores().then(function(friendScores) {
			 renderWinModal(currentScore, friendScores);
		  });
	   }

	// render win modal list
	   function renderWinModal(currentScore, friendScores) {
		  var localScores = [];
		  try {
			 var stored = localStorage.getItem('solitaire-scores');
			 if (stored) localScores = JSON.parse(stored);
		  } catch(e) {}

		  // build combined list
		  var combined = localScores.map(function(s) {
			 return { score: s, username: null };
		  });
		  if (friendScores && friendScores.length) {
			 combined = combined.concat(friendScores);
		  }
		  combined.sort(function(a, b) { return b.score - a.score; });

		  // find current score position
		  var rank = -1;
		  for (var i = 0; i < combined.length; i++) {
			 if (combined[i].score === currentScore && combined[i].username === null) {
				rank = i;
				break;
			 }
		  }

		  var total = combined.length;
		  var start = Math.max(0, rank - 5);
		  var end = Math.min(total, start + 11);
		  if (end - start < 11) start = Math.max(0, end - 11);
		  var visible = combined.slice(start, end);

		  var list = d.getElementById('win-score-list');
		  list.innerHTML = '';
		  for (var i = 0; i < visible.length; i++) {
			 var item = visible[i];
			 var li = d.createElement('li');
			 var globalRank = start + i + 1;
			 var isCurrent = (start + i === rank);
			 if (isCurrent) li.className = 'win-score-current';
			 li.innerHTML =
				'<span class="win-score-rank">#' + globalRank + '</span>' +
				'<span class="win-score-value">' + item.score + '</span>' +
				(isCurrent ? '<span class="win-score-you">this game</span>' : '') +
				(item.username ? '<span class="win-score-friend">' + item.username + '</span>' : '');
			 list.appendChild(li);
		  }
		  d.getElementById('win-modal').classList.remove('win-modal-hidden');

		  // scroll current score into vertical center
		  var list = d.getElementById('win-score-list');
		  var current = list.querySelector('.win-score-current');
		  if (current) {
			 var listHeight = list.clientHeight;
			 var itemHeight = current.offsetHeight;
			 var itemTop = current.offsetTop;
			 var scrollTo = itemTop - (listHeight / 2) + (itemHeight / 2);
			 list.scrollTop = scrollTo;
		  }
	   }

   // check for win
      function checkForWin(table) {
         // if all foundation piles are full
         if (  table['spades'].length +
               table['hearts'].length +
               table['diamonds'].length +
               table['clubs'].length
               === 52 ) {
            console.log('Game Has Been Won');
            // stop timer
            timer('stop');
            // bonus points for time
            updateScore(getBonus());
            // save score locally always
            saveScore(score);
            // throw confetti
            throwConfetti();
            // sync with KV then show modal
            var finalScore = score;
            kvSync(finalScore).then(function() {
               if (document.getElementById('show-scores-toggle').checked) {
                  showWinModal(finalScore);
               }
            });
            // return true
            return true;
         }
         else return false;
      }

   // check for auto win
      function checkForAutoWin(table) {
         // if all tableau cards are played and stock is empty
         if (  parseInt($tab.dataset.unplayed) +
               table['stock'].length +
               table['waste'].length === 0) {
            // show auto win button
            $autoWin.style.display = 'block';
            // bind click to auto win button
            $autoWin.addEventListener('click', autoWin);
         }
         return;
      }

   // auto win
      function autoWin() {
         console.log('Huzzah!');
         // hide auto win button
         $autoWin.style.display = 'none';
         // unbind click to auto win button
         $autoWin.removeEventListener('click', autoWin);
         // unbind click events
         unbindClick(
            '#stock .card:first-child,' +
            '#waste .card:first-child,' +
            '#fnd .card:first-child,' +
            '#fnd #spades.pile[data-empty="true"],' +
            '#fnd #hearts.pile[data-empty="true"],' +
            '#fnd #diamonds.pile[data-empty="true"],' +
            '#fnd #clubs.pile[data-empty="true"],' +
            '#tab .card[data-played="true"],' +
            '#tab .pile[data-empty="true"]'
         );
         // unbind double click events
         unbindClick(
            '#waste .card:first-child' +
            '#tab .card:last-child',
            'double'
         );
         // reset table
         reset(table);
         render(table);
         // animate cards to foundation piles
         autoWinAnimation(table);
         // stop timer
         timer('stop');
         // bonus points for time
         updateScore(getBonus());
      }

   // auto win animation
      function autoWinAnimation(table) {
         // set number of iterations
         var i = parseInt($tab.dataset.played);
         // create animation loop
         function animation_loop() {
            // get lowest ranking card
               var bottomCards = []; // create array for the bottom cards
               var els = d.querySelectorAll('#tab .card:last-child');
               for (var e in els) { // loop through elements
                  e = els[e];
                  if (e.nodeType)
                     bottomCards.push( parseRankAsInt(e.dataset.rank) );
               }
               // get the lowest rank from array of bottom cards
               var lowestRank = Math.min.apply(Math, bottomCards);
               // parse integer as rank
               var rank = parseIntAsRank(lowestRank);
               // get element with rank
               var e = d.querySelector('#tab .card[data-rank="'+rank+'"]');

            // setup move
               // get suit of card
               var suit = e.dataset.suit;
               // create card array with rank and suit
               var card = [rank, suit];
               // get destination pile
               var dest = findFoundationDest(card);

            // make move
               if ( validateMove(card, dest) ) {
                  // set source pile
                  var pile = e.parentElement.parentElement;
                  $table.dataset.source = pile.dataset.pile;
                  // set dest pile
                  $table.dataset.dest = dest;
                  // make move
                  makeMove();
                  reset(table);
                  render(table, playedCards);
               } else {
                  console.log('Move is Invalid. Try again...');
                  reset(table);
                  render(table, playedCards);
               }
            // let's do it again in 100ms
            setTimeout(function() {
               i--;
               if (i !== 0) animation_loop();
               // at the end lets celebrate!
               else {
                  saveScore(score);
                  throwConfetti();
                  var finalScore = score;
                  kvSync(finalScore).then(function() {
                     if (document.getElementById('show-scores-toggle').checked) {
                        showWinModal(finalScore);
                     }
                  });
               }
            }, 100);
         };
         // run animation loop
         animation_loop();
      }

   // throw confetti
      var confettiAnimFrame = null;

      function throwConfetti() {
         console.log('Confetti!');

         var canvas = d.getElementById('confetti');
         var ctx = canvas.getContext('2d');

         // cancel any existing animation
         if (confettiAnimFrame) {
            cancelAnimationFrame(confettiAnimFrame);
            confettiAnimFrame = null;
         }

         // size canvas to cover full viewport
         canvas.width  = window.innerWidth;
         canvas.height = window.innerHeight;
         canvas.style.opacity = '1';

         var COLORS = [
            '#f44336','#e91e63','#9c27b0','#673ab7',
            '#3f51b5','#2196f3','#00bcd4','#009688',
            '#4caf50','#cddc39','#ffeb3b','#ffc107',
            '#ff9800','#ff5722','#ffffff','#00e5ff'
         ];

         var NUM   = 200;
         var DURATION = 5000;
         var startTime = null;
         var pieces = [];

         for (var i = 0; i < NUM; i++) {
            pieces.push({
               x:     Math.random() * canvas.width,
               y:     Math.random() * canvas.height - canvas.height,
               w:     Math.random() * 14 + 6,
               h:     Math.random() * 7  + 4,
               color: COLORS[Math.floor(Math.random() * COLORS.length)],
               vx:    Math.random() * 4 - 2,
               vy:    Math.random() * 4 + 1.5,
               angle: Math.random() * Math.PI * 2,
               spin:  (Math.random() - 0.5) * 0.25,
               wobble: Math.random() * Math.PI * 2,
               wobbleSpeed: Math.random() * 0.05 + 0.02
            });
         }

         function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed  = timestamp - startTime;
            var progress = Math.min(elapsed / DURATION, 1);

            // fade out in final 25%
            var fadeStart = 0.75;
            var alpha = progress > fadeStart
               ? 1 - (progress - fadeStart) / (1 - fadeStart)
               : 1;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (var i = 0; i < pieces.length; i++) {
               var p = pieces[i];

               p.wobble += p.wobbleSpeed;
               p.x  += p.vx + Math.sin(p.wobble) * 0.8;
               p.y  += p.vy;
               p.vy += 0.04; // gravity
               p.angle += p.spin;

               // wrap horizontally
               if (p.x < -p.w)              p.x = canvas.width  + p.w;
               if (p.x > canvas.width  + p.w) p.x = -p.w;

               // recycle from top when off bottom
               if (p.y > canvas.height + p.h) {
                  p.y  = -p.h;
                  p.x  = Math.random() * canvas.width;
                  p.vy = Math.random() * 4 + 1.5;
               }

               ctx.save();
               ctx.globalAlpha = alpha;
               ctx.translate(p.x, p.y);
               ctx.rotate(p.angle);
               ctx.fillStyle = p.color;
               ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
               ctx.restore();
            }

            if (progress < 1) {
               confettiAnimFrame = requestAnimationFrame(animate);
            } else {
               canvas.style.opacity = '0';
               ctx.clearRect(0, 0, canvas.width, canvas.height);
               confettiAnimFrame = null;
            }
         }

         confettiAnimFrame = requestAnimationFrame(animate);
      }

// ### NEW GAME ###
   function newGame() {

      // stop timer and clear any pending timeouts
      clearInterval(clock);
      clearTimeout(clickTimer);

      // remove play/pause button listeners if bound
      if (typeof pauseTimer === 'function') $playPause.removeEventListener('click', pauseTimer);
      if (typeof playTimer === 'function') $playPause.removeEventListener('click', playTimer);

      // reset timer state and display
      clock = 0;
      time = 0;
      delete $timer.dataset.action;
      delete d.body.dataset.gameplay;
      $timerSpan.textContent = '00:00';

      // reset click state
      clicks = 0;
      clickTimer = null;
      lastEventTime = 0;

      // reset move count and display
      moves = 0;
      $moveCount.dataset.moves = 0;
      $moveCountSpan.textContent = '0';

      // reset score and display
      score = 0;
      bonus = 0;
	  lastSavedScore = null;
      $score.dataset.score = 0;
      $scoreSpan.textContent = '0';

      // hide auto-win button
      $autoWin.style.display = 'none';
      $autoWin.removeEventListener('click', autoWin);

      // clear confetti canvas
      if (confettiAnimFrame) {
         cancelAnimationFrame(confettiAnimFrame);
         confettiAnimFrame = null;
      }
      var confettiCanvas = d.getElementById('confetti');
      confettiCanvas.style.opacity = 0;
      var confettiCtx = confettiCanvas.getContext('2d');
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      // clean up any active drag or touch
      if (dragClone) {
         try { d.body.removeChild(dragClone); } catch(e) {}
         dragClone = null;
      }
      isDragging = false;
      d.removeEventListener('touchmove', onTouchMove);
      d.removeEventListener('touchend', onTouchEnd);
      d.removeEventListener('touchcancel', onTouchCancel);
      touchDragCard = null;

      // sweep any stray clone cards left in body
      var bodyChildren = Array.prototype.slice.call(d.body.children);
      for (var i = 0; i < bodyChildren.length; i++) {
         if (bodyChildren[i].classList.contains('card')) {
            try { d.body.removeChild(bodyChildren[i]); } catch(e) {}
         }
      }

      // rebuild all table data structures
      deck = [];
      s = [];
      w = [];
      spades = [];
      hearts = [];
      diamonds = [];
      clubs = [];
      t = [];
      t[1] = t[2] = t[3] = t[4] = t[5] = t[6] = t[7] = [];
      table = [];
      table['stock'] = s;
      table['waste'] = w;
      table['spades'] = spades;
      table['hearts'] = hearts;
      table['diamonds'] = diamonds;
      table['clubs'] = clubs;
      table['tab'] = t;
      unplayedTabCards = [];

      // reset table DOM dataset
      reset(table);

      // clear DOM before render so checkForPlayedCards finds no stale cards
      var piles = d.querySelectorAll('#stock ul, #waste ul, #fnd ul, #tab ul');
      for (var i = 0; i < piles.length; i++) { piles[i].innerHTML = ''; }

      // deal and start a new game
      deck = create(deck, suits);
      deck = shuffle(deck);
      table = deal(deck, table);
      render(table, playedCards);
      play(table);
   }

	// prevent pinch-to-zoom (multi-touch)
	document.addEventListener('touchmove', function(e) {
	   if (e.touches.length > 1) e.preventDefault();
	}, { passive: false });

	// prevent double-tap zoom
	var lastTap = 0;
	document.addEventListener('touchend', function(e) {
	   var now = Date.now();
	   if (now - lastTap < 300) e.preventDefault();
	   lastTap = now;
	}, { passive: false });

	// bottom bar scroll arrows
	var bottomBar = d.getElementById('bottom-bar');
	var arrowLeft = d.getElementById('bar-arrow-left');
	var arrowRight = d.getElementById('bar-arrow-right');

	function updateBarArrows() {
		var scrollLeft = bottomBar.scrollLeft;
		var maxScroll = bottomBar.scrollWidth - bottomBar.clientWidth;
		arrowLeft.classList.toggle('visible', scrollLeft > 2);
		arrowRight.classList.toggle('visible', scrollLeft < maxScroll - 2);
	}

	bottomBar.addEventListener('scroll', updateBarArrows);
	window.addEventListener('resize', updateBarArrows);
	updateBarArrows();

	// show scores toggle
	var scoresToggle = d.getElementById('show-scores-toggle');
	var savedToggle = localStorage.getItem('solitaire_show_scores');
	if (savedToggle !== null) scoresToggle.checked = savedToggle === 'true';
	updateScoresButtonVisibility();
	scoresToggle.addEventListener('change', function() {
		localStorage.setItem('solitaire_show_scores', this.checked);
		updateScoresButtonVisibility();
	});

	function updateScoresButtonVisibility() {
		var wrap = d.getElementById('scores-btn-wrap');
		wrap.style.display = scoresToggle.checked ? 'inline-flex' : 'none';
	}

	// scores button
	d.getElementById('scores-btn').addEventListener('click', function() {
		var localScores = [];
		try {
			var stored = localStorage.getItem('solitaire-scores');
			if (stored) localScores = JSON.parse(stored);
		} catch(e) {}
		var topScore = localScores.length ? localScores[0] : 0;
		showWinModal(topScore);
	});

	// win modal close/new game
	d.getElementById('win-modal-close').addEventListener('click', function() {
		d.getElementById('win-modal').classList.add('win-modal-hidden');
	});
	d.querySelector('#new-game').addEventListener('click', newGame);
	d.getElementById('win-modal-new-game').addEventListener('click', function() {
		d.getElementById('win-modal').classList.add('win-modal-hidden');
		newGame();
	});

	// win modal refresh
	d.getElementById('win-modal-refresh').addEventListener('click', function() {
		var btn = this;
		btn.classList.add('spinning');
		setTimeout(function() { btn.classList.remove('spinning'); }, 650);
		var localScores = [];
		try {
			var stored = localStorage.getItem('solitaire-scores');
			if (stored) localScores = JSON.parse(stored);
		} catch(e) {}
		var topScore = localScores.length ? localScores[0] : 0;
		kvSync(topScore).then(function() {
			kvFetchFriendScores().then(function(friendScores) {
				renderWinModal(topScore, friendScores);
			});
		});
	});

	// settings modal open/close
	d.getElementById('settings-btn').addEventListener('click', function() {
		openSettingsModal();
	});
	d.getElementById('settings-modal-close').addEventListener('click', function() {
		d.getElementById('settings-modal').classList.add('settings-modal-hidden');
	});

	// settings modal logic
	function openSettingsModal() {
		var workerInput = d.getElementById('settings-worker-url');
		var usernameInput = d.getElementById('settings-username');
		var tokenInput = d.getElementById('settings-token');
		var connectBtn = d.getElementById('settings-connect-btn');
		var tokenField = d.getElementById('settings-token-field');
		var usernameField = d.getElementById('settings-username-field');

		workerInput.value = kvWorkerUrl;

		if (kvToken && kvUsername) {
			// existing user
			usernameInput.value = kvUsername;
			usernameInput.disabled = true;
			tokenInput.value = kvToken;
			tokenField.style.display = 'block';
			connectBtn.textContent = 'Save';
			connectBtn.disabled = false;
			d.getElementById('settings-username-status').textContent = '';
			d.getElementById('settings-username-status').className = '';
		} else if (kvToken && !kvUsername) {
			// has token but no username — connect flow
			usernameInput.value = '';
			usernameInput.disabled = true;
			tokenInput.value = kvToken;
			tokenField.style.display = 'block';
			connectBtn.textContent = 'Connect';
			connectBtn.disabled = false;
		} else {
			// new user — show token field for existing account import
			usernameInput.value = '';
			usernameInput.disabled = false;
			tokenInput.value = '';
			tokenInput.placeholder = 'Paste token here to connect existing account';
			tokenField.style.display = 'block';
			d.getElementById('settings-token-change').style.display = 'none';
			connectBtn.textContent = 'Register';
			connectBtn.disabled = true;
			d.getElementById('settings-username-status').textContent = '';
			d.getElementById('settings-username-status').className = '';
		}

		renderFriendsList();
		d.getElementById('settings-modal').classList.remove('settings-modal-hidden');
	}

	// enable connect button when token is pasted on fresh device
	d.getElementById('settings-token').addEventListener('input', function() {
		var val = this.value.trim();
		var connectBtn = d.getElementById('settings-connect-btn');
		if (!kvToken && !kvUsername) {
			// fresh device — token input drives the button
			if (val.length > 0) {
				connectBtn.textContent = 'Connect';
				connectBtn.disabled = false;
			} else {
				connectBtn.textContent = 'Register';
				connectBtn.disabled = true;
			}
		}
	});

	// username availability check with debounce
	var usernameCheckTimer = null;
	d.getElementById('settings-username').addEventListener('input', function() {
		var val = this.value.toLowerCase().trim();
		var status = d.getElementById('settings-username-status');
		var connectBtn = d.getElementById('settings-connect-btn');
		connectBtn.disabled = true;
		status.textContent = '';
		status.className = '';
		clearTimeout(usernameCheckTimer);
		if (val.length < 3) return;
		if (!/^[a-z0-9_-]+$/.test(val)) {
			status.textContent = 'Only letters, numbers, hyphens and underscores allowed';
			status.className = 'taken';
			return;
		}
		status.textContent = 'Checking...';
		status.className = 'checking';
		usernameCheckTimer = setTimeout(function() {
			var workerUrl = d.getElementById('settings-worker-url').value.trim();
			if (!workerUrl) {
				status.textContent = 'Enter a worker URL first';
				status.className = 'taken';
				return;
			}
			fetch(workerUrl.replace(/\/$/, '') + '/search/' + val)
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data.available) {
						status.textContent = '✓ Username is available';
						status.className = 'available';
						connectBtn.disabled = false;
					} else {
						status.textContent = '✗ Username is taken';
						status.className = 'taken';
						connectBtn.disabled = true;
					}
				})
				.catch(function() {
					status.textContent = 'Could not reach worker';
					status.className = 'taken';
				});
		}, 500);
	});

	// connect/register button
	d.getElementById('settings-connect-btn').addEventListener('click', function() {
		var workerUrl = d.getElementById('settings-worker-url').value.trim();
		var usernameInput = d.getElementById('settings-username');
		var tokenInput = d.getElementById('settings-token');
		var connectBtn = this;

		kvWorkerUrl = workerUrl;
		localStorage.setItem('solitaire_kv_url', kvWorkerUrl);

		if (kvToken && kvUsername) {
			// just saving worker url
			setKvIndicator('green');
			kvCheckStatus();
			d.getElementById('settings-modal').classList.add('settings-modal-hidden');
			return;
		}

		var pastedToken = tokenInput.value.trim();
		if (pastedToken) {
			// connect flow — validate token
			connectBtn.disabled = true;
			connectBtn.textContent = 'Connecting...';
			fetch(workerUrl.replace(/\/$/, '') + '/connect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: pastedToken })
			}).then(function(r) { return r.json(); })
			.then(function(data) {
				if (data.success) {
					kvToken = pastedToken;
					kvUsername = data.username;
					localStorage.setItem('solitaire_kv_token', kvToken);
					localStorage.setItem('solitaire_kv_username', kvUsername);
					// merge scores
					var localScores = [];
					try {
						var stored = localStorage.getItem('solitaire-scores');
						if (stored) localScores = JSON.parse(stored);
					} catch(e) {}
					var merged = localScores.concat(data.scores);
					merged.sort(function(a, b) { return b - a; });
					merged = merged.slice(0, 100);
					localStorage.setItem('solitaire-scores', JSON.stringify(merged));
					setKvIndicator('green');
					d.getElementById('settings-modal').classList.add('settings-modal-hidden');
				} else {
					connectBtn.disabled = false;
					connectBtn.textContent = 'Connect';
					d.getElementById('settings-username-status').textContent = 'Invalid token';
					d.getElementById('settings-username-status').className = 'taken';
				}
			}).catch(function() {
				connectBtn.disabled = false;
				connectBtn.textContent = 'Connect';
				d.getElementById('settings-username-status').textContent = 'Could not reach worker';
				d.getElementById('settings-username-status').className = 'taken';
			});
			return;
		}

		// register flow
		var username = usernameInput.value.toLowerCase().trim();
		connectBtn.disabled = true;
		connectBtn.textContent = 'Registering...';
		var localScores = [];
		try {
			var stored = localStorage.getItem('solitaire-scores');
			if (stored) localScores = JSON.parse(stored);
		} catch(e) {}
		fetch(workerUrl.replace(/\/$/, '') + '/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: username, scores: localScores })
		}).then(function(r) { return r.json(); })
		.then(function(data) {
			if (data.success) {
				kvToken = data.token;
				kvUsername = data.username;
				localStorage.setItem('solitaire_kv_token', kvToken);
				localStorage.setItem('solitaire_kv_username', kvUsername);
				setKvIndicator('green');
				d.getElementById('settings-modal').classList.add('settings-modal-hidden');
			} else {
				connectBtn.disabled = false;
				connectBtn.textContent = 'Register';
				d.getElementById('settings-username-status').textContent = data.error || 'Registration failed';
				d.getElementById('settings-username-status').className = 'taken';
			}
		}).catch(function() {
			connectBtn.disabled = false;
			connectBtn.textContent = 'Register';
			d.getElementById('settings-username-status').textContent = 'Could not reach worker';
			d.getElementById('settings-username-status').className = 'taken';
		});
	});

	// change token button
	d.getElementById('settings-token-change').addEventListener('click', function() {
		if (!confirm('This will disconnect your current account. Are you sure?')) return;
		kvToken = '';
		kvUsername = '';
		localStorage.removeItem('solitaire_kv_token');
		localStorage.removeItem('solitaire_kv_username');
		setKvIndicator('');
		openSettingsModal();
	});

	// copy token button
	d.getElementById('settings-token-copy').addEventListener('click', function() {
		var tokenInput = d.getElementById('settings-token');
		navigator.clipboard.writeText(tokenInput.value).then(function() {
			var btn = d.getElementById('settings-token-copy');
			btn.textContent = 'Copied!';
			setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
		});
	});

	// friend search
	d.getElementById('settings-friend-search-btn').addEventListener('click', function() {
		var val = d.getElementById('settings-friend-search').value.toLowerCase().trim();
		var result = d.getElementById('settings-search-result');
		if (!val) return;
		if (val === kvUsername) {
			result.textContent = "That's you!";
			result.className = 'not-found';
			return;
		}
		if (kvFriends.indexOf(val) >= 0) {
			result.textContent = 'Already following ' + val;
			result.className = 'not-found';
			return;
		}
		result.textContent = 'Searching...';
		result.className = '';
		fetch(kvWorkerUrl.replace(/\/$/, '') + '/user/' + val)
			.then(function(r) { return r.json(); })
			.then(function(data) {
				if (data.success) {
					result.textContent = '✓ Found ' + val + ' — ';
					result.className = 'found';
					var addBtn = d.createElement('button');
					addBtn.textContent = 'Add';
					addBtn.style.cssText = 'background:transparent;border:1px solid #4caf50;border-radius:4px;color:#4caf50;font-size:11px;padding:0.2em 0.5em;cursor:pointer;margin-left:4px;';
					addBtn.addEventListener('click', function() {
						kvFriends.push(val);
						localStorage.setItem('solitaire_kv_friends', JSON.stringify(kvFriends));
						d.getElementById('settings-friend-search').value = '';
						result.textContent = '';
						result.className = '';
						renderFriendsList();
					});
					result.appendChild(addBtn);
				} else {
					result.textContent = '✗ User not found';
					result.className = 'not-found';
				}
			}).catch(function() {
				result.textContent = 'Could not reach worker';
				result.className = 'not-found';
			});
	});

	// render friends list in settings
	function renderFriendsList() {
		var list = d.getElementById('settings-friends-list');
		list.innerHTML = '';
		if (kvFriends.length === 0) {
			var li = d.createElement('li');
			li.style.color = 'rgba(255,255,255,0.3)';
			li.textContent = 'No friends added yet';
			list.appendChild(li);
			return;
		}
		kvFriends.forEach(function(username) {
			var li = d.createElement('li');
			var removeBtn = d.createElement('button');
			removeBtn.textContent = 'Remove';
			removeBtn.addEventListener('click', function() {
				kvFriends = kvFriends.filter(function(u) { return u !== username; });
				localStorage.setItem('solitaire_kv_friends', JSON.stringify(kvFriends));
				renderFriendsList();
			});
			li.textContent = username;
			li.appendChild(removeBtn);
			list.appendChild(li);
		});
	}

	// on page load — check KV status, sync scores and prefs if configured
	if (kvWorkerUrl && kvToken) {
		setKvIndicator('green');
		kvCheckStatus();
		// sync prefs — only send local prefs if we actually have stored timestamps
		var tableTime = parseInt(localStorage.getItem('solitaire_table_time') || '0');
		var cardTime = parseInt(localStorage.getItem('solitaire_card_time') || '0');
		var pageLoadTime = Math.max(tableTime, cardTime);
		var hasLocalPrefs = localStorage.getItem('solitaire_table_time') !== null ||
		                    localStorage.getItem('solitaire_card_time') !== null;
		var pageLoadPrefs = {
			table: localStorage.getItem('solitaire_table') || 'green_felt.jpg',
			card: localStorage.getItem('solitaire_card') || 'card_back_bg.png'
		};
		// if no local prefs ever set, send timestamp of 0 with no prefs so KV always wins
		if (!hasLocalPrefs) pageLoadTime = -1;
		kvSyncPrefs(pageLoadPrefs, pageLoadTime);
	}
