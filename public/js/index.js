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
      <div id="w-input-container" class="w-input-container"  onclick="setFocus()">
        <div class="w-input-text-group">
          <div id="w-input-text" class="w-input-text" contenteditable></div>
          <div class="w-placeholder">Type a message</div>
        </div>
      </div>
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
  // expectedUser{userID: 130, name: 'tes3Name', surname: 'tes3Surame', profilePicture: null} 
  // message{toRoom: '106', message: 'test again', timeStamp: '2021-12-19T20:03:48.759Z'}

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
  // buildReaction(message.reactions)

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

function initiateChat(userID) {
  socket.emit('makeChat', userID)

}

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

socket.on('userDisconnected', disconnectionInfo => {
  console.log('user disconnected', disconnectionInfo)
})

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

function setUserOffline(id, room) {
  console.log('setUserOffline', id, room);
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


/////////////////////////////////CALL LOG END//////////////////////

let secondaryVideosDiv = document.getElementById('secondaryVideosDiv')
const myPeer = new Peer(undefined, {
  host: 'peer.imperiumline.com',
  secure: true,
  config: {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302"
      },
      {
        urls: "turn:0.peerjs.com:3478",
        username: "peerjs",
        credential: "peerjsp"
      },
      {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
      },
      { "url": "stun:stun.l.google.com:19302" },

      {
        "url": "turn:stun.imperiumline.com:5349",
        credential: 'guest',
        username: 'somepassword'
      }

    ],
    sdpSemantics: "unified-plan"
  }
})

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
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

///////Video Sizing//////////////////////
function toggleFullscreen(element) {
  if (!document.fullscreenElement) { element.requestFullscreen().catch(err => { alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`); }); }
  else { document.exitFullscreen(); }
}

// when my peer is ready with an ID ---> this means that we cannot receive a call before a peer Id is opened
myPeer.on('open', myPeerId => {
  console.log('my peer is now connected with id: ' + myPeerId)
  let myStream;
  let myScreenStream;
  let _callUniqueId;
  let allInvitedUsers;
  let globalCallType = "audio" // by default
  let globalAudioState = 'enabled';
  let screenSharing = false
  let globalMainVideoDiv;
  let mySideVideoDiv;
  let myScreenSideVideo;
  let myScreenViewers = [];
  let caller_me, videoCoverDiv_videoCoverDiv
  let optionalResolutions = [{ minWidth: 320 }, { minWidth: 640 }, { minWidth: 1024 }, { minWidth: 1280 }, { minWidth: 1920 }, { minWidth: 2560 }]
  let participants = []
  let rightPanel;
  let topBar;
  let bottomPanel;

  socket.on('prepareCallingOthers', initiatedCallInfo => {
    navigator.getUserMedia({ video: { optional: optionalResolutions }, audio: true }, stream => {
      let { callUniqueId, callType, caller, groupMembersToCall_fullInfo, allUsers, callTitle } = initiatedCallInfo
      let { userID, name, surname, profilePicture, role } = caller

      //save these important variables
      myInfo = caller
      caller_me = caller
      _callUniqueId = callUniqueId
      saveLocalMediaStream(callType, stream)
      rightPanel = createRightPartPanel()
      createLeftPanel()
      // create topBar
      topBar = createTopBar({ callUniqueId: callUniqueId, callType: globalCallType, callTitle: callTitle, isTeam: 'isTeam' }, caller)
      bottomPanel = createBottomPart()
      mySideVideoDiv = createSideVideo(globalCallType, myStream, caller, 'userMedia', globalAudioState)
      rightPanel.participantsBox.prepend(mySideVideoDiv)
      // create awaited users divs
      let awaitedUserDivs = allUsers.map(user => {
        //let { userID, name, surname, role, profilePicture, status } = user
        let targetedUser = groupMembersToCall_fullInfo.find(member => member.userProfileIdentifier.userID == user.userID);
        if (targetedUser == undefined) {
          let ringTextForMe = user.userID === caller.userID ? 'Waiting ...' : 'Offline';
          let ringIconForMe = user.userID === caller.userID ? 'bx bxs-hourglass' : 'bx bxs-phone-off';
          let offlineIcon = createElement({ elementType: 'i', class: ringIconForMe })
          let offlineText = createElement({ elementType: 'p', textContent: ringTextForMe })
          let offlineButton = createElement({ elementType: 'button', childrenArray: [offlineIcon, offlineText] })
          let chatIcon = createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })
          let chatButton = createElement({ elementType: 'button', childrenArray: [chatIcon] })
          let actions = [
            { element: offlineButton, functionCall: () => { } },
            { element: chatButton, functionCall: () => { console.log('chat with user', userID) } }]
          return { userID: user.userID, div: userForAttendanceList(user, actions) }
        }
        else {

          let ringIcon = createElement({ elementType: 'i', class: 'bx bxs-bell-ring' })
          let ringText = createElement({ elementType: 'p', textContent: 'Ringing...' })
          let ringButton = createElement({ elementType: 'button', childrenArray: [ringIcon, ringText] })

          let chatIcon = createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })
          let chatButton = createElement({ elementType: 'button', childrenArray: [chatIcon] })

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

      //put Users on absence list
      allInvitedUsers = setAllUsers(allUsers)
      updateAttendanceList(caller, 'present')

      videoCoverDiv_videoCoverDiv = videoCoverDiv.videoCoverDiv

      let { closeVideoBtn, HangUpBtn, muteMicrophoneBtn } = videoCoverDiv.controls
      HangUpBtn.addEventListener('click', () => {
        socket.emit('cancelCall', callUniqueId)
        mySideVideoDiv.remove();
        stopWaitingTone() //on the first call of event 'connectUser' if we are the caller: close the waiting tone
        videoCoverDiv.videoCoverDiv.remove() //on the first call of event 'connectUser' if we are the caller: remove waiting div
        updateAttendanceList(caller, 'absent')
        topBar.textContent = ''
        stream.getTracks().forEach((track) => { console.log('track', track); track.stop(); stream.removeTrack(track); })
        myStream.getTracks().forEach((track) => { console.log('track', track); track.stop(); myStream.removeTrack(track); })
      })

      muteMicrophoneBtn.addEventListener('click', () => {
        toggleDisableAudio(myStream)
        console.log("audio disable happened")
        determineAudioVideoState(myStream, muteMicrophoneBtn, closeVideoBtn)
        mySideVideoDiv.remove()
        mySideVideoDiv = createSideVideo(globalCallType, myStream, caller, 'userMedia', globalAudioState)
        rightPanel.participantsBox.textContent = ''
        rightPanel.participantsBox.prepend(mySideVideoDiv)
      })

      closeVideoBtn.addEventListener('click', () => {
        toggleDisableVideo(myStream)
        console.log("video disable happened")
        determineAudioVideoState(myStream, muteMicrophoneBtn, closeVideoBtn)
        mySideVideoDiv.remove()
        mySideVideoDiv = createSideVideo(globalCallType, myStream, caller, 'userMedia', globalAudioState)
        rightPanel.participantsBox.textContent = ''
        rightPanel.participantsBox.prepend(mySideVideoDiv)
      })
      determineAudioVideoState(myStream, muteMicrophoneBtn, closeVideoBtn)

      socket.on('callRejected', timeoutDetails => { //Handle RejectedCall
        console.log('remote call Rejected')
        let { callUniqueId, userInfo } = timeoutDetails
        for (let i = 0; i < awaitedUserDivs.length; i++) {
          const awaitedDiv = awaitedUserDivs[i];
          if (awaitedDiv.userID == userInfo.userID) {

            let memberProfilePicture;
            if (profilePicture == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
            else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: userInfo.profilePicture })

            let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: userInfo.name + ' ' + userInfo.surname })
            let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: userInfo.role })
            let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

            let ringIcon = createElement({ elementType: 'i', class: 'bx bx-x' })
            let ringText = createElement({ elementType: 'p', textContent: 'Rejected' })
            let ringButton = createElement({ elementType: 'button', childrenArray: [ringIcon, ringText] })


            let chatIcon = createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })
            let chatButton = createElement({ elementType: 'button', childrenArray: [chatIcon] })
            chatButton.addEventListener('click', () => console.log('chat with USER', userInfo.userID))

            let ringAgainIcon = createElement({ elementType: 'i', class: 'bx bxs-bell-ring' })
            let ringAgainText = createElement({ elementType: 'p', textContent: 'Ring Again' })
            let ringAgainButton = createElement({ elementType: 'button', childrenArray: [ringAgainIcon, ringAgainText] })
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
            if (profilePicture == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
            else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: userInfo.profilePicture })

            let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: userInfo.name + ' ' + userInfo.surname })
            let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: userInfo.role })
            let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

            let ringIcon = createElement({ elementType: 'i', class: 'bx bx-x' })
            let ringText = createElement({ elementType: 'p', textContent: 'Not answered' })
            let ringButton = createElement({ elementType: 'button', childrenArray: [ringIcon, ringText] })


            let chatIcon = createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })
            let chatButton = createElement({ elementType: 'button', childrenArray: [chatIcon] })
            chatButton.addEventListener('click', () => console.log('chat with USER', userInfo.userID))

            let ringAgainIcon = createElement({ elementType: 'i', class: 'bx bxs-bell-ring' })
            let ringAgainText = createElement({ elementType: 'p', textContent: 'Ring Again' })
            let ringAgainButton = createElement({ elementType: 'button', childrenArray: [ringAgainIcon, ringAgainText] })
            ringAgainButton.addEventListener('click', () => console.log('ring again USER', userInfo.userID))

            awaitedDiv.div.textContent = '';
            console.log('timeoutDetails', timeoutDetails)
            awaitedDiv.div.append(memberProfilePicture, memberNameRole, ringButton, chatButton, ringAgainButton)
          }
        }

      })

      // Handle added users to call
      socket.on('userAddedToCall', (additionDetails) => {
        let { callUniqueId, userInfo } = additionDetails
        console.log('additionDetails', additionDetails)
        let memberProfilePicture;
        if (userInfo.profilePicture == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
        else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: userInfo.profilePicture })

        let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: userInfo.name + ' ' + userInfo.surname })
        let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: userInfo.role })
        let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

        let status = userInfo.status == "offline" ? "Offline" : "Ringing ...";

        let statIcon = userInfo.status == "offline" ? 'bx bxs-phone-off' : 'bx bxs-bell-ring'
        let ringIcon = createElement({ elementType: 'i', class: statIcon })

        let ringText = createElement({ elementType: 'p', textContent: status })
        let ringButton = createElement({ elementType: 'button', childrenArray: [ringIcon, ringText] })

        let chatIcon = createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })
        let chatButton = createElement({ elementType: 'button', childrenArray: [chatIcon] })
        chatButton.addEventListener('click', () => console.log('chat with USER', userInfo.userID))

        let addeduserDiv = createElement({ elementType: 'div', class: 'listMember', childrenArray: [memberProfilePicture, memberNameRole, ringButton, chatButton] })
        videoCoverDiv.calleesDiv.prepend(addeduserDiv)
        awaitedUserDivs.push({ userID: userInfo.userID, div: addeduserDiv })

        //add this new users to the attendance list
        allUsers.push(userInfo)
        allInvitedUsers = setAllUsers(allUsers)
        updateAttendanceList(userInfo, 'absent')
      })
    }, (err) => { alert('Failed to get local media stream', err); });
  })
  socket.on('incomingCall', incomingCallInfo => {
    let { callUniqueId, callType, caller, myInfo, allUsers, callTitle } = incomingCallInfo
    let { name, profilePicture, surname, userID } = caller

    let responded = false;
    let notification = displayNotification({
      title: { iconClass: 'bx bxs-phone-call', titleText: 'Incoming call' },
      body: {
        shortOrImage: {
          shortOrImagType: profilePicture == null ? 'short' : 'image',
          shortOrImagContent: profilePicture == null ? name.charAt(0) + surname.charAt(0) : profilePicture
        },
        bodyContent: 'Incoming ' + callType + ' call from' + name + ' ' + surname //+ (allUsers.length <= 2 ? '.' : ' with ' + (groupMembersToCall_fullInfo.length - 1) + ' other' + ((groupMembersToCall_fullInfo.length - 1) > 1 ? 's.' : '.'))
      },
      actions: [
        { type: 'normal', displayText: 'Reject', actionFunction: () => { socket.emit("callRejected", callUniqueId); responded = true } },
        { type: 'confirm', displayText: 'Audio', actionFunction: () => { caller_me = myInfo; _callUniqueId = callUniqueId; callAnswerByType("audio", myPeerId, callUniqueId, myInfo, allUsers, callTitle); responded = true } },
        { type: 'confirm', displayText: 'Video', actionFunction: () => { caller_me = myInfo; _callUniqueId = callUniqueId; callAnswerByType("video", myPeerId, callUniqueId, myInfo, allUsers, callTitle); responded = true } },
      ],
      obligatoryActions: {
        onDisplay: () => { responded = false; },
        onHide: () => { responded = false; console.log('call notification Hidden') },
        onEnd: () => {
          if (responded == false) {
            socket.emit("callNotAnswered", callUniqueId)
            console.log('call notification Ended')
          }
        },
      },
      delay: 60000,
      tone: 'call'
    })
    socket.on('callCancelled', () => { notification.notificationStop(); receivedUsers = 0; })

  })

  function callAnswerByType(answertype, myPeerId, callUniqueId, myInfo, allUsers, callTitle) {
    navigator.getUserMedia({ video: true, audio: true }, stream => {
      responded = true
      myStream = stream // store our stream globally so that to access it whenever needed
      // store the call type fpr incoming videos and sending our stream
      saveLocalMediaStream(answertype, stream)
      // let properStream = getStreamToUseLocally(answertype, myStream)
      callInfo = { callUniqueId, callType: globalCallType, callTitle: callTitle ? callTitle : 'Untitled Call', isTeam: false }
      socket.emit("answerCall", { myPeerId, callUniqueId, callType: answertype })
      topBar = createTopBar(callInfo, myInfo) // create top bar
      rightPanel = createRightPartPanel()
      bottomPanel = createBottomPart()
      // ut create and append my sidevideo
      mySideVideoDiv = createSideVideo(answertype, myStream, myInfo, 'userMedia', globalAudioState)
      rightPanel.participantsBox.textContent = ''
      rightPanel.participantsBox.append(mySideVideoDiv)

      allInvitedUsers = setAllUsers(allUsers)
      updateAttendanceList(myInfo, 'present')
      showOngoingCallSection()
      createLeftPanel()
    }, (err) => { alert('Failed to get local media stream', err); });
  }

  socket.on('connectUser', userToConnect => {
    let { peerId, userInfo, callType } = userToConnect
    let { userID, name, surname, profilePicture, role } = userInfo
    let callMediaType = 'userMedia' // set Dafault calltype
    let options = { metadata: { userInfo: caller_me, callType: globalCallType, callMediaType: callMediaType, audioState: globalAudioState } }
    const call = myPeer.call(peerId, myStream, options)
    let sideVideoDiv
    let bubble

    let participant = {
      userInfo: userInfo,
      peerId: peerId,
      userMedia: {
        stream: null,
        callType: callType,
        sideVideoDiv: sideVideoDiv,
        callObject: null,
        peerInitiatedByMe: true,
        isOnMainVideo: false,
        bubble: bubble,
        audioState: 'enabled'
      },
      screenMedia: {
        stream: null,
        callType: null,
        sideVideoDiv: null,
        callObject: null,
        peerInitiatedByMe: true,
        isOnMainVideo: false,
        bubble: false
      }
    }
    participant.userMedia.callObject = call // save the call Object
    call.once('stream', userVideoStream => {
      for (let i = 0; i < userVideoStream.getTracks().length; i++) { const track = userVideoStream.getTracks()[i]; track.muted = false; }//i decided to unmute these tracks becaise for some reason i was receiveing muted tracks
      participant.userMedia.stream = userVideoStream
      updateAttendanceList(userInfo, 'present') // update this user on attendance list
      participant.userMedia.sideVideoDiv = createSideVideo(callType, userVideoStream, userInfo, 'userMedia', 'enabled') // create and save the side video element // audio is enbaed by default because the acceptant does not have time to disable audio
      rightPanel.participantsBox.append(participant.userMedia.sideVideoDiv) // display this user's video
      participant.userMedia.bubble = bottomPanel.createBubble(callType, userVideoStream, userInfo, 'userMedia', 'enabled') // create and save the side video element
      bottomPanel.availableScreensDiv.append(participant.userMedia.bubble) // display bubble
      stopWaitingTone() //on the first call of event 'connectUser' if we are the caller: close the waiting tone
      if (videoCoverDiv_videoCoverDiv) videoCoverDiv_videoCoverDiv.remove() //on the first call of event 'connectUser' if we are the caller: remove waiting div
      let maindiv = document.getElementById('mainVideoDiv') // get mainVideoDiv element for potential future use
      console.log('participants', participants.length)
      if (participants.length <= 1) { // if this is the first user who is connecting to Us - Create a mainVideoDiv and store It
        maindiv.textContent = '';
        let mainVideoDivContent = createMainVideoDiv(callType, userVideoStream, userInfo, 'userMedia', 'enabled')
        mainVideoDivContent.forEach(div => { maindiv.append(div) })
        globalMainVideoDiv = maindiv
        participant.userMedia.isOnMainVideo = true;
      }
      // if i call a peer, while having shared my screen, i will need to include him in my screen viewers
      if (screenSharing == true) {
        let screenShare_options = { metadata: { userInfo: caller_me, callType: 'video', callMediaType: 'screenMedia' } }
        const call = myPeer.call(peerId, myScreenStream, screenShare_options)
        let myScreenViewer = {
          userInfo: userInfo,
          peerId: peerId,
          callObject: call,
          peerInitiatedByMe: true
        }
        myScreenViewers.push(myScreenViewer)
      }
      // --------------------------------------
    })
    call.once('close', () => {
      removePeer(userInfo.userID)
    })
    participants.push(participant) // push the participant to the Array
    rightPanel.setParticipantsCount(participants.length)
    rightPanel.messagesBox.addMessage({ userInfo: participant.userInfo, content: '', time: new Date() }, 'join')
  })

  //for incoming Peer Calls
  myPeer.on('call', call => {
    let incomingPeerInfo = call.metadata.userInfo
    let callType = call.metadata.callType
    let callMediaType = call.metadata.callMediaType
    let audioState = call.metadata.audioState
    let callMediaTypeText = '';
    if (callMediaType == 'userMedia') { call.answer(myStream); callMediaTypeText = callMediaType } // check if it is a screen share or a user video/audio share
    if (callMediaType == 'screenMedia') { call.answer(); callMediaTypeText = callMediaType }

    call.once('stream', function (remoteStream) {
      for (let i = 0; i < remoteStream.getTracks().length; i++) { const track = remoteStream.getTracks()[i]; track.muted = false; } //i decided to unmute these tracks becaise for some reason i was receiveing muted tracks
      if (callMediaType == 'userMedia') { // if the presented media is userMedia

        let maindiv = document.getElementById('mainVideoDiv')
        if (participants.length == 0) { // if it is the first user connection display on the main videoDiv
          maindiv.textContent = '';
          let mainVideoDivContent = createMainVideoDiv(callType, remoteStream, incomingPeerInfo, callMediaType)
          mainVideoDivContent.forEach(div => { maindiv.append(div) }) // display the maindiv content
          globalMainVideoDiv = maindiv // store the mainDiv
        }

        let participant = {
          userInfo: incomingPeerInfo,
          peerId: call.peer,
          userMedia: {
            stream: remoteStream,
            callType: callType,
            sideVideoDiv: createSideVideo(callType, remoteStream, incomingPeerInfo, callMediaTypeText, audioState),
            callObject: call,
            peerInitiatedByMe: false,
            isOnMainVideo: participants.length == 0 ? true : false,
            bubble: bottomPanel.createBubble(callType, remoteStream, incomingPeerInfo, callMediaTypeText, audioState),
            audioState: audioState
          },
          screenMedia: {
            stream: null,
            callType: null,
            sideVideoDiv: null,
            callObject: null,
            peerInitiatedByMe: false,
            isOnMainVideo: false,
            bubble: null,
            audioState: null
          }
        }
        updateAttendanceList(incomingPeerInfo, 'present')
        rightPanel.participantsBox.append(participant.userMedia.sideVideoDiv) //display this user's screen
        bottomPanel.availableScreensDiv.append(participant.userMedia.bubble) //display this user's bubble
        participants.push(participant)
        rightPanel.setParticipantsCount(participants.length)
        rightPanel.messagesBox.addMessage({ userInfo: incomingPeerInfo, content: '', time: new Date() }, 'join')
      }
      if (callMediaType == 'screenMedia') {
        //display this user's video
        for (let i = 0; i < participants.length; i++) {
          if (participants[i].userInfo.userID == incomingPeerInfo.userID) {
            participants[i].screenMedia.stream = remoteStream
            participants[i].screenMedia.callType = callType
            participants[i].screenMedia.sideVideoDiv = createSideVideo(callType, remoteStream, incomingPeerInfo, callMediaTypeText, audioState)
            participants[i].screenMedia.callObject = call
            participants[i].screenMedia.bubble = bottomPanel.createBubble(callType, remoteStream, incomingPeerInfo, callMediaTypeText, audioState)
            participants[i].screenMedia.audioState = 'enabled'

            participants[i].userMedia.sideVideoDiv.after(participants[i].screenMedia.sideVideoDiv)
            participants[i].userMedia.bubble.after(participants[i].screenMedia.bubble)
          }
        }
      }
      console.log('after call entrance participants', participants)
    })
  })

  function updateAttendanceNumbers() {
    presenceSelectorBtn.textContent = 'Present (' + presentMembersDiv.childElementCount + ')'
    absenceSelectorBtn.textContent = 'Absent (' + absentMembersDiv.childElementCount + ')'
  }

  function updateAttendanceList(userInfo, status) {
    //display the caller's name on present members DIV
    let { name, profilePicture, surname, userID } = userInfo
    let itsANewUser = true
    for (let i = 0; i < allInvitedUsers.length; i++) {
      const elementObject = allInvitedUsers[i];
      //let { userID: userID, div: presenceDiv, chatButton: chatButton, ringButton: ringButton } = elementObject
      if (elementObject.userID == userID) {
        itsANewUser = false
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
      let chatIcon = createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })
      let chatButton = createElement({ elementType: 'button', childrenArray: [chatIcon] })

      let ringIcon = createElement({ elementType: 'i', class: 'bx bxs-bell-ring' })
      let ringText = createElement({ elementType: 'p', textContent: 'Ring' })
      let ringButton = createElement({ elementType: 'button', childrenArray: [ringIcon, ringText] })

      let actions = [
        { element: chatButton, functionCall: () => { console.log('chat with user', userID) } },
        { element: ringButton, functionCall: () => { console.log('Ring user', userID); } }]

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
  function saveLocalMediaStream(type, stream) {
    let modifiedStream
    switch (type) {
      case "audio":
        modifiedStream = convertToAudioOnlyStream(stream)
        break;
      case "video":
        modifiedStream = stream; // restore the video component
        break;
      default:
        modifiedStream = convertToAudioOnlyStream(stream)
        break;
    }
    globalCallType = type
    myStream = modifiedStream
  }
  function toggleDisableAudio(stream) {
    if (!stream) return console.warn('No Stream provided to the function');
    for (let index in stream.getAudioTracks()) {
      let audioTrack = stream.getAudioTracks()[index]
      if (audioTrack.enabled) { audioTrack.enabled = false; globalAudioState = 'disabled'; socket.emit('audioStateChange', { callUniqueId: _callUniqueId, state: 'disabled' }) }
      else { audioTrack.enabled = true; globalAudioState = 'enabled'; socket.emit('audioStateChange', { callUniqueId: _callUniqueId, state: 'enabled' }) }
    }
    updateMySideVideoDiv()
  }
  socket.on('audioStateChange', changeData => {
    let { userID, state } = changeData
    for (let i = 0; i < participants.length; i++) {
      if (participants[i].userInfo.userID == userID) {
        convertParticipantsSideVideo(participants[i], 'audio', state)
      }
    }
  })
  function toggleDisableVideo(stream) {
    if (!stream) return console.warn('No Stream provided to the function');
    for (let index in stream.getVideoTracks()) {
      let videoTrack = stream.getVideoTracks()[index]
      if (videoTrack.enabled) {
        videoTrack.enabled = false;
        globalCallType = "audio";
        socket.emit('videoStateChange', { callUniqueId: _callUniqueId, state: 'disabled' })
      }
      else {
        videoTrack.enabled = true;
        globalCallType = "video";
        socket.emit('videoStateChange', { callUniqueId: _callUniqueId, state: 'enabled' })
      }
    }
    updateMySideVideoDiv()
  }
  socket.on('videoStateChange', changeData => {
    let { userID, state } = changeData
    for (let i = 0; i < participants.length; i++) {
      if (participants[i].userInfo.userID == userID) {
        convertParticipantsSideVideo(participants[i], 'video', state)
      }
    }
  })
  function convertParticipantsSideVideo(participant, subject, state) {
    // possible subjects: audio / video 
    // possible states: audio / video video
    // participant is the target element from the participants array
    /**
     let participant = {
          userInfo: incomingPeerInfo,
          peerId: call.peer,
          userMedia: {
            stream: remoteStream,
            callType: callType,
            sideVideoDiv: createSideVideo(callType, remoteStream, incomingPeerInfo, callMediaTypeText),
            callObject: call,
            peerInitiatedByMe: false,
            isOnMainVideo: participants.length == 0 ? true : false,
            bubble: bottomPanel.createBubble(callType, remoteStream, incomingPeerInfo, callMediaTypeText, audioState)
          },
          screenMedia: {
            stream: null,
            callType: null,
            sideVideoDiv: null,
            callObject: null,
            peerInitiatedByMe: false,
            isOnMainVideo: false,
            bubble: null
          }
        }
     */
    console.log('state change', participant, subject, state)
    if (subject == 'video') {
      let callType;
      if (state == 'enabled') callType = 'video'
      if (state == 'disabled') callType = 'audio'

      let newSideVideoDiv = createSideVideo(callType, participant.userMedia.stream, participant.userInfo, 'userMedia', participant.userMedia.audioState)
      participant.userMedia.callType = callType
      participant.userMedia.sideVideoDiv.after(newSideVideoDiv)
      participant.userMedia.sideVideoDiv.remove()
      participant.userMedia.sideVideoDiv = newSideVideoDiv
      if (participant.userMedia.isOnMainVideo == true) {
        let maindiv = document.getElementById('mainVideoDiv') // get mainVideoDiv element
        maindiv.textContent = ''
        let mainVideoDivContent = createMainVideoDiv(callType, participant.userMedia.stream, participant.userInfo, 'userMedia', participant.userMedia.audioState)
        mainVideoDivContent.forEach(div => { maindiv.append(div) })
        globalMainVideoDiv = maindiv // store what is on main Div
      }

      let newBubble = bottomPanel.createBubble(callType, participant.userMedia.stream, participant.userInfo, 'userMedia', participant.userMedia.audioState)
      participant.userMedia.bubble.after(newBubble)
      participant.userMedia.bubble.remove()
      participant.userMedia.bubble = newBubble
    }
    if (subject == 'audio') {
      let newSideVideoDiv = createSideVideo(participant.userMedia.callType, participant.userMedia.stream, participant.userInfo, 'userMedia', state)
      participant.userMedia.audioState = state
      participant.userMedia.sideVideoDiv.after(newSideVideoDiv)
      participant.userMedia.sideVideoDiv.remove()
      participant.userMedia.sideVideoDiv = newSideVideoDiv
      if (participant.userMedia.isOnMainVideo == true) {
        let maindiv = document.getElementById('mainVideoDiv') // get mainVideoDiv element
        maindiv.textContent = ''
        let mainVideoDivContent = createMainVideoDiv(participant.userMedia.callType, participant.userMedia.stream, participant.userInfo, 'userMedia', state)
        mainVideoDivContent.forEach(div => { maindiv.append(div) })
        globalMainVideoDiv = maindiv // store what is on main Div
      }
      let newBubble = bottomPanel.createBubble(participant.userMedia.callType, participant.userMedia.stream, participant.userInfo, 'userMedia', state)
      participant.userMedia.bubble.after(newBubble)
      participant.userMedia.bubble.remove()
      participant.userMedia.bubble = newBubble
    }
  }
  function determineAudioVideoState(stream, audioButton, videoButton) {
    if (!stream) return console.warn('No Stream provided to the function');
    for (let index in stream.getVideoTracks()) {
      let videoTrack = stream.getVideoTracks()[index]
      if (videoTrack.enabled) { videoButton.classList.remove("active") }
      else { videoButton.classList.add("active") }
    }
    for (let index in stream.getAudioTracks()) {
      let audioTrack = stream.getAudioTracks()[index]
      if (audioTrack.enabled) { audioButton.classList.remove("active") }
      else { audioButton.classList.add("active") }
    }
  }

  function updateMySideVideoDiv() {
    let myNewSideVideo = createSideVideo(globalCallType, myStream, caller_me, 'userMedia', globalAudioState)
    mySideVideoDiv.after(myNewSideVideo)
    mySideVideoDiv.remove()
    mySideVideoDiv = myNewSideVideo
  }

  function createMainVideoDiv(callType, stream, userInfo, callMediaType) {
    let { userID, name, surname, profilePicture, role } = userInfo;

    //main video element
    let mainVideoElement = createElement({ elementType: 'video', class: 'mainVideoElement', srcObject: stream, autoplay: true });

    let statement = "";
    if (callMediaType == 'userMedia') statement = ""
    if (callMediaType == 'screenMedia') statement = "'s screen"

    //topBar
    let mainVideoOwnerProfilePicture;
    if (profilePicture == null) mainVideoOwnerProfilePicture = createElement({ elementType: 'div', class: 'mainVideoOwnerProfilePicture', textContent: name.charAt(0) + surname.charAt(0) })
    else mainVideoOwnerProfilePicture = createElement({ elementType: 'img', class: 'mainVideoOwnerProfilePicture', src: profilePicture })
    let videoOwnerName = createElement({ elementType: 'div', class: 'videoOwnerName', textContent: name + ' ' + surname + statement })
    let videoOwnerPosition = createElement({ elementType: 'div', class: 'videoOwnerPosition', textContent: role })
    let mainVideoOwnerProfileNamePosition = createElement({ elementType: 'div', class: 'mainVideoOwnerProfileNamePosition', childrenArray: [videoOwnerName, videoOwnerPosition] })
    let leftUserIdentifiers = createElement({ elementType: 'div', class: 'leftUserIdentifiers', childrenArray: [mainVideoOwnerProfilePicture, mainVideoOwnerProfileNamePosition] })

    let muteBtn = createElement({
      elementType: 'button', title: 'Mute Video', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-volume-mute' })], onclick: () => {
        for (let index in stream.getAudioTracks()) {
          let audioTrack = stream.getAudioTracks()[index]
          audioTrack.enabled = !audioTrack.enabled
        }
        determinAudioState()
      }
    })
    determinAudioState()
    function determinAudioState() {
      for (let index in stream.getAudioTracks()) {
        let audioTrack = stream.getAudioTracks()[index]
        if (audioTrack.enabled) {
          muteBtn.classList.remove("active")
        } else {
          muteBtn.classList.add("active")
        }
      }
    }
    let speakerBtn = createElement({ elementType: 'button', title: 'User is speaking', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-user-voice' })] })
    streamVolumeOnTreshold(stream, 20, speakerBtn)
    let mainVideoFullscreenBtn = createElement({
      elementType: 'button', class: 'mainVideoFullscreenBtn', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-fullscreen' })],
      onclick: () => {
        toggleFullscreen(mainVideoDiv)
        tooggleFullScreenClass()
      }
    })
    let rightVideoControls = createElement({ elementType: 'div', class: 'rightVideoControls', childrenArray: [muteBtn, speakerBtn, mainVideoFullscreenBtn] })
    let callTopBar = createElement({ elementType: 'div', class: 'callTopBar', childrenArray: [leftUserIdentifiers, rightVideoControls] })

    function tooggleFullScreenClass() {
      mainVideoFullscreenBtn.classList.toggle('active')
    }
    //call controls
    //let alwaysVisibleControls = createElement({ elementType: 'button', class: 'alwaysVisibleControls' })
    let fitToFrame = createElement({
      elementType: 'button', class: 'callControl', title: "Fit video to frame", childrenArray: [createElement({ elementType: 'i', class: 'bx bx-collapse' })],
      onClick: () => {
        mainVideoElement.classList.toggle('fitVideoToWindow');
      }
    })
    let closeVideoBtn = createElement({
      elementType: 'button', class: 'callControl', title: "Close my video", childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })],
      onclick: () => {
        toggleDisableVideo(myStream)
        determineStates()
      }
    })
    let HangUpBtn = createElement({
      elementType: 'button', class: 'callControl hangupbtn', title: "Leave this call", childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' })],
      onclick: () => {
        leaveCall()
      }
    })
    let muteMicrophone = createElement({
      elementType: 'button', class: 'callControl', title: "Mute my microphone", childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-microphone' })],
      onclick: () => {
        toggleDisableAudio(myStream)
        determineStates()
      }
    })
    let shareScreenBtn = createElement({
      elementType: 'button', class: 'callControl', title: "Share my screen", childrenArray: [createElement({ elementType: 'i', class: 'bx bx-window-open' })],
      onclick: helpToggleScreenShare
    })
    function helpToggleScreenShare() {
      toggleScreenShare(shareScreenBtn)
      console.log('screen share')
    }
    determineStates()

    function determineStates() {
      determineAudioVideoState(myStream, muteMicrophone, closeVideoBtn)
    }

    let hiddableControls = createElement({ elementType: 'div', class: 'hiddableControls', childrenArray: [fitToFrame, closeVideoBtn, HangUpBtn, muteMicrophone, shareScreenBtn] })
    let callControls = createElement({ elementType: 'div', class: 'callControls', childrenArray: [hiddableControls] })

    // AudioCall Cover Div
    let audioCallprofilePicture
    if (profilePicture == null) audioCallprofilePicture = createElement({ elementType: 'div', class: 'profilePicture', textContent: name.charAt(0) + surname.charAt(0) })
    else audioCallprofilePicture = createElement({ elementType: 'img', class: 'profilePicture', src: profilePicture })
    let audioCallCoverName = createElement({ elementType: 'div', class: 'audioCallCoverName', textContent: name + " " + surname })
    let audioCallCover = createElement({ elementType: 'div', class: 'audioCallCover', childrenArray: [audioCallprofilePicture, audioCallCoverName] })

    let callParticipantDiv
    if (callType == "audio") { audioCallCover.style.display = 'flex' }
    else audioCallCover.style.display = 'none'

    return [mainVideoElement, audioCallCover, callTopBar, callControls]
  }

  function createSideVideo(type, stream, userInfo, callMediaType, audioState) {
    let { userID, name, surname, profilePicture, role } = userInfo
    let statement = "";
    if (callMediaType == 'userMedia') statement = ""
    if (callMediaType == 'screenMedia') statement = "'s screen"
    let videoElement = createElement({ elementType: 'video', srcObject: stream, class: 'callParticipant', autoPlay: "true" }); videoElement.play()

    let miniVideowner = createElement({ elementType: 'div', class: 'miniVideowner', textContent: name + " " + surname + statement })
    let muteBtn = createElement({ elementType: 'button', title: 'Mute Video', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-volume-mute' })] })
    let speakerBtn = createElement({ elementType: 'button', title: 'User is speaking', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-user-voice' })] })
    let sideVideoControls = createElement({ elementType: 'div', class: 'sideVideoControls', childrenArray: [miniVideowner, muteBtn, speakerBtn] })

    let micText = userID == mySavedID? 'You have muted your Mic.': name + ' muted their Mic.'
    let isMuted = createElement({
      elementType: 'div', class: 'muteIndicator', childrenArray: [
        createElement({
          elementType: 'div', class: 'muteIndicatorContent', childrenArray: [
            createElement({ elementType: 'i', class: 'bx bxs-microphone-off' }),
            createElement({ elementType: 'p', textContent: micText })
          ]
        })
      ]
    })

    determinAudioState() // activate / deactivate mute button
    // AudioCall Cover Div
    let audioCallprofilePicture
    if (profilePicture == null) audioCallprofilePicture = createElement({ elementType: 'div', class: 'profilePicture', textContent: name.charAt(0) + surname.charAt(0) })
    else audioCallprofilePicture = createElement({ elementType: 'img', class: 'profilePicture', src: profilePicture })
    let audioCallCoverName = createElement({ elementType: 'div', class: 'audioCallCoverName', textContent: name + " " + surname })
    let audioCallCover = createElement({ elementType: 'div', class: 'audioCallCover', childrenArray: [audioCallprofilePicture, audioCallCoverName] })

    muteBtn.addEventListener('click', () => {
      for (let index in stream.getAudioTracks()) {
        let audioTrack = stream.getAudioTracks()[index]
        audioTrack.enabled = !audioTrack.enabled
      }
      determinAudioState()
    })

    function determinAudioState() {
      for (let index in stream.getAudioTracks()) {
        let audioTrack = stream.getAudioTracks()[index]
        if (audioTrack.enabled) {
          muteBtn.classList.remove("active")
        } else {
          muteBtn.classList.add("active")
        }
      }
    }
    streamVolumeOnTreshold(stream, 20, speakerBtn)
    // overall callParticipant Div
    let callParticipantDiv
    if (type == "audio") { audioCallCover.style.display = 'flex' }
    else audioCallCover.style.display = 'none';

    if (audioState == 'disabled') callParticipantDiv = createElement({ elementType: 'div', class: 'callParticipantDiv', childrenArray: [videoElement, audioCallCover, sideVideoControls, isMuted] })
    else callParticipantDiv = createElement({ elementType: 'div', class: 'callParticipantDiv', childrenArray: [videoElement, audioCallCover, sideVideoControls] })

    if (userID == mySavedID) { videoElement.muted = true; muteBtn.remove(); } // if this is my video no not put an event listener, and mute it, and remove unmute button
    else {
      callParticipantDiv.addEventListener("click", () => {
        let maindiv = document.getElementById('mainVideoDiv')
        maindiv.textContent = '' //empty the mainDiv
        let mainVideoDivContent = createMainVideoDiv(type, stream, userInfo, callMediaType) // create main div contents
        mainVideoDivContent.forEach(div => { maindiv.append(div) }) // apend main div contents to the mainDiv
        globalMainVideoDiv = maindiv // register the mainDiv

        console.log('participants', participants)
        for (let i = 0; i < participants.length; i++) { // loop into all participants and assign them being on main video or not
          if (participants[i].userInfo.userID == userInfo.userID) {
            console.log('participants[i].userMedia', participants[i].userMedia)
            console.log('participants[i].screenMedia', participants[i].screenMedia)
            console.log('participants', participants[0].screenMedia)
            if (callMediaType == 'userMedia') participants[i].userMedia.isOnMainVideo = true
            if (callMediaType == 'screenMedia') participants[i].screenMedia.isOnMainVideo = true
          } else {
            participants[i].userMedia.isOnMainVideo = false;
            participants[i].screenMedia.isOnMainVideo = false;
          }
        }
      })
    }
    return callParticipantDiv;
  }

  socket.on('new-incall-message', message => {
    console.log(message)
    rightPanel.messagesBox.addMessage(message, 'message')
    rightPanel.incrementUnread()
  })

  socket.on('userDisconnectedFromCall', disconnectionInfo => {
    console.log('participants', participants)
    let { id, room } = disconnectionInfo;
    console.log('userDisconnected', id, room)

    if (isNumeric(room)) setUserOffline(id, room)
    if (!isNumeric(room) && room.includes('-allAnswered-sockets')) removePeer(id)
  })

  socket.on('userLeftCall', id => {
    removePeer(id)
    console.log('userLeftCall', id)
  })

  socket.on('stoppedScreenSharing', disconnectionInfo => {
    let { userID, callUniqueId } = disconnectionInfo;
    // close all of the the videos of the person qho quit
    console.log('participants who quit', participants, userID)
    for (let j = 0; j < participants.length; j++) {
      if (participants[j].userInfo.userID == userID) {
        if (participants[j].screenMedia.sideVideoDiv) participants[j].screenMedia.sideVideoDiv.remove(); // remove all the sidevideo of the disconnected user
        if (participants[j].screenMedia.bubble) participants[j].screenMedia.bubble.remove(); // remove all the sidevideo of the disconnected user
        if (participants[j].screenMedia.isOnMainVideo == true) { // if the removed video was also on main video remove it or replace it with a preceeding one
          let maindiv = document.getElementById('mainVideoDiv') // get mainVideoDiv element
          maindiv.textContent = ''
          let mainVideoDivContent = createMainVideoDiv(participants[j].userMedia.callType, participants[j].userMedia.stream, participants[j].userInfo, 'userMedia')
          mainVideoDivContent.forEach(div => { maindiv.append(div) })
          globalMainVideoDiv = maindiv // store what is on main Div
        }
        if (typeof participants[j].screenMedia.callObject.destroy == 'function') participants[j].screenMedia.callObject.destroy(); // displose the call object
      }
    }
  })

  function removePeer(userId) {
    // close all of the the videos of the person qho quit
    let indexOfRemovedUser
    let removedUser
    for (let j = 0; j < participants.length; j++) {
      if (participants[j].userInfo.userID == userId) {
        indexOfRemovedUser = j
        removedUser = participants[j]
        if (participants[j].userMedia.sideVideoDiv) participants[j].userMedia.sideVideoDiv.remove(); // remove all the sidevideo of the disconnected user
        if (participants[j].userMedia.bubble) participants[j].userMedia.bubble.remove(); // remove all the bubble of the disconnected user
        if (participants[j].screenMedia.sideVideoDiv) { participants[j].screenMedia.sideVideoDiv.remove(); } // remove all the sidevideo of the disconnected user
        updateAttendanceList(participants[j].userInfo, 'absent')
        rightPanel.messagesBox.addMessage({ userInfo: participants[j].userInfo, content: '', time: new Date() }, 'leave')
        participants.splice(j, 1); // remove the disconnected user
        rightPanel.setParticipantsCount(participants.length)
      }
    }
    if (participants.length >= 1) { // if we still have users on the call
      if (removedUser.userMedia.isOnMainVideo == true || removedUser.screenMedia.isOnMainVideo == true) { //if the removed user
        let nextOrPrevUser = participants[indexOfRemovedUser] || participants[indexOfRemovedUser - 1] || participants[indexOfRemovedUser + 1] // decide which user to put on main video
        let maindiv = document.getElementById('mainVideoDiv') // get mainVideoDiv element
        maindiv.textContent = ''
        let mainVideoDivContent = createMainVideoDiv(nextOrPrevUser.userMedia.callType, nextOrPrevUser.userMedia.stream, nextOrPrevUser.userInfo, 'userMedia')
        mainVideoDivContent.forEach(div => { maindiv.append(div) })
        globalMainVideoDiv = maindiv // store what is on main Div
      }
    }
    else { leaveCall() } // no longer have any user connected - remove the mail Video and end the call
  }

  function toggleScreenShare(triggerButton) {
    if (screenSharing == false) {
      startScreenSharing(triggerButton)
    } else {
      stopScreenSharing(triggerButton)
    }
  }
  function startScreenSharing(triggerButton) {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then((screenVideoStream) => {
      myScreenStream = screenVideoStream // store my screen stream
      myScreenStream.getTracks().forEach(track => track.onended = () => stopScreenSharing(triggerButton)) // end screen sharing if the system ends the streaming or if the device is unplugged
      let callMediaType = 'screenMedia'
      let options = { metadata: { userInfo: caller_me, callType: 'video', callMediaType: callMediaType } }
      myScreenSideVideo = createSideVideo('video', myScreenStream, caller_me, callMediaType, 'enabled')
      mySideVideoDiv.after(myScreenSideVideo)
      for (let i = 0; i < participants.length; i++) {
        console.log('checking all participants', 1)
        const call = myPeer.call(participants[i].userMedia.callObject.peer, myScreenStream, options)
        let myScreenViewer = {
          userInfo: participants[i].userMedia.userInfo,
          peerId: participants[i].userMedia.callObject.peer,
          callObject: call,
          peerInitiatedByMe: true,
          audioState: 'enabled'
        }
        myScreenViewers.push(myScreenViewer)
      }
      triggerButton.classList.add('active')
      screenSharing = true
    })
  }
  function stopScreenSharing(triggerButton) {
    socket.emit('stopScreenSharing', _callUniqueId)
    screenSharing = false
    myScreenStream.getTracks().forEach(track => track.stop())
    if (triggerButton) triggerButton.classList.remove('active')
    for (let i = 0; i < myScreenViewers.length; i++) {
      myScreenSideVideo.remove();
      myScreenViewers.splice(i, 1);
    }
  }

  function leaveCall() {
    socket.emit('leaveCall', { callUniqueId: _callUniqueId })
    if (screenSharing == true) stopScreenSharing()
    if (myStream) myStream.getTracks().forEach(track => track.stop()) // ensure that all tracks are closed
    if (myScreenStream) myScreenStream.getTracks().forEach(track => track.stop()) // ensure that all tracks are closed
    console.log('participants before leaving the call', participants)
    for (let i = 0; i < participants.length; i++) { removePeer(participants[i].userInfo.userID) }
    mySideVideoDiv.remove()
    rightPanel.participantsBox.textContent = ''
    if (globalMainVideoDiv) globalMainVideoDiv.textContent = ''
    topBar.textContent = ''
    bottomPanel.textContent = ''
  }
  function createRightPartPanel() {
    let participantsCount = 0;
    let unreadmessagesCount = 0;
    // Header
    let participantsSelectorBtn = createElement({ elementType: 'div', class: 'rightHeaderItem participants headerItemSelected', textContent: 'Participants ' + participantsCount })
    let messagesSelectorbtn = createElement({ elementType: 'div', class: 'rightHeaderItem callChat', textContent: 'Messages ' + unreadmessagesCount })
    let rightPartheaderVideoMessaging = createElement({ elementType: 'div', class: 'rightPartheaderVideoMessaging', childrenArray: [participantsSelectorBtn, messagesSelectorbtn] })
    let callParticipantsDiv = createElement({ elementType: 'div', class: 'callParticipantsDiv' })
    let c_openchat__box__info = createElement({
      elementType: 'div', class: 'c-openchat__box__info', childrenArray: [
        createElement({ elementType: 'div', class: 'push-down' }),
        createElement({
          elementType: 'div', class: 'message-separator', childrenArray: [
            createElement({ elementType: 'span', textContent: 'You joined' })
          ]
        })
      ]
    })
    c_openchat__box__info.style.scrollBehavior = "smooth";
    let iconButton = createElement({ elementType: 'button', class: 'chat-options', title: 'Send a Sticker', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-smile' })] })
    let inputText = createElement({ elementType: 'div', class: 'w-input-text', contentEditable: true })
    let inputPlaceHolder = createElement({ elementType: 'div', class: 'w-placeholder', textContent: 'Type a message' })
    let inputTextGroup = createElement({ elementType: 'div', class: 'w-input-text-group', childrenArray: [inputText, inputPlaceHolder] })
    let inputContainer = createElement({ elementType: 'div', class: 'w-input-container', childrenArray: [inputTextGroup], onclick: (e) => inputText.focus() })
    let sendButton = createElement({ elementType: 'button', class: 'chat-options', title: 'Send Message', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-send' })] })
    let typingBox = createElement({ elementType: 'div', class: 'typingBox', childrenArray: [iconButton, inputContainer, sendButton] })

    let callMessagingDiv = createElement({ elementType: 'div', class: 'callMessagingDiv hideDivAside', childrenArray: [c_openchat__box__info, typingBox] })

    // selectore Event listeners
    participantsSelectorBtn.addEventListener('click', () => {
      participantsSelectorBtn.classList.add('headerItemSelected');
      messagesSelectorbtn.classList.remove('headerItemSelected');
      callMessagingDiv.classList.add('hideDivAside')
      callParticipantsDiv.classList.remove('hideDivAside')
    })
    messagesSelectorbtn.addEventListener('click', () => {
      participantsSelectorBtn.classList.remove('headerItemSelected');
      messagesSelectorbtn.classList.add('headerItemSelected');
      callMessagingDiv.classList.remove('hideDivAside')
      callParticipantsDiv.classList.add('hideDivAside')
      unreadmessagesCount = 0
      messagesSelectorbtn.textContent = ('Messages ' + unreadmessagesCount)
    })
    sendButton.addEventListener('click', sendMessage)
    inputText.addEventListener('keydown', function (e) { if (e.key == 'Enter' && !e.shiftKey) { sendMessage(); e.preventDefault(); } })
    function sendMessage() {
      if (inputText.textContent == '') return;
      console.log(inputText.textContent)
      socket.emit('new-incall-message', { callUniqueId: _callUniqueId, message: inputText.textContent })
      inputText.textContent = '';
    }
    function incrementUnreadCount() { unreadmessagesCount = unreadmessagesCount + 1; messagesSelectorbtn.textContent = ('Messages ' + unreadmessagesCount) }
    function setParticipantsCount(count) { participantsSelectorBtn.textContent = ('Participants ' + count) }

    let rightPartContentDiv = createElement({ elementType: 'div', class: 'rightPartContentDiv', childrenArray: [callParticipantsDiv, callMessagingDiv] })

    let ongoingCallRightPart = document.getElementById('ongoingCallRightPart')
    ongoingCallRightPart.textContent = '';
    ongoingCallRightPart.append(rightPartheaderVideoMessaging, rightPartContentDiv)

    let prevMsg
    let receivedGroup;
    let sentGroup;

    c_openchat__box__info.addMessage = (message, event) => {
      let { userInfo, content, time } = message
      if (event == 'join') {
        let notificationElement = createElement({ elementType: 'div', class: 'message-separator', childrenArray: [createElement({ elementType: 'span', textContent: userInfo.userID == caller_me.userID ? 'You joined' : userInfo.name + ' ' + userInfo.surname + ' joined' })] })
        c_openchat__box__info.append(notificationElement)
      }
      if (event == 'leave') {
        let notificationElement = createElement({ elementType: 'div', class: 'message-separator', childrenArray: [createElement({ elementType: 'span', textContent: userInfo.userID == caller_me.userID ? 'You left' : userInfo.name + ' ' + userInfo.surname + ' left' })] })
        c_openchat__box__info.append(notificationElement)
      }

      if (event == 'message') {
        // ------------------------------------------------------------------------------
        if (!prevMsg) {
          if (message.userInfo.userID == caller_me.userID) {
            let msg = createSentMessage(message)
            sentGroup = createNewSentGroup(msg)
            c_openchat__box__info.append(sentGroup)
          }
          else {
            let msg = createReceivedMessage(message)
            receivedGroup = createNewReceivedGroup(msg)
            c_openchat__box__info.append(receivedGroup)
          }
        }
        else {
          if (prevMsg.userInfo.userID == caller_me.userID) {
            if (message.userInfo.userID == caller_me.userID) {
              let msg = createSentMessage(message)
              sentGroup.append(msg)
            }
            else {
              if (prevMsg.userInfo.userID == message.userInfo.userID) {
                let msg = createReceivedMessage(message)
                receivedGroup.append(msg)
              }
              else {
                let msg = createReceivedMessage(message)
                let newReceivedGrp = createNewReceivedGroup(msg)
                receivedGroup = newReceivedGrp
                c_openchat__box__info.append(receivedGroup)
              }
            }
          }
          else {
            if (message.userInfo.userID == caller_me.userID) {
              let msg = createSentMessage(message)
              let newSentGroup = createNewSentGroup(msg)
              sentGroup = newSentGroup
              c_openchat__box__info.append(sentGroup)
            }
            else {
              if (prevMsg.userInfo.userID == message.userInfo.userID) {
                let msg = createReceivedMessage(message)
                receivedGroup.append(msg)
              }
              else {
                let msg = createReceivedMessage(message)
                let newReceivedGrp = createNewReceivedGroup(msg)
                receivedGroup = newReceivedGrp
                c_openchat__box__info.append(receivedGroup)
              }
            }
          }
        }
        // -------------------------------------------------------------------------------
        c_openchat__box__info.scrollTop = c_openchat__box__info.scrollHeight;
        prevMsg = message
      }
      function createNewSentGroup(firstMessage) {
        let anotherGroup = createElement({ elementType: 'div', class: 'message-group-sent' }); anotherGroup.append(firstMessage);
        return anotherGroup
      }
      function createNewReceivedGroup(firstMessage) {
        let receivedMessageProfile;
        if (message.userInfo.profilePicture == null) receivedMessageProfile = createElement({ elementType: 'div', class: 'receivedMessageProfile', textContent: message.userInfo.name.charAt(0) + message.userInfo.surname.charAt(0) })
        else receivedMessageProfile = createElement({ elementType: 'img', class: 'receivedMessageProfile', src: message.userInfo.profilePicture })
        let receivedMessageProfileContainter = createElement({ elementType: 'div', childrenArray: [receivedMessageProfile] })
        let receivedMessagesHolder = createElement({ elementType: 'div', childrenArray: [firstMessage] })
        let anotherGroup = createElement({ elementType: 'div', class: 'message-group-received', childrenArray: [receivedMessageProfileContainter, receivedMessagesHolder] })
        anotherGroup.append = (childElement) => { receivedMessagesHolder.append(childElement) }
        return anotherGroup
      }
      function createSentMessage(message) {
        let profileP;
        if (message.userInfo.profilePicture == null) profileP = createElement({ elementType: 'div', textContent: message.userInfo.name.charAt(0) + message.userInfo.surname.charAt(0) })
        else profileP = createElement({ elementType: 'img', src: message.userInfo.profilePicture })
        let message_sent = createElement({
          elementType: 'div', class: 'message-sent', childrenArray: [
            createElement({ elementType: 'div', class: 'time_reactions_options', textContent: new Date(message.time).toString('YYYY-MM-dd').substring(16, 24) }),
            createElement({ elementType: 'div', class: 'message-sent-text', textContent: content }),
            createElement({ elementType: 'div', class: 'message-sent-status', childrenArray: [profileP] }),
          ]
        })
        return message_sent
      }
      function createReceivedMessage(message) {
        let message_received = createElement({
          elementType: 'div', class: 'message-received', childrenArray: [
            createElement({ elementType: 'div', class: 'message-received-text', textContent: content }),
            createElement({ elementType: 'div', class: 'time_reactions_options', textContent: new Date(message.time).toString('YYYY-MM-dd').substring(16, 24) })
          ]
        })
        return message_received
      }
    }
    return {
      messagesBox: c_openchat__box__info, // contains an addMessage(message) function to add messages to the conversation
      incrementUnread: () => { if (callMessagingDiv.classList.contains('hideDivAside')) { incrementUnreadCount() } },
      participantsBox: callParticipantsDiv,
      setParticipantsCount: setParticipantsCount // a function that accepts an integer
    }
  }
  function createLeftPanel() {
    let ongoingCallLeftPart = document.getElementById('ongoingCallLeftPart')
    ongoingCallLeftPart.textContent = '';
    let presentCount = 1
    let absentCount = 0;
    let presenceSelectorBtn = createElement({ elementType: 'div', class:'leftHeaderItem headerItemSelected', textContent: 'Present ' + presentCount})
    let absenceSelectorBtn = createElement({ elementType: 'div', class:'leftHeaderItem', textContent: 'Absent ' + absentCount})
    let attendanceTitleSection = createElement({ elementType: 'div', class: 'attendanceTitleSection', childrenArray: [presenceSelectorBtn, absenceSelectorBtn]})

    let presentMembersDiv = createElement({ elementType: 'div', class: 'presentMembersDiv'})
    let absentMembersDiv = createElement({ elementType: 'div', class: 'absentMembersDiv hiddenDiv'})
    let attendanceContentDiv = createElement({ elementType: 'div', class: 'attendanceContentDiv', childrenArray: [presentMembersDiv, absentMembersDiv]})

    presenceSelectorBtn.addEventListener('click', ()=>{
      presenceSelectorBtn.classList.add('headerItemSelected');
      absenceSelectorBtn.classList.remove('headerItemSelected');
      presentMembersDiv.classList.remove('hiddenDiv')
      absentMembersDiv.classList.add('hiddenDiv')
    })
    absenceSelectorBtn.addEventListener('click', ()=>{
      presenceSelectorBtn.classList.remove('headerItemSelected');
      absenceSelectorBtn.classList.add('headerItemSelected');
      presentMembersDiv.classList.add('hiddenDiv')
      absentMembersDiv.classList.remove('hiddenDiv')
    })
    ongoingCallLeftPart.append(attendanceTitleSection, attendanceContentDiv)

    function setUserPresent(userForAttendanceList, userInfo){
      
    }

    return{
      leftPanel: leftPanel,

    }
  }
  function createBottomPart() {
    let availableScreensDiv = document.getElementById('availableScreensDiv')
    availableScreensDiv.textContent = '';
    function createBottomBubble(callType, stream, userInfo, callMediaType, audioState) {
      let bubble = createElement({
        elementType: 'div', class: 'screenItem', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0),
        onclick: () => {
          let maindiv = document.getElementById('mainVideoDiv')
          maindiv.textContent = '' //empty the mainDiv
          let mainVideoDivContent = createMainVideoDiv(callType, stream, userInfo, callMediaType, audioState) // create main div contents       
          mainVideoDivContent.forEach(div => { maindiv.append(div) }) // apend main div contents to the mainDiv
          globalMainVideoDiv = maindiv // register the mainDiv

          for (let i = 0; i < participants.length; i++) { // loop into all participants and assign them being on main video or not
            if (participants[i].userInfo.userID == userInfo.userID) {
              if (callMediaType == 'userMedia') { participants[i].userMedia.isOnMainVideo = true }
              if (callMediaType == 'screenMedia') { participants[i].screenMedia.isOnMainVideo = true }
            } else {
              participants[i].userMedia.isOnMainVideo = false;
              participants[i].screenMedia.isOnMainVideo = false;
            }
          }
        }
      })
      streamVolumeOnTreshold(stream, 20, bubble)
      return bubble
    }
    return {
      createBubble: createBottomBubble, // it accepts : callType, stream, userInfo, callMediaType, audioState
      availableScreensDiv: availableScreensDiv
    }
  }
})

function isNumeric(num) { return !isNaN(num) }
function isNegative(num) { if (Math.sign(num) === -1) { return true; } return false; }

function convertToAudioOnlyStream(stream) { stream.getVideoTracks().forEach(track => { track.enabled = false; }); return stream; } // disable all video tracks

function createElement(configuration) {
  if (!configuration.elementType) return console.warn('no element type provided')
  let elementToReturn = document.createElement(configuration.elementType)
  if (configuration.id) elementToReturn.setAttribute('id', configuration.id)
  if (configuration.class) elementToReturn.setAttribute('class', configuration.class)
  if (configuration.title) elementToReturn.setAttribute('title', configuration.title)
  if (configuration.srcObject) elementToReturn.srcObject = configuration.srcObject
  if (configuration.src) elementToReturn.src = configuration.src
  if (configuration.textContent) elementToReturn.textContent = configuration.textContent
  if (configuration.childrenArray) configuration.childrenArray.forEach(child => elementToReturn.append(child))
  if (configuration.onclick) elementToReturn.addEventListener('click', configuration.onclick)
  if (configuration.autoPlay) elementToReturn.setAttribute('autoplay', 'true')
  if (configuration.type) elementToReturn.setAttribute('type', configuration.type)
  if (configuration.placeHolder) elementToReturn.setAttribute('placeholder', configuration.placeHolder)
  if (configuration.contentEditable) elementToReturn.setAttribute('contentEditable', configuration.contentEditable)
  if (configuration.autoplay) elementToReturn.autoplay = configuration.autoplay
  return elementToReturn
}

function userForAttendanceList(userInfo, actions) {
  let { userID, name, surname, role, profilePicture, status } = userInfo
  // actions is an array of buttons where on item is {element, functionCall}
  // container is presentMembersDiv
  let memberProfilePicture;
  if (profilePicture == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: name.charAt(0) + surname.charAt(0) })
  else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: profilePicture })

  let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: name + ' ' + surname })
  let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: role })
  let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })
  let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' }), createElement({ elementType: 'p', textContent: 'Chat' }),] })

  let actionElements = actions.map(action => {
    //let { element, functionCall } = action
    let { element, functionCall } = action
    element.addEventListener('click', functionCall)
    return element;
  })

  let presentMember = createElement({ elementType: 'div', class: 'listMember', childrenArray: [memberProfilePicture, memberNameRole].concat(actionElements) })
  return presentMember
}

function updateAttendaceList() {




}

function streamVolumeOnTreshold(stream, threshold, outletEment) {
  if (stream.getAudioTracks().length < 1) return;
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
    socket.emit("initiateCall", { callTo, audio, video, group, fromChat, previousCallId })
    showOngoingCallSection()
    startWaitingTone()
    stream.getTracks().forEach(track => { track.stop(); stream.removeTrack(track); })  //stop media tracks
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
  let { isGroup, awaitedUserDivs, displayInitials, profilePicture, screenMessage, spinner } = constraints
  // isGroup: isGroup,
  // awaitedUserDivs: awaitedUserDivs,
  // displayInitials: displayInitials,
  // profilePicture: profilePicture,
  // screenMessage: reason,
  // spinner: true,

  let caleeProfilePicture;
  if (constraints.profilePicture != null) { caleeProfilePicture = createElement({ elementType: 'img', class: 'caleeProfilePicture', src: constraints.profilePicture }) }
  else caleeProfilePicture = createElement({ elementType: 'div', class: 'caleeProfilePicture', textContent: constraints.displayInitials })
  let activity = createElement({ elementType: 'div', class: 'activity', textContent: constraints.screenMessage })
  let spinnerDiv = createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })
  let calleesDiv = createElement({ elementType: 'div', class: 'calleesDiv', childrenArray: awaitedUserDivs.map(awaitedUserDiv => awaitedUserDiv.div) })

  let videoCoverDiv
  if (spinner == true) videoCoverDiv = createElement({ elementType: 'div', class: 'videoCoverDiv', childrenArray: [caleeProfilePicture, activity, spinnerDiv, calleesDiv] })
  else videoCoverDiv = createElement({ elementType: 'div', class: 'videoCoverDiv', childrenArray: [caleeProfilePicture, activity, calleesDiv] })

  let controls = {};
  if (constraints.videoConnectingControls) {
    let closeVideoBtn = createElement({ elementType: 'button', class: 'callControl', title: "Close my video", childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video-off' })] })

    let HangUpBtn = createElement({ elementType: 'button', class: 'callControl hangupbtn', title: "Leave this call", childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' })] })
    let muteMicrophoneBtn = createElement({ elementType: 'button', class: 'callControl', title: "Mute my microphone", childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-microphone-off' })] })

    let hiddableControls = createElement({ elementType: 'div', class: 'waitingCallControls', childrenArray: [closeVideoBtn, HangUpBtn, muteMicrophoneBtn] })
    videoCoverDiv.append(hiddableControls)
    controls = { closeVideoBtn, HangUpBtn, muteMicrophoneBtn }
  }
  return { videoCoverDiv, controls, calleesDiv }
}

function displayNotification(notificationConfig) {
  let { title, body, actions, obligatoryActions, delay, tone } = notificationConfig
  let { iconClass, titleText } = title
  let { shortOrImage, bodyContent } = body
  let { shortOrImagType, shortOrImagContent } = shortOrImage
  let { onDisplay, onEnd, onHide } = obligatoryActions

  let notificationsDiv = document.getElementById('notificationsDiv')

  //Title
  let titleIcon = createElement({ elementType: 'i', class: iconClass })
  let titleTextDiv = createElement({ elementType: 'div', class: 'notificationTitleText', textContent: titleText })
  let notificationTitle = createElement({ elementType: 'div', class: 'notificationTitle', childrenArray: [titleIcon, titleTextDiv] })

  //Body
  let profilePicture;
  if (shortOrImagType == 'short') { profilePicture = createElement({ elementType: 'div', class: 'profilePicture', textContent: shortOrImagContent }) }
  if (shortOrImagType == 'image') { profilePicture = createElement({ elementType: 'img', class: 'profilePicture', src: shortOrImagContent }) }
  let notificationContent = createElement({ elementType: 'div', class: 'notificationContent', textContent: bodyContent })
  let notificationBody = createElement({ elementType: 'div', class: 'notificationBody', childrenArray: [profilePicture, notificationContent] })

  let notification;

  //Actions
  let buttonsArray = [];
  actions.forEach(action => {
    let { type, displayText, actionFunction } = action
    let actionBtn = createElement({ elementType: 'button', class: type, textContent: displayText })
    actionBtn.addEventListener('click', () => { actionFunction(); notificationStop(); })
    buttonsArray.push(actionBtn)
  })
  let dismissbutton = createElement({ elementType: 'button', class: 'normal', textContent: 'Hide' })
  buttonsArray.push(dismissbutton)
  let notificationActions = createElement({ elementType: 'div', class: 'notificationActions', childrenArray: buttonsArray })

  //progressbar
  let notificationProgressBar = createElement({ elementType: 'div', class: 'notificationProgressBar' })

  //notification Element
  notification = createElement({ elementType: 'div', class: 'notification', childrenArray: [notificationTitle, notificationBody, notificationActions, notificationProgressBar] })
  notificationsDiv.append(notification)

  // run the On display event
  onDisplay()

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
    shortOrImage: { shortOrImagType: 'image', shortOrImagContent: '/images/profiles/group.jpeg' },
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
  delay: 5000,
  tone: 'notification'
})


function createOngoingCallScreen() {
  // leftPart
  let leftPartHeaderDivTitle = createElement({ elementType: 'div', class: 'leftPartHeaderDivTitle' })
  let inviteSomeone = createElement({
    type: 'button',
    class: 'inviteSomeone',
    childrenArray: [createElement({ elementType: 'i', class: 'bx bx-plus' }), createElement({ elementType: 'p', textContent: 'invite Someone' })]
  })
  let presenceSelectorBtn = createElement({ elementType: 'div', class: 'leftHeaderItem headerItemSelected', textContent: 'Present (0)' })
  let absenceSelectorBtn = createElement({ elementType: 'div', class: 'leftHeaderItem', textContent: 'Absent (0)' })

  let attendanceTitleSection = createElement({ elementType: 'div', class: 'attendanceTitleSection', childrenArray: [presenceSelectorBtn, absenceSelectorBtn] })
  let presentMembersDiv = createElement({ elementType: 'div', class: 'presentMembersDiv', id: 'presentMembersDiv' })
  let absentMembersDiv = createElement({ elementType: 'div', class: 'absentMembersDiv', id: 'absentMembersDiv' })
  let attendanceContentDiv = createElement({ elementType: 'div', class: 'attendanceContentDiv', childrenArray: [presentMembersDiv, absentMembersDiv] })

  let leftPart = createElement({ elementType: 'div', class: 'leftPart', textContent: 'Attendance', childrenArray: [leftPartHeaderDivTitle, inviteSomeone, attendanceTitleSection, attendanceContentDiv] })
  //call-container

  return {
    leftPartHeaderDivTitle: leftPartHeaderDivTitle,
    inviteSomeone: inviteSomeone,
    attendanceTitleSection: attendanceTitleSection,
  }
}

function createTopBar(callInfo, myInfo) {
  let { callUniqueId, callType, callTitle, isTeam } = callInfo
  let callScreenHeader = document.getElementById('callScreenHeader')


  let MeetingTitle = createElement({ elementType: 'div', class: 'MeetingTitle', textContent: callTitle })
  let headerLeftPart = createElement({ elementType: 'div', class: 'headerLeftPart', childrenArray: [MeetingTitle] })

  let input = createElement({ elementType: 'input', placeHolder: 'Search users' })
  let doneBtn = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-check' }), createElement({ elementType: 'p', textContent: 'Done' })] })
  let searchField = createElement({ elementType: 'div', class: 'searchField', childrenArray: [input, doneBtn] })

  let invitedDiv = createElement({ elementType: 'div', class: 'invitedDiv', textContent: 'Type to search ...' })

  input.addEventListener('input', () => {
    var searchText = input.value;
    console.log('searching People', callUniqueId, searchText)
    socket.emit('searchPeopleToInviteToCall', { callUniqueId, searchText });
  })


  socket.on('searchPeopleToInviteToCall', (searchPeople) => {
    console.log(searchPeople)
    if (searchPeople.length == 0) { return invitedDiv.textContent = 'No user found.' }
    invitedDiv.textContent = ''
    searchPeople.forEach((searchPerson) => {
      let searchPersonElement;
      let element = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-user-plus' })] })
      let actions = [
        {
          element, functionCall: () => {
            console.log('add user; ', searchPerson.userID)
            searchPersonElement.remove()
            socket.emit('addUserToCall', { callUniqueId, userID: searchPerson.userID, callType, callTitle });
          }
        }
      ];
      searchPersonElement = userForAttendanceList(searchPerson, actions)
      invitedDiv.append(searchPersonElement)
    })
  })

  let popDown = createElement({ elementType: 'div', class: 'popdown', childrenArray: [searchField, invitedDiv] })
  let inviteSomeone = createElement({
    elementType: 'button',
    class: 'inviteSomeone',
    childrenArray: [
      createElement({ elementType: 'i', class: 'bx bx-plus' }),
      createElement({ elementType: 'p', textContent: 'Add Participants' }),
    ],
    onclick: () => {
      input.focus()
      popDown.classList.toggle('popdownDisplayed')
    }
  })
  doneBtn.addEventListener('click', () => { popDown.classList.toggle('popdownDisplayed') })
  let headerRightPart = createElement({ elementType: 'div', class: 'headerRightPart', childrenArray: [inviteSomeone, popDown] })

  callScreenHeader.textContent = '';
  callScreenHeader.append(headerLeftPart, headerRightPart)

  return callScreenHeader
}




// window.onbeforeunload = function () {
//   deleteAllCookies()
//   return 'Are you sure you want to leave?';
// };
// function deleteAllCookies() {
//   var cookies = document.cookie.split(";");

//   for (var i = 0; i < cookies.length; i++) {
//     var cookie = cookies[i];
//     var eqPos = cookie.indexOf("=");
//     var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
//     document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
//   }
// }