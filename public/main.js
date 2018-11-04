$(() => {
  const FADE_TIME = 150; // ms
  const TYPING_TIMER_LENGTH = 400; // ms
  const COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7',
  ];

  // Initialize variables
  const $window = $(window);
  const $usernameInput = $('.usernameInput'); // Input for username
  const $messages = $('.messages'); // Messages area
  const $inputMessage = $('.inputMessage'); // Input message input box

  const $loginPage = $('.login.page'); // The login page
  const $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  let username;
  let connected = false;
  let typing = false;
  let lastTypingTime;
  let $currentInput = $usernameInput.focus();

  const socket = io();

  // Vote variables
  const votes = [];
  const vA = 0;
  const vB = 0;
  const vC = 0;
  const vD = 0;
  let timer;
  let topVote;
  const votingComplete = false;

  /*
  const $voteA = $('#voteA');
  const $voteB = $('#voteB');
  const $voteC = $('#voteC');
  const $voteD = $('#voteD');

  */

  // Get buttons for voting
  const buttonA = document.querySelector('#button0');
  const buttonB = document.querySelector('#button1');
  const buttonC = document.querySelector('#button2');
  const buttonD = document.querySelector('#button3');
  
  const submitButton = document.querySelector('#submitVotesButton');
  const resetButton = document.querySelector('#resetVotesButton');


  //  const startButton = document.querySelector('#startButton');

  let totalPlayers = 0;
  let totalPlayersVoted = 0;
  
  // Player variables
  let playerVote;
  let playerPreviousVote = "";
  const playerVoteIndex = -1;
  let playerVoteWeight = 1;
  let playerVoted = false;

  // Event variables
  let currentEvent;
  const allEvents = [];

  const voteLetters = ['A', 'B', 'C', 'D'];

  const voteChoices = [0, 0, 0, 0];


  // Call init when window loads
  const init = () => {


    // Set the current event (probably want to do this on the server)
    // currentEvent = empress;

    // Load the current event (probably want to do this on the server)
    // loadEvent(currentEvent);
  };

  // Load event function
  // Loads all information about the current event

  /*
  const loadEvent = (eventCard) => {
    // Add information about the event to the client page
    document.querySelector('#eventTitle').innerHTML = `<h2>${eventCard.title}</h2>`;
    document.querySelector('#eventImage').src = `media/${eventCard.name}.jpg`;
    document.querySelector('#description').innerHTML = eventCard.flavorTextDescription;
    document.querySelector('#textOverlay').innerHTML = eventCard.flavorTextDescription;

    // Only display necessary options and buttons
    for (let i = 0; i < 4; i++) {
      if (eventCard.options && eventCard.options[i] && eventCard.completedOptions[i] == 0) {
        document.querySelector(`#button${i}`).style.display = 'block';
        document.querySelector(`#option${i}`).innerHTML = `${voteLetters[i]}. (${eventCard.options[i]}) ${eventCard.optionsFlavor[i]}`;
      } else {
        document.querySelector(`#option${i}`).innerHTML = '';
        document.querySelector(`#button${i}`).style.display = 'none';
      }
    }
  };

  const loadResolution = (eventCard, index) => {
    // Add information about the event to the client page

    document.querySelector('#eventTitle').innerHTML = `<h2>${eventCard.title}</h2>`;
    document.querySelector('#eventImage').src = `media/${eventCard.name}.jpg`;
    document.querySelector('#description').innerHTML = `${eventCard.flavorTextDescription}<br><br>${eventCard.resolution.text[index]}`;
    document.querySelector('#textOverlay').innerHTML = `${eventCard.flavorTextDescription}<br><br>${eventCard.resolution.text[index]}`;
    // document.querySelector("#textOverlay").innerHTML = eventCard.description;
  };
  */

  // Add Participant Message function
  // Provide information about the number of players in the game
  const addParticipantsMessage = (data) => {
    let message = '';
    if (data.numUsers === 1) {
      message += "You're the only player";
    } else {
      message += `There are ${data.numUsers} players`;
    }
    log(message);
  };

  // Sets username function
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  };

  // Sends message function
  const sendMessage = () => {
    let message = $inputMessage.val();

    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username,
        message,
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  };

  // Log a message
  const log = (message, options) => {
    const $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  };

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    const $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    const $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    const $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    const typingClass = data.typing ? 'typing' : '';
    const $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  };

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  };


  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  };

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    const $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  };

  // Prevents input from having injected markup
  const cleanInput = input => $('<div/>').text(input).html();

  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        const typingTimer = (new Date()).getTime();
        const timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  };

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = data => $('.typing.message').filter(function (i) {
    return $(this).data('username') === data.username;
  });

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    let hash = 7;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    const index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  };

  
  const userVote = (e) => {
    /*
    //console.log(e.target.value);
    switch(e.target.value){
      case "Sword":
        playerVote = 
        break;
      case "Wand":
        console.log(e.target.value);
        break;
      case "Cup":
        console.log(e.target.value);
        break;
      case "Coin":
        console.log(e.target.value);
        break;
      default:
        break;
    }
    */
    
    playerPreviousVote = playerVote;
    playerVote = e.target.value;
    
    
    console.log(playerVote);
    console.log(playerPreviousVote);
    if(playerVote != playerPreviousVote){
      socket.emit('playerVote', playerVote, playerVoteWeight, playerPreviousVote, playerVoted);
      buttonA.style.border = "1px solid black";
      buttonB.style.border = "1px solid black";
      buttonC.style.border = "1px solid black";
      buttonD.style.border = "1px solid black";
      e.target.style.border = "3px solid black";
      document.querySelector("#userVoteChoice").innerHTML = e.target.value;
    }
    
    playerVoted = true;
    
    
  }
  
  buttonA.addEventListener('click', userVote);
  buttonB.addEventListener('click', userVote);
  buttonC.addEventListener('click', userVote);
  buttonD.addEventListener('click', userVote);

  const submitVotes = () =>{
    if(totalPlayersVoted > 0){
      socket.emit('submitVotes');
    }
    
  }
  
  submitButton.addEventListener('click', submitVotes);
  
  const resetVotes = () =>{
    socket.emit('resetVotes');
    
    
  }
  
  resetButton.addEventListener('click', resetVotes);
  
  
  /*
  // Get votes function
  // Gets the votes from the server each time a player votes
  // Displays votes to the screen
  // "data" is the votes array on the server side
  const getVotes = (data) => {
    vA = data.votes[0];
    vB = data.votes[1];
    vC = data.votes[2];
    vD = data.votes[3];

    // Update visual
    $voteA.text(`Votes for A: ${vA}`);
    $voteB.text(`Votes for C: ${vB}`);
    $voteC.text(`Votes for C: ${vC}`);
    $voteD.text(`Votes for C: ${vD}`);
  };

  // Handle each type of vote
  // Each of these four functions are connected to the different voting buttons
  const voteForA = () => {
    if (playerVoted == false) {
      socket.emit('voting', 0, playerVoteWeight);
      playerVote = 'A';
      voteChoices[0] += 1;
      playerVoteIndex = 0;
      playerVoted = true;
    }
  };
  const voteForB = () => {
    if (playerVoted == false) {
      socket.emit('voting', 1, playerVoteWeight);
      playerVote = 'B';
      voteChoices[1] += 1;
      playerVoteIndex = 1;
      playerVoted = true;
    }
  };
  const voteForC = () => {
    if (playerVoted == false) {
      socket.emit('voting', 2, playerVoteWeight);
      playerVote = 'C';
      voteChoices[2] += 1;
      playerVoteIndex = 2;
      playerVoted = true;
    }
  };
  const voteForD = () => {
    if (playerVoted == false) {
      socket.emit('voting', 3, playerVoteWeight);
      playerVote = 'D';
      voteChoices[3] += 1;
      playerVoteIndex = 3;
      playerVoted = true;
    }
  };


  const startGame = (data) => {
    socket.emit('start game');
  };

  // Reset votes on the client and server side
  const resetVotes = () => {
    vA = 0;
    vB = 0;
    vC = 0;
    vD = 0;

    socket.emit('resetVotes');
  };

  // Add the event listeners for the buttons
  buttonA.addEventListener('click', voteForA);
  buttonB.addEventListener('click', voteForB);
  buttonC.addEventListener('click', voteForC);
  buttonD.addEventListener('click', voteForD);

  startButton.addEventListener('click', startGame);
  */
  // Keyboard events
  $window.keydown((event) => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', () => {
    updateTyping();
  });

  // Focus input when clicking anywhere on login page
  $loginPage.click(() => {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });


  // Socket events
  // These events are tiggered by the server

  // Whenever the server emits 'login', log the login message
  socket.on('login', (data) => {
    if (username != 'TOC_Admin') {
      // document.querySelector('#startButton').style.display = 'none';
    }
    
    totalPlayersVoted = data.numUsersVoted;
    totalPlayers = data.numUsers;
    document.querySelector("#numOfUsersVoted").innerHTML = totalPlayersVoted + "/" + totalPlayers; 

    connected = true;
    // Display the welcome message
    const message = 'Three of Coins - Chat';
    log(message, {
      prepend: true,
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    addChatMessage(data);
    // getVotes(data);
  });


  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', (data) => {
    log(`${data.username} joined`);
    
    totalPlayersVoted = data.numUsersVoted;
    totalPlayers = data.numUsers;
    document.querySelector("#numOfUsersVoted").innerHTML = totalPlayersVoted + "/" + totalPlayers; 

    addParticipantsMessage(data);
  });

  socket.on('updatePlayerVotes', (data) => {
    totalPlayersVoted = data.numUsersVoted;
    totalPlayers = data.numUsers;
    document.querySelector("#numOfUsersVoted").innerHTML = totalPlayersVoted + "/" + totalPlayers; 
  });
  
  socket.on('updateFinalVote', (data) => {
    document.querySelector("#finalVoteChoice").innerHTML = data.finalVote;
    console.log(data.finalVote);
    console.log(playerVote);
    
  });
  
  socket.on('resetVotes', (data) => {
    
    if(data.finalVote != playerVote && playerVoteWeight < 5){
      playerVoteWeight += 1;
    }
    if(data.finalVote == playerVote){
      playerVoteWeight = 1;
    }

    document.querySelector("#weight").innerHTML = playerVoteWeight;
    
    buttonA.style.border = "1px solid black";
    buttonB.style.border = "1px solid black";
    buttonC.style.border = "1px solid black";
    buttonD.style.border = "1px solid black";
    
    playerVoted = false;
    playerPreviousVote = "";
    
    document.querySelector("#userVoteChoice").innerHTML = "";
    totalPlayersVoted = 0;
    document.querySelector("#numOfUsersVoted").innerHTML = totalPlayersVoted + "/" + totalPlayers; 
    document.querySelector("#finalVoteChoice").innerHTML = "";
  });
  /*
  // First the client adds a vote to the server
  // The server holds all of the votes
  // The server must update the client on all player's votes
  socket.on('voting', (data) => {
    vA = data.votes[0];
    vB = data.votes[1];
    vC = data.votes[2];
    vD = data.votes[3];

    $voteA.text(`Votes for A: ${vA}`);
    $voteB.text(`Votes for B: ${vB}`);
    $voteC.text(`Votes for C: ${vC}`);
    $voteD.text(`Votes for D: ${vD}`);

    if (playerVote) {
      document.querySelector('#currentVote').innerHTML = `<h3>Vote: ${playerVote}</h3>`;
    }
  });

  socket.on('load resolution'), (data) => {
    currentEvent = data.currentEvent;
    loadResolution(data.currentEvent, data.resIndex);
    document.querySelector('#health').innerHTML = `Health: ${data.fool.health}`;
    document.querySelector('#strength').innerHTML = `Strength: ${data.fool.strength}`;
    document.querySelector('#intelligence').innerHTML = `Intelligence: ${data.fool.intelligence}`;
    document.querySelector('#charisma').innerHTML = `Charisma: ${data.fool.charisma}`;
    document.querySelector('#luck').innerHTML = `Luck: ${data.fool.luck}`;
    document.querySelector('#gold').innerHTML = `Gold: ${data.fool.gold}`;
  };

  socket.on('load event', (data) => {
    currentEvent = data.currentEvent;
    loadEvent(data.currentEvent);
    document.querySelector('#optionList').style.display = 'block';
    document.querySelector('#voteCompleted').innerHTML = '';
    playerVoted = false;

    document.querySelector('#health').innerHTML = `Health: ${data.fool.health}`;
    document.querySelector('#strength').innerHTML = `Strength: ${data.fool.strength}`;
    document.querySelector('#intelligence').innerHTML = `Intelligence: ${data.fool.intelligence}`;
    document.querySelector('#charisma').innerHTML = `Charisma: ${data.fool.charisma}`;
    document.querySelector('#luck').innerHTML = `Luck: ${data.fool.luck}`;
    document.querySelector('#gold').innerHTML = `Gold: ${data.fool.gold}`;
  });

  // Reset voting
  socket.on('resetVoting', (data) => {
    vA = data.votes[0];
    vB = data.votes[1];
    vC = data.votes[2];
    vD = data.votes[3];

    $voteA.text(`Votes for A: ${vA}`);
    $voteB.text(`Votes for B: ${vB}`);
    $voteC.text(`Votes for C: ${vC}`);
    $voteD.text(`Votes for D: ${vD}`);
  });

  // Server tells the client it is in the voting phase
  socket.on('voting phase', (data) => {
    document.querySelector('#voteTimer').innerHTML = `Timer: ${data.time}`;
    document.querySelector('#voteIntermission').innerHTML = '';
    document.querySelector('#options').innerHTML = 'What will you do?';
  });

  // Server tells the client that voting is complete
  socket.on('voting complete', (data) => {
    votingComplete = true;
    if (data.topVote == playerVoteIndex) {
      playerVoteWeight = 1;
    } else {
      playerVoteWeight += 1;
    }
    playerVoteIndex = -1;
    document.querySelector('#options').innerHTML = 'What will you do?';
    document.querySelector('#voteWeight').innerHTML = `<h3>Weight: ${playerVoteWeight}</h3>`;
    topVote = data.topVote;
    if (currentEvent.options[topVote]) {
      document.querySelector('#voteCompleted').innerHTML = `Fate has decided you will: ${currentEvent.options[topVote]}`;
    }

    document.querySelector('#optionList').style.display = 'none';
    document.querySelector('#currentVote').innerHTML = '<h3> Vote:</h3>';

    document.querySelector('#health').innerHTML = `Health: ${data.fool.health}`;
    document.querySelector('#strength').innerHTML = `Strength: ${data.fool.strength}`;
    document.querySelector('#intelligence').innerHTML = `Intelligence: ${data.fool.intelligence}`;
    document.querySelector('#charisma').innerHTML = `Charisma: ${data.fool.charisma}`;
    document.querySelector('#luck').innerHTML = `Luck: ${data.fool.luck}`;
    document.querySelector('#gold').innerHTML = `Gold: ${data.fool.gold}`;
  });

  socket.on('end game', (data) => {
    document.querySelector('#eventImage').style.visibility = 'hidden';
    document.querySelector('#eventTitle').innerHTML = 'Game Over';
    document.querySelector('#voteArea').style.visibility = 'hidden';
    document.querySelector('#textOverlay').style.visibility = 'hidden';

    document.querySelector('#optionList').style.visibility = 'hidden';
    document.querySelector('#startButton').style.visibility = 'hidden';
    document.querySelector('#voteCompleted').style.visibility = 'hidden';

    let mostVotes = 0;
    let mostVotedFor = 0;
    for (let i = 0; i < voteChoices.length; i++) {
      if (mostVotes < voteChoices[i]) {
        mostVotes = voteChoices[i];
        mostVotedFor = i;
      }
    }

    const foolHealth = data.fool.health;

    if (foolHealth > 0) {
      document.querySelector('#description').innerHTML = 'Congratulations! You survived.';
    } else {
      document.querySelector('#description').innerHTML = 'You died.';
    }

    switch (mostVotedFor) {
      case 0:
        document.querySelector('#options').innerHTML = 'You preferred the Sword (Strength). You hack first and ask quesitons later.';
        break;
      case 1:
        document.querySelector('#options').innerHTML = 'You preferred the Wand (Intelligence). Your knowledge gives you power.';
        break;
      case 2:
        document.querySelector('#options').innerHTML = 'You preferred the Cup (Charisma). You talk your way through any situation.';
        break;
      case 3:
        document.querySelector('#options').innerHTML = "You preferred the Coin (Luck). Fate doesn't dare mess with you.";
        break;
      default:
        break;
    }
  });

  socket.on('voting resolution', (data) => {
    // votingComplete = true;

    document.querySelector('#voteWeight').innerHTML = `<h3>Weight: ${playerVoteWeight}</h3>`;
    topVote = data.topVote;
    resIndex = data.resIndex;
    // if(currentEvent.options[topVote]){
    document.querySelector('#description').innerHTML = `${currentEvent.flavorTextDescription}<br><br>${currentEvent.resolution.text[resIndex]}`;
    document.querySelector('#textOverlay').innerHTML = `${currentEvent.flavorTextDescription}<br><br>${currentEvent.resolution.text[resIndex]}`;
    // }

    if (currentEvent.resolution.effectStats[resIndex]) {
      document.querySelector('#voteCompleted').innerHTML = `Stat change: ${currentEvent.resolution.effectStats[resIndex]} (${currentEvent.resolution.effectPower[resIndex]})`;
    }

    document.querySelector('#options').innerHTML = '';

    document.querySelector('#optionList').style.display = 'none';
    document.querySelector('#currentVote').innerHTML = '<h3> Vote:</h3>';

    document.querySelector('#health').innerHTML = `Health: ${data.fool.health}`;
    document.querySelector('#strength').innerHTML = `Strength: ${data.fool.strength}`;
    document.querySelector('#intelligence').innerHTML = `Intelligence: ${data.fool.intelligence}`;
    document.querySelector('#charisma').innerHTML = `Charisma: ${data.fool.charisma}`;
    document.querySelector('#luck').innerHTML = `Luck: ${data.fool.luck}`;
    document.querySelector('#gold').innerHTML = `Gold: ${data.fool.gold}`;
  });


  // Server tells the client it is the event intermission
  socket.on('event intermission', (data) => {
    document.querySelector('#voteIntermission').innerHTML = `Timer: ${data.timer}`;
    document.querySelector('#voteTimer').innerHTML = '';
    playerVoted = true;
  });

  socket.on('event resolution', (data) => {
    document.querySelector('#voteIntermission').innerHTML = `Timer: ${data.timer}`;
    document.querySelector('#voteTimer').innerHTML = '';
    playerVoted = true;
  });

  // Server tells the client to load a new event, and which one to load
  socket.on('new event', (data) => {
    currentEvent = allEvents[data.eventIndex];
    loadEvent(currentEvent);
    document.querySelector('#voteCompleted').innerHTML = '';
    playerVoted = false;
  });
  */

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(`${data.username} left`);
    addParticipantsMessage(data);
    removeChatTyping(data);
    totalPlayersVoted = data.numUsersVoted;
    totalPlayers = data.numUsers;
    document.querySelector("#numOfUsersVoted").innerHTML = totalPlayersVoted + "/" + totalPlayers; 
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', (data) => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });

  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });

  // Call init when the window loads
  window.onload = init;
});
