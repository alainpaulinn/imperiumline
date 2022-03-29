//Get data from the chatsFromDataServer
var socket = io();

//focu on the typing element
function setFocus() {
  document.getElementById('w-input-text').focus();
}
let panel = document.getElementById("toggleProfile_content");
let btnPanel = document.getElementById("toggleProfile");
function toggleProfile() {
  panel.classList.toggle("opened");
}
let menuSlideUp = document.getElementById("menuSlideUp");
function toggleMenu() {
  menuSlideUp.classList.toggle("MenuSlideUp");
}

const menu_list = document.querySelectorAll('.menu_list');
function activelink() {
  menu_list.forEach((item) =>
    item.classList.remove('active'));
  this.classList.add('active');
}
menu_list.forEach((item) =>
  item.addEventListener('click', activelink));

let timeScheduling_btn = document.getElementById("timeScheduling-btn")
let messaging_btn = document.getElementById("messaging-btn")
let calls_btn = document.getElementById("calls-btn")
let preferences_btn = document.getElementById("preferences-btn")
let profile_btn = document.getElementById("profile-btn")

let timeScheduling_div = document.getElementById("timeScheduling-div")
let messaging_div = document.getElementById("messaging-div")
let calls_div = document.getElementById("calls-div")
let preferences_div = document.getElementById("preferences-div")
let profile_div = document.getElementById("profile-div")

document.getElementById("timeScheduling-btn").addEventListener('click', () => {
  timeScheduling_div.classList.toggle("undropped-down")
  timeScheduling_btn.firstChild.classList.toggle("rotate180")
})
document.getElementById("messaging-btn").addEventListener('click', () => {
  messaging_div.classList.toggle("undropped-down")
  messaging_btn.firstChild.classList.toggle("rotate180")
})
document.getElementById("calls-btn").addEventListener('click', () => {
  calls_div.classList.toggle("undropped-down")
  calls_btn.firstChild.classList.toggle("rotate180")
})
document.getElementById("preferences-btn").addEventListener('click', () => {
  preferences_div.classList.toggle("undropped-down")
  preferences_btn.firstChild.classList.toggle("rotate180")
})
document.getElementById("profile-btn").addEventListener('click', () => {
  profile_div.classList.toggle("undropped-down")
  profile_btn.firstChild.classList.toggle("rotate180")
})



//Logout Button
var logout_button = document.getElementById("logout-button");
logout_button.addEventListener("click", function () {
  document.getElementById("logoutForm").submit();
});


document.getElementById("mainMenuToggle").addEventListener("click", () => {
  let hamburger = document.getElementById("mainMenuToggle")
  let hamburgerIsOpen = hamburger.classList.contains("active")
  if (hamburgerIsOpen) {
    document.getElementsByClassName("c-sidepanel")[0].classList.add("expanded")
    hamburger.classList.remove("active");
    var droppedElements = document.querySelectorAll(".droppable")
    droppedElements.forEach(function (element) {
      element.classList.add("undropped-down")

      timeScheduling_btn.firstChild.classList.remove("rotate180")
      messaging_btn.firstChild.classList.remove("rotate180")
      preferences_btn.firstChild.classList.remove("rotate180")
      profile_btn.firstChild.classList.remove("rotate180")
    })
  }
  else {
    hamburger.classList.add("active");
    document.getElementsByClassName("c-sidepanel")[0].classList.remove("expanded")
  }
})
let taggedMessages = [];

let selectedChatId;
let selectedReactionId;
let mySavedID;
let myName, Mysurname;
let lastMessageInSelectedChat;
let friends = [];
let chats = [];
let ITriggeredChatCreation = false;

let openChatInfo;
let chatEventListenings = [];
let chatContainer = document.querySelector("#place_for_chats")

socket.on('redirect', function (destination) {
  window.location.href = destination;
});
socket.on('myId', function (myId) {
  console.log('myId :', myId);
  mySavedID = myId.id;
  myName = myId.name;
  Mysurname = myId.surname;
  document.getElementById("my-name-surname").innerHTML = myName + ' ' + Mysurname;
});



socket.on('displayChat', function (chat) {

  let chatAlreadyExists = document.getElementById(chat.roomID + 'msg')
  if (chatAlreadyExists) {
    chatAlreadyExists.innerHTML = buildChat(chat, true)
    //console.log('existing chat')
    //chatAlreadyExists.click();

  }
  else {
    chatContainer.innerHTML += buildChat(chat, false)
    //console.log('new chat')
  }
  console.log(chat)
  initialiseChatEventListeners()

});

socket.on('displayNewCreatedChat', function (chat) {
  chatContainer.innerHTML = buildChat(chat, false) + chatContainer.innerHTML
  console.log('new chat')
  initialiseChatEventListeners()
});
socket.on('clickOnChat', function (chatToClick) {
  let messageElement = document.getElementById(chatToClick + "msg")
  messageElement.click();
  console.log('chatToClick', messageElement)

});
socket.on('chatContent', function (chatContent) {
  openChatInfo = chatContent;
  console.log("from server: ", chatContent)
  openChat(openChatInfo)
});

socket.on('newMessage', ({ chatInfo, expectedUser, insertedMessage }) => {
  //updateChatList
  /*
  // CHAT INFO
  {
    "roomID": "105",
    "users": [
        {
            "userID": 128,
            "name": "tes1Name",
            "surname": "test1Surname",
            "profilePicture": "/images/profiles/user-128.png"
        },
        {
            "userID": 130,
            "name": "tes3Name",
            "surname": "tes3Surame",
            "profilePicture": null
        }
    ],
    "roomName": null,
    "profilePicture": null,
    "type": 0,
    "lastmessage": "Hi man",
    "fromID": "130",
    "fromName": "tes3Name",
    "fromSurname": "tes3Surame",
    "timestamp": "2021-12-31T22:37:51.000Z",
    "unreadCount": 0
  }
  //EXPECTED USER
  {
    "userID": 130,
    "name": "tes3Name",
    "surname": "tes3Surame",
    "profilePicture": null
  }

  //inseted Message
  {
    "id": 405,
    "toRoom": 105,
    "message": "Hi man",
    "timeStamp": "2021-12-31T22:37:51.000Z"
  }
  */
  console.log("NEWWWW CHATTTTT", chatInfo, expectedUser, insertedMessage)
  let chatAlreadyExists = document.getElementById(chatInfo.roomID + 'msg')
  if (chatAlreadyExists) {
    chatAlreadyExists.innerHTML = buildChat(chatInfo, true)
    console.log('existing chat')
    chatContainer.insertBefore(chatAlreadyExists, chatContainer.firstChild)
  }
  else {
    chatContainer.innerHTML = buildChat(chatInfo, false) + chatContainer.innerHTML
    console.log('new chat')
  }
  displayMessageOnChat(expectedUser, insertedMessage);
  initialiseChatEventListeners()
  console.log(chatContainer.children)
});

socket.on('updateReaction', function (receivedReactionsInfo) {
  console.log("receivedReactionsInfo", receivedReactionsInfo)
  /*
  {
      "chat": "9",
      message: reactionIdentifiers.messageId,
      "details": [
          {
              "reactionId": 4,
              "messageId": 48,
              "users": [
                  {
                      "userID": 1,
                      "name": "Test1Name",
                      "surname": "Test1Surname",
                      "profilePicture": null
                  }
              ],
              "icon": "😨",
              "name": "Afraid",
              "description": null
          },
          {
              "reactionId": 5,
              "messageId": 48,
              "users": [
                  {
                      "userID": 5,
                      "name": "test5Name",
                      "surname": "test5Surname",
                      "profilePicture": null
                  }
              ],
              "icon": "😠",
              "name": "Angry",
              "description": null
          }
      ]
  }*/

  if (selectedChatId == receivedReactionsInfo.chat) {
    let reactionsContainer = document.getElementById(receivedReactionsInfo.message + "-reactions")
    reactionsContainer.innerHTML = buildReaction(receivedReactionsInfo)
  }
})

function buildReaction(receivedReactionsInfo) {
  let reactionsContainerContent = ``;
  receivedReactionsInfo.details.forEach(entry => {
    let reactionIcon = entry.icon;
    let reactorsList = `<div class="title">Reactions</div>`;

    entry.users.forEach(user => {
      let nameString;
      if (mySavedID == user.userID) {
        nameString = "Me";
      }
      else {
        nameString = user.name + " " + user.surname;
      }
      reactorsList += `<li>${nameString}</li>`
    })

    reactionsContainerContent +=
      `<div class="reactionBox">
      <div class="reactionIcon">${reactionIcon}</div> 
      <ul class="reactorList">
        ${reactorsList}
      </ul>
    </div>`
  })

  return reactionsContainerContent;
}

function scroll() {
  let messagescontainer = document.querySelector('.c-openchat__box__info');
  messagescontainer.scrollTop = messagescontainer.scrollHeight;
  //console.log(messagescontainer)
}
function buildChat(chat, exists) {
  /*object structure
  {
    "roomID": "18",
    "users": [
        {
            "userID": 7,
            "name": "Test",
            "surname": "User7",
            "profilePicture": null
        },
        {
            "userID": 1,
            "name": "Test1Name",
            "surname": "Test1Surname",
            "profilePicture": "/images/profiles/user-128.png"
        }
    ],
    "roomName": null,
    "profilePicture": "/images/profiles/user-128.png",
    "type": 0,
    "lastmessage": "<em>New Chat</em>",
    "fromID": 7,
    "myID": 7,
    "timestamp": "2022-01-24T12:00:48.000Z",
    "unreadCount": 0
}*/

  let {
    roomID,
    users,
    roomName,
    profilePicture,
    type,
    lastmessage,
    from,
    myID,
    timestamp,
    unreadCount //tobe done later
  } = chat;
  if (!myID) { myID = mySavedID }

  let chatDate = new Date(timestamp)

  // make the Display picture
  let avatar;
  if (profilePicture.length == 2) {
    avatar = `<div>${profilePicture}</div>`
  } else {
    avatar = `<img src='${profilePicture}' alt=''>`
  }

  //  
  let writenBy = '';
  switch (type) {
    case 0:
      writenBy = "";
      break;
    case 1:
      if (myID == from.userID) {
        writenBy = "Me: ";
      } else {
        writenBy = from.name + ": ";
      }
      break;
    default:
      break;
  }


  let newChatTemplate = `<li class='c-chats__list' id='${roomID}msg'><button data-id='${roomID
    }' class='c-chats__link' href='' title=''><div class='c-chats__image-container'>${avatar
    }</div><div class='c-chats__info'><p class='c-chats__title'>${roomName
    }</p><span>${chatDate.toString('YYYY-MM-dd').substring(0, 24)
    }</span><p class='c-chats__excerpt'>${writenBy + lastmessage
    //.substring(0,25)+'...'
    }</p></div></button></li>`;

  let existChatTemplate = `<button data-id='${roomID
    }' class='c-chats__link' href='' title=''><div class='c-chats__image-container'>${avatar
    }</div><div class='c-chats__info'><p class='c-chats__title'>${roomName
    }</p><span>${chatDate.toString('YYYY-MM-dd').substring(0, 24)
    }</span><p class='c-chats__excerpt'>${writenBy + lastmessage
    //.substring(0,25)+'...'
    }</p></div></button>`

  switch (exists) {
    case true:
      return existChatTemplate;
    case false:
      return newChatTemplate;
  }
}
function initialiseChatEventListeners() {
  let chatArray = document.querySelectorAll('.c-chats__list')
  chatArray.forEach(chat => {
    if (chatEventListenings.includes(chat.id)) socket.emit('requestChat', "already added")
    else {
      chat.addEventListener('click', function () {
        document.querySelector(".c-openchat").innerHTML = `<div class="spinner"> <div></div>  <div></div>  <div></div>  </div>`
        socket.emit('requestChatContent', chat.id.slice(0, -3))
        console.log(chat.id.slice(0, -3))
        chatEventListenings.push(chat.id)
        document.querySelectorAll('.c-chats__list').forEach(selection => { selection.classList.remove("openedChat") })
        this.classList.add("openedChat");
        selectedChatId = chat.id.slice(0, -3);
      });
    }
  })
}


document.getElementById("newChat").addEventListener("click", () => {
  chatSearchToogle()

  var searchField = document.getElementById('searchField')
  searchField.focus();
})

function openChat(openChatInfo) {
  let {
    roomID,
    roomName,
    type,
    profilePicture,
    myID,
    messagesArray,
    usersArray
  } = openChatInfo;

  /*one Message
  {
    "id": 179,
    "message": "YeAhhh rev.",
    "roomID": 1,
    "userID": 1,
    "timeStamp": "2022-02-01T07:05:39.000Z",
    "userInfo": {
        "userID": 1,
        "name": "Test1Name",
        "surname": "Test1Surname",
        "profilePicture": "/images/profiles/user-128.png"
    },
    "reactions": {
        "chat": 1,
        "message": 179,
        "details": []
    },
    tagContent: Array(6)
      0: {id: 38, message: 'jjnolnk', roomID: 7, userID: 1, timeStamp: '2022-01-08T23:49:47.000Z', …}
      1: {id: 40, message: 'e e', roomID: 7, userID: 1, timeStamp: '2022-01-08T23:51:10.000Z', …}
}*/


  let chatTitle;
  let avatar;

  if (messagesArray.length > 0) lastMessageInSelectedChat = messagesArray[0]
  else lastMessageInSelectedChat = null

  let callOptions = ``
  switch (type) {
    case 1:

      if (profilePicture === null) { avatar = `<img class="c-openchat__box__pp" src='/images/profiles/group.jpeg' alt=''></img>` }
      else avatar = `<img class="c-openchat__box__pp" src='${profilePicture}' alt=''></img>`;

      // groupId, audiocall = true, videoCall = false, is a group = true;
      callOptions = `
        <button onclick="call(${roomID}, true, false, false, true, null)" c><i class="bx bxs-phone"></i></button>
        <button ><i class='bx bx-chevron-right' ></i></button>
      `
      break;
    case 0:
      var otherUser = usersArray.filter(user => {
        return user.userID !== myID
      })

      if (otherUser.length > 0) {
        chatTitle = otherUser[0].name + ' ' + otherUser[0].surname;
        callOptions = `
        <button onclick="call(${roomID}, true, false, false, true, null)"><i class="bx bxs-phone"></i></button>
        <button onclick="call(${roomID}, true, true, false, true, null)"><i class='bx bxs-video'></i></button>
        <button ><i class='bx bx-chevron-right' ></i></button>
        `
      } else {
        chatTitle = "<em>User Quit or his account was deleted</em>"
        callOptions = `<button ><i class='bx bx-chevron-right' ></i></button>`
      }

      if (otherUser[0].profilePicture === null) { avatar = `<div class="c-openchat__box__pp">${otherUser[0].name.charAt(0) + otherUser[0].surname.charAt(0)}</div>`; }
      else avatar = `<img class="c-openchat__box__pp" src='${otherUser[0].profilePicture}' alt=''></img>`;

      callType = false
      break;
    default:

  }

  let chatBoxTeamplate = `
  <div class='c-openchat__box'>
    <div class='c-openchat__box__header'>
      <div class='c-chat-title'>
        ${avatar}
        <p class='c-openchat__box__name'>${roomName}</p>
        <span class='c-openchat__box__status'></span>
      </div>
      <div class="universalCallButtons">
        ${callOptions}
      </div>

    </div>
    <div class='c-openchat__box__info'>
      
      

    </div>
    <div class="typingBox">
      <button class='chat-options' href='' title=''><i class='bx bxs-smile' ></i></i></button>
      <button class='chat-options' href='' title=''><i class='bx bx-paperclip' ></i></button>
      <div id="w-input-container" onclick="setFocus()">
        <div class="w-input-text-group">
          <div id="w-input-text" class="w-input-text" contenteditable></div>
          <div class="w-placeholder">Type a message</div>
        </div>
      </div>
      <button class='chat-options' href='' title=''><i class='bx bxs-microphone' ></i></button>
      <button id='sendButton' class='chat-options' href='' title=''><i class='bx bxs-send' ></i></button>
    </div>
  
  
  </div>`;
  //insert the elements
  document.querySelector(".c-openchat").innerHTML = chatBoxTeamplate;

  let messagescontainer = document.querySelector('.c-openchat__box__info');
  messagescontainer.style.scrollBehavior = "auto"

  let receivedGroup = '';
  let sentGroup = '';

  let previousMessageDate;
  let previousUserId;
  let profilePictureToReleaseLater;
  messagesArray.forEach((message, index) => {
    if (index === 0) {
      //excpect set that there was no previous sender
      previousUserId = null;
    }

    //date separation
    let prevDate = new Date(previousMessageDate)
    let thisDate = new Date(message.timeStamp)
    console.log(sameDay(prevDate, thisDate))

    //Preparing the profile Picture
    let messageUserPicture = '';
    if (message.userInfo.profilePicture === null) { messageUserPicture = `<div class="receivedMessageProfile">${message.userInfo.name.charAt(0) + message.userInfo.surname.charAt(0)}</div>` }
    else { messageUserPicture = `<img class="receivedMessageProfile" src="${message.userInfo.profilePicture}" alt=""></img>` }
    //${messageUserPicture}
    if (profilePictureToReleaseLater === null) { profilePictureToReleaseLater = `<div class="receivedMessageProfile">${messagesArray[index - 1].userInfo.name.charAt(0) + messagesArray[index - 1].userInfo.surname.charAt(0)}</div>` }
    else { profilePictureToReleaseLater = `<img class="receivedMessageProfile" src="${profilePictureToReleaseLater}" alt=""></img>` }
    //${profilePictureToReleaseLater}

    //release previous message if it sontains something
    if (message.userID == myID + '') {
      if (receivedGroup != '') {
        let separator = '';
        if (!sameDay(prevDate, thisDate)) separator = `<div class="message-separator"><span>${prevDate.toString('YYYY-MM-dd').substring(0, 15)}</span></div>`;
        else separator = '';
        messagescontainer.innerHTML = separator +
          `<div class="message-group-received">
            <div>
                ${profilePictureToReleaseLater} 
            </div>
            <div>
                ${receivedGroup}
            </div>
        </div>` + messagescontainer.innerHTML;
        receivedGroup = '';
      }

      //one minute ungrouping of my sent messages
      if (((prevDate - thisDate) > 60000 || !sameDay(prevDate, thisDate)) && (index !== 0) && previousUserId == myID + '' && sentGroup != '') {
        let separator = '';
        if (!sameDay(prevDate, thisDate)) separator = `<div class="message-separator"><span>${prevDate.toString('YYYY-MM-dd').substring(0, 15)}</span></div>`;
        else separator = '';
        messagescontainer.innerHTML = separator +
          `
        <div class="message-group-sent">
          ${sentGroup}
        </div> ` + messagescontainer.innerHTML;
        sentGroup = '';
      }

      let tagTemplate = ``
      message.tagContent.forEach(tag => {
        tagTemplate += `<a href="#${tag.id}" class="message-tag-text">${tag.message}</a>`
      })
      //Prepare reaction template
      sentGroup =
        `<div class="message-sent" id="${message.id}">
        ${buildOptions(message, true)}
        <div class="message-sent-text" id="${message.id}-messageText">${tagTemplate + message.message
        //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
        }</div>
        <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
      </div>` + sentGroup;

      //release my sent message group on the final message
      if (messagesArray.length == index + 1) {
        messagescontainer.innerHTML =
          `<div class="message-separator"><span>${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(0, 15)}</span></div>
        <div class="message-group-sent">
          ${sentGroup}
        </div> ` + messagescontainer.innerHTML;
        sentGroup = '';
      }

    }
    else {
      //release previous message if it sontains something
      if (sentGroup != '') {
        let separator = '';
        if (!sameDay(prevDate, thisDate)) separator = `<div class="message-separator"><span>${prevDate.toString('YYYY-MM-dd').substring(0, 15)}</span></div>`;
        else separator = '';
        messagescontainer.innerHTML = separator +
          `<div class="message-group-sent">
          ${sentGroup}
        </div> ` + messagescontainer.innerHTML;
        sentGroup = '';
      }

      //if the messageis not from the same person as previously sent, or if it is more than one minute ago
      if (index != 0 && previousUserId != message.userID + '' && previousUserId != myID + '' && receivedGroup != '') {
        let separator = '';
        if (!sameDay(prevDate, thisDate)) separator = `<div class="message-separator"><span>${prevDate.toString('YYYY-MM-dd').substring(0, 15)}</span></div>`;
        else separator = '';
        messagescontainer.innerHTML = separator +
          `
        <div class="message-group-received">
            <div>
                ${profilePictureToReleaseLater}
            </div>
            <div>
                ${receivedGroup}
            </div>
        </div>` + messagescontainer.innerHTML;
        receivedGroup = '';
      }

      //one minute ungrouping of my sent messages
      if (receivedGroup != '' && index != 0 && previousUserId == message.userID && ((prevDate - thisDate) > 60000 || !sameDay(prevDate, thisDate))) {
        //console.log(message.message)
        let separator = '';
        if (!sameDay(prevDate, thisDate)) separator = `<div class="message-separator"><span>${prevDate.toString('YYYY-MM-dd').substring(0, 15)}</span></div>`;
        else separator = '';
        messagescontainer.innerHTML = separator +
          `
        <div class="message-group-received">
            <div>
                ${messageUserPicture}
            </div>
            <div>
                ${receivedGroup}
            </div>
        </div>` + messagescontainer.innerHTML;
        receivedGroup = '';
      }

      let tagTemplate = ``
      message.tagContent.forEach(tag => {
        tagTemplate += `<a href="#${tag.id}" class="message-tag-text">${tag.message}</a>`
      })

      receivedGroup =
        `<div class="message-received" id="${message.id}">
          <div class="message-received-text" id="${message.id}-messageText">${
        //message.userID +": " + 
        tagTemplate + message.message
        //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
        }</div>
          ${buildOptions(message, false)}
        </div>` + receivedGroup;


      //release my received message group on the final message
      if (messagesArray.length == index + 1) {
        messagescontainer.innerHTML =
          `<div class="message-separator"><span>${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(0, 15)}</span></div>
        <div class="message-group-received">
            <div>
                ${messageUserPicture}
            </div>
            <div>
                ${receivedGroup}
            </div>
        </div>` + messagescontainer.innerHTML;
        receivedGroup = '';
      }
      profilePictureToReleaseLater = message.userInfo.profilePicture;
    }

    previousMessageDate = message.timeStamp;
    previousUserId = message.userID;


  })


  //scroll bottom
  scroll()
  messagescontainer.style.scrollBehavior = "smooth"

  document.querySelectorAll(".reactionIconChoose").forEach(function (reactionIcon) {
    //console.log(reactionIcon)
    reactionIcon.addEventListener("click", function () {
      console.log(reactionIcon.id)
    })
  })

  if (messagesArray.length < 1) {
    messagescontainer.innerHTML = `
    <div class="c-openchat__selectConversation">
      <img src="/images/yourMessagesWillAppearHere.jpeg" alt="">
      <h3> Start typing <i class='bx bxs-keyboard'></i> </br> Your messages will appear here ...</h3>
    </div>
    `
  }
  else {
    messagescontainer.innerHTML = `<div class="push-down"></div>` + messagescontainer.innerHTML;
  }

  //grab text message input and process it
  let messageContent = document.getElementById("w-input-text")
  messageContent.addEventListener('keydown', function (e) {
    if (e.key == 'Enter' && !e.shiftKey) {
      // prevent default behavior
      e.preventDefault();
      let unfDate = new Date();
      let fDate = [((unfDate.getMonth()+1)+'').padStart(2,"0"),
        (unfDate.getDate()+'').padStart(2,"0"),
        (unfDate.getFullYear()+'')].join('-') +' ' +
       [(unfDate.getHours()+'').padStart(2,"0"),
        (unfDate.getMinutes()+'').padStart(2,"0"),
        (unfDate.getSeconds()+'').padStart(2,"0")].join(':');
      let message =
      {
        toRoom: selectedChatId,
        message: messageContent.innerText.trim(),
        timeStamp: fDate,
        taggedMessages: taggedMessages
      };
      console.log(message)
      messageContent.innerText = '';
      socket.emit('message', message)
      taggedMessages = [];
      removeAllTags();

    }

  });

  //grab text message input and process it
  let sendButton = document.getElementById("sendButton")
  sendButton.addEventListener('click', function (e) {

    if (messageContent.innerText.trim() != '') {
      let message =
      {
        toRoom: selectedChatId,
        message: messageContent.innerText,
        timeStamp: new Date().toISOString(),
        taggedMessages: taggedMessages
      };
      console.log('message', message)
      messageContent.innerText = '';
      socket.emit('message', message)

      taggedMessages = [];
      removeAllTags();
      // prevent default behavior
      e.preventDefault();
    }

  });

  //initialise all icons because there are new icons added in the open chat section
  
}
function reactionTo(messageId, reaction) {
  console.log(messageId, reaction);
  socket.emit('messageReaction', { messageId, selectedChatId, reaction })
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
function displayMessageOnChat(expectedUser, message) {
  console.log("received content: ", expectedUser, message)
  //expectedUser{userID: 130, name: 'tes3Name', surname: 'tes3Surame', profilePicture: null} 
  //message{toRoom: '106', message: 'test again', timeStamp: '2021-12-19T20:03:48.759Z'}

  /*previous message{"id": 79,"message": "waiting","roomID": 107,"userID": "128","timeStamp": "2021-12-19T22:02:20.000Z",
        "userInfo": {
            "userID": 128,
            "name": "tes1Name",
            "surname": "test1Surname",
            "profilePicture": "/images/profiles/user-128.png"
          }
        }*/
  /*
  let selectedChatId;
  let mySavedID;
  let lastMessageInSelectedChat;*/
  //buildReaction(message.reactions)

  console.log("Previous message", lastMessageInSelectedChat)
  console.log("new message", message)
  if (message.toRoom == selectedChatId) {


    //For the first message in chat
    if (!lastMessageInSelectedChat) {

      //Preparing the profile Picture
      let messageUserPicture = '';
      if (expectedUser.profilePicture === null) { messageUserPicture = `<div class="receivedMessageProfile">${expectedUser.name.charAt(0) + expectedUser.surname.charAt(0)}</div>` }
      else { messageUserPicture = `<img class="receivedMessageProfile" src="${expectedUser.profilePicture}" alt=""></img>` }


      let globalChatContainer = document.querySelector('.c-openchat__box__info');
      let pushDown = `<div class="push-down"></div>`;
      let dateSeparator = `<div class="message-separator"><span>${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(0, 15)}</span></div>`
      if (expectedUser.userID == mySavedID + '') {

        globalChatContainer.innerHTML = pushDown + dateSeparator +
          `<div class="message-group-sent">
            <div class="message-sent" id="${message.id}">
              ${buildOptions(message, true)}
              <div class="message-sent-text" id="${message.id}-messageText">${buildTags(message.tagContent) + message.message
          //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
          }</div>
              <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
            </div>
          </div> `
      }
      else {
        globalChatContainer.innerHTML = pushDown + dateSeparator +
          `<div class="message-group-received">
              <div>
                  ${messageUserPicture}
              </div>
              <div>
                <div class="message-received" id="${message.id}">
                  <div class="message-received-text" id="${message.id}-messageText">${//expectedUser.userID +": " + 
          buildTags(message.tagContent) + message.message
          //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
          }</div>
                  ${buildOptions(message, false)}
                </div>
              </div>
          </div>`
      }
    }

    //expectedUser.userID == mySavedID //check if it is my message
    else if (expectedUser.userID == mySavedID + '') {
      let lastDisplayedMessage = document.getElementById(lastMessageInSelectedChat.id + '');

      // i don't how this error is coming, the lastMessageInSelectedChat is behind for 1 hr
      let lastselectedChatTime = new Date(lastMessageInSelectedChat.timeStamp);
      let thisMessageTimestamp = new Date(message.timeStamp)
      let timeDiff = thisMessageTimestamp - lastselectedChatTime;


      let lastDisplayedGroup = lastDisplayedMessage.parentElement;
      let globalChatContainer = document.querySelector('.c-openchat__box__info');

      //if the previous message was mine
      if (lastMessageInSelectedChat.userID == mySavedID + '') {
        //if it is less than one minute
        if (timeDiff < 60000 && sameDay(thisMessageTimestamp, lastselectedChatTime)) {
          lastDisplayedGroup.innerHTML +=
            `<div class="message-sent" id="${message.id}">
            ${buildOptions(message, true)}
            <div class="message-sent-text" id="${message.id}-messageText">${buildTags(message.tagContent) + message.message
            //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
            }</div>
            <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
          </div>`;
        }
        //here is the only occasion that we create a new group
        else if (!sameDay(thisMessageTimestamp, lastselectedChatTime)) {
          globalChatContainer.innerHTML +=
            `<div class="message-separator"><span>${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(0, 15)}</span></div>
          <div class="message-group-sent">
            <div class="message-sent" id="${message.id}">
              ${buildOptions(message, true)}
              <div class="message-sent-text" id="${message.id}-messageText">${buildTags(message.tagContent) + message.message
            //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
            }</div>
              <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
            </div>
          </div> `
        }
        else {
          globalChatContainer.innerHTML +=
            `<div class="message-group-sent">
            <div class="message-sent" id="${message.id}">
              ${buildOptions(message, true)}
              <div class="message-sent-text" id="${message.id}-messageText">${buildTags(message.tagContent) + message.message
            //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
            }</div>
              <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
            </div>
          </div> `
        }
      }
      else {
        //overall chat container
        let globalChatContainer = lastDisplayedMessage.parentElement.parentElement.parentElement;
        //here is the only occasion that we create a new group
        if (!sameDay(thisMessageTimestamp, lastselectedChatTime)) {
          globalChatContainer.innerHTML +=
            `<div class="message-separator"><span>${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(0, 15)}</span></div>
          <div class="message-group-sent">
            <div class="message-sent" id="${message.id}">
              ${buildOptions(message, true)}
              <div class="message-sent-text" id="${message.id}-messageText">${buildTags(message.tagContent) + message.message
            //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
            }</div>
              <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
            </div>
          </div> `
        }
        else {
          globalChatContainer.innerHTML +=
            `<div class="message-group-sent">
            <div class="message-sent" id="${message.id}">
              ${buildOptions(message, true)}
              <div class="message-sent-text" id="${message.id}-messageText">${buildTags(message.tagContent) + message.message
            //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
            }</div>
              <div class="message-sent-status"><img src="https://randomuser.me/api/portraits/med/men/1.jpg" alt=""></div>
            </div>
          </div> `
        }
      }

    } else {
      let lastDisplayedMessage = document.getElementById(lastMessageInSelectedChat.id + '');

      // i don't how this error is coming, the lastMessageInSelectedChat is behind for 1 hr
      let lastselectedChatTime = new Date(lastMessageInSelectedChat.timeStamp);
      let thisMessageTimestamp = new Date(message.timeStamp)
      let timeDiff = thisMessageTimestamp - lastselectedChatTime;

      let lastDisplayedGroup = lastDisplayedMessage.parentElement;
      let globalChatContainer = document.querySelector('.c-openchat__box__info')

      //first of all chack if it is the same date
      if (!sameDay(thisMessageTimestamp, lastselectedChatTime)) {
        //Preparing the profile Picture
        let messageUserPicture = '';
        if (expectedUser.profilePicture === null) { messageUserPicture = `<div class="receivedMessageProfile">${expectedUser.name.charAt(0) + expectedUser.surname.charAt(0)}</div>` }
        else { messageUserPicture = `<img class="receivedMessageProfile" src="${expectedUser.profilePicture}" alt=""></img>` }

        globalChatContainer.innerHTML +=
          `<div class="message-separator"><span>${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(0, 15)}</span></div>
        <div class="message-group-received">
              <div>
                  ${messageUserPicture}
              </div>
              <div>
                <div class="message-received" id="${message.id}">
                  <div class="message-received-text" id="${message.id}-messageText">${//expectedUser.userID +": " + 
          buildTags(message.tagContent) + message.message
          //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
          }</div>
                  ${buildOptions(message, false)}
                </div>
              </div>
          </div>`
      }
      //if  no 60 seconds, same user as previous message, on the same day
      else if (timeDiff < 60000 && lastMessageInSelectedChat.userID == expectedUser.userID) {
        lastDisplayedGroup.innerHTML +=
          `<div class="message-received" id="${message.id}">
            <div class="message-received-text" id="${message.id}-messageText">${//expectedUser.userID +": " + 
          buildTags(message.tagContent) + message.message
          //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
          }</div>
            ${buildOptions(message, false)}
        </div>`
      }

      else {
        //Preparing the profile Picture
        let messageUserPicture = '';
        if (expectedUser.profilePicture === null) { messageUserPicture = `<div class="receivedMessageProfile">${expectedUser.name.charAt(0) + expectedUser.surname.charAt(0)}</div>` }
        else { messageUserPicture = `<img class="receivedMessageProfile" src="${expectedUser.profilePicture}" alt=""></img>` }

        globalChatContainer.innerHTML +=
          `<div class="message-group-received">
              <div>
                  ${messageUserPicture}
              </div>
              <div>
                <div class="message-received" id="${message.id}">
                  <div class="message-received-text" id="${message.id}-messageText">${//expectedUser.userID +": " + 
          buildTags(message.tagContent) + message.message
          //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
          }</div>
                  ${buildOptions(message, false)}
                </div>
              </div>
          </div>`
      }
    }

    lastMessageInSelectedChat = {
      id: message.id, message: message.message, roomID: message.toRoom, userID: expectedUser.userID, timeStamp: message.timeStamp,
      userInfo: {
        userID: message.id,
        name: expectedUser.name,
        surname: expectedUser.surname,
        profilePicture: expectedUser.profilePicture
      }
    }
    console.log(lastMessageInSelectedChat)
    scroll()
  }
  else {
    console.log("received a message from a chat not opened")
  }
}
console.log(new Date().toISOString())

let searchField = document.getElementById('searchField')
searchField.addEventListener('input', function () {
  var text = this.value;
  socket.emit('searchPeople', text);
})

let searchResults = document.getElementById('searchResults')
socket.on('searchPerson', (searchPeople) => {
  console.log(searchPeople)
  searchResults.innerHTML = '';

  searchPeople.forEach(searchPerson => {
    let searchAvatar;
    if (searchPerson.profilePicture == null) {
      searchAvatar = `<div>${searchPerson.name.charAt(0) + searchPerson.surname.charAt(0)}</div>`
    } else {
      searchAvatar = `<img src="${searchPerson.profilePicture}" alt="">`
    }

    searchResults.innerHTML +=
      `<li class="resultItem" id="user${searchPerson.id}">
      <div data-id="" class="resultItemBundle" href="" title="">
        <div class="containerImage">
          ${searchAvatar}
        </div>
        <div class="person-data">
          <div class="nameSurnamePosition">
            <p class="resultsNameSurname">${searchPerson.name + " " + searchPerson.surname}</p>
            <p class="resultsPosition">${searchPerson.email}</p>
            <p class="resultsquote">Dispute Analyst</p>
          </div>
          <div class="universalCallButtons">
            <button id="${searchPerson.id}chatButton" class='searchChatButton'><i class='bx bxs-message-square-add' ></i></button>
            <button id="${searchPerson.id}audioButton" class='searchAudioButton'><i class='bx bxs-phone' ></i></button>
            <button id="${searchPerson.id}videoButton" class='searchVideoButton'><i class='bx bxs-video-recording' ></i></button>
          </div>
        </div>
      </div>
    </li>`;

  })
  let searchChatButtons = document.querySelectorAll('.searchChatButton')
  searchChatButtons.forEach(searchChatButton => {
    searchChatButton.addEventListener('click', function () {
      chatSearchToogle();
      console.log("CHAT", this.id)
      //socket.emit('chat',this.id)
      socket.emit('makeChat', this.id.slice(0, -10))
      ITriggeredChatCreation = true;
    })
  })
  let searchAudioButtons = document.querySelectorAll('.searchAudioButton')
  searchAudioButtons.forEach(searchAudioButton => {
    searchAudioButton.addEventListener('click', function () {
      console.log("AUDIO", this.id)
      //call(callTo, audio, video, group, fromChat, previousCallId)
      call(this.id.slice(0, -11), true, false, false, false, null)
    })
  })
  let searchVideoButtons = document.querySelectorAll('.searchVideoButton')
  searchVideoButtons.forEach(searchVideoButton => {
    searchVideoButton.addEventListener('click', function () {
      console.log("VIDEO", this.id)
      //call(callTo, audio, video, group, fromChat, previousCallId)
      call(this.id.slice(0, -11), true, true, false, false, null)
    })
  })
  //console.log(searchChatbuttons)
  
  //console.log(searchPerson)
})

function chatSearchToogle() {
  var chatContainerHeader = document.querySelector("c-chats__header");
  var newSearchBox = document.getElementById("newChatTitle");
  var oldSearchBox = document.getElementById("chatSearch");
  var chatContainingDiv = document.getElementById("place_for_chats");
  var ButtonSearchBox = document.getElementById("newChat")
  var searchResultsContainer = document.getElementById("searchResults")
  newSearchBox.classList.toggle('displayed')
  newSearchBox.classList.toggle('unDisplayed')
  oldSearchBox.classList.toggle('unDisplayed')
  oldSearchBox.classList.toggle('displayed')
  ButtonSearchBox.classList.toggle("rotate45")
  console.log(newSearchBox);
  console.log("clicked")
  searchResultsContainer.classList.toggle("searchIntoView")
  chatContainingDiv.classList.toggle("hideLeft")

}

function buildOptions(message, sent) {

  switch (sent) {
    case true:
      return `
          <div class="time_reactions_options">

            <div class="messageOptions"> 
              <button class="expandOptions" onClick="messageReference(${message.id})" id="${message.id}reply"><i class='bx bx-share'></i></button>
              <button class="expandOptions" onClick="" id="${message.id}Option"><i class='bx bx-trash-alt' ></i></button>
            </div>
            <div class="time_reactionChoice">
              <div class="reactionChoice">
                <div id="${message.id}-Like" onclick="reactionTo(${message.id}, 'Like')" class="reactionIconChoose">👍</div>
                <div class="reactionName">Like</div>
              </div>
              <div class="reactionChoice">
                <div id="${message.id}-Angry" onclick="reactionTo(${message.id}, 'Laugh')" class="reactionIconChoose">😂</div>
                <div class="reactionName">Laugh</div>
              </div>
              <div class="reactionChoice">
                <div id="${message.id}-Afraid" onclick="reactionTo(${message.id}, 'Wow')" class="reactionIconChoose">😲</div>
                <div class="reactionName">Wow</div>
              </div>
              <div class="reactionChoice">
                <div id="${message.id}-Wrincle" onclick="reactionTo(${message.id}, 'Afraid')" class="reactionIconChoose">😨</div>
                <div class="reactionName">Afraid</div>
              </div>
              <div class="reactionChoice">
                <div id="${message.id}-Wrincle" onclick="reactionTo(${message.id}, 'Angry')" class="reactionIconChoose">😠</div>
                <div class="reactionName">Angry</div>
              </div>
              <div class="reactionChoice">
                <div id="${message.id}-Wrincle" onclick="reactionTo(${message.id}, 'Love')" class="reactionIconChoose">❤️</div>
                <div class="reactionName">Love</div>
              </div>
              <div class="ReactionTime">${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(16, 24)}</div>
            </div> 
            <div id="${message.id}-reactions" class="messageReactions">
              ${buildReaction(message.reactions)}

            </div>
          </div>`
    case false:
      return `
      <div class="time_reactions_options">
        <div id="${message.id}-reactions" class="messageReactions">
          ${buildReaction(message.reactions)}

        </div>
        <div class="time_reactionChoice">
          <div class="ReactionTime">${new Date(message.timeStamp).toString('YYYY-MM-dd').substring(16, 24)}</div>
          <div class="reactionChoice">
            <div id="${message.id}-Like" onclick="reactionTo(${message.id}, 'Like')" class="reactionIconChoose">👍</div>
            <div class="reactionName">Like</div>
          </div>
          <div class="reactionChoice">
            <div id="${message.id}-Angry" onclick="reactionTo(${message.id}, 'Laugh')" class="reactionIconChoose">😂</div>
            <div class="reactionName">Laugh</div>
          </div>
          <div class="reactionChoice">
            <div id="${message.id}-Afraid" onclick="reactionTo(${message.id}, 'Wow')" class="reactionIconChoose">😲</div>
            <div class="reactionName">Wow</div>
          </div>
          <div class="reactionChoice">
            <div id="${message.id}-Wrincle" onclick="reactionTo(${message.id}, 'Afraid')" class="reactionIconChoose">😨</div>
            <div class="reactionName">Afraid</div>
          </div>
          <div class="reactionChoice">
            <div id="${message.id}-Wrincle" onclick="reactionTo(${message.id}, 'Angry')" class="reactionIconChoose">😠</div>
            <div class="reactionName">Angry</div>
          </div>
          <div class="reactionChoice">
            <div id="${message.id}-Wrincle" onclick="reactionTo(${message.id}, 'Love')" class="reactionIconChoose">❤️</div>
            <div class="reactionName">Love</div>
          </div>
        </div> 
        <div class="messageOptions"> 
          <button class="expandOptions" onClick="" id="${message.id}Option"><i class='bx bx-dots-horizontal-rounded'></i></button>
          <button class="expandOptions" onClick="messageReference(${message.id})" id="${message.id}reply"><i class='bx bx-share'></i></button>
        </div>
      </div>`;

    default:
      break;
  }


}

function messageReference(msgID) {
  console.log(msgID)
  if (taggedMessages.includes(msgID)) return;
  let button_emelemnt;
  if (taggedMessages.length < 1) {
    taggedMessages.push(msgID)
    let tag_message_container = document.getElementById("w-input-container")
    let tagField = document.createElement("div")
    tagField.setAttribute("class", "taggedMessageInTying")
    tagField.setAttribute("id", "taggedMessageInTying")

    tag_message_container.prepend(tagField)

    let messageElement = document.getElementById(msgID + "-messageText").cloneNode(true);
    messageElement.setAttribute('id', msgID + "clonedTag");

    let messageToShow = document.createElement('div');
    messageElement.setAttribute('id', msgID + "container");

    //attributes breakdown
    button_emelemnt = document.createElement("button")
    button_emelemnt.setAttribute('class', "btn-remove-tag")
    let button_icon = document.createElement("i")
    button_icon.setAttribute('class', 'bx bx-x-circle')
    //append it to the container
    button_emelemnt.appendChild(button_icon)
    messageToShow.appendChild(button_emelemnt)
    messageToShow.prepend(messageElement)
    tagField.appendChild(messageToShow)
  }
  else {
    taggedMessages.push(msgID)
    let tagField = document.getElementById("taggedMessageInTying")
    let messageElement = document.getElementById(msgID + "-messageText").cloneNode(true);
    messageElement.setAttribute('id', msgID + "clonedTag");

    let messageToShow = document.createElement('div');
    messageElement.setAttribute('id', msgID + "container");

    //attributes breakdown
    button_emelemnt = document.createElement("button")
    button_emelemnt.setAttribute('class', "btn-remove-tag")
    let button_icon = document.createElement("i")
    button_icon.setAttribute('class', 'bx bx-x-circle')
    //append it to the container
    button_emelemnt.appendChild(button_icon)
    messageToShow.appendChild(button_emelemnt)
    messageToShow.prepend(messageElement)
    tagField.appendChild(messageToShow)

    //console.log(messageToShow)
  }
  button_emelemnt.addEventListener('click', function () {
    taggedMessages = taggedMessages.filter((id) => id !== msgID)
    this.parentNode.parentNode.removeChild(this.parentElement)
    if (taggedMessages.length == 0) {
      removeAllTags()
    }

  })
  setFocus()
}

function removeAllTags() {
  taggedMessages = [];
  let tagField = document.getElementById("taggedMessageInTying")
  tagField.parentNode.removeChild(tagField);
}

function buildTags(tagContentArray) {
  let tagTemplate = ``
  tagContentArray.forEach(tag => {
    tagTemplate += `<a href="#${tag.id}" class="message-tag-text">${tag.message}</a>`
  })
  return tagTemplate;
}



/////////////////////SIDEPANEL SWITCH///////////////////////////
let time_scheduling_option = document.getElementById("time-scheduling_panel")
let messages_panel = document.getElementById("messages_panel")
let calls_panel = document.getElementById("calls_panel")

let document_title = document.getElementsByTagName("title")[0]

let time_scheduling_button = document.getElementById("time_scheduling-option")
let message_button = document.getElementById("messages-option")
let calls_button = document.getElementById("calls-option")

let callPopupElement = document.getElementById("incomingCallPopup");
let callHistoryPage = document.getElementById("callHistoryPage")
let ongoingCallPage = document.getElementById("ongoingCallPage")

let incomingNameDiv = document.getElementById("incomingCallname")

time_scheduling_button.addEventListener('click', (e) => {
  time_scheduling_option.style.display = "flex"
  messages_panel.style.display = "none";
  calls_panel.style.display = "none";

  document_title.innerText = "Time Scheduling"
})

message_button.addEventListener('click', (e) => {
  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "flex";
  calls_panel.style.display = "none";

  document_title.innerText = "Messaging"
})

calls_button.addEventListener('click', (e) => {
  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";

  document_title.innerText = "Calls";
})




/////////////////////Call filtering////////////////////////
$(".pill").click(function () {
  $(this).toggleClass("selectedPill");
});

const callParticipantsBtn = document.getElementById("callParticipantsBtn")
const callParticipantsDiv = document.getElementById("callParticipantsDiv")
callParticipantsBtn.addEventListener("click", () => {
  callParticipantsDiv.classList.toggle("displayNoneToggle")
  callParticipantsBtn.classList.toggle("rotate90")
})

////////////////////////////Launch Call function////////////////
function ignoreIncomingCall() {
  callPopupElement.style.display = "none"
}

function closeIncomingCallPopup() {
  callPopupElement.style.display = "none"
}


/////////////////////////Detailed call processing///////////////
/*
let callId;
const PRE = "IMPERIUM"
const SUF = "LINE"
var room_id;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null
var screenSharing = false

let currentCallInfo;

let inCallChatArea = document.getElementById("in-call-chatArea")


const ringtone = new Audio('/audio/imperiumLine.mp3')
ringtone.addEventListener('ended', function () {
  this.currentTime = 0;
  this.play();
}, false);

const waitingTone = new Audio('/audio/callWaiting.mp3')
waitingTone.addEventListener('ended', function () {
  this.currentTime = 0;
  this.play();
}, false);

function call(callTo, audio, video, group, fromChat) {
  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";
  callHistoryPage.style.display = "none";
  ongoingCallPage.style.display = "flex";

  document_title.innerText = "Calls";

  console.log("call", callTo, audio, video, group, fromChat)
  socket.emit("startCall", { callTo, audio, video, group, fromChat })

  createRoom(myPeerId)
}

function createRoom(myPeerId) {
  console.log("Creating Room")
  //let room = document.getElementById("room-input").value;
  if (callId == " " || callId == "") {
    alert("Please enter room number")
    return;
  }
  peer = new Peer(myPeerId)
  peer.on('open', (id) => {
    console.log("Peer Connected with ID: ", id)
    getUserMedia({ video: true, audio: true }, (stream) => {
      local_stream = stream;
      setLocalStream(local_stream)
    }, (err) => {
      console.log(err)
    })

    //Here i will put a waiting message
    console.log(`Room ${room_id} is created`)
    waitingTone.play();
  })
  peer.on('call', (call) => {

    call.answer(local_stream);
    call.on('stream', (stream) => {
      setRemoteStream(stream)
    })
    currentPeer = call;
    waitingTone.pause();
    waitingTone.currentTime = 0;

  })
  peer.on('connection', (chatConnection) => {
    socket.emit("checkUser", chatConnection.label)
    inCallChatArea.innerHTML += `<div class="message-separator"><span>User ${chatConnection.label} joined</span></div>`
    console.log(chatConnection)
  })
  peer.on('data', (data) => {


  })

}

function setLocalStream(stream) {

  //let video = document.getElementById("localVideo");
  let video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.play();

  let secondaryVideosDiv = document.getElementById('secondaryVideosDiv');
  let nameDiv = document.createElement("div");
  nameDiv.innerText = 'Me';
  let secondaryVideoDiv = document.createElement("div")
  secondaryVideoDiv.className = 'secondaryVideo';

  secondaryVideoDiv.appendChild(video);
  secondaryVideoDiv.appendChild(nameDiv);

  
  secondaryVideosDiv.appendChild(secondaryVideoDiv)
}

function setRemoteStream(stream) {

  let video = document.getElementById("remoteVideo");
  video.srcObject = stream;
  video.play();

  let secondaryVideosDiv = document.getElementById('secondaryVideosDiv');
  let nameDiv = document.createElement("div");
  nameDiv.innerText = 'RemoteName';
  let secondaryVideoDiv = document.createElement("div")
  secondaryVideoDiv.className = 'secondaryVideo';

  secondaryVideoDiv.appendChild(video);
  secondaryVideoDiv.appendChild(nameDiv);

  
  secondaryVideosDiv.appendChild(secondaryVideoDiv)
}

function joinRoom(callIdentification) {
  console.log("Joining Room")
  if (callIdentification == " " || callIdentification == "") {
    alert("Incorrect room number")
    return;
  }
  room_id = callIdentification;
  peer = new Peer()
  peer.on('open', (id) => {
    console.log("Connected with Id: " + id)
    getUserMedia({ video: true, audio: true }, (stream) => {
      local_stream = stream;
      setLocalStream(local_stream)
      let call = peer.call(room_id, stream)
      call.on('stream', (stream) => {
        setRemoteStream(stream);
      })
      currentPeer = call;

      let dataconnection = peer.connect(room_id, {label: mySavedID+"" || myID+""})
    }, (err) => {
      console.log(err)
    })

  })
}




let videoSelectPopup = document.getElementById("videoDevicesPopup")
let audioInSelectPopup = document.getElementById("audioInDevicesPopup")


let videoDevicesPop = document.getElementById("videoDevicesPop")
let audioInDevicesPop = document.getElementById("audioInDevicesPop")


// videoDevicesPop.addEventListener("click", ()=>{
//   videoSelectPopup.classList.toggle('is-visible')
// })
// audioDevicesPop.addEventListener("click", ()=>{
//   audioInSelectPopup.classList.toggle('is-visible')
// })

// navigator.mediaDevices.enumerateDevices().then(function (devices) {
//   for(var i = 0; i < devices.length; i ++){
//       var device = devices[i];
//       if (device.kind === 'videoinput') {
//           var option = document.createElement('div');
//           option.value = device.deviceId;
//           option.innerText = device.label || 'camera ' + (i + 1);
//           videoSelectPopup.appendChild(option);
//       }
//   };
// });
// navigator.mediaDevices.enumerateDevices().then(function (devices) {
//   for(var i = 0; i < devices.length; i ++){
//       var device = devices[i];
//       if (device.kind === 'videoinput') {
//           var option = document.createElement('div');
//           option.value = device.deviceId;
//           option.innerText = device.label || 'camera ' + (i + 1);
//           videoSelectPopup.appendChild(option);
//       }
//   };
// });


function removeAudio() {
  if (!local_stream) return;
  for (let index in local_stream.getAudioTracks()) {
    local_stream.getAudioTracks()[index].enabled = !local_stream.getAudioTracks()[index].enabled
    local_stream.getAudioTracks()[index].enabled ? audioInDevicesPop.classList.remove("red-bg") : audioInDevicesPop.classList.add("red-bg")
    //audioInDevicesPop.classList.add("red-bg")
  }
}
function removeVideo() {
  if (!local_stream) return;
  for (let index in local_stream.getAudioTracks()) {
    local_stream.getVideoTracks()[index].enabled = !local_stream.getVideoTracks()[index].enabled
    local_stream.getVideoTracks()[index].enabled ? videoDevicesPop.classList.remove("red-bg") : videoDevicesPop.classList.add("red-bg")
    //audioInDevicesPop.classList.add("red-bg")
  }
}

function toggleScreenSharing() {

  if (screenSharing) {
    stopScreenSharing()

    console.log("stopping screenshare")
  }
  else {
    startScreenShare()

    console.log("Initiating screenshare")
  }
}

function startScreenShare() {
  if (screenSharing) {
    stopScreenSharing()
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
    screenStream = stream;
    let videoTrack = screenStream.getVideoTracks()[0];
    videoTrack.onended = () => {
      stopScreenSharing()
    }
    if (peer) {
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(videoTrack)
      screenSharing = true
      document.getElementById("toggleScreenSharing").classList.add("red-bg")
    }
    console.log(screenStream)
  })
}

function stopScreenSharing() {
  if (!screenSharing) return;
  let videoTrack = local_stream.getVideoTracks()[0];
  if (peer) {
    let sender = currentPeer.peerConnection.getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    })
    sender.replaceTrack(videoTrack)
    document.getElementById("toggleScreenSharing").classList.remove("red-bg")
  }
  screenStream.getTracks().forEach(function (track) {
    track.stop();
  });
  screenSharing = false
}

socket.on('incomingCall', data => {
  console.log(data)
  currentCallInfo = data;

  callPopupElement.style.display = "flex";
  //room_id = PRE + callId + SUF;

  ringtone.play();
  incomingNameDiv.innerText = currentCallInfo.caller.name+ " " +currentCallInfo.caller.surname
  
  // if(group == false) return incomingNameDiv.innerText = callerInfo.name + ' ' + callerInfo.surname;
  // incomingNameDiv.innerText = callerInfo.map((caller)=>{ return caller.name+" "+callerInfo.surname}).join();
  
})

function answer(currentCallInfo) {
  ringtone.pause();
  ringtone.currentTime = 0;

  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";
  callHistoryPage.style.display = "none";
  ongoingCallPage.style.display = "flex";

  document_title.innerText = "Calls";

  callPopupElement.style.display = "none"

  createRoom(myPeerId)

  currentCallInfo.groupMembersToCall_fullInfo.forEach(member => {
    if (member.userProfileIdentifier.userID != mySavedID){
      joinRoom(member.peerId)
    }
  })
  

}*/

/////////////////////////////Call LOG/////////////////////
socket.on('updateCallLog', (initialCallLog) => {
  /**
   * 
   * {
    "id": 490,
    "callUniqueId": "I2bB39xUKy4x8eWzg6o5",
    "callId": 289,
    "participantId": 3,
    "stillParticipating": 0,
    "initiatorId": 0,
    "startDate": "2022-02-28T17:03:42.000Z",
    "initiator": {
        "userID": 1,
        "name": "Test1Name",
        "surname": "Test1Surname",
        "profilePicture": "/images/profiles/user-128.png"
    },
    "participantsOnCall": [],
    "participantsOffCall": [
        {
            "userID": 3,
            "name": "Test3Name",
            "surname": "Test3Surname",
            "profilePicture": null
        },
        {
            "userID": 7,
            "name": "Test",
            "surname": "User7",
            "profilePicture": null
        }
    ]
  }
   */
  let callLogDiv = document.getElementById('list-call-section-content')
  callLogDiv.innerHTML = ``;
  initialCallLog.forEach(callLog => {

    let uniqueId_call = callLog.callUniqueId;
    let callogClass = "";
    if (callLog.participantsOnCall.length > 0) callogClass = "ongoing";

    let callDate = new Date(callLog.startDate)
    let prPicture = callLog.initiator.profilePicture ? "<img src='" + callLog.initiator.profilePicture + "'alt='" + callLog.initiator.name.charAt(0) + callLog.initiator.surname.charAt(0) + "'>" : "<div>" + callLog.initiator.name.charAt(0) + callLog.initiator.surname.charAt(0) + "</div>"
    let callDirection = callLog.initiator.userID == mySavedID ? "<div class='callType green'><i class='bx bxs-phone-outgoing'></i>Outgoing</div>" : "<div class='callType blue'><i class='bx bxs-phone-incoming'></i>Incoming</div>";
    if (callLog.missed == 1) {
      callDirection = "<div class='callType red'><i class='bx bxs-phone-off'></i>Missed</div>"
      callogClass = "missed";
    }
    let template = `
    <div class="call-log ${callogClass}" id="log${callLog.callUniqueId}" >
        <div class="line1">
            <div class="picture">
              ${prPicture}
            </div>
            <div class="nameAndType">
                <div class="callMembers">${callLog.initiator.name + ' ' + callLog.initiator.surname}</div>
                ${//<div class="callType blue"><i class='bx bxs-phone-incoming'></i>Incoming</div>
      callDirection
      }
            </div>
            <div class="dateTime">${callDate.toString('YYYY-MM-dd').substring(0, 24)}</div>
            <!--<div class="duration">&bull; 12 min</div>-->
            <div class="universalCallButtons">
                <button class="audioFromCallog" data-id="${callLog.callUniqueId}"><i class="bx bxs-phone"></i></button>
                <button class="videoFromCallog" data-id="${callLog.callUniqueId}"><i class="bx bxs-video-recording"></i></button>
                <button class="detailsFromCallog" data-id="${callLog.callUniqueId}"><i class='bx bx-chevron-right'></i></button>
            </div>
        </div>
        <div class="line2">
            ${listOfParticipants(callLog.participantsOnCall, "green-bg")}
            ${listOfParticipants(callLog.participantsOffCall, "orange-bg")}
        </div>
    </div>
    `

    callLogDiv.innerHTML += template;

  })


  function listOfParticipants(participantsArray, backgroundClass) {
    let userTemplate = ``;
    participantsArray.forEach(participant => {
      if (participant.profilePicture == null) userTemplate += `
      <div class="picture ${backgroundClass}" title='${participant.name + ' ' + participant.surname}'>
        <div>${participant.name.charAt(0) + participant.surname.charAt(0)}</div>
      </div>`
      else {
        userTemplate += `
        <div class="picture ${backgroundClass}" title='${participant.name + ' ' + participant.surname}'>
          <img src="${participant.profilePicture}"alt="${participant.name.charAt(0) + participant.surname.charAt(0)}">
        </div>`
      }
    })

    return userTemplate;
  }
  document.querySelectorAll(".audioFromCallog").forEach(log => {
    log.addEventListener('click', (e) => {
      let logId = log.getAttribute('data-id');
      console.log(logId)
      //call(callTo, audio, video, group, fromChat, previousCallId)
      call(logId, true, false, true, false, logId)
      showOngoingCallSection()
    })
  })
  document.querySelectorAll(".videoFromCallog").forEach(log => {
    log.addEventListener('click', (e) => {
      let logId = log.getAttribute('data-id');
      console.log(logId)
      //call(callTo, audio, video, group, fromChat, previousCallId)
      call(logId, true, true, true, false, logId)
      showOngoingCallSection()
    })
  })
  document.querySelectorAll(".detailsFromCallog").forEach(log => {
    log.addEventListener('click', (e) => {
      let logId = log.getAttribute('data-id');
      console.log(logId)
      socket.emit('callDetails', callUniqueId)
    })
  })
})


/////////////////////////////////CALL LOG END//////////////////////

let secondaryVideosDiv = document.getElementById('secondaryVideosDiv')
const myPeer = new Peer(undefined,
  /*{
  host: '/',
  port: '3001'
}
*/)
let myPeerId;
const myVideo = document.createElement('video')

let videoSelectPopup = document.getElementById("videoDevicesPopup")
let audioInSelectPopup = document.getElementById("audioInDevicesPopup")

let videoDevicesPop = document.getElementById("videoDevicesPop")
let audioInDevicesPop = document.getElementById("audioInDevicesPop")

myVideo.muted = true
const peers = {}
let tream;
let currentCallInfo;

var screenSharing = false;
var screenStream;

let largeVideo = document.getElementById('largeVideo')
let largeVideoName = document.getElementById('largeVideoName')

//ringtone preparation
const ringtone = new Audio('/audio/imperiumLine.mp3')
ringtone.addEventListener('ended', function () {
  this.currentTime = 0;
  this.play();
}, false);

const waitingTone = new Audio('/audio/callWaiting.mp3')
waitingTone.addEventListener('ended', function () {
  this.currentTime = 0;
  this.play();
}, false);

// async function prepareMediaDevices() {
//   const stream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: true
//   });
//   tream = stream;
//   addVideoStream(myVideo, stream, myPeerId);
// }

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  tream = stream
  addVideoStream(myVideo, stream, myPeerId)
})


socket.on('incomingCall', data => {
  currentCallInfo = data;
  incomingNameDiv.innerText = currentCallInfo.caller.name + " " + currentCallInfo.caller.surname
  callPopupElement.style.display = "flex";
  ringtone.play()
})

socket.on('prepareCallingOthers', data => {
  currentCallInfo = data;
})

socket.on('user-connected', userId => {
  console.log('user connected', userId)
  connectToNewUser(userId, tream)
})

socket.on('user-disconnected', peerIdToRemove => {
  removeUser(peerIdToRemove)
})

myPeer.on('open', id => {
  console.log('a peer is opened: ', id)
  myPeerId = id;
})

//for testing only
function show_conncted_users() {
  socket.emit('showConnectedUsers')
}

function call(callTo, audio, video, group, fromChat, previousCallId) {
  //prepareMediaDevices()
  socket.emit("join-room", { callTo, audio, video, group, fromChat, previousCallId })
  showOngoingCallSection()
  waitingTone.play();
}

myPeer.on('call', call => {
  //prepareMediaDevices()
  call.answer(tream)
  console.log('call answered', call)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, call.peer)
    console.log('incoming call', call)
  })

  waitingTone.pause();
  waitingTone.currentTime = 0;
})

function removeUser(peerId) {
  if (peers[peerId]) {
    peers[peerId].close();
    delete peers[peerId];
  }
  let videoToRemove = document.getElementById(peerId);
  if (videoToRemove) videoToRemove.remove();
  if (Object.keys(peers).length < 1) {
    showCallHistory();
  }
}

function connectToNewUser(userId, stream) {
  if (peers[userId]) return;
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, userId)
  })
  call.on('close', () => {
    video.remove()
    delete peers[userId]
  })

  peers[userId] = call
}

function addVideoStream(video, stream, peerId) {
  let previousSecondaryVideo = document.getElementById(peerId)

  if (previousSecondaryVideo) {
    previousSecondaryVideo.innerHTML = '';
    previousSecondaryVideo.className = 'secondaryVideo'
    previousSecondaryVideo.id = peerId;

    let name = document.createElement('div')
    name.className = 'name'
    name.innerText = 'Me'

    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    video.addEventListener('click', () => {
      largeVideo.srcObject = video.srcObject;
      largeVideoName.innerHTML = 'me'
    })
    previousSecondaryVideo.append(video, name)
    //secondaryVideo.appendChild(name)

    secondaryVideosDiv.append(previousSecondaryVideo)
    //console.log('invoked by: ', stream)
  } else {
    let secondaryVideo = document.createElement('div')
    secondaryVideo.className = 'secondaryVideo'
    secondaryVideo.id = peerId;

    let name = document.createElement('div')
    name.className = 'name'
    name.innerText = 'Me'

    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    video.addEventListener('click', () => {
      largeVideo.srcObject = video.srcObject;
      largeVideoName.innerHTML = 'me'
    })
    secondaryVideo.append(video, name)
    //secondaryVideo.appendChild(name)

    secondaryVideosDiv.append(secondaryVideo)
    //console.log('invoked by: ', stream)
  }

}

function answer(currentCallInfo) {
  hideIncomingCallPopup()
  showOngoingCallSection()
  socket.emit("answerCall", { myPeerId, callUniqueId: currentCallInfo.callUniqueId })
  ringtone.pause();
  ringtone.currentTime = 0;
}
function hangUpCall(currentCallInfo) {
  showCallHistory()
  socket.emit('leaveCall', { myPeerId, callUniqueId: currentCallInfo.callUniqueId })
}

function showIncomingCallPopup() {
  callPopupElement.style.display = "flex";
}
function hideIncomingCallPopup() {
  callPopupElement.style.display = "none";
}
function showOngoingCallSection() {
  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";
  callHistoryPage.style.display = "none";
  ongoingCallPage.style.display = "flex";

  document_title.innerText = "Calls";
}
function showCallHistory() {
  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";
  callHistoryPage.style.display = "flex";
  ongoingCallPage.style.display = "none";

  document_title.innerText = "Calls";
}
function showMessagesPanel() {
  time_scheduling_option.style.display = "none"
  messages_panel.style.display = "flex";
  calls_panel.style.display = "none";
  callHistoryPage.style.display = "none";
  ongoingCallPage.style.display = "none";

  document_title.innerText = "Messages";
}

//functional buttons//////////////////
function removeAudio() {
  if (!tream) return;
  for (let index in tream.getAudioTracks()) {
    tream.getAudioTracks()[index].enabled = !tream.getAudioTracks()[index].enabled
    tream.getAudioTracks()[index].enabled ? audioInDevicesPop.classList.remove("red-bg") : audioInDevicesPop.classList.add("red-bg")
  }
}
function removeVideo() {
  if (!tream) return;
  for (let index in tream.getAudioTracks()) {
    tream.getVideoTracks()[index].enabled = !tream.getVideoTracks()[index].enabled
    tream.getVideoTracks()[index].enabled ? videoDevicesPop.classList.remove("red-bg") : videoDevicesPop.classList.add("red-bg")
  }
}

function toggleScreenSharing() {
  if (screenSharing) {
    stopScreenSharing()
    console.log("stopping screenshare")
  }
  else {
    startScreenShare()
    console.log("Initiating screenshare")
  }
}

function startScreenShare() {
  if (screenSharing) {
    stopScreenSharing()
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
    screenStream = stream;
    let videoTrack = screenStream.getVideoTracks()[0];
    videoTrack.onended = () => {
      stopScreenSharing()
    }
    if (myPeer) {

      for (const property in peers) {
        let currentPeer = peers[property];
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
      }
      screenSharing = true
      document.getElementById("toggleScreenSharing").classList.add("red-bg")
    }
    console.log(screenStream)
  })
}

function stopScreenSharing() {
  if (!screenSharing) return;
  let videoTrack = tream.getVideoTracks()[0];
  if (myPeer) {

    for (const property in peers) {
      let currentPeer = peers[property];
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      })
      sender.replaceTrack(videoTrack)
    }

    document.getElementById("toggleScreenSharing").classList.remove("red-bg")
  }
  screenStream.getTracks().forEach(function (track) {
    track.stop();
  });
  screenSharing = false
}


///////Video Sizing//////////////////////
function toggleFullscreen() {
  let elem = document.querySelector('#call-main');

  if (!document.fullscreenElement) {
    document.getElementById("gotoFullscreen").classList.add('red-bg')
    elem.requestFullscreen().catch(err => {
      document.getElementById("gotoFullscreen").classList.remove('red-bg')
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  } else {
    document.exitFullscreen();
    document.getElementById("gotoFullscreen").classList.remove('red-bg')
  }
}