// Setup basic express server
const express = require('express');

const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3000;

const votesArray = [0, 0, 0, 0];


server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));


// Variables stored on server

let numUsers = 0;
let voteTimer = 30;
let changeEventTimer = -1;
let eventResolutionTimer = -1;
const numOfEvents = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const usedNums = [];
const usedEvents = [];
let gameStarted = false;

let currentEvent;
const allEvents = [];

const fool = {
  health: 10,
  strength: 5,
  charisma: 4,
  intelligence: 3,
  luck: 6,
  gold: 10,
};


const allMagicianEvents = [];
/*
const magician_Main = {
  title: 'The Magician',
  name: 'magician',
  type: 'voting',
  flavorTextDescription: 'The adventurer enters a dimly lit and cramped room. The walls are lined with shelves of books, many of which display runes from a long lost ancient language. In the center of the room stands a large black cauldron, which has vapor rising from the top and makes a quiet simmering noise. On the side of the pot opposite to the adventurer is a witch dressed in mage’s robes, adding ingredients to the elixir and occasionally stirring it. Though her wrinkles and grey hair betray her age, she stands tall with dignity and you can see the vast amount of knowledge she’s gained over countless years (and perhaps centuries) in her eyes.',
  abridgedDescription: 'The adventurer encounter a witch crafting a potion in a room populated with books.',
  options: ['Use your Sword', 'Use your Wand', 'Use your Cup', 'Use your Coin'],
  optionsFlavor: ['This witch is clearly powerful and possibly even a threat, better attack her before she attacks us with whatever she’s making.', 'We may be able to learn something useful from the books around the room, they may be worth taking a look at.', 'The witch may know something about this place we’re in, we should ask her some questions.', 'That draught looks very enticing...should we take a sip?'],
  completedOptions: [0, 0, 0, 0],
  connections: [1, 2, 3, 4],
  resolution: {
    text: '',
    type: 'none',
    effect: '',
  },
};

allMagicianEvents.push(magician_Main);

const magician_sword = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'The adventurer rushes up to the witch and in his haste knocks the cauldron of liquid and spills it on her! Enraged, she draws her staff and combat spellbook and prepares to fight.',
  abridgedDescription: '',
  options: [],
  completedOptions: [],
  connections: [0],
  resolution: {
    text: ['As the witch crumples in defeat, she drops her staff to the ground. No point in wasting a perfectly good weapon - the adventurer picks it up and claims it for himself, while the witch lies in pain.', 'The witch, though old, moves quicker than the adventurer. As the adventurer swings his sword at the witch, she counters with her staff and deals blow to his gut, knockiing the wind out of him. The witch refrains from dealing further damage, as she knows he is no match for her.'],
    dice: 4,
    threshold: [15, 0],
    statNeeded: fool.strength,
    effectStats: ['strength', '', 'health'],
    effectPower: [2, 0, -5],
    type: 'stat',
  },

};

allMagicianEvents.push(magician_sword);
const magician_wand = {
  title: 'The Magician',
  name: 'magician',
  type: 'voting',
  flavorTextDescription: 'The witch calls out to the adventurer, “Weary traveller I do not mind if you look through my library but be warned that some of those tomes contain dangerous knowledge. Proceed at your own risk.” The adventurer returns his attention to the shelf and spots three books. The covers of the first book are made of pure metal and looks dangerously difficult to open. The second book floats once pulled from the shelf and whispers promises of divine secrets. The last book is rather plain and well worn, likely meaning that it has been read a good deal. Better only read one, there’s not much time to waste.',
  abridgedDescription: '',
  options: ['Use your Sword', 'Use your Wand', 'Use your Cup', 'Leave'],
  optionsFlavor: ['Open the iron book.', 'Open the floating book.', 'Open the worn book.', 'These books could be dangerous like the witch said, better leave them where we found them.'],
  completedOptions: [0, 0, 0, 0],
  connections: [5, 6, 7, 8],
  resolution: {
    text: [],
    type: 'none',
    effect: '',
  },
};

allMagicianEvents.push(magician_wand);

const magician_cup = {
  title: 'The Magician',
  name: 'magician',
  type: 'voting',
  flavorTextDescription: 'The witch begins, “There are few places in the world that seep evil energy as this place does - I only stay here for the immense amount of mana and magical resources it provides.” She pauses. “I sense that you are here to end this wretched place. I know little but I’m willing to impart on you what I can, though just knowing this information could prove dangerous. Are you sure you wish to know regardless?”',
  abridgedDescription: '',
  options: ['Say Yes', 'Say No'],
  optionsFlavor: ['', ''],
  completedOptions: [0, 0, 0, 0],
  connections: [9, 10],
  resolution: {
    text: '',
    type: 'none',
    effect: '',
  },
};

allMagicianEvents.push(magician_cup);

const magician_coin = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'The witch notices the adventurer eyeing the cerulean mixture she has been so carefully crafting. “Care for a taste?” she asks as she extends a sturdy but boney hand towards him, clasping a vial of her work. The adventurer scoops his hands into the cauldron, and brings some of the cerulean mixture up to his mouth. Surprisingly, it’s no longer hot, likely because it’s no longer being disturbed.',
  abridgedDescription: '',
  options: [],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['The adventurer feels rejuvenated, possibly more alive than he has in a while.', 'The adventurer almost immediately feels sick - clearly the potion hadn’t been finished quite yet.'],
    dice: 4,
    threshold: [15, 0],
    statNeeded: fool.luck,
    effectStats: ['luck', '', 'health'],
    effectPower: [2, 0, -3],
    type: 'stat',

  },
};

allMagicianEvents.push(magician_coin);

const magician_wand_sword = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'You attempt to open the book with your Sword.',
  abridgedDescription: '',
  options: [],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['The adventurer forces the book open and feels his muscles surge with power as he reads its contents.', 'The adventurer tries his damndest to open the book but it takes all of his might to just hold it. He uses his last ounce of strength to reshelve it, and decides to move on.', 'The adventurer tugs the book from its place but can’t muster the power to keep it in his hands. It ungracefully tumbles from the rack and lands on the adventurer’s feet.'],
    dice: 4,
    threshold: [8, 4, 0],
    statNeeded: fool.strength,
    effectStats: ['strength', '', 'health'],
    effectPower: [2, 0, -3],
    type: 'stat',
  },
};
allMagicianEvents.push(magician_wand_sword);
const magician_wand_wand = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'You attempt to open the book with your Wand.',
  abridgedDescription: '',
  options: [],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['The magic book slams open and attempts to assault the adventurer with dark magic, but he uses his own power to bend the book to his will, letting him access its harbored secrets without resistance.', 'The adventurer clasps the levitating book in his hands, but the book refuses to open, and the whispers emanating from it have gone silent. It seems the adventurer is not quite worthy of its secrets just yet.', 'The adventurer extends a hand to the floating book and the room fills with a high pitched scream coming from the book itself, replacing the almost ambient whispers that it conjured previously. It dissolves into ash, but not before thoroughly leaving the adventurer’s head rattled and ears ringing. The witch looks over at the adventurer, gives a shrug, and continues to stir her pot.'],
    dice: 4,
    threshold: [8, 4, 0],
    statNeeded: fool.intelligence,
    effectStats: ['intelligence', '', 'health'],
    effectPower: [2, 0, -3],
    type: 'stat',
  },
};
allMagicianEvents.push(magician_wand_wand);
const magician_wand_cup = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'You attempt to open the book with your Cup.',
  abridgedDescription: '',
  options: [''],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['“It’s just my recipe book!” she replies. “I hardly use it anymore - I have all of my concoctions in my head nowadays. I’d be happy to let you use it.” She extends the book over her cauldron, which sufficiently heats it to reveal writing that was previously invisible. “Can’t just let anyone have these secrets, can I?”. She points to the simplest formula, a healing elixir, and provides the adventurer the ingredients and flask to make one.', 'The witch doesn’t respond, too absorbed in her work. After some initial pestering, the adventurer gives up and places the pages back with the other books.'],
    dice: 4,
    threshold: [7, 0],
    statNeeded: fool.charisma,
    effectStats: ['charisma', ''],
    effectPower: [2, 0],
    type: 'stat',
  },
};
allMagicianEvents.push(magician_wand_cup);
const magician_wand_leave = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'Nothing gained, nothing lost.',
  abridgedDescription: '',
  options: [],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['It was probably a good idea to leave those books alone.'],
    threshold: [],
    effectStats: [],
    effectPower: [],
    type: 'none',
  },
};
allMagicianEvents.push(magician_wand_leave);

const magician_cup_yes = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'You inquire the witch.',
  abridgedDescription: '',
  options: [],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['The witch lowers her voice to barely audible from where the adventurer is standing, and tells him of her experiences over the many years of the dungeon. Of the power of swords, cups, wands, and coins having influence on all of the happenings in the realm, and of constantly shifting rooms with constantly shifting happenings and unknown futures in each of them.', 'She begins to speak, but a purple mist rises from the floor and the temperature in the room drops drastically. The tainted air finds its way into her nose and fills her lungs. The witch twitches and writhes in unnatural ways until she succumbs to suffocation. As if to hint at what’s coming, the remaining haze attacks the adventurer.'],
    dice: 4,
    threshold: [15, 10],
    statNeeded: fool.charisma,
    effectStats: ['charisma', 'health'],
    effectPower: [2, -5],
    type: 'stat',
  },
};
allMagicianEvents.push(magician_cup_yes);

const magician_cup_no = {
  title: 'The Magician',
  name: 'magician',
  type: 'resolution',
  flavorTextDescription: 'You ignore the witch.',
  abridgedDescription: '',
  options: [],
  completedOptions: [0, 0, 0, 0],
  connections: [0],
  resolution: {
    text: ['“I see,” the witch says somewhat disheartened. “Perhaps then you are not the adventurer that I was expecting to liberate this place.”'],
    dice: 0,
    threshold: [],
    statNeeded: fool.health,
    effectStats: [],
    effectPower: [],
    type: 'none',
  },
};

allMagicianEvents.push(magician_cup_no);



  var newMagician = {
    title: "The Magician",
    name: "magician",
    falvorTextDescription: "The adventurer enters a dimly lit and cramped room. The walls are lined with shelves of books, many of which display runes from a long lost ancient language...",
    abridgedDescription: "The adventurer encounter a witch crafting a potion in a room populated with books.",
    mainOptions:[
      {optionName: "sword",
        optionDescription: "This witch is clearly powerful and possibly even a threat, better attack her before she attacks us with whatever she’s making.",
        result: {
          type: "combat",
          resultDescription: "The adventurer rushes up to the witch and in his haste knocks the cauldron of liquid and spills it on her! Enraged, she draws her staff and combat spellbook and prepares to fight.",
          condition: {
            stat: "luck",
            dice: "4",
            threshold: "15",
          },
          success: {
            desciprtion: "As the witch crumples in defeat, her staff clangs to the ground with a loud thump. No point in wasting a perfectly good weapon - the adventurer picks it up and claims it for himself.",
            item: "Staff of Fireball"
          },
          failure: {
            description: "You could not best the witch."
          },
        }
      },
      {optionName: "wand",
        optionDescription: "We may be able to learn something useful from the books around the room, they may be worth taking a look at.",
        result: {
          type: "inspect",
          resultDescription: "The witch calls out to the adventurer, “Weary traveller I do not mind if you look through my library but be warned that some of those tomes contain dangerous knowledge. Proceed at your own risk.” The adventurer returns his attention to the shelf and spots three books. The covers of the first book are made of pure metal and looks dangerously difficult to open. The second book floats once pulled from the shelf and whispers promises of divine secrets. The last book is rather plain and well worn, likely meaning that it has been read a good deal. Better only read one, there’s not much time to waste.",
          condition: {
            stat: "luck",
            dice: "4",
            threshold: "15",
          },
          success: {
            description: "As the witch crumples in defeat, her staff clangs to the ground with a loud thump. No point in wasting a perfectly good weapon - the adventurer picks it up and claims it for himself.",
            item: "Staff of Fireball"
          },
          failure: {
            description: "You could not best the witch."
          },
        }

      },
      {optionName: "cup",
        optionDescription: "Cup description",

      },
      {optionName: "coin",
        optionDescription: "Coin description",

      },
    ],
  }
  
const magician = {
  title: 'The Magician',
  name: 'magician',
  description: 'A crooked old woman stirs a cauldron full of a steaming blue liquid. She smiles and offers you a cap.',
  options: ['Drink', 'Fight', 'Leave'],
  effectStat: ['health', 'health', 'health'],
  effectPower: [-1, -1, -1],
};

const highPriestess = {
  title: 'The High Priestess',
  name: 'highPriestess',
  description: 'You enter a room, in which stands a large statue of a beautiful angel. She is weeping through closed palms clasped over her face, and the tears drip as a fountain into a large basin of clear liquid.',
  options: ['Drink', 'Gather a flask', 'Pray', 'Leave'],
  effectStat: ['health', 'health', 'health', 'health'],
  effectPower: [-1, -1, -1, -1],
};

const empress = {
  title: 'The Empress',
  name: 'empress',
  description: 'You enter a room that is a lush garden space, with trees and exotic plants twenty high over your head. In the center of the room is an enormous and beautiful flower that you have never seen before.',
  options: ['Try to pick a petal', 'Smell the flower', 'Hack at the flower', 'Leave'],
  effectStat: ['health', 'health', 'health', 'health'],
  effectPower: [-1, -1, -1, -1],
};

const emperor = {
  title: 'The Emperor',
  name: 'emperor',
  description: 'You enter a room, in the center of which sits a gem-encrusted sword in a pedestal.',
  options: ['Take the sword', 'Leave'],
  effectStat: ['health', 'health'],
  effectPower: [-1, -1],
};

const hierophant = {
  title: 'The Hierophant',
  name: 'hieropohant',
  description: 'You enter a room that looks much like a fortune teller’s tent. A woman sits at a table in the center of the room, peering at you over her crystal ball. She gestures at the chair across from her.',
  options: ['Ask for fortune', 'Ask about the secrets of the dungeon', 'Attack'],
  effectStat: ['health', 'health', 'health'],
  effectPower: [-1, -1, -1],
};

const lovers = {
  title: 'The Lovers',
  name: 'lovers',
  description: 'You enter a room with a huge mirror covering the wall. There is no visible exit except the door you came in from. You and the door are reflected in the mirror, but your reflection seems off somehow. It grins back at you, but you are not smiling.',
  options: ['Touch the mirror', 'Call out to the mirror', 'Smash the mirror', 'Run into the mirror'],
  effectStat: ['health', 'health', 'health', 'health'],
  effectPower: [-1, -1, -1, -1],
};

const chariot = {
  title: 'The Chariot',
  name: 'chariot',
  description: 'You hesitate to call this a room, because there is no visible ceiling or floor. Instead you see a bright blue sky above you and rolling hills of sand in front of you for what seems like miles. You hear a whinnying behind you where the door once was, and swivel around to see a pearl white mare, thrashing but tied to a wooden post. Someone left a bucket of water for it by its feet.',
  options: ['Untie and attempt to ride the horse', 'Take the bucket of water', 'Try walking to the other side of the dunes'],
  effectStat: ['health', 'health', 'health'],
  effectPower: [-1, -1, -1],
};

const hermit = {
  title: 'The Hermit',
  name: 'hermit',
  description: 'You enter a pitch black room, with two lights in front of you. The farther light looks like a flame and calls out to you, telling you that it will lead those worthy to the truth. The other light is nearby and you can clearly make out that it’s a doorway.',
  options: ['Follow the flame', 'Leave'],
  effectStat: ['health', 'health'],
  effectPower: [-1, -1],
};

const wheelOfFortune = {
  title: 'Wheel of Fortune',
  name: 'wheelOfFortune',
  description: 'A massive stone wheel sits in this room, divided into many sections, all engraved with strange symbols. A sign nearby invites you to spin the wheel.',
  options: ['Spin', 'Leave'],
  effectStat: ['health', 'health'],
  effectPower: [-1, -1],
};

const death = {
  title: 'Death',
  name: 'death',
  description: 'You enter a comfortably furnished room. A cloaked man sitting in a chair turns to you. His face is shrouded in shadow as he reaches into his cloak with a skeletal hand, extracting an hourglass and making a noise of confusion and frustration. He speak in a grating voice, “YOU SHOULD NOT BE HERE. IT’S NOT TIME YET…” He sighs and stands, seeming to glide towards you as he picks up a large scythe to lean on like a walking stick, gesturing to a deck of cards on a table. “WELL, I WAS GETTING A BIT BORED, FANCY A GAME?”',
  options: ["Play Death's game", 'Ask to rest', 'Attack', 'Leave'],
  effectStat: ['health', 'health', 'health', 'health'],
  effectPower: [-1, -1, -1, -1],
};

const devil = {
  title: 'The Devil',
  name: 'devil',
  description: 'You enter a room that is absolutely filled with treasure. Heaps of glittering gold and gems tower over you.',
  options: ['Take some treasure', 'Leave some treasure', 'Leave'],
  effectStat: ['health', 'health', 'health'],
  effectPower: [-1, -1, -1],
};

const world = {
  title: 'The World',
  name: 'world',
  description: 'Fight the World...',
  options: ['Attack'],
  effectStat: ['health'],
  effectPower: [-1],
};

let topVote = 0;

allEvents.push(magician);
allEvents.push(highPriestess);
allEvents.push(empress);
allEvents.push(emperor);
allEvents.push(hierophant);
allEvents.push(lovers);
allEvents.push(chariot);
allEvents.push(hermit);
allEvents.push(wheelOfFortune);
allEvents.push(death);
allEvents.push(devil);
allEvents.push(world);

let resolutionBool = false;
const eventResIndex = -1;
*/
// Timer for different phases

/*
setInterval(() => {
  
  
  
  if (gameStarted) {
    // Vote timer is default
    // As long as it is > 0, it is the voting phase
    if (voteTimer > 0) {
      voteTimer -= 1;


      // Call voting phase on client side
      io.sockets.emit('voting phase', {
        time: voteTimer,

      });
    } else if (eventResolutionTimer > 0) {
      if (resolutionBool == false) {
        let eventResolutionIndex = 0;
        let die = currentEvent.resolution.dice;
        let looping = true;
        die *= Math.floor(Math.random() * die);
        for (var i = 0; i < currentEvent.resolution.effectStats.length; i++) {
          if (looping && currentEvent.resolution.statNeeded * die > currentEvent.resolution.threshold[i]) {
            eventResolutionIndex = i;
            looping = false;
          }
        }


        switch (currentEvent.resolution.effectStats[eventResolutionIndex]) {
          case 'health':
            fool.health += currentEvent.resolution.effectPower[eventResolutionIndex];
            break;
          case 'strength':
            fool.strength += currentEvent.resolution.effectPower[eventResolutionIndex];
            break;
          case 'intelligence':
            fool.intelligence += currentEvent.resolution.effectPower[eventResolutionIndex];
            break;
          case 'charisma':
            fool.charisma += currentEvent.resolution.effectPower[eventResolutionIndex];
            break;
          case 'luck':
            fool.luck += currentEvent.resolution.effectPower[eventResolutionIndex];
            break;
          case 'gold':
            fool.gold += currentEvent.resolution.effectPower[eventResolutionIndex];
            break;
          default:
            break;
        }


        io.sockets.emit('voting resolution', {
          topVote,
          fool,
          resIndex: eventResolutionIndex,
        });

        resolutionBool = true;
      }


      io.sockets.emit('event intermission', {
        timer: eventResolutionTimer,
      });

      eventResolutionTimer -= 1;
    } else {
      // Once the vote timer reaches zero
      // Find which option was voted for
      // Handle event resolution
      if (changeEventTimer == -1) {
        topVote = 0;

        let maxVotes = 0;

        // Get top vote
        // Need to add our voting logic here, currently doesn't "add everything to a deck and shuffle it"
        for (var i = 0; i < votesArray.length; i++) {
          if (maxVotes < votesArray[i]) {
            maxVotes = votesArray[i];
            topVote = i;
          }
        }

        // EVENT RESOLUTION
        
        switch(currentEvent.effectStat[topVote]){
          case "health":
            fool.health += currentEvent.effectPower[topVote];
            break;
          case "strength":
            fool.strength += currentEvent.effectPower[topVote];
            break;
          case "defense":
            fool.defense += currentEvent.effectPower[topVote];
            break;
          case "intelligence":
            fool.intelligence += currentEvent.effectPower[topVote];
            break;
          case "gold":
            fool.gold += currentEvent.effectPower[topVote];
            break;
          default:
            break;
        }
        


        // Call voting complete on client side
        io.sockets.emit('voting complete', {
          topVote,
          fool,

        });

        // eventResIndex = -1;
        // Rest all votes to 0
        for (let i = 0; i < votesArray.length; i++) {
          votesArray[i] = 0;
        }

        // Set the timer for the next phase (changing event intermission)
        changeEventTimer = 10;
      } else if (changeEventTimer > 0) {
        // Now, each frame the change event timer will count down
        changeEventTimer -= 1;

        // Call event intermission on client side
        io.sockets.emit('event intermission', {
          timer: changeEventTimer,
        });
      } else {
        // Once the change event timer hits 0
        // Call reset voting on client side
        io.sockets.emit('resetVoting', {
          votes: votesArray,
        });


        
        // Randomly select a new event from the list of events
        let randomEvent = 0;
        if(numOfEvents.length != usedNums.length){

          randomEvent = Math.floor(Math.random() * numOfEvents.length);

          // Make sure the new event is not one that was already chosen
          while(usedNums.includes(randomEvent)){
            randomEvent = Math.floor(Math.random() * numOfEvents.length);
          }
          usedNums.push(randomEvent);

        }
        else{
          // If all events have been chosen once, add all events back to main list and select a random event from that
          let length = usedNums.length
          for(var i = 0; i < length; i++){
            usedNums.pop();
          }

          randomEvent = Math.floor(Math.random() * numOfEvents.length);

          while(usedNums[randomEvent]){
            randomEvent = Math.floor(Math.random() * numOfEvents.length);
          }

        }

        currentEvent = allEvents[randomEvent];
        


        let endGame = true;

        for (var i = 0; i < 4; i++) {
          if (magician_Main.completedOptions[i] == 0) {
            endGame = false;
          }
        }


        if (endGame) {
          gameStarted = false;
          console.log('end game');

          io.sockets.emit('end game', {
            fool,
          });
        }

        console.dir(currentEvent);

        if (currentEvent == magician_Main) {
          currentEvent.completedOptions[topVote] = 1;
          currentEvent = allMagicianEvents[currentEvent.connections[topVote]];
        } else if (currentEvent.connections.length > 1) {
          currentEvent = allMagicianEvents[currentEvent.connections[topVote]];
        } else {
          currentEvent = allMagicianEvents[currentEvent.connections[0]];
        }

        if (currentEvent.type == 'resolution') {
          eventResolutionTimer = 15;
          resolutionBool = false;
        } else {
          changeEventTimer = -1;
          voteTimer = 30;
        }

        // Call new event on client side

        if (!endGame) {
          io.sockets.emit('load event', {
            currentEvent,
            fool,
          });
        }

        // Set change event timer to -1

        // Set vote timer to 10 (or whatever we decide)
        // This will restart the entire loop
      }
    }
  }


// Interval happens once a second
}, 1000);
*/

// When the server and client are connected this runs
io.on('connection', (socket) => {
  let addedUser = false;

  

  if (gameStarted) {
    io.sockets.emit('load event', {
      currentEvent,
      fool,
    });
  }

  socket.on('start game', () => {
    if (gameStarted == false) {
      /*
      let randomEvent = 0;

      randomEvent = Math.floor(Math.random() * numOfEvents.length);

      currentEvent = allEvents[randomEvent];

      console.dir(currentEvent);

      usedNums.push(randomEvent);

      currentEvent = allEvents[randomEvent];

      io.sockets.emit('load event', {
        currentEvent: currentEvent,
        fool: fool,
      });

      gameStarted = true;
      */

      for (let i = 0; i < 4; i++) {
        magician_Main.completedOptions[i] = 0;
      }

      currentEvent = magician_Main;

      io.sockets.emit('load event', {
        currentEvent,
        fool,
      });

      gameStarted = true;
    }
  });

  // Handle Messages
  // When the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // Call new message on client side
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data,
      votes: 1,
    });
  });


  // Call add user on client side
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers,

    });

    io.emit('voting', {
      votes: votesArray,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username,
    });
  });

  // Call voting on client side
  // Adds user's vote with weight to the vote array
  socket.on('voting', (letter, weight) => {
    votesArray[letter] += weight;


    io.emit('voting', {
      votes: votesArray,
    });
  });

  // Reset votes on client and server
  socket.on('resetVotes', () => {
    for (let i = 0; i < votesArray.length; i++) {
      votesArray[i] = 0;
    }

    io.emit('resetVoting', {
      votes: votesArray,
    });
  });


  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username,
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers,
      });
    }
  });
});
