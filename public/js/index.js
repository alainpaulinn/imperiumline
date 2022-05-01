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
let workShifts_btn = document.getElementById("workShifts-btn")
let messaging_btn = document.getElementById("messaging-btn")
let calls_btn = document.getElementById("calls-btn")
let preferences_btn = document.getElementById("preferences-btn")
let profile_btn = document.getElementById("profile-btn")

let timeScheduling_div = document.getElementById("timeScheduling-div")
let workShifts_div = document.getElementById("workShifts-div")
let messaging_div = document.getElementById("messaging-div")
let calls_div = document.getElementById("calls-div")
let preferences_div = document.getElementById("preferences-div")
let profile_div = document.getElementById("profile-div")

document.getElementById("timeScheduling-btn").addEventListener('click', () => {
  timeScheduling_div.classList.toggle("undropped-down")
  timeScheduling_btn.firstChild.classList.toggle("rotate180")
})
document.getElementById("workShifts-btn").addEventListener('click', () => {
  workShifts_div.classList.toggle("undropped-down")
  workShifts_btn.firstChild.classList.toggle("rotate180")
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
            "profilePicture": "/private/profiles/user-128.png"
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
            "profilePicture": "/private/profiles/user-128.png"
        }
    ],
    "roomName": null,
    "profilePicture": "/private/profiles/user-128.png",
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
        "profilePicture": "/private/profiles/user-128.png"
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

      if (profilePicture === null) { avatar = `<img class="c-openchat__box__pp" src='/private/profiles/group.jpeg' alt=''></img>` }
      else avatar = `<img class="c-openchat__box__pp" src='${profilePicture}' alt=''></img>`;

      // groupId, audiocall = true, videoCall = false, is a group = true;
      callOptions = `
        <button onclick="" title="Set/Change this Conversation's name"><i class='bx bxs-edit-alt'></i></button>
        <button onclick="" title="Add/Remove people from this Conversation"><i class='bx bxs-user-plus' ></i></button>
        <button onclick="call(${roomID}, true, false, false, true, null)" title="Initiate a call"><i class="bx bxs-phone"></i></button>
        <button ><i class='bx bx-chevron-right' title="More"></i></button>
      `
      break;
    case 0:
      var otherUser = usersArray.filter(user => {
        return user.userID !== myID
      })

      if (otherUser.length > 0) {
        chatTitle = otherUser[0].name + ' ' + otherUser[0].surname;
        callOptions = `
        <button onclick="call(${roomID}, true, false, false, true, null)" title="Initiate audio call"><i class="bx bxs-phone"></i></button>
        <button onclick="call(${roomID}, true, true, false, true, null)" title="Initiate video call"><i class='bx bxs-video'></i></button>
        <button ><i class='bx bx-chevron-right' title="More"></i></button>
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

      //sender's name
      let sendersName = ''
      if (receivedGroup === '') {
        sendersName = `<div class="senderOriginName">${message.userInfo.name + ' ' + message.userInfo.surname}</div>`
      }
      receivedGroup =
        `<div class="message-received" id="${message.id}">
          <div class="message-received-text" id="${message.id}-messageText">${
        //message.userID +": " + 
        tagTemplate + message.message
        //+" "+new Date(message.timeStamp).toString('YYYY-MM-dd')
        }</div>
          ${buildOptions(message, false)}
          ${sendersName}
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
      let fDate = [
        (unfDate.getFullYear() + ''),
        ((unfDate.getMonth() + 1) + '').padStart(2, "0"),
        (unfDate.getDate() + '').padStart(2, "0")].join('-')
        + ' ' +
        [(unfDate.getHours() + '').padStart(2, "0"),
        (unfDate.getMinutes() + '').padStart(2, "0"),
        (unfDate.getSeconds() + '').padStart(2, "0")].join(':');
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
      let unfDate = new Date();
      let fDate = [
        (unfDate.getFullYear() + ''),
        ((unfDate.getMonth() + 1) + '').padStart(2, "0"),
        (unfDate.getDate() + '').padStart(2, "0")].join('-')
        + ' ' +
        [(unfDate.getHours() + '').padStart(2, "0"),
        (unfDate.getMinutes() + '').padStart(2, "0"),
        (unfDate.getSeconds() + '').padStart(2, "0")].join(':');
      let message =
      {
        toRoom: selectedChatId,
        message: messageContent.innerText,
        timeStamp: fDate,
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
            "profilePicture": "/private/profiles/user-128.png"
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
                  <div class="senderOriginName">${
          //sender's Name 
          message.userInfo.name + ' ' + message.userInfo.surname}</div>
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
                  <div class="senderOriginName">${expectedUser.name + ' ' + expectedUser.surname}</div>
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
                  <div class="senderOriginName">${expectedUser.name + ' ' + expectedUser.surname}</div>
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
      `<li class="resultItem" id="user${searchPerson.userID}">
      <div data-id="" class="resultItemBundle" href="" title="">
        <div class="containerImage">
          ${searchAvatar}
        </div>
        <div class="person-data">
          <div class="nameSurnamePosition">
            <p class="resultsNameSurname">${searchPerson.name + " " + searchPerson.surname}</p>
            <p class="resultsPosition">${searchPerson.email}</p>
            <p class="resultsquote">${searchPerson.role}</p>
          </div>
          <div class="universalCallButtons">
            <button id="${searchPerson.userID}chatButton" class='searchChatButton'><i class='bx bxs-message-square-add' ></i></button>
            <button id="${searchPerson.userID}audioButton" class='searchAudioButton'><i class='bx bxs-phone' ></i></button>
            <button id="${searchPerson.userID}videoButton" class='searchVideoButton'><i class='bx bxs-video-recording' ></i></button>
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
      socket.emit('makeChat', this.id.slice(0, -10))
      ITriggeredChatCreation = true;
    })
  })
  let searchAudioButtons = document.querySelectorAll('.searchAudioButton')
  searchAudioButtons.forEach(searchAudioButton => {
    searchAudioButton.addEventListener('click', function () {
      console.log("AUDIO", this.id)
      call(this.id.slice(0, -11), true, false, false, false, null)
    })
  })
  let searchVideoButtons = document.querySelectorAll('.searchVideoButton')
  searchVideoButtons.forEach(searchVideoButton => {
    searchVideoButton.addEventListener('click', function () {
      console.log("VIDEO", this.id)
      call(this.id.slice(0, -11), true, true, false, false, null)
    })
  })
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
let time_scheduling_panel = document.getElementById("time-scheduling_panel")
let work_shift_panel = document.getElementById("work_shifts_Panel")
let messages_panel = document.getElementById("messages_panel")
let calls_panel = document.getElementById("calls_panel")

let document_title = document.getElementsByTagName("title")[0]

let time_scheduling_button = document.getElementById("time_scheduling-option")
let work_shifts_button = document.getElementById("work_shifts-option")
let message_button = document.getElementById("messages-option")
let calls_button = document.getElementById("calls-option")

let callHistoryPage = document.getElementById("callHistoryPage")
let ongoingCallPage = document.getElementById("ongoingCallPage")

let incomingNameDiv = document.getElementById("incomingCallname")

let functionalityOptionsArray = [
  {
    functionalityId: 1,
    panel: time_scheduling_panel,
    triggerButton: time_scheduling_button,
    title: "Calendar"
  },
  {
    functionalityId: 2,
    panel: work_shift_panel,
    triggerButton: work_shifts_button,
    title: "Work Shifts"
  },
  {
    functionalityId: 3,
    panel: messages_panel,
    triggerButton: message_button,
    title: "Messages"
  },
  {
    functionalityId: 4,
    panel: calls_panel,
    triggerButton: calls_button,
    title: "Calls"
  },
]

setSidepanelEventlisteners(functionalityOptionsArray)

function setSidepanelEventlisteners(optionsArray) {
  // let optionsArray = [{
  //  functionalityId: 1,
  //   panel: "objectPanel",
  //   triggerButton: "objectTrigger",
  //   title: "title"
  // }]
  optionsArray.forEach((option) => {
    option.triggerButton.addEventListener("click", () => {
      for (let i = 0; i < optionsArray.length; i++) {
        if (optionsArray[i].functionalityId != option.functionalityId) {
          optionsArray[i].panel.style.display = "none";
        }
        option.panel.style.display = "flex";
        document_title.innerText = option.title;
      }
    })
  })

}

function updateSidePanel(sidepanelOptions) {


}




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
        "profilePicture": "/private/profiles/user-128.png"
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
/////////////////////////////////in call controls//////////////////
let mainVideoElement = document.getElementById('mainVideoElement')
let fitVideoToWindowBtn = document.getElementById('fitVideoToWindowBtn')

let participantsSelectorBtn = document.getElementById("participantsSelectorBtn")
let messagesSelectorbtn = document.getElementById("messagesSelectorbtn")

let rightCallParticipantsDiv = document.getElementById("rightCallParticipantsDiv")
let rightCallMessagesDiv = document.getElementById("rightCallMessagesDiv")

participantsSelectorBtn.addEventListener("click", () => {
  participantsSelectorBtn.classList.add("headerItemSelected")
  messagesSelectorbtn.classList.remove("headerItemSelected")

  rightCallMessagesDiv.classList.add("hideDivAside")
  rightCallParticipantsDiv.classList.remove("hideDivAside")
})
messagesSelectorbtn.addEventListener("click", () => {
  participantsSelectorBtn.classList.remove("headerItemSelected")
  messagesSelectorbtn.classList.add("headerItemSelected")

  rightCallMessagesDiv.classList.remove("hideDivAside")
  rightCallParticipantsDiv.classList.add("hideDivAside")

  messagesSelectorbtn.textContent = "Messages"
})

let presenceSelectorBtn = document.getElementById("presenceSelectorBtn")
let absenceSelectorBtn = document.getElementById("absenceSelectorBtn")

let presentMembersDiv = document.getElementById("presentMembersDiv")
let absentMembersDiv = document.getElementById("absentMembersDiv")
let mainVideoDiv = document.getElementById('mainVideoDiv')

presenceSelectorBtn.addEventListener('click', (e) => {
  presenceSelectorBtn.classList.add("headerItemSelected")
  absenceSelectorBtn.classList.remove("headerItemSelected")

  presentMembersDiv.style.display = "flex"
  absentMembersDiv.style.display = "none"
})

absenceSelectorBtn.addEventListener('click', (e) => {
  absenceSelectorBtn.classList.add('headerItemSelected')
  presenceSelectorBtn.classList.remove("headerItemSelected")

  presentMembersDiv.style.display = "none"
  absentMembersDiv.style.display = "flex"
})



/////////////////////////////////CALL LOG END//////////////////////

let secondaryVideosDiv = document.getElementById('secondaryVideosDiv')
const myPeer = new Peer(undefined, { host: 'peer.imperiumline.com', secure: true })
const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

let videoSelectPopup = document.getElementById("videoDevicesPopup")
let audioInSelectPopup = document.getElementById("audioInDevicesPopup")

let videoDevicesPop = document.getElementById("videoDevicesPop")
let audioInDevicesPop = document.getElementById("audioInDevicesPop")


let tream;

var screenSharing = false;
var screenStream;


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

socket.on('user-disconnected', peerIdToRemove => {
  removeUser(peerIdToRemove)
})

//for testing only
function show_conncted_users() {
  socket.emit('showConnectedUsers')
}

function showOngoingCallSection() {
  time_scheduling_panel.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";
  callHistoryPage.style.display = "none";
  ongoingCallPage.style.display = "flex";

  document_title.innerText = "Calls";
}
function showCallHistory() {
  time_scheduling_panel.style.display = "none"
  messages_panel.style.display = "none";
  calls_panel.style.display = "flex";
  callHistoryPage.style.display = "flex";
  ongoingCallPage.style.display = "none";

  document_title.innerText = "Calls";
}
function showMessagesPanel() {
  time_scheduling_panel.style.display = "none"
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
    console.log('track', track);
    track.stop();
    stream.removeTrack(track);
  });
  screenSharing = false
}


///////Video Sizing//////////////////////
function toggleFullscreen(element) {
  if (!document.fullscreenElement) { element.requestFullscreen().catch(err => { alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`); }); }
  else { document.exitFullscreen(); }
}


//calls renovation -------------------------------------------------------------------------------------------------

// when my peer is ready with an ID ---> this means that we cannot receive a call before a peer Id is opened
myPeer.on('open', myPeerId => {
  //all connected Peers variable
  let myStream;
  let allInvitedUsers;
  let receivedUsers = 0;

  socket.on('prepareCallingOthers', initiatedCallInfo => {
    navigator.getUserMedia({ video: true, audio: true }, stream => {
      let { callUniqueId, caller, groupMembersToCall_fullInfo, allUsers } = initiatedCallInfo
      let { userID, name, surname, profilePicture, role } = caller
      //put create and append my sidevideo
      let mySideVideoDiv = createSideVideo(stream, { videoOwner: { name: name, surname: surname, id: userID } })
      rightCallParticipantsDiv.append(mySideVideoDiv)

      // create awaited users divs
      let awaitedUserDivs = allUsers.map(user => {
        //let { userID, name, surname, role, profilePicture, status } = user
        let targetedUser = groupMembersToCall_fullInfo.find(member => member.userProfileIdentifier.userID == user.userID);
        if (targetedUser == undefined) {

          let ringTextForMe = user.userID === caller.userID ? 'Waiting ...' : 'User Offline';
          let ringIconForMe = user.userID === caller.userID ? 'bx bxs-hourglass' : 'bx bxs-phone-off';

          let offlineIcon = createElement({ type: 'i', class: ringIconForMe })
          let offlineText = createElement({ type: 'p', textContent: ringTextForMe })
          let offlineButton = createElement({ type: 'button', childrenArray: [offlineIcon, offlineText] })

          let chatIcon = createElement({ type: 'i', class: 'bx bxs-message-square-detail' })
          let chatButton = createElement({ type: 'button', childrenArray: [chatIcon] })

          let actions = [
            { element: offlineButton, functionCall: () => { } },
            { element: chatButton, functionCall: () => { console.log('chat with user', userID) } }]
          return { userID: user.userID, div: userForAttendanceList(user, actions) }
        }
        else {

          let ringIcon = createElement({ type: 'i', class: 'bx bxs-bell-ring' })
          let ringText = createElement({ type: 'p', textContent: 'Ringing...' })
          let ringButton = createElement({ type: 'button', childrenArray: [ringIcon, ringText] })

          let chatIcon = createElement({ type: 'i', class: 'bx bxs-message-square-detail' })
          let chatButton = createElement({ type: 'button', childrenArray: [chatIcon] })

          let actions = [
            { element: ringButton, functionCall: () => { console.log('ringing', userID) } },
            { element: chatButton, functionCall: () => { console.log('chat with user', userID) } }
          ]
          return { userID: user.userID, div: userForAttendanceList(user, actions) }
        }
      })
      console.log("awaitedUserDivs", awaitedUserDivs)

      //create Cover waiting
      let videoCoverDiv = videoConnectingScreen(prepareVideoCoverDiv(allUsers, caller, 'Dialling...', awaitedUserDivs))
      mainVideoDiv.prepend(videoCoverDiv.videoCoverDiv)

      myInfo = caller
      myStream = stream
      //put Users on absence list
      allInvitedUsers = setAllUsers(allUsers)
      updateAttendanceList(caller, 'present')

      handleOutgoingPeerCalls(caller, videoCoverDiv.videoCoverDiv)

      let { chooseVideoOutputDeviceBtn, closeVideoBtn, HangUpBtn, muteMicrophoneBtn, chooseAudioOutputDeviceBtn } = videoCoverDiv.controls
      HangUpBtn.addEventListener('click', () => {
        socket.emit('cancelCall')
        mySideVideoDiv.remove();
        stopWaitingTone() //on the first call of event 'connectUser' if we are the caller: close the waiting tone
        videoCoverDiv.videoCoverDiv.remove() //on the first call of event 'connectUser' if we are the caller: remove waiting div
        receivedUsers = 0;
        updateAttendanceList(caller, 'absent')
        stream.getTracks().forEach((track) => { console.log('track', track); track.stop(); stream.removeTrack(track); })
        myStream.getTracks().forEach((track) => { console.log('track', track); myStream.stop(); myStream.removeTrack(track); })
      })

      //Handle RejectedCall
      socket.on('callRejected', timeoutDetails => {
        console.log('remote call Rejected')
        let { callUniqueId, userInfo } = timeoutDetails

        for (let i = 0; i < awaitedUserDivs.length; i++) {
          const awaitedDiv = awaitedUserDivs[i];
          if (awaitedDiv.userID == userInfo.userID) {

            let memberProfilePicture;
            if (profilePicture == null) memberProfilePicture = createElement({ type: 'div', class: 'memberProfilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
            else memberProfilePicture = createElement({ type: 'img', class: 'memberProfilePicture', src: userInfo.profilePicture })

            let memberName = createElement({ type: 'div', class: 'memberName', textContent: userInfo.name + ' ' + userInfo.surname })
            let memberRole = createElement({ type: 'div', class: 'memberRole', textContent: userInfo.role })
            let memberNameRole = createElement({ type: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

            let ringIcon = createElement({ type: 'i', class: 'bx bx-x' })
            let ringText = createElement({ type: 'p', textContent: 'Rejected' })
            let ringButton = createElement({ type: 'button', childrenArray: [ringIcon, ringText] })


            let chatIcon = createElement({ type: 'i', class: 'bx bxs-message-square-detail' })
            let chatButton = createElement({ type: 'button', childrenArray: [chatIcon] })
            chatButton.addEventListener('click', () => console.log('chat with USER', userInfo.userID))

            let ringAgainIcon = createElement({ type: 'i', class: 'bx bxs-bell-ring' })
            let ringAgainText = createElement({ type: 'p', textContent: 'Ring Again' })
            let ringAgainButton = createElement({ type: 'button', childrenArray: [ringAgainIcon, ringAgainText] })
            ringAgainButton.addEventListener('click', () => console.log('ring again USER', userInfo.userID))

            awaitedDiv.div.textContent = '';
            awaitedDiv.div.append(memberProfilePicture, memberNameRole, ringButton, chatButton, ringAgainButton)
          }
        }
      })

      //Handle TimedOutCall
      socket.on('callNotAnswered', timeoutDetails => {
        console.log('remote call not answered')
        let { callUniqueId, userInfo } = timeoutDetails
        for (let i = 0; i < awaitedUserDivs.length; i++) {
          const awaitedDiv = awaitedUserDivs[i];
          if (awaitedDiv.userID == userInfo.userID) {

            let memberProfilePicture;
            if (profilePicture == null) memberProfilePicture = createElement({ type: 'div', class: 'memberProfilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
            else memberProfilePicture = createElement({ type: 'img', class: 'memberProfilePicture', src: userInfo.profilePicture })

            let memberName = createElement({ type: 'div', class: 'memberName', textContent: userInfo.name + ' ' + userInfo.surname })
            let memberRole = createElement({ type: 'div', class: 'memberRole', textContent: userInfo.role })
            let memberNameRole = createElement({ type: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

            let ringIcon = createElement({ type: 'i', class: 'bx bx-x' })
            let ringText = createElement({ type: 'p', textContent: 'Not answered' })
            let ringButton = createElement({ type: 'button', childrenArray: [ringIcon, ringText] })


            let chatIcon = createElement({ type: 'i', class: 'bx bxs-message-square-detail' })
            let chatButton = createElement({ type: 'button', childrenArray: [chatIcon] })
            chatButton.addEventListener('click', () => console.log('chat with USER', userInfo.userID))

            let ringAgainIcon = createElement({ type: 'i', class: 'bx bxs-bell-ring' })
            let ringAgainText = createElement({ type: 'p', textContent: 'Ring Again' })
            let ringAgainButton = createElement({ type: 'button', childrenArray: [ringAgainIcon, ringAgainText] })
            ringAgainButton.addEventListener('click', () => console.log('ring again USER', userInfo.userID))

            awaitedDiv.div.textContent = '';
            awaitedDiv.div.append(memberProfilePicture, memberNameRole, ringButton, chatButton, ringAgainButton)
          }
        }

      })
    }, (err) => { alert('Failed to get local media stream', err); });
  })
  socket.on('incomingCall', incomingCallInfo => {
    let { callUniqueId, caller, myInfo, allUsers } = incomingCallInfo
    let { name, profilePicture, surname, userID } = caller

    let responded = false;
    let notification = displayNotification({
      title: { iconClass: 'bx bxs-phone-call', titleText: 'Incoming call' },
      body: {
        shortOrImage: {
          shortOrImagType: profilePicture == null ? 'short' : 'image',
          shortOrImagContent: profilePicture == null ? name.charAt(0) + surname.charAt(0) : profilePicture
        },
        bodyContent: 'Incoming call from' + name + ' ' + surname //+ (groupMembersToCall_fullInfo.length == 1 ? '.' : ' with ' + (groupMembersToCall_fullInfo.length - 1) + ' other' + ((groupMembersToCall_fullInfo.length - 1) > 1 ? 's.' : '.'))
      },
      actions: [
        { type: 'normal', displayText: 'Reject', actionFunction: () => { socket.emit("callRejected", callUniqueId); responded == true } },
        {
          type: 'confirm', displayText: 'Answer', actionFunction: () => {
            navigator.getUserMedia({ video: true, audio: true }, stream => {
              myStream = stream
              socket.emit("answerCall", { myPeerId, callUniqueId })
              //put create and append my sidevideo
              let mySideVideoDiv = createSideVideo(stream, { videoOwner: { name: myInfo.name, surname: myInfo.surname, id: myInfo.userID } })
              rightCallParticipantsDiv.append(mySideVideoDiv)

              allInvitedUsers = setAllUsers(allUsers)
              updateAttendanceList(myInfo, 'present')
              showOngoingCallSection()
            }, (err) => { alert('Failed to get local media stream', err); });
          }
        }
      ],
      obligatoryActions: {
        onDisplay: () => { },
        onHide: () => { responded = false; console.log('call notification Hidden') },
        onEnd: () => {
          if (responded == false) {
            socket.emit("callNotAnswered", callUniqueId)
          }
          console.log('call notification Ended')
        },
      },
      delay: 60000,
      tone: 'call'
    })
    socket.on('callCancelled', () => { notification.notificationStop(); receivedUsers = 0; })
    handleOutgoingPeerCalls(myInfo)
  })

  function handleOutgoingPeerCalls(myInfo, videoCoverDiv) {
    //let { userID, name, surname, profilePicture, role } = myInfo
    socket.on('connectUser', userToConnect => {
      let { peerId, userInfo } = userToConnect
      let { userID, name, surname, profilePicture, role } = userInfo
      let options = { metadata: myInfo }
      const call = myPeer.call(peerId, myStream, options)
      let sideVideoDiv
      call.once('stream', userVideoStream => {
        console.log('user is streaming back after my call', userInfo)
        updateAttendanceList(userInfo, 'present')
        // display this user's video
        sideVideoDiv = createSideVideo(userVideoStream, { videoOwner: { name: userInfo.name, surname: userInfo.surname, id: userInfo.userID } })
        rightCallParticipantsDiv.append(sideVideoDiv)

        stopWaitingTone() //on the first call of event 'connectUser' if we are the caller: close the waiting tone
        videoCoverDiv.remove() //on the first call of event 'connectUser' if we are the caller: remove waiting div

        receivedUsers = receivedUsers + 1;
        let maindiv = document.getElementById('mainVideoDiv')
        maindiv.textContent = '';
        console.log(receivedUsers, 'receivedUsers')
        if (receivedUsers < 2) {
          let mainVideoDivContent = createMainVideoDiv(userVideoStream, userInfo)
          mainVideoDivContent.forEach(div => {
            maindiv.append(div)
          })
        }
      })
      call.once('close', () => {
        console.log('user is closing after my call', userInfo)
        updateAttendanceList(userInfo, 'absent')
        // remove this user's video
        sideVideoDiv.remove()
      })

    })
  }

  //for incoming Peer Calls
  myPeer.on('call', call => {
    let infomingPeerInfo = call.metadata
    call.answer(myStream)
    let sideVideoDiv
    call.once('stream', function (remoteStream) {
      console.log('I answered a socket call and the user streamed right back', infomingPeerInfo)
      updateAttendanceList(infomingPeerInfo, 'present')

      sideVideoDiv = createSideVideo(remoteStream, { videoOwner: { name: infomingPeerInfo.name, surname: infomingPeerInfo.surname, id: infomingPeerInfo.userID } })
      rightCallParticipantsDiv.append(sideVideoDiv) //display this user's video

      receivedUsers = receivedUsers + 1;
      let maindiv = document.getElementById('mainVideoDiv')
      
      console.log(receivedUsers, 'receivedUsers')
      if (receivedUsers < 2) {
        maindiv.textContent = '';
        let mainVideoDivContent = createMainVideoDiv(remoteStream, infomingPeerInfo)
        mainVideoDivContent.forEach(div => {
          maindiv.append(div)
        })
      }
    })

  })

  function updateAttendanceNumbers() {
    presenceSelectorBtn.textContent = 'Present (' + presentMembersDiv.childElementCount + ')'
    absenceSelectorBtn.textContent = 'Absent (' + absentMembersDiv.childElementCount + ')'
  }

  function makeCalleeElement(userInfo, status) {
    let { name, profilePicture, surname, userID, role } = userInfo
    let userDiv = userForAttendanceList(user, actions)
  }

  function updateAttendanceList(userInfo, status) {
    //display the caller's name on present members DIV
    let { name, profilePicture, surname, userID } = userInfo
    for (let i = 0; i < allInvitedUsers.length; i++) {
      const elementObject = allInvitedUsers[i];
      //let { userID: userID, div: presenceDiv, chatButton: chatButton, ringButton: ringButton } = elementObject
      if (elementObject.userID == userID) {
        if (status == 'present') {
          presentMembersDiv.append(elementObject.div);
          elementObject.ringButton.remove()
        }
        if (status == 'absent') {
          absentMembersDiv.append(elementObject.div);
          elementObject.div.append(elementObject.ringButton)
        }
        updateAttendanceNumbers()
      }
    }
  }

  function setAllUsers(allUsers) {
    absentMembersDiv.textContent = '' // reset presence
    presentMembersDiv.textContent = '' // reset absence
    let allInvitedUsersArray = allUsers.map(user => {
      let { userID, name, surname, profilePicture, role } = user;
      //element, functionCall
      let chatIcon = createElement({ type: 'i', class: 'bx bxs-message-square-detail' })
      let chatButton = createElement({ type: 'button', childrenArray: [chatIcon] })

      let ringIcon = createElement({ type: 'i', class: 'bx bxs-bell-ring' })
      let ringText = createElement({ type: 'p', textContent: 'Ring' })
      let ringButton = createElement({ type: 'button', childrenArray: [ringIcon, ringText] })

      let actions = [
        { element: chatButton, functionCall: () => { console.log('chat with user', userID) } },
        { element: ringButton, functionCall: () => { console.log('Ring user', userID) } }]

      let presenceDiv = userForAttendanceList(user, actions)
      absentMembersDiv.append(presenceDiv)
      updateAttendanceNumbers()
      return { userID: userID, div: presenceDiv, chatButton: chatButton, ringButton: ringButton }
    })
    return allInvitedUsersArray;
  }

  function prepareVideoCoverDiv(allUsers, caller, reason, awaitedUserDivs) {
    let isGroup, displayName, displayInitials, profilePicture, screenMessage, spinner, callees, firstCallee, calleesDiv;
    // let { name, profilePicture, surname, userID } = caller
    // let { name, profilePicture, surname, userID } = allUsers array
    // let { name, profilePicture, surname, userID, role } = specialStatuseUsers array

    isGroup = allUsers.length > 2 ? true : false
    callees = allUsers.filter(user => { return user.userID != caller.userID })
    displayName = callees.map(calee => { return calee.name + ' ' + calee.surname }).join(', ')
    firstCallee = callees[0]
    displayInitials = isGroup == true ? 'Grp' : firstCallee.name.charAt(0) + firstCallee.surname.charAt(0)
    profilePicture = isGroup == true ? '/private/profiles/group.jpeg' : firstCallee.profilePicture

    return {
      isGroup: isGroup,
      awaitedUserDivs: awaitedUserDivs,
      displayInitials: displayInitials,
      profilePicture: profilePicture,
      screenMessage: reason,
      spinner: true,
      videoConnectingControls: true
    }
  }

  function createMainVideoDiv(stream, userInfo) {
    let { userID, name, surname, profilePicture, role } = userInfo;
    // let mainVideoDiv = document.getElementById('mainVideoDiv')

    //main video element
    let mainVideoElement = createElement({ type: 'video', class: 'mainVideoElement', srcObject: stream })
    mainVideoElement.play();

    //topBar
    let mainVideoOwnerProfilePicture;
    if (profilePicture == null) mainVideoOwnerProfilePicture = createElement({ type: 'div', class: 'mainVideoOwnerProfilePicture', textContent: name.charAt(0) + surname.charAt(0) })
    else mainVideoOwnerProfilePicture = createElement({ type: 'img', class: 'mainVideoOwnerProfilePicture', src: profilePicture })
    let videoOwnerName = createElement({ type: 'div', class: 'videoOwnerName', textContent: name + ' ' + surname })
    let videoOwnerPosition = createElement({ type: 'div', class: 'videoOwnerPosition', textContent: role })
    let mainVideoOwnerProfileNamePosition = createElement({ type: 'div', class: 'mainVideoOwnerProfileNamePosition', childrenArray: [videoOwnerName, videoOwnerPosition] })
    let leftUserIdentifiers = createElement({ type: 'div', class: 'leftUserIdentifiers', childrenArray: [mainVideoOwnerProfilePicture, mainVideoOwnerProfileNamePosition] })
    let mainVideoFullscreenBtn = createElement({
      type: 'button',
      class: 'mainVideoFullscreenBtn',
      childrenArray: [createElement({ type: 'i', class: 'bx bx-fullscreen' })],
      onclick: () => { toggleFullscreen(mainVideoDiv) }
    })
    let rightVideoControls = createElement({ type: 'div', class: 'rightVideoControls', childrenArray: [mainVideoFullscreenBtn] })
    let callTopBar = createElement({ type: 'div', class: 'callTopBar', childrenArray: [leftUserIdentifiers, rightVideoControls] })

    //call controls
    let alwaysVisibleControls = createElement({ type: 'button', class: 'alwaysVisibleControls' })
    let fitToFrame = createElement({
      type: 'button', class: 'callControl', title: "Fit video to frame", childrenArray: [createElement({ type: 'i', class: 'bx bx-collapse' })],
      onClick: () => { mainVideoElement.classList.toggle('fitVideoToWindow') }
    })
    let shareScreenBtn = createElement({ type: 'button', class: 'callControl', title: "Choose video output device", childrenArray: [createElement({ type: 'i', class: 'bx bx-window-open' })] })
    let closeVideoBtn = createElement({ type: 'button', class: 'callControl', title: "Close my video", childrenArray: [createElement({ type: 'i', class: 'bx bxs-video-recording' }), createElement({ type: 'i', class: 'bx bx-chevron-up' })] })
    let HangUpBtn = createElement({ type: 'button', class: 'callControl hangupbtn', title: "Leave this call", childrenArray: [createElement({ type: 'i', class: 'bx bxs-phone-off' })] })
    let muteMicrophone = createElement({ type: 'button', class: 'callControl', title: "Mute my microphone", childrenArray: [createElement({ type: 'i', class: 'bx bx-video-off' })] })
    let silenceAudio = createElement({ type: 'button', class: 'callControl', title: "Silence all call audio", childrenArray: [createElement({ type: 'i', class: 'bx bx-volume-mute' })] })
    let chooseAudioOutputDeviceBtn = createElement({ type: 'button', class: 'callControl', title: "Choose audio output device", childrenArray: [createElement({ type: 'i', class: 'bx bxs-speaker' }), createElement({ type: 'i', class: 'bx bx-chevron-up' })] })

    let hiddableControls = createElement({ type: 'div', class: 'hiddableControls', childrenArray: [fitToFrame, shareScreenBtn, closeVideoBtn, HangUpBtn, muteMicrophone, silenceAudio, chooseAudioOutputDeviceBtn] })
    let callControls = createElement({ type: 'div', class: 'callControls', childrenArray: [alwaysVisibleControls, hiddableControls] })

    return [mainVideoElement, callTopBar, callControls]
  }
})

function createSideVideo(stream, userInfo) {
  let { videoOwner } = userInfo;
  let { name, surname, id } = videoOwner;
  let videoElement = createElement({ type: 'video', srcObject: stream, class: 'callParticipant' })
  videoElement.play()
  if (id == mySavedID) videoElement.muted = true
  let miniVideowner = createElement({ type: 'div', class: 'miniVideowner', textContent: name + " " + surname })
  let muteBtn = createElement({ type: 'button', title: 'Mute Video', childrenArray: [createElement({ type: 'i', class: 'bx bx-volume-mute' })] })
  let speakerBtn = createElement({ type: 'button', title: 'User is speaking', childrenArray: [createElement({ type: 'i', class: 'bx bxs-user-voice' })] })
  let sideVideoControls = createElement({ type: 'div', class: 'sideVideoControls', childrenArray: [miniVideowner, muteBtn, speakerBtn] })
  if (id == mySavedID) muteBtn.remove()
  let callParticipantDiv = createElement({ type: 'div', class: 'callParticipantDiv', childrenArray: [videoElement, sideVideoControls] })
  muteBtn.addEventListener('click', () => {
    if (videoElement.muted == true) { videoElement.muted = false; muteBtn.classList.remove('active'); }
    else { videoElement.muted = true; muteBtn.classList.add('active') }
  })
  streamVolumeOnTreshold(stream, 20, speakerBtn)
  return callParticipantDiv;
}

function createElement(configuration) {
  if (!configuration.type) return console.warn('no element type provided')
  let elementToReturn = document.createElement(configuration.type)
  if (configuration.id) elementToReturn.setAttribute('id', configuration.id)
  if (configuration.class) elementToReturn.setAttribute('class', configuration.class)
  if (configuration.title) elementToReturn.setAttribute('title', configuration.title)
  if (configuration.srcObject) elementToReturn.srcObject = configuration.srcObject
  if (configuration.src) elementToReturn.src = configuration.src
  if (configuration.textContent) elementToReturn.textContent = configuration.textContent
  if (configuration.childrenArray) configuration.childrenArray.forEach(child => elementToReturn.append(child))
  if (configuration.onclick) elementToReturn.addEventListener('click', configuration.onclick)
  return elementToReturn
}

function userForAttendanceList(userInfo, actions) {
  let { userID, name, surname, role, profilePicture, status } = userInfo
  // actions is an array of buttons where on item is {element, functionCall}
  //container is presentMembersDiv
  let memberProfilePicture;
  if (profilePicture == null) memberProfilePicture = createElement({ type: 'div', class: 'memberProfilePicture', textContent: name.charAt(0) + surname.charAt(0) })
  else memberProfilePicture = createElement({ type: 'img', class: 'memberProfilePicture', src: profilePicture })

  let memberName = createElement({ type: 'div', class: 'memberName', textContent: name + ' ' + surname })
  let memberRole = createElement({ type: 'div', class: 'memberRole', textContent: role })
  let memberNameRole = createElement({ type: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })
  let chatButton = createElement({ type: 'button', childrenArray: [createElement({ type: 'i', class: 'bx bxs-message-square-detail' }), createElement({ type: 'p', textContent: 'Chat' }),] })

  let actionElements = actions.map(action => {
    //let { element, functionCall } = action
    let { element, functionCall } = action
    element.addEventListener('click', functionCall)
    return element;
  })

  let presentMember = createElement({ type: 'div', class: 'listMember', childrenArray: [memberProfilePicture, memberNameRole].concat(actionElements) })
  return presentMember
}

function streamVolumeOnTreshold(stream, threshold, outletEment) {
  let audioContext = new AudioContext();
  let analyser = audioContext.createAnalyser();
  let microphone = audioContext.createMediaStreamSource(stream);
  let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
  analyser.smoothingTimeConstant = 0.8;
  analyser.fftSize = 1024;
  microphone.connect(analyser);
  analyser.connect(javascriptNode);
  javascriptNode.connect(audioContext.destination);
  javascriptNode.onaudioprocess = function () {
    var array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var values = 0;
    var length = array.length;
    for (var i = 0; i < length; i++) { values += (array[i]); }
    var average = values / length;
    if (Math.round(average) > 15) {
      let comparableValue = Math.round(average) - 10;
      if (comparableValue > threshold) { outletEment.classList.add('isSpeaking') }
      else { outletEment.classList.remove('isSpeaking') }
    }
  }
}

function call(callTo, audio, video, group, fromChat, previousCallId) {
  initiateCall({ callTo, audio, video, group, fromChat, previousCallId })
}

function initiateCall(initiationInfo) {
  let { callTo, audio, video, group, fromChat, previousCallId } = initiationInfo
  navigator.getUserMedia({ video: true, audio: true }, stream => {  //test user media accessibiity
  showOngoingCallSection()
  startWaitingTone()
  socket.emit("initiateCall", { callTo, audio, video, group, fromChat, previousCallId })
  stream.getTracks().forEach(track => { track.stop(); stream.removeTrack(track);  })  //stop media tracks

  }, (err) => { alert('Failed to get local media stream', err); });
}

function startWaitingTone() {
  waitingTone.play()
}
function stopWaitingTone() {
  waitingTone.currentTime = 0;
  waitingTone.pause()
}

function videoConnectingScreen(constraints) {
  // let memberNameRole = createElement({ type: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })
  let { isGroup, awaitedUserDivs, displayInitials, profilePicture, screenMessage, spinner } = constraints

  // isGroup: isGroup,
  // awaitedUserDivs: awaitedUserDivs,
  // displayInitials: displayInitials,
  // profilePicture: profilePicture,
  // screenMessage: reason,
  // spinner: true,

  let caleeProfilePicture;
  if (constraints.profilePicture != null) { caleeProfilePicture = createElement({ type: 'img', class: 'caleeProfilePicture', src: constraints.profilePicture }) }
  else caleeProfilePicture = createElement({ type: 'div', class: 'caleeProfilePicture', textContent: constraints.displayInitials })
  let activity = createElement({ type: 'div', class: 'activity', textContent: constraints.screenMessage })
  let spinnerDiv = createElement({ type: 'div', class: 'spinner', childrenArray: [createElement({ type: 'div' }), createElement({ type: 'div' }), createElement({ type: 'div' })] })
  let calleesDiv = createElement({ type: 'div', class: 'calleesDiv', childrenArray: awaitedUserDivs.map(awaitedUserDiv => awaitedUserDiv.div) })

  let videoCoverDiv
  if (spinner == true) videoCoverDiv = createElement({ type: 'div', class: 'videoCoverDiv', childrenArray: [caleeProfilePicture, activity, spinnerDiv, calleesDiv] })
  else videoCoverDiv = createElement({ type: 'div', class: 'videoCoverDiv', childrenArray: [caleeProfilePicture, activity, calleesDiv] })

  let controls = {};
  if (constraints.videoConnectingControls) {
    let chooseVideoOutputDeviceBtn = createElement({ type: 'button', class: 'callControl', title: "Choose camera", childrenArray: [createElement({ type: 'i', class: 'bx bxs-video-recording' }), createElement({ type: 'i', class: 'bx bx-chevron-up' })] })
    let closeVideoBtn = createElement({ type: 'button', class: 'callControl', title: "Close my video", childrenArray: [createElement({ type: 'i', class: 'bx bxs-video-off' })] })

    let HangUpBtn = createElement({ type: 'button', class: 'callControl hangupbtn', title: "Leave this call", childrenArray: [createElement({ type: 'i', class: 'bx bxs-phone-off' })] })
    let muteMicrophoneBtn = createElement({ type: 'button', class: 'callControl', title: "Mute my microphone", childrenArray: [createElement({ type: 'i', class: 'bx bx-video-off' })] })
    let chooseAudioOutputDeviceBtn = createElement({ type: 'button', class: 'callControl', title: "Choose audio output device", childrenArray: [createElement({ type: 'i', class: 'bx bxs-speaker' }), createElement({ type: 'i', class: 'bx bx-chevron-up' })] })

    let hiddableControls = createElement({ type: 'div', class: 'waitingCallControls', childrenArray: [chooseVideoOutputDeviceBtn, closeVideoBtn, HangUpBtn, muteMicrophoneBtn, chooseAudioOutputDeviceBtn] })
    videoCoverDiv.append(hiddableControls)
    controls = { chooseVideoOutputDeviceBtn, closeVideoBtn, HangUpBtn, muteMicrophoneBtn, chooseAudioOutputDeviceBtn }
  }
  return { videoCoverDiv, controls }
}

function displayNotification(notificationConfig) {
  let { title, body, actions, obligatoryActions, delay, tone } = notificationConfig
  let { iconClass, titleText } = title
  let { shortOrImage, bodyContent } = body
  let { shortOrImagType, shortOrImagContent } = shortOrImage
  let { onDisplay, onEnd, onHide } = obligatoryActions

  let notificationsDiv = document.getElementById('notificationsDiv')

  //Title
  let titleIcon = createElement({ type: 'i', class: iconClass })
  let titleTextDiv = createElement({ type: 'div', class: 'notificationTitleText', textContent: titleText })
  let notificationTitle = createElement({ type: 'div', class: 'notificationTitle', childrenArray: [titleIcon, titleTextDiv] })

  //Body
  let profilePicture;
  if (shortOrImagType == 'short') { profilePicture = createElement({ type: 'div', class: 'profilePicture', textContent: shortOrImagContent }) }
  if (shortOrImagType == 'image') { profilePicture = createElement({ type: 'img', class: 'profilePicture', src: shortOrImagContent }) }
  let notificationContent = createElement({ type: 'div', class: 'notificationContent', textContent: bodyContent })
  let notificationBody = createElement({ type: 'div', class: 'notificationBody', childrenArray: [profilePicture, notificationContent] })

  let notification;

  //Actions
  let buttonsArray = [];
  actions.forEach(action => {
    let { type, displayText, actionFunction } = action
    let actionBtn = createElement({ type: 'button', class: type, textContent: displayText })
    actionBtn.addEventListener('click', () => { notificationStop(); actionFunction(); })
    buttonsArray.push(actionBtn)
  })
  let dismissbutton = createElement({ type: 'button', class: 'normal', textContent: 'Hide' })
  buttonsArray.push(dismissbutton)
  let notificationActions = createElement({ type: 'div', class: 'notificationActions', childrenArray: buttonsArray })

  //progressbar
  let notificationProgressBar = createElement({ type: 'div', class: 'notificationProgressBar' })

  //notification Element
  notification = createElement({ type: 'div', class: 'notification', childrenArray: [notificationTitle, notificationBody, notificationActions, notificationProgressBar] })
  notificationsDiv.append(notification)

  let notificationTone;
  if (tone == 'notification') { notificationTone = new Audio('/private/audio/imperiumLineNotification.mp3'); notificationTone.play() }
  if (tone == 'call') {
    notificationTone = new Audio('/private/audio/imperiumLineCall.mp3'); notificationTone.play()
    notificationTone.addEventListener('ended', function () { this.currentTime = 0; this.play(); }, false);
  }
  const notificationStop = () => { if (notificationTone) { notificationTone.currentTime = 0; notificationTone.pause(); notification.remove() } }

  dismissbutton.addEventListener('click', () => { notificationStop(); onHide(); })
  setTimeout(() => { notificationStop(); onEnd(); }, delay);
  let interval = 10 //milliseconds
  let control = delay
  let countDown = setInterval(() => {
    control = control - interval;
    let width = (control / delay) * 100
    notificationProgressBar.style.width = width + '%'
    if (width < 1) clearInterval(countDown)
  }, interval);

  notification.notificationStop = notificationStop

  return notification
}

//exemplary Notification Code
let notification = displayNotification({
  title: { iconClass: 'bx bxs-phone-call', titleText: 'Incoming call' },
  body: {
    shortOrImage: { shortOrImagType: 'image', shortOrImagContent: 'http://localhost:3000/images/profiles/group.jpeg' },
    bodyContent: 'Welcome to ImperiumLine.com, an ezy way to connect with people and teams that/where you belong/care. Enjoy the app'
  },
  actions: [
    // {
    //   type: 'confirm', displayText: 'Answer', actionFunction: () => {
    //     console.log('call answered')
    //   }
    // }
  ],
  obligatoryActions: {
    onDisplay: () => { console.log('Notification Displayed') },
    onHide: () => { console.log('Notification Hidden') },
    onEnd: () => { console.log('Notification Ended') },
  },
  delay: 3000,
  tone: 'notification'
})


function createOngoingCallScreen() {
  // leftPart
  let leftPartHeaderDivTitle = createElement({ type: 'div', class: 'leftPartHeaderDivTitle' })
  let inviteSomeone = createElement({
    type: 'button',
    class: 'inviteSomeone',
    childrenArray: [createElement({ type: 'i', class: 'bx bx-plus' }), createElement({ type: 'p', textContent: 'invite Someone' })]
  })
  let presenceSelectorBtn = createElement({ type: 'div', class: 'leftHeaderItem headerItemSelected', textContent: 'Present (0)' })
  let absenceSelectorBtn = createElement({ type: 'div', class: 'leftHeaderItem', textContent: 'Absent (0)' })

  let attendanceTitleSection = createElement({ type: 'div', class: 'attendanceTitleSection', childrenArray: [presenceSelectorBtn, absenceSelectorBtn] })
  let presentMembersDiv = createElement({ type: 'div', class: 'presentMembersDiv', id: 'presentMembersDiv' })
  let absentMembersDiv = createElement({ type: 'div', class: 'absentMembersDiv', id: 'absentMembersDiv' })
  let attendanceContentDiv = createElement({ type: 'div', class: 'attendanceContentDiv', childrenArray: [presentMembersDiv, absentMembersDiv] })

  let leftPart = createElement({ type: 'div', class: 'leftPart', textContent: 'Attendance', childrenArray: [leftPartHeaderDivTitle, inviteSomeone, attendanceTitleSection, attendanceContentDiv] })
  //call-container

  return {
    leftPartHeaderDivTitle: leftPartHeaderDivTitle,
    inviteSomeone: inviteSomeone,
    attendanceTitleSection: attendanceTitleSection,

  }
}


window.onbeforeunload = function () {
  deleteAllCookies()
  return 'Are you sure you want to leave?';
};
function deleteAllCookies() {
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf("=");
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}