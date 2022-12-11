const scriptSrcUrls = [] // here we keep a list of our external scripts
const styleSrcUrls = ["'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"] // here we keep a list of our external styles
const fontSrcUrls = ["https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"] // here we keep a list of our external fonts
const connectSrcUrls = ["wss://*.imperiumline.com", "https://*.imperiumline.com"] // here we keep a list of our external connections

const selfLink = "'self'"

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const app = express(); // app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [selfLink],
      connectSrc: [selfLink, ...connectSrcUrls],
      scriptSrc: [selfLink, ...scriptSrcUrls],
      styleSrc: [selfLink, ...styleSrcUrls],
      workerSrc: [selfLink],
      objectSrc: [selfLink],
      imgSrc: [selfLink],
      fontSrc: [selfLink, ...fontSrcUrls],
    },
    referrerPolicy: { policy: "no-referrer" }
  })
);
const ninetyDaysInSeconds = 5184000 // 90 * 24 * 60 * 60
app.use(helmet.hsts({
  maxAge: ninetyDaysInSeconds,
  includeSubdomains: true,
  preload: true
})) //Strict Transport Security tells the browser to never again visit our website on http during the period mentioned
app.use(helmet.frameguard({ action: 'deny' })); // X Frame Options http header prevents our website to be framed into another or vice versa
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy()); // Removes the X-Powered-By header if it was set.


// const xXssProtection = require("x-xss-protection");
// app.use(xXssProtection()); // Set "X-XSS-Protection: 0"

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const dotenv = require('dotenv');
const session = require('express-session');
const SocketIOFileUpload = require("socketio-file-upload")
const fs = require('fs')
const bcrypt = require('bcryptjs');

dotenv.config({ path: './.env' });

const db = require('./db/db.js');
const pwValidator = require('./controllers/pwValidator');
const { connect } = require('tls');
const console = require('console');

const handlebars = require('express-handlebars').create({
  layoutsDir: path.join(__dirname, "views/layouts"),
  partialsDir: path.join(__dirname, "views/partials"),
  defaultLayout: 'layout',
  extname: 'hbs'
})

app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, "views"));
//app.set('partials', 'views/partials')

db.connect((err) => {
  if (err) {
    console.log(err);
  }
  else {
    console.log('MySQL Connected');
  }
})

const port = process.env.PORT || 3600;
app.use(express.static(path.join(__dirname, './public')));

//Session & cookie configuration
const sessionMiddleware = session({
  name: 'sessName',
  resave: false,
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  cookie: {
    MaxAge: 1000 * 60 * 60 * 24 * 7, //one week max
    sameSite: 'strict',
    secure: false, // TODO: This value has tobe true in Production environment and the application has to have HTTPS enabled
    httpOnly: true,
  }
})
io.use(function (socket, next) {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
})

app.use(sessionMiddleware)

//parse url encoded body as sent by HTML forms
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/', require('./routes/router.js'));
app.use('/auth', require('./routes/auth.js'));
app.use('/admin', require('./routes/router.js'));
app.use('/private', require('./routes/router.js'));

app.use(SocketIOFileUpload.router);

let connectedUsers = [];
io.on('connection', (socket) => {
  console.log(socket.request.session.email ? "a user came online and has session opened" : " a user came online and has No session");
  if (socket.request.session.email) {
    var email = socket.request.session.email;
    let id;
    db.query('SELECT id, name, surname, company_id FROM user WHERE email = ?', [email], async (err, result) => {
      if (result.length < 1) return console.log("Connected user's cookie's email does not exist in the database!! Modified cookie");
      id = result[0].id;
      company_id = result[0].company_id;
      let randomPeerId = makeid(25)
      connectedUsers.push({ id: id, email: email, socket: socket, callId: randomPeerId })
      let userInfo = await getUserInfo(id)
      userInfo.callId = randomPeerId
      let myInformation = {
        userInfo: userInfo,
        adminShip: {
          superAdmin: { isSuperAdmin: await getSuperadminAccess(id) },
          admin: {
            isAdmin: await checkGenericAdminAccess(id),
            administeredCompaniesInfo: await getAdminUserCompanies(id)
          }
        }
      }
      socket.emit('myId', myInformation);
      db.query('SELECT `id`, `userID`, `roomID`, `dateGotAccess`, room.chatID, room.name, room.type, room.profilePicture, room.creationDate, room.lastActionDate FROM `participants` LEFT JOIN room ON room.chatID = participants.roomID WHERE participants.userID = ? ORDER BY `room`.`lastActionDate` DESC', [id], async (err, mychatResults) => {
        if (err) return console.log(err)
        let roomInfos = []
        for (let i = 0; i < mychatResults.length; i++) {
          const myChat = mychatResults[i];
          socket.join(myChat.roomID + '')
          roomInfos.push(await getRoomInfo(myChat.roomID, id))
        }
        socket.emit('displayChat', roomInfos)
      })
      //send call log to the connected user
      socket.emit('updateCallLog', await getCallLog(id))

      //sendCalendarEvents to the connected user
      let today = new Date()
      let lastYear = new Date()
      lastYear.setFullYear(today.getFullYear() - 1)
      let nextYear = new Date()
      nextYear.setFullYear(today.getFullYear() + 1)
      socket.emit('fillCalendar', await getEvents(id, lastYear, nextYear))

      let initialDate = new Date()
      let endDate = new Date()
      let dateEvents = await getEvents(id, initialDate, endDate)
      socket.emit('dayEvents', dateEvents)

      //fill favorites and friends
      socket.emit('favoriteUsers', await getUserFavorites(id))
      socket.emit('allUsers', await getCompanyUsers(company_id))

      io.emit('onlineStatusChange', { userID: id, status: 'online' });

    })
    // prepare to receive files
    // Make an instance of SocketIOFileUpload and listen on this socket:
    var uploader = new SocketIOFileUpload();
    // uploader.dir = "private/cover";
    uploader.maxFileSize = 1024 * 1024 * 1024; // reject files more th
    uploader.listen(socket);
    // Do something when starting upload:
    uploader.on("start", (event) => {
      // security check
      if (/\.exe$/.test(event.file.name)) {
        uploader.abort(event.file.id, socket);
        console.log('file upload aborted')
        return;
      }
      if (!event.file.meta.fileRole) return console.log("unable to upload file: " + event.file.name, "invalid Role")
      switch (event.file.meta.fileRole) {
        case 'profilePicture':
          uploader.dir = "private/profiles"
          break;
        case 'coverPicture':
          uploader.dir = "private/cover"
          break;
        case 'groupProfilePicture':
          uploader.dir = "private/profiles"
          break;
        default:
          break;
      }
      event.file.clientDetail.name = event.file.name;
      console.log('event', event)
      console.log('start', event.file.name)
      console.log('Meta', event.file.meta.fileRole)
    });

    // Do something when a file is saved:
    uploader.on("saved", (event) => {
      // event.file.clientDetail.name = event.file.name;
      let fileName = makeid(25)
      switch (event.file.meta.fileRole) {
        case 'profilePicture':
          fs.renameSync('private/profiles/' + event.file.name, 'private/profiles/' + fileName);
          updateDBProfilePicture(id, 'private/profiles/' + fileName)
          break;
        case 'coverPicture':
          fs.renameSync('private/cover/' + event.file.name, 'private/cover/' + fileName);
          updateDBCoverPicture(id, 'private/cover/' + fileName)
          break;
        case 'groupProfilePicture':
          let picturePath = 'private/profiles/' + fileName
          let roomID = event.file.meta.roomID
          fs.renameSync('private/profiles/' + event.file.name, picturePath);
          updateDBGroupPicture(roomID, picturePath)
          io.sockets.in(roomID + '').emit('chatProfilePictureChange', { profilePicture: picturePath, roomID: roomID });
          socket.emit('serverFeedback', [{ type: 'positive', message: 'the group profile picture was changed successfully.' }])
          break;
      }
      event.file.clientDetail.name = fileName
      console.log('saved', event)
    });
    // Error handler:
    uploader.on("error", (event) => {
      console.log("Error from uploader", event);
      socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while Uploading the file.' }])
    });
    socket.on("deleteCoverPicture", () => {
      deleteCoverPicture(id)
    })
    socket.on("deleteProfilePicture", () => {
      deleteProfilePicture(id)
    })

    socket.on("setOnlineStatus", (status) => {
      switch (status) {
        case 'offline':
          saveAndSendStatus(id, status)
          break;
        case 'online':
          saveAndSendStatus(id, status)
          break;
        case 'onCall':
          saveAndSendStatus(id, status)
          break;

        default:
          let resultantStatus = 'offline';
          for (let i = 0; i < connectedUsers.length; i++) {
            if (connectedUsers[i].id == id) resultantStatus = 'online';
          }
          saveAndSendStatus(id, resultantStatus)
          break;
      }
    })

    function registeStatus(userID, newStatus) {
      for (let i = 0; i < connectedUsers.length; i++) {
        if (connectedUsers[i].id == userID) connectedUsers[i].status = newStatus;
      }
    }

    function myStatusToAll(status){
      io.emit('onlineStatusChange', { userID: id, status: status });
    }

    function saveAndSendStatus(id, status){
      registeStatus(id, status)
      myStatusToAll(status)
    }

    socket.on('addFavourite', async (favoriteID) => {
      let serverFeedback = await addFavourite(id, favoriteID)
      if (serverFeedback.type == 'negative') return socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while Adding the favorite.' }])
      //fill favorites and friends
      socket.emit('favoriteUsers', await getUserFavorites(id))
      socket.emit('allUsers', await getCompanyUsers(company_id))
    })
    socket.on('removeFavourite', async (favoriteID) => {
      let serverFeedback = await removeFavourite(id, favoriteID)
      if (serverFeedback.type == 'negative') return socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while removing the favorite.' }])
      //fill favorites and friends
      console.log('Removing favorite', serverFeedback)
      socket.emit('favoriteUsers', await getUserFavorites(id))
      socket.emit('allUsers', await getCompanyUsers(company_id))
    })
    socket.on('searchAllUsersFavorites', async (searchterm) => {
      let users = await searchUsers(searchterm, id, company_id, true, 15)
      socket.emit('searchedAllUsers', users)
    })

    socket.on("chatProfilePictureDelete", async (roomID) => {
      let groupMembers = await getRoomParticipantArray(roomID)
      let thisParticipant = groupMembers.find(participant => participant.userID === id)
      if (thisParticipant == undefined) return console.log('this user cannot delete conversation profile picture because he is not part of the group')

      deleteGroupProfilePicture(roomID)
      io.sockets.in(roomID + '').emit('chatProfilePictureChange', { profilePicture: 'private/profiles/group.jpeg', roomID: roomID })
      socket.emit('serverFeedback', [{ type: 'positive', message: 'Group chat profile picture removed successfully.' }])
    })
    //-----------------------------------
    socket.on('requestChatContent', async (chatIdentification) => {
      let groupMembers = await getRoomParticipantArray(chatIdentification)
      let thisParticipant = groupMembers.find(participant => participant.userID === id)
      if (thisParticipant == undefined) return console.log('this user cannot open conversation because he is not part of the group')

      socket.emit('chatContent', await getChatFullInfo(chatIdentification, id))
    });
    socket.on('message', async (message) => {
      /* message = { toRoom: selectedChatId, message: messageContent.innerText.trim(), timeStamp: new Date().toISOString(), taggedMessages: taggedMessages }; */
      let _chatInfo = await getRoomInfo(message.toRoom, id)
      let expectedUser = _chatInfo.users.find(user => user.userID == id)
      if (!expectedUser) return console.log('cannot sent a message to a room to which the user is not a member')

      let fDate = formatDate(new Date())
      if (expectedUser && message.message != "") {
        db.query('INSERT INTO `message`(`message`, `roomID`, `userID`, `timeStamp`) VALUES (?,?,?,?)', [message.message, message.toRoom, id, fDate || message.timeStamp], async (err, participantResult) => {
          if (err) return console.log(err)
          db.query('UPDATE `room` SET `lastActionDate` = ? WHERE `room`.`chatID` = ?;', [fDate || message.timeStamp, message.toRoom], async (err, updateLastAction) => {
            if (err) return console.log(err)
            db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id`= ?', [participantResult.insertId], async (err, messageResult) => {
              if (err) return console.log(err)
              message.taggedMessages.forEach(taggedMessage => {
                db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [taggedMessage], async (err, referencedMessageResult) => {
                  if (err) return console.log(err)
                  if (referencedMessageResult.length > 0) {
                    if (referencedMessageResult[0].roomID == message.toRoom) {
                      db.query("INSERT INTO `messagetags`(`messageId`, `tagMessageId`) VALUES ('?','?')", [participantResult.insertId, taggedMessage], async (err, insertedTag) => {
                        if (err) return console.log(err)
                        console.log(`Tag ${insertedTag.insertId} is inserted`)
                      })
                    }
                    else console.log(`User ${id} tried to tag Message ${participantResult.insertId} which is not from group ${message.toRoom} it is from ${referencedMessageResult[0].roomID}`)
                  }
                })

              });
              let insertedMessage = {
                id: messageResult[0].id,
                roomID: messageResult[0].roomID,
                message: messageResult[0].message,
                userID: messageResult[0].userID,
                timeStamp: messageResult[0].timeStamp,
                reactions: {
                  chat: messageResult[0].roomID,
                  message: messageResult[0].id,
                  details: await getMessageReactions(messageResult[0].id),
                  available: await getAvailableMessageReactions()
                },
                tagContent: await getMessageTags(messageResult[0].id),
                userInfo: await getUserInfo(id)
              }
              console.log("Last inserted ID", participantResult.insertId)
              let chatInfo = await getRoomInfo(message.toRoom, id)
              io.sockets.in(message.toRoom + '').emit('newMessage', { chatInfo, expectedUser, insertedMessage });
            })
          })
        })
      }
      else { console.log(`${id} was prevented to write to ${message.toRoom} because they are not a member`) } //Just for security purposes
    });
    socket.on('deleteMessage', async (messageId) => {
      let access_roomId = await checkMessageOwnership(messageId, id)
      if (access_roomId == false) return console.log('user cannot delete a message that does not belong to him')
      let deleteResult = await deleteMessage(messageId)
      if (deleteResult.type == 'positive') io.sockets.in(messageId + '').emit('deletedMessage', { roomId: access_roomId, messageId: messageId });
      socket.emit('serverFeedback', [deleteResult])
    })
    socket.on('searchPeople', async (searchPeople) => {
      let foundUsers = await searchUsers(searchPeople, id, company_id, false, 15)
      socket.emit('searchPerson', foundUsers)
    })
    socket.on('searchChats', async (searchText) => {
      let foundConversationIDs = []
      let foundUsers = await searchUsers(searchText, id, company_id, false, 15) // for private (non Group) chats
      let foundGroups = await searchGroupsByName(searchText, id, 15) // for group chats
      for (let i = 0; i < foundGroups.length; i++) {
        if (!foundConversationIDs.includes(foundGroups[i])) foundConversationIDs.push(foundGroups[i])
      }
      for (let i = 0; i < foundUsers.length; i++) {
        let memberRooms = await getuserChatsIds(foundUsers[i].userID)
        let myMemberRooms = await getuserChatsIds(id)
        let commonEntry = await findAllCommonElements(memberRooms, myMemberRooms)
        for (let m = 0; m < commonEntry.length; m++) {
          if (!foundConversationIDs.includes(commonEntry[m])) foundConversationIDs.push(commonEntry[m])
        }
      }

      let foundConversations = []
      for (let i = 0; i < foundConversationIDs.length; i++) {
        foundConversations.push(await getRoomInfo(foundConversationIDs[i], id))
        console.log('room', foundConversationIDs[i])
      }
      console.log('foundConversations', foundConversations)
      socket.emit('searchChats', foundConversations)
    })
    socket.on('makeChat', async (makeChat) => {
      if (makeChat == id) return console.log(`user with ID ${id} wanted to create a chat with himself and was dismissed`)
      let memberRooms = await getuserChatsIds(makeChat)
      //remove rooms wchich are group conversations
      for (let i = 0; i < memberRooms.length; i++) {
        const _roomBasicInfo = await getChatRoomBasicInfo(memberRooms[i])
        if (_roomBasicInfo.type == 1) memberRooms.splice(i, 1) // remove any group result
      }
      let myMemberRooms = await getuserChatsIds(id)
      //finally check if we have common priavate conversation
      let commonEntry = await findCommonElement(memberRooms, myMemberRooms)
      switch (commonEntry.exists) {
        case true:
          // let roombasicinfo = await getChatRoomBasicInfo(commonEntry.id) //check if a chat was returned
          // if (roombasicinfo.type == 1) createNewChat() // create a new chat with the user, if a group chat was found
          socket.emit('clickOnChat', commonEntry.id)
          break;
        case false:
          createNewChat(); /////////CREATE A NEW CHAT
          break;
        default:
          break;
      }

      async function createNewChat() {
        let createdChatId = await createChat(id, makeChat)
        let partnerConnectionInstances = connectedUsers.filter(user => { return user.id == makeChat })
        let myConnectionInstances = connectedUsers.filter(user => { return user.id == id })
        partnerConnectionInstances.forEach(connection => { connection.socket.join(createdChatId + ''); }); //make partner join the room
        myConnectionInstances.forEach(connection => { connection.socket.join(createdChatId + ''); }); // join me to the room
        //Send to all concerned people / logged in instances
        io.sockets.in(createdChatId + '').emit('displayNewCreatedChat', await getRoomInfo(createdChatId, id));
        socket.emit('clickOnChat', createdChatId)
        //for the person who opened the chat -> open the chat
      }
    })

    socket.on('changeRoomName', async (changeDetails) => {
      let { roomName, roomID } = changeDetails
      console.log('changeRoomName', roomName, roomID)
      let groupMembers = await getRoomParticipantArray(roomID)
      let thisParticipant = groupMembers.find(participant => participant.userID === id)
      if (thisParticipant == undefined) return console.log('this user cannot change the conversation name because he is not part of the group')
      let roombasicinfo = await getChatRoomBasicInfo(roomID)
      if (roombasicinfo.type != 1) { // prevents from changing a name of a private chat
        socket.emit('serverFeedback', [{ type: 'negative', message: 'this conversation name cannot be changed because it is not a group chat.' }])
        return console.log('this conversation name cannot be changed because it is not a group chat')
      }
      db.query("UPDATE `room` SET `name`= ? WHERE `chatID` = ?", [roomName, roomID], async (err, result) => {
        if (err) {
          socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while changing the group name.' }])
        }
        else {
          // if(roomName == null || roomName?.trim == ''){
          //   changeDetails.roomName = groupMembers.map(user => user.name + ' ' + user.surname).join();
          // }
          io.sockets.in(roomID + '').emit('chatNameChange', changeDetails);
          socket.emit('serverFeedback', [{ type: 'positive', message: 'the group name was changed successfully.' }])
        }
      })
    })

    socket.on('changeRoomProfilePicture', async (changeDetails) => {
      let { profilePicture, roomID } = changeDetails
      console.log('changeprofilePicture', profilePicture, roomID)
      let groupMembers = await getRoomParticipantArray(roomID)
      let thisParticipant = groupMembers.find(participant => participant.userID === id)
      if (thisParticipant == undefined) return console.log('this user cannot change the conversation profile picture because he is not part of the group')
      db.query("UPDATE `room` SET `profilePicture`= ? WHERE `chatID` = ?", [profilePicture, roomID], async (err, result) => {
        if (err) {
          socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while changing the group profile picture.' }])
        }
        else {
          io.sockets.in(roomID + '').emit('chatProfilePictureChange', changeDetails);
          socket.emit('serverFeedback', [{ type: 'positive', message: 'the group profile picture was changed successfully.' }])
        }
      })
    })

    socket.on('addRoomParticipantsSearch', async (changeDetails) => {
      let { roomID, searchText } = changeDetails
      let groupMembers = await getRoomParticipantArray(roomID)
      let foundUsers = await searchUsers(searchText, id, company_id, false, 15)
      console.log("found users", foundUsers)
      for (let i = 0; i < foundUsers.length; i++) {
        for (let j = 0; j < groupMembers.length; j++) {
          if (foundUsers[i].userID === groupMembers[j].userID) foundUsers.splice(i, 1);
        }
      }
      socket.emit('addRoomParticipantsSearch', foundUsers)
    })

    socket.on('createNewGroupChatSearch', async (searchText) => {
      let foundUsers = await searchUsers(searchText, id, company_id, false, 15)
      console.log('searchText', searchText)
      socket.emit('createNewGroupChatSearch', foundUsers)
    })
    socket.on('createNewGroupChat', async ({ groupName, users }) => {
      let curatedUsers = [...new Set(users)] // to avoid duplicates
      let groupCreationResult = await createNewGroupChat(groupName)
      let feedbackMessages = []
      if (groupCreationResult.type == 'negative') {
        socket.emit('serverFeedback', [groupCreationResult])

        return;
      }
      else {
        feedbackMessages.push(groupCreationResult)
        let roomID = groupCreationResult.insertId
        console.log('roomID', roomID)
        for (let i = 0; i < curatedUsers.length; i++) {
          let additionFeedback = await addUserToRoom(curatedUsers[i], roomID)
          if (additionFeedback.type == 'positive') {
            for (let j = 0; j < connectedUsers.length; j++) { // add the ysers to the room
              if (connectedUsers[j].id == curatedUsers[i]) {
                connectedUsers[j].socket.join(roomID + '')
                socket.to(connectedUsers[j].socket.id).emit('displayNewCreatedChat', await getRoomInfo(roomID, connectedUsers[j].id));
              }
            }
          }
          feedbackMessages.push(additionFeedback)
        }
        addUserToRoom(id, roomID)
        socket.join(roomID + '')
        socket.emit('displayNewCreatedChat', await getRoomInfo(roomID, id));
        socket.emit('serverFeedback', feedbackMessages) // give the feedback to the creator  
      }
    })

    socket.on('addUserToRoom', async ({ userID, roomID }) => {
      let groupMembers = await getRoomParticipantArray(roomID)
      let thisParticipant = groupMembers.find(participant => participant.userID === id)
      if (thisParticipant == undefined) return console.log('this user cannot add users to the conversation because he is not part of the group')

      let additionFeedback = await addUserToRoom(userID, roomID)
      socket.emit('serverFeedback', [additionFeedback])
      if (additionFeedback.type == 'positive') {
        let updatedRoomMembers = await getRoomParticipantArray(roomID)
        io.sockets.in(roomID + '').emit('chatUsersChange', { chatUsers: updatedRoomMembers, roomID: roomID });
        for (let i = 0; i < connectedUsers.length; i++) { // add the ysers to the room
          if (connectedUsers[i].id === userID) {
            connectedUsers[i].socket.join(roomID + '')
            socket.to(connectedUsers[i].socket.id).emit('displayNewCreatedChat', await getRoomInfo(roomID, connectedUsers[i].id));
          }
        }
        let chatDetails = await getChatRoomBasicInfo(roomID)
        let changeDetails = { roomName: updatedRoomMembers.map(user => user.name + ' ' + user.surname).join(), roomID: roomID }
        if (chatDetails.type == 1 && chatDetails.name == null) io.sockets.in(roomID + '').emit('chatNameChange', changeDetails);
      }
    })

    socket.on('removeRoomParticipant', async ({ roomID, userID }) => {
      let groupMembers = await getRoomParticipantArray(roomID)
      let thisParticipant = groupMembers.find(participant => participant.userID === id)
      if (thisParticipant == undefined) return console.log('this user cannot remove users to the conversation because he is not part of the group')
      db.query("DELETE FROM `participants` WHERE `userID` = ? AND `roomID` = ?", [userID, roomID], async (err, result) => {
        if (err) {
          socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while removing the user to the group.' }])
        }
        else {
          let updatedRoomMembers = await getRoomParticipantArray(roomID)
          io.sockets.in(roomID + '').emit('chatUsersChange', { chatUsers: updatedRoomMembers, roomID: roomID });
          socket.emit('serverFeedback', [{ type: 'positive', message: 'the group member removed successfully.' }])
          for (let i = 0; i < connectedUsers.length; i++) { // add the users to the room
            if (connectedUsers[i].id == userID) {
              connectedUsers[i].socket.leave(roomID + '')
              console.log('removeChatAccessElements', { roomID, userID });
              socket.to(connectedUsers[i].socket.id).emit('removeChatAccessElements', { roomID, userID });
            }
          }
          let chatDetails = await getChatRoomBasicInfo(roomID)
          let changeDetails = { roomName: updatedRoomMembers.map(user => user.name + ' ' + user.surname).join(), roomID: roomID }
          if (chatDetails.type == 1 && chatDetails.name == null) io.sockets.in(roomID + '').emit('chatNameChange', changeDetails);
        }
      })
    })



    socket.on('messageReaction', (reactionIdentifiers) => {
      //reactionIdentifiers {messageId, selectedChatId, reaction}
      console.log(reactionIdentifiers, id)
      db.query("SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id`=?", [reactionIdentifiers.selectedChatId], async (err, messageCheck) => {
        if (err) return console.log(err)
        if (messageCheck.length > 0 && !err) {
          db.query("SELECT `roomID`  FROM `participants` WHERE `userID`=?", [id], async (err, chatCheck) => {
            if (err) return console.log(err)
            if (messageCheck.length > 0 && !err) {
              db.query("SELECT `id`, `icon`, `name`, `description` FROM `reactionoptions` WHERE `name`=?", [reactionIdentifiers.reaction], async (err, reactions) => {
                if (err) return console.log(err)
                if (reactions.length > 0) {
                  db.query("INSERT INTO reactions (`userID`, `messageID`, `reactionOptionID`) VALUES (?, ?, ?)  ON DUPLICATE KEY UPDATE `reactionOptionID` = ? ",
                    [id, reactionIdentifiers.messageId, reactions[0].id, reactions[0].id], async (err, updateInsertResult) => {
                      if (err) {
                        console.error(err);
                      }
                      else {
                        console.log('reaction has updated successfully')
                        io.sockets.in(reactionIdentifiers.selectedChatId + '').emit('updateReaction',
                          {
                            chat: reactionIdentifiers.selectedChatId,
                            message: reactionIdentifiers.messageId,
                            messageOwner: await getUserInfo(messageCheck[0].userID),
                            details: await getMessageReactions(reactionIdentifiers.messageId),
                            available: await getAvailableMessageReactions(),
                            performer: await getUserInfo(id)
                          }
                        );
                      }
                    })

                }
                else {
                  console.log(`user: ${id} selected a reaction: ${reactionIdentifiers.reaction} which does not exist in database`)
                }
              })
            }
            else {
              console.log(`User: ${id} is trying to react to a message: ${reactionIdentifiers.messageId} in chat ${reactionIdentifiers.selectedChatId} Where he is not a member`)
            }
          })
        }
        else {
          console.log(`User: ${id} is trying to react to a message: ${reactionIdentifiers.messageId} that does not exist`)
        }
      })

    })

    function makeid(length) {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
          charactersLength));
      }
      return result;
    }

    socket.on('callLogContactSearch', async (searchPeople) => {
      let foundUsers = await searchUsers(searchPeople, id, company_id, false, 15)
      socket.emit('callLogContactSearch', foundUsers)
    })

    async function leaveAllPreviousCalls() {
     
      // check if this user is already on another call, and end that call before starting a new one
      let currentOngoingCalls = await getStillParticipatingCalls(id)
      for (let c = 0; c < currentOngoingCalls.length; c++) {
        const callUniqueId = currentOngoingCalls[c];
        socket.to(callUniqueId + '').emit('callCancelled', { callUniqueId: callUniqueId });
        socket.to(callUniqueId + '-allAnswered-sockets').emit('userLeftCall', await getUserInfo(id));
        setUserCallStatus(id, callUniqueId, 'offCall')
        try { socket.leave(callUniqueId + '-allAnswered-sockets'); } catch (e) { console.log('[error]', 'leave room :', e); }
        // try { socket.leave(callUniqueId); } catch (e) { console.log('[error]', 'leave room :', e); }
        let thisCallparticipants = await getCallParticipants(callUniqueId)
        for (let i = 0; i < connectedUsers.length; i++) {
          for (let j = 0; j < thisCallparticipants.length; j++) {
            if (connectedUsers[i].id == thisCallparticipants[j].userID) {
              // connectedUsers[i].socket.emit
              socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));

            }
            if (connectedUsers[i].id == id) {
              socket.to(connectedUsers[i].socket.id).emit('exitAllCalls')
            }
          }
        }
      }
      socket.emit('updateCallLog', await getCallLog(id));
    }
    socket.on("initiateCall", async data => {
      let { callTo, audio, video, group, fromChat, previousCallId } = data;

      leaveAllPreviousCalls() // leave all previous calls if still participating

      // console.log(data)
      if (callTo === undefined || audio === undefined || video === undefined || group === undefined || fromChat === undefined) return console.log("invalid call performed by user ID:", id, 'data given: ', data)

      let audioPresentation = 1;
      if (audio === false) audioPresentation = 0;
      let videoPresentation = 1;
      if (video === false) videoPresentation = 0;
      let chatPresentation = 1;
      if (fromChat === true) chatPresentation = 0;
      let groupPresentation = 1;
      if (group === false) groupPresentation = 0;


      let givenTitle, eventId;

      console.log('previousCallId', previousCallId)
      if (previousCallId == 'joinEvent') {
        let eventId = callTo
        let givenTitle = await getEventTitle(eventId)

        let previousCalls = await findRecentEventCalls(eventId)
        if (previousCalls != null) {
          // returns: `id`, `callUniqueId`, `initiatorId`, `destinationId`, `destinationType`, `initialtionTime`, `endTime`, `callChatId`, `eventId`, `callTitle`
          let mostRecentCallUnniqueID = previousCalls[0].callUniqueId
          choseIfRejoinOrNew(mostRecentCallUnniqueID, givenTitle, eventId, false)
        }
        else {
          let eventParticipants = await getEventParticipants(eventId)
          let eventParticipantUserInfos = eventParticipants.map((participant) => participant.userInfo)
          initiateCall(eventParticipantUserInfos, givenTitle || 'Untitled Call', eventId, false)
        }

        return; // exit the function and do ot analyze further
      }

      //call from individual call buttons(outside callog and outside chat)
      else if (group === false && fromChat === false) {
        let oneToCall = await getUserInfo(callTo);
        initiateCall([oneToCall, await getUserInfo(id)], givenTitle, eventId, true);
        return; // exit the function
      }

      switch (chatPresentation) {
        case 0:  //call from Chat
          let groupMembersToCall = await getRoomParticipantArray(callTo)
          initiateCall(groupMembersToCall, givenTitle, eventId, true)
          break;
        case 1: //call from callogs
          choseIfRejoinOrNew(callTo, givenTitle, eventId, true)
          break;
        default:
          let thisUser = await getUserInfo(id)
          initiateCall([thisUser], givenTitle, eventId, true)
          // socket.emit('serverFeedback', [{ type: 'negative', message: 'You can not call yourself, or groups where you are the only participant' }])
          break;
      }

      async function choseIfRejoinOrNew(previousCallID, givenTitle, eventId, notifyCallees) {
        let stillOnCallUsers = await getOnCallPeopleByStatus(previousCallID, 1)
        let allExistingCallGroupMembersToCall = await getCallParticipants(previousCallID)
        if (stillOnCallUsers.length > 0) {
          rejoinCall(allExistingCallGroupMembersToCall, previousCallID, notifyCallees)
        }
        else {
          initiateCall(allExistingCallGroupMembersToCall, givenTitle, eventId, notifyCallees)
        }
      }
      async function initiateCall(groupMembersToCall, givenTitle, eventId, notifyCallees) {
        let callTitle = givenTitle ? givenTitle : 'Untitled Call'
        let callUniqueId = makeid(20)
        let insertedCallId = await logToDatabaseNewCall(callUniqueId, id, callTo, groupPresentation, null, chatPresentation, eventId || null, callTitle)
        if (!insertedCallId) {
          socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while trying to perform the call' }])
          console.log('An error occurred while trying to perform the call')
          return; // exit the function if there was an error to register the call
        }
        let groupMembersToCall_fullInfo = []
        groupMembersToCall.forEach(callParticipant => { insertCallParticipant(callUniqueId, insertedCallId, callParticipant.userID, id) })
        socket.join(callUniqueId + '-allAnswered-sockets'); //join a room for answered call people
        socket.join(callUniqueId + '');
        setUserCallStatus(id, callUniqueId, 'onCall') //register myself in the database that i am on this call
        for (let j = 0; j < connectedUsers.length; j++) { if (connectedUsers[j].id == id) { socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); } } //send myself an update in the call log
        for (let i = 0; i < groupMembersToCall.length; i++) {
          console.log("groupMembersToCall", groupMembersToCall[i].userID)
          for (let j = 0; j < connectedUsers.length; j++) {
            console.log("connectedUsers", connectedUsers[j].id)
            if (groupMembersToCall[i].userID == connectedUsers[j].id && groupMembersToCall[i].userID != id) { //&& groupMembersToCall[i].userID != id will eliminate my other onnected computers from reciving my call
              if (notifyCallees == true) {
                socket.to(connectedUsers[j].socket.id).emit('incomingCall', {
                  callUniqueId: callUniqueId,
                  callType: video == true ? "video" : "audio",
                  caller: await getUserInfo(id),
                  allUsers: groupMembersToCall,
                  myInfo: await getUserInfo(connectedUsers[j].id),
                  callTitle: callTitle,
                  callStage: 'initial'
                });
              }
              console.log("--->connectedUser identified", connectedUsers[j].id)
              groupMembersToCall_fullInfo.push({ peerId: connectedUsers[j].callId, userProfileIdentifier: groupMembersToCall[i] })
              connectedUsers[j].socket.join(callUniqueId + '');
            }
            if (groupMembersToCall[i].userID == connectedUsers[j].id) { socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); } //update callog for each connected user
          }
        }
        let _calltype = videoPresentation == 1 ? "video" : "audio"
        let callInitiationInfo = { callUniqueId, callType: _calltype, groupMembersToCall_fullInfo, caller: await getUserInfo(id), allUsers: groupMembersToCall, callTitle: callTitle, callStage: 'initial' }
        socket.emit('prepareCallingOthers', callInitiationInfo);
        console.log('callInitiationInfo2', callInitiationInfo)

      }

      async function rejoinCall(groupMembersToCall, previousCallId) {
        let callTitlePrep = await getcallTitle(previousCallId)
        let callTitle = callTitlePrep ? callTitlePrep : 'Untitled Call'
        let groupMembersToCall_fullInfo = []
        console.log('groupMembersToCall, previousCallId', groupMembersToCall, previousCallId)
        for (let i = 0; i < groupMembersToCall.length; i++) {
          for (let j = 0; j < connectedUsers.length; j++) {
            if (groupMembersToCall[i].userID == connectedUsers[j].id && groupMembersToCall[i].userID != id) { //&& groupMembersToCall[i].userID != id will eliminate my other onnected computers from reciving my call
              groupMembersToCall_fullInfo.push({ peerId: connectedUsers[j].callId, userProfileIdentifier: groupMembersToCall[i] })
            }
          }
        }
        let _calltype = videoPresentation == 1 ? "video" : "audio"
        let callInitiationInfo = { callUniqueId: previousCallId, callType: _calltype, groupMembersToCall_fullInfo, caller: await getUserInfo(id), allUsers: groupMembersToCall, callTitle: callTitle, callStage: 'rejoin' }
        socket.emit('prepareCallingOthers', callInitiationInfo);
      }
      // })
    })

    socket.on('readyForRejoin', async initiatedCallInfo => {
      let callAccess = await checkCallAccess(id, initiatedCallInfo.callUniqueId)
      if (callAccess != true) return console.log('user does not have access to this call')

      leaveAllPreviousCalls()// make sure that the user is not on another call

      let { callUniqueId, callType, caller, groupMembersToCall_fullInfo, allUsers, callTitle, callStage, peerId } = initiatedCallInfo

      let groupMembersToCall = await getCallParticipants(callUniqueId)
      socket.emit('updateAllParticipantsList', groupMembersToCall) // ensure that if someone has been added to the call is also included

      //inform all users who are already on the call- to call me
      console.log('initiatedCallInfo', initiatedCallInfo)
      socket.to(callUniqueId + '-allAnswered-sockets').emit('connectUser', { peerId: peerId, userInfo: await getUserInfo(id), callType: callType, callStage: callStage });
      setUserCallStatus(id, callUniqueId, 'onCall') // set this user to in-call status
      socket.join(callUniqueId) // join for all participants even thos who are not on the call
      socket.join(callUniqueId + '-allAnswered-sockets'); // become a member of the call room

      //check connected people from allowed people and update their call log
      for (let i = 0; i < connectedUsers.length; i++) {
        for (let j = 0; j < groupMembersToCall.length; j++) {
          if (connectedUsers[i].id == groupMembersToCall[j].userID) {
            socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
          }
        }
      }
      console.log('readyForRejoin sockets', io.sockets.adapter.rooms)
    })

    socket.on('cancelCall', async (callUniqueId) => { // if the caller decides to close the call => end the call for everybody
      let access = await checkCallAccess(id, callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot cancel call because he has no access to this call :', callUniqueId) }

      socket.to(callUniqueId + '').emit('callCancelled', { callUniqueId: callUniqueId });
      setUserCallStatus(id, callUniqueId, 'offCall')
      let consernedMembers = await getCallParticipants(callUniqueId)
      let memberIDArray = consernedMembers.map(member => member.userID)
      for (let j = 0; j < connectedUsers.length; j++) {
        if (memberIDArray.includes(connectedUsers[j].id)) {
          socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id));
        }
      } //send myself an update in the call log
    })

    socket.on('answerCall', async data => {
      let { myPeerId, callUniqueId, callType, callStage } = data;
      console.log('user ', id, ' has joined the call ', callUniqueId, ' and requests to be called')

      saveAndSendStatus(id, 'onCall')

      let thisCallparticipants = await getCallParticipants(callUniqueId) //get all people who are allowed in this call
      let thisUsershouldbeinthiscall = false
      for (var i = 0; i < thisCallparticipants.length; i++) { //For security purposes check if the answered person should be able to answer this call
        if (thisCallparticipants[i].userID == id) { thisUsershouldbeinthiscall = true; break; }
      }
      if (thisUsershouldbeinthiscall == false) { return console.log("You are not allowed to answer this call", callUniqueId) }

      leaveAllPreviousCalls()// make sure that the user is not on another call

      socket.emit('updateAllParticipantsList', thisCallparticipants) // this is because if someone answers this call, while the called has added other users, the caller will not have a list
      socket.to(callUniqueId + '-allAnswered-sockets', thisCallparticipants)
      //inform all users who accepted the call- to call me
      socket.to(callUniqueId + '-allAnswered-sockets').emit('connectUser', { peerId: myPeerId, userInfo: await getUserInfo(id), callType, callStage });
      setUserCallStatus(id, callUniqueId, 'onCall') // set this user to in-call status
      socket.join(callUniqueId + '-allAnswered-sockets'); // become a member of the call room

      //check connected people from allowed people and update their call log
      for (let i = 0; i < connectedUsers.length; i++) {
        for (let j = 0; j < thisCallparticipants.length; j++) {
          if (connectedUsers[i].id == thisCallparticipants[j].userID) {
            // connectedUsers[i].socket.emit
            socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
            socket.to(connectedUsers[i].socket.id).emit('confirmStatus', 'onCall');

          }
        }
      }

      saveAndSendStatus(id, 'onCall')
    })

    socket.on('callNotAnswered', async callUniqueId => {
      let callAccess = await checkCallAccess(id, callUniqueId)
      if (callAccess != true) return console.log('user does not have access to this call')

      setCallAsMissed(id, callUniqueId)
      socket.to(callUniqueId + '-allAnswered-sockets').emit('callNotAnswered', { callUniqueId: callUniqueId, userInfo: await getUserInfo(id) });
      let consernedMembers = await getCallParticipants(callUniqueId)
      let memberIDArray = consernedMembers.map(member => member.userID)
      for (let j = 0; j < connectedUsers.length; j++) {
        if (memberIDArray.includes(connectedUsers[j].id)) {
          socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id));
        }
      } //send myself an update in the call log
    })
    socket.on('callRejected', async callUniqueId => {
      let callAccess = await checkCallAccess(id, callUniqueId)
      if (callAccess != true) return console.log('user does not have access to this call')

      setCallAsMissed(id, callUniqueId)
      socket.to(callUniqueId + '-allAnswered-sockets').emit('callRejected', { callUniqueId: callUniqueId, userInfo: await getUserInfo(id) });
    })

    socket.on('leaveCall', async data => {
      let access = await checkCallAccess(id, data.callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot leave the call because he has no access to this call :', data.callUniqueId) }

      socket.to(data.callUniqueId + '-allAnswered-sockets').emit('userLeftCall', await getUserInfo(id));
      setUserCallStatus(id, data.callUniqueId, 'offCall')
      try { socket.leave(data.callUniqueId + '-allAnswered-sockets'); } catch (e) { console.log('[error]', 'leave room :', e); }
      try { socket.leave(data.callUniqueId); } catch (e) { console.log('[error]', 'leave room :', e); }
      let thisCallparticipants = await getCallParticipants(data.callUniqueId)
      for (let i = 0; i < connectedUsers.length; i++) {
        for (let j = 0; j < thisCallparticipants.length; j++) {
          if (connectedUsers[i].id == thisCallparticipants[j].userID) {
            socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
          }
        }
      }
      socket.emit('updateCallLog', await getCallLog(id));

      saveAndSendStatus(id, 'online')

    })
    // search to add new users to call
    socket.on('searchPeopleToInviteToCall', async (callSearchData) => {
      let access = await checkCallAccess(id, callSearchData.callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot search to add a person to call because he has no access to this call :', callSearchData.callUniqueId) }
      let { callUniqueId, searchText } = callSearchData
      console.log('callSearchData', callSearchData)
      let foundUsers = await searchUsers(searchText, id, company_id, false, 15)
      let thisCallParticipants = await getRoomParticipantArrayByCallUniqID(callUniqueId)
      let thisCallParticipantsIDs = thisCallParticipants.map(participant => participant.userID) //get all people who are allowed in this call
      for (let i = 0; i < foundUsers.length; i++) {
        if (thisCallParticipantsIDs.includes(foundUsers[i].userID)) foundUsers.splice(i, 1)
      }
      socket.emit('searchPeopleToInviteToCall', foundUsers)
    })

    socket.on('addUserToCall', async identifications => {
      let access = await checkCallAccess(id, identifications.callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot add user :', identifications.userID, ' to call because he has no access to this call :', identifications.callUniqueId) }
      let { callUniqueId, userID, callType, callTitle } = identifications

      let thisCallparticipantsInFull = await getCallParticipants(callUniqueId)
      let thisCallparticipants = thisCallparticipantsInFull.map(participant => { return participant.userID }) //get all people who are allowed in this call
      thisCallparticipantsInFull.push(await getUserInfo(userID))
      for (let j = 0; j < connectedUsers.length; j++) {
        //console.log("searching to add connectedUser", connectedUsers[j].id)
        if (connectedUsers[j].id == userID && !thisCallparticipants.includes(userID)) {
          connectedUsers[j].socket.join(callUniqueId + '');
          socket.to(connectedUsers[j].socket.id).emit('incomingCall', {
            callUniqueId: callUniqueId,
            callType: callType,
            caller: await getUserInfo(id),
            allUsers: thisCallparticipantsInFull,
            myInfo: await getUserInfo(connectedUsers[j].id),
            callTitle: callTitle,
            callStage: 'added'
          });
          socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); // update callee callog
        }
      }
      io.sockets.in(callUniqueId + '-allAnswered-sockets').emit('userAddedToCall', { callUniqueId: callUniqueId, userInfo: await getUserInfo(userID) })
      insertCallParticipant(callUniqueId, 1, userID, id) //  is a fictional ID
    })

    socket.on('ringAgain', async ({ userID, callUniqueId, callType, callTitle }) => {
      let access = await checkCallAccess(id, callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot add user :', identifications.userID, ' to call because he has no access to this call :', identifications.callUniqueId) }

      let onCallMembers = await getOnCallPeopleByStatus(callUniqueId, 1) // get people whi accepted the call
      let thisCallparticipantsInFull = await getCallParticipants(callUniqueId)
      let currentCallparticipantsNow = onCallMembers.map(participant => { return participant.userID }) //get all people who are allowed in this call

      for (let j = 0; j < connectedUsers.length; j++) {
        //console.log("searching to add connectedUser", connectedUsers[j].id)
        if (connectedUsers[j].id == userID && !currentCallparticipantsNow.includes(userID)) {
          connectedUsers[j].socket.join(callUniqueId + '');
          socket.to(connectedUsers[j].socket.id).emit('incomingCall', {
            callUniqueId: callUniqueId,
            callType: callType,
            caller: await getUserInfo(id),
            allUsers: thisCallparticipantsInFull,
            myInfo: await getUserInfo(connectedUsers[j].id),
            callTitle: callTitle,
            callStage: 'added'
          });
          socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); // update callee callog
        }
      }
      io.sockets.in(callUniqueId + '-allAnswered-sockets').emit('ringingAgain', { callUniqueId: callUniqueId, userInfo: await getUserInfo(userID) })
    })

    // for testing only
    socket.on('showConnectedUsers', () => {
      console.log("showConnectedUsers", connectedUsers)
    })

    ////////////////Meeting/schedule planning/////////////////
    socket.on('inviteUserToEventSearch', async searchText => {
      let foundUsers = await searchUsers(searchText, id, company_id, false, 15)
      socket.emit('inviteUserToEventSearch', foundUsers)
    })

    ///////////New Event/schedule/meeting plan////////////////////////////////
    socket.on('newEventCreation', (newEventCreation) => {
      console.log("newEventCreation", newEventCreation)
      let { inviteList, title, eventLocation, context, activityLink, details, startTime, endTime, occurrence, recurrenceType, startRecurrenceDate, endRecurrenceDate, type, oneTimeDate } = newEventCreation;
      db.query("INSERT INTO `events`(`ownerId`, `title`, `eventLocation`, `context`, `activityLink`, `details`, `startTime`, `endTime`, `occurrence`, `recurrenceType`, `startRecurrenceDate`, `endRecurrenceDate`, `type`, `oneTimeDate`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [id, title, eventLocation, context, activityLink, details, startTime, endTime, occurrence, recurrenceType, startRecurrenceDate, endRecurrenceDate, type, oneTimeDate],
        async (err, EventInsertResult) => {
          if (err) return console.log(err);
          inviteList.forEach(invite => { insertEventParticipant(EventInsertResult.insertId, invite) })
          insertEventParticipant(EventInsertResult.insertId, id)
          let today = new Date()
          let todayYear = today.getFullYear()
          let lastYear = new Date(); lastYear.setFullYear(todayYear - 1)
          let nextYear = new Date(); nextYear.setFullYear(todayYear + 1)
          let eventsToSend = await getEvents(id, lastYear, nextYear);
          socket.emit('notificationUpdateCalendar', eventsToSend)
          socket.emit('updateCalendarWithSelectedDay', eventsToSend)
          for (let i = 0; i < inviteList.length; i++) {
            for (let j = 0; j < connectedUsers.length; j++) {
              if (connectedUsers[j].id == inviteList[i]) {
                let lastYear = new Date(); lastYear.setFullYear(todayYear - 1)
                let nextYear = new Date(); nextYear.setFullYear(todayYear + 1)
                let userCalendar = await getEvents(connectedUsers[j].id, lastYear, nextYear)
                socket.to(connectedUsers[j].socket.id).emit('notificationUpdateCalendar', userCalendar);
                socket.to(connectedUsers[j].socket.id).emit('updateCalendarWithSelectedDay', userCalendar);
              }
            }
          }
        }
      )
    })

    socket.on('dayEvents', async dateReceived => {
      let initialDate = new Date(dateReceived)
      let endDate = new Date(dateReceived)
      let dateEvents = await getEvents(id, initialDate, endDate)
      socket.emit('dayEvents', dateEvents)
    })

    // socket.on('updateCalendarWithSelectedDay', async (dateReceived) => {
    //   let today = new Date()
    //   let lastYear = new Date()
    //   lastYear.setFullYear(today.getFullYear() - 1)
    //   let nextYear = new Date()
    //   nextYear.setFullYear(today.getFullYear() + 1)
    //   socket.emit('updateCalendarWithSelectedDay', await getEvents(id, lastYear, nextYear))
    // })

    socket.on('deleteEvent', async (eventId) => {
      let foundEvent = await getEventDetails(eventId)
      if (foundEvent == undefined) {
        socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while deleting the event' }])
        console.log('event not found')
        return;
      }
      if (foundEvent.owner.userID == id) {
        console.log('event found')
        db.query("DELETE FROM `events` where eventId = ?", [eventId], async (err, result) => {
          if (!err) socket.emit('serverFeedback', [{ type: 'positive', message: 'the event was deleted successfully' }])
          else (console.log('An error occurred while deleting the event'))

          let today = new Date()
          let todayYear = today.getFullYear()
          let lastYear = new Date(); lastYear.setFullYear(todayYear - 1)
          let nextYear = new Date(); nextYear.setFullYear(todayYear + 1)
          let eventsToSend = await getEvents(id, lastYear, nextYear);
          socket.emit('notificationUpdateCalendar', eventsToSend)
          socket.emit('updateCalendarWithSelectedDay', eventsToSend)

          // foundEvent.Participants.forEach(async (participant) => {})
          for (let i = 0; i < foundEvent.Participants.length; i++) {
            const participant = foundEvent.Participants[i];
            for (let j = 0; j < connectedUsers.length; j++) {
              const connectedUser = connectedUsers[j];
              if (connectedUser.id == participant.userInfo.userID) {
                let _today = new Date()
                let _todayYear = _today.getFullYear()
                let _lastYear = new Date(); _lastYear.setFullYear(_todayYear - 1)
                let _nextYear = new Date(); _nextYear.setFullYear(_todayYear + 1)
                let _eventsToSend = await getEvents(connectedUser.id, _lastYear, _nextYear)
                socket.to(connectedUser.socket.id).emit('notificationUpdateCalendar', _eventsToSend);
                socket.to(connectedUser.socket.id).emit('updateCalendarWithSelectedDay', _eventsToSend)

                console.log('event object', _eventsToSend, _todayYear, connectedUser.id, _lastYear, _nextYear)
              }
            }
          }
        })


      }
      else {
        socket.emit('serverFeedback', [{ type: 'negative', message: 'An error occurred while deleting the event' }])
        console.log('event not found')
      }
    })

    socket.on('videoStateChange', async changeData => {
      let { callUniqueId, state } = changeData
      let access = await checkCallAccess(id, callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot Disable Video he has no access to this call :', callUniqueId) }
      socket.to(callUniqueId + '-allAnswered-sockets').emit('videoStateChange', { userID: id, state: state })
    })
    socket.on('audioStateChange', async changeData => {
      let { callUniqueId, state } = changeData
      let access = await checkCallAccess(id, callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot Disable audio he has no access to this call :', callUniqueId) }
      socket.to(callUniqueId + '-allAnswered-sockets').emit('audioStateChange', { userID: id, state: state })
    })
    socket.on('stopScreenSharing', async callUniqueId => {
      let access = await checkCallAccess(id, callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot stop screen sharing because he has no access to this call :', callUniqueId) }
      socket.to(callUniqueId + '-allAnswered-sockets').emit('stoppedScreenSharing', { userID: id, callUniqueId: callUniqueId })
    })
    socket.on('new-incall-message', async (messageData) => {
      let { callUniqueId, message } = messageData
      let access = await checkCallAccess(id, callUniqueId)
      if (access != true) { return console.log('User :', id, ' text in this call because he has no access to this call :', callUniqueId) }
      io.sockets.in(callUniqueId + '-allAnswered-sockets').emit('new-incall-message', { userInfo: await getUserInfo(id), content: message, time: new Date() });
    })

    ///ADMIN functionalities
    // -- Fetch Numbers
    socket.on('requestAdminNumbers', async (companyId) => {
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      console.log('id, companyId', id, companyId)
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
    })
    socket.on('requestSuperAdminNumbers', async (companyId) => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin', companyId))
    })
    // ADMIN -- Fetch actual data -- deleting -- updating -- searching
    // Fetch
    socket.on('manageAdmins', async (companyId) => {
      console.log('manageAdmins', companyId)
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('manageAdmins', await getCompanyAdmins(companyId))
    })
    socket.on('manageUsers', async (companyId) => {
      console.log('manageUsers', companyId)
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('manageUsers', await getCompanyUsers(companyId))
    })
    socket.on('managePositions', async (companyId) => {
      console.log('managePositions', companyId)
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('managePositions', await getCompanyPositions(companyId))
    })
    // Update
    socket.on('updateUser', async (updateObject) => {
      console.log('updateUser', updateObject)
      let { userID, name, surname, email, positionId, password, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let userInfoUpdateResult = await updateUserInfo(userID, name, surname, email, positionId)
      let serverFeedback = [userInfoUpdateResult]
      if (password.trim() != '') {
        let passwordResult = await updateUserPassword(userID, password)
        serverFeedback.push(passwordResult)
      }
      socket.emit('manageUsers', await getCompanyUsers(companyId))
      socket.emit('serverFeedback', serverFeedback)
    })
    socket.on('editPosition', async (updateObject) => {
      console.log('editPosition', updateObject)
      let { positionId, companyId, positionName } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let editPositionResult = await editPosition(positionId, companyId, positionName)
      socket.emit('managePositions', await getCompanyPositions(companyId))
      socket.emit('serverFeedback', [editPositionResult])
    })
    // Delete
    socket.on('deleteUserInfo', async (updateObject) => {
      console.log('deleteUserInfo', updateObject)
      let { userToDelete, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let deleteUserResult = await deleteUser(userToDelete)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('manageUsers', await getCompanyUsers(companyId))
      socket.emit('serverFeedback', [deleteUserResult])
    })
    socket.on('revokeAdminAccess', async (updateObject) => {
      console.log('revokeAdminAccess', updateObject)
      let { adminToDelete, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let revokeAdminAccessResult = await revokeAdminAccess(adminToDelete, companyId)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('manageAdmins', await getCompanyAdmins(companyId))
      socket.emit('serverFeedback', [revokeAdminAccessResult])
    })
    socket.on('deletePosition', async (updateObject) => {
      console.log('deletePosition', updateObject)
      let { positionId, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let deletePositionResult = await deletePosition(positionId, companyId)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('managePositions', await getCompanyPositions(companyId))
      socket.emit('serverFeedback', [deletePositionResult])
    })
    // Create New
    socket.on('saveNewUserInfo', async (updateObject) => {
      console.log('saveNewUserInfo', updateObject)
      let { name, surname, email, positionId, password, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let createUserResult = await createUser(name, surname, email, positionId, password, companyId)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('manageUsers', await getCompanyUsers(companyId))
      socket.emit('serverFeedback', [createUserResult])
    })
    socket.on('giveNewAdminAccess', async (updateObject) => {
      console.log('giveNewAdminAccess', updateObject)
      let { userId, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let makeUserAdminResult = await makeUserAdmin(userId, companyId, id)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('manageAdmins', await getCompanyAdmins(companyId))
      socket.emit('serverFeedback', [makeUserAdminResult])
      // console.log('executed')
    })
    socket.on('createPosition', async (updateObject) => {
      console.log('createPosition', updateObject)
      let { positionName, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let createPositionResult = await createPosition(positionName, companyId)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('managePositions', await getCompanyPositions(companyId))
      socket.emit('serverFeedback', [createPositionResult])
      // console.log('executed')
    })

    // Search
    socket.on('manageUsersSearch', async (searchObject) => {
      console.log('manageUsersSearch', searchObject)
      let { searchTerm, companyId } = searchObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      socket.emit('manageUsersSearch', await searchUsers(searchTerm, id, companyId, true, 15))
    })
    socket.on('manageAdminsSearch', async (searchObject) => {
      console.log('manageAdminsSearch', searchObject)
      let { searchTerm, companyId } = searchObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      socket.emit('manageAdminsSearch', await searchAdmins(searchTerm, companyId))
    })
    socket.on('managePositionSearch', async (searchObject) => {
      console.log('managePositionSearch', searchObject)
      let { searchTerm, companyId } = searchObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      socket.emit('managePositionSearch', await searchPosition(searchTerm, companyId))
    })

    // SUPER ADMIN Fetch actual data -- deleting -- updating -- searching
    // Fetch
    socket.on('superManageCompanies', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superManageCompanies', await getAllCompanies())
    })
    socket.on('superManageAdmins', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superManageAdmins', {
        admins: await getAllPrimaryAdmins(),
        allUsers: await getAllimperiumlineUsers(),
        allcompanies: await getAllCompanies(),
      })
    })
    socket.on('superManageSuperAdmins', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superManageSuperAdmins', await getAllSuperAdmins())
    })
    // Update
    socket.on('superManageEditCompanies', async (updateObject) => {
      let { companyId, companyName, description } = updateObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let editCompaniesResult = await editCompany(companyId, companyName, description)
      socket.emit('superManageCompanies', await getAllCompanies())
      socket.emit('serverFeedback', [editCompaniesResult])
    })
    // Delete
    socket.on('superManageDeleteCompanies', async (deleteObject) => {
      let { companyId } = deleteObject

      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let editCompaniesResult = await deleteCompany(companyId)
      socket.emit('superManageCompanies', await getAllCompanies())
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin', companyId))
      socket.emit('serverFeedback', [editCompaniesResult])
    })
    socket.on('revokePrimaryAdminAccess', async (deleteObject) => {
      let { adminToDelete } = deleteObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let deletePrimaryAdminResult = await deletePrimaryAdmin(adminToDelete)
      socket.emit('superManageAdmins', await getAllPrimaryAdmins())
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin'))
      socket.emit('serverFeedback', [deletePrimaryAdminResult])
    })
    socket.on('revokeSuperAdminAccess', async (deleteObject) => {
      let { superAdminId } = deleteObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let deleteSuperAdminResult = await deleteSuperAdmin(superAdminId)
      socket.emit('superManageSuperAdmins', await getAllSuperAdmins())
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin'))
      socket.emit('serverFeedback', [deleteSuperAdminResult])
    })
    // Create New
    socket.on('superManageCreateCompany', async (createObject) => {
      let { companyName, companyDescription } = createObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let createCompanyResult = await createCompany(companyName, companyDescription)
      socket.emit('superManageCompanies', await getAllCompanies())
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin'))
      socket.emit('serverFeedback', [createCompanyResult])
    })
    socket.on('superManageCreateAdmin', async (createObject) => {
      console.log('superManageCreateAdmin', createObject)
      let { companyId, adminName, adminSurname, adminEmail, adminPassword } = createObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let createPrimaryAdminResult = await createPrimaryAdmin(companyId, adminName, adminSurname, adminEmail, adminPassword, id)
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin', companyId))
      socket.emit('superManageAdmins', await getAllPrimaryAdmins())
      socket.emit('serverFeedback', [createPrimaryAdminResult])
    })
    socket.on('superManageCreateSuperAdmin', async (createObject) => {
      console.log('superManageCreateSuperAdmin', createObject)
      let { companyId, adminName, adminSurname, adminEmail, adminPassword } = createObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let createSuperAdminResult = await createSuperAdmin(companyId, adminName, adminSurname, adminEmail, adminPassword, id)
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin', companyId))
      socket.emit('superManageSuperAdmins', await getAllSuperAdmins())
      socket.emit('serverFeedback', [createSuperAdminResult])
    })

    // Search
    socket.on('superManageSearchCreateCompany', async (searchObject) => {
      let { searchTerm } = searchObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      socket.emit('superManageSearchCreateCompany', await searchCompany(searchTerm))
    })
    socket.on('superManageAdminsSearch', async (searchObject) => {
      let { searchTerm } = searchObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      socket.emit('superManageAdminsSearch', await searchPrimaryAdmins(searchTerm))
    })
    socket.on('superManageSuperAdminsSearch', async (searchObject) => {
      let { searchTerm } = searchObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      socket.emit('superManageSuperAdminsSearch', await searchSuperAdmins(searchTerm))
    })
    // --------------------------------------------Helpers--------------------------------
    // helper events to update elements
    socket.on('preparePositions', async companyId => {
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('preparePositions', await getCompanyPositions(companyId))
    })
    socket.on('prepareUsers', async companyId => {
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('prepareUsers', await getCompanyUsers(companyId))
    })
    socket.on('prepareAdmins', async companyId => {
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')
      socket.emit('prepareAdmins', await getCompanyAdmins(companyId))
    })
    // Superadmin helpsers to update elements
    socket.on('superAdminPrepareCompanies', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superAdminPrepareCompanies', await getAllCompanies())
    })
    socket.on('superAdminPrepareAdmins', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superAdminPrepareAdmins', await getAllPrimaryAdmins())
    })
    socket.on('superAdminPrepareSuperAdmins', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superAdminPrepareSuperAdmins', await getAllSuperAdmins())
    })
    ///////////////
    //RESET USERS's OWN password
    socket.on('resetMyPW', async (userData) => {
      let { currentPw, newPw, confirmPw } = userData;
      console.log('userData', userData)

      let serverFeedback = []
      if (currentPw == '' || newPw == '' || confirmPw == '') serverFeedback.push({ type: 'negative', message: '*All fields are required' })
      let currentPwCheck = await checkCurrentPassword(id, currentPw)
      if (currentPwCheck.value == false) serverFeedback.push(currentPwCheck)
      if (newPw != confirmPw) serverFeedback.push({ type: 'negative', message: '*New Password and Password confirmation should be identical' })

      let overallResult = true; //default set that every check was successfull
      for (let i = 0; i < serverFeedback.length; i++) {
        const response = serverFeedback[i];
        if (response.type == 'negative') overallResult = false;
      }

      if (overallResult == false) {
        let passwordChangeResult = await updateUserPassword(id, newPw)
        serverFeedback.push(passwordChangeResult)
      }
      socket.emit('serverFeedback', serverFeedback)
    })
    //////////////
    socket.on('disconnecting', () => {
      console.log('socket.roomsssssssssssssssssssssss', socket.rooms); // the Set contains at least the socket ID
      let roomsArray = Array.from(socket.rooms);
      roomsArray.forEach(async function (room) {
        try {

          if (isNumeric(room) && !room.includes('-allAnswered-sockets')) {
            socket.to(room + '').emit('userDisconnected', { id: id, room: room })
          }
          if (!isNumeric(room) && room.includes('-allAnswered-sockets')) {
            socket.to(room + '').emit('userDisconnectedFromCall', { userInfo: await getUserInfo(id), room: room })
            let callUniqueId = room.replace('-allAnswered-sockets', '');
            setUserCallStatus(id, callUniqueId, 'offCall')

            let consernedMembers = await getCallParticipants(callUniqueId)
            let memberIDArray = consernedMembers.map(member => member.userID)
            for (let j = 0; j < connectedUsers.length; j++) {
              if (memberIDArray.includes(connectedUsers[j].id)) {
                socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id));
              }
            } //send myself an update in the call log
          }
        } catch (error) {
          console.error(error)
        }
      })
    })

    socket.on('disconnect', () => {
      console.log('user disconnected', socket.rooms);
      let _connectedUsers = connectedUsers.filter(function (user) {
        return user.socket != socket;
      });
      connectedUsers = _connectedUsers;
      console.log("connectedUsers", connectedUsers)

      let currentConnections = connectedUsers.filter (({id}) => id === id).length
      console.log("currentConnections", currentConnections)
      io.emit('onlineStatusChange', { userID: id, status: 'offline' });
    });

    // function checkifOnCall

    function informAllUserLeft(leftUser, callUniqueId) { }
  }
  else {
    var destination = '/connect';
    socket.emit('redirect', destination);
  }

});

function isNumeric(num) { return !isNaN(num) }
function isNegative(num) {
  if (Math.sign(num) === -1) { return true; }
  return false;
}

function formatDate(unfDate) {
  let fDate = [
    (unfDate.getFullYear() + ''),
    ((unfDate.getMonth() + 1) + '').padStart(2, "0"),
    (unfDate.getDate() + '').padStart(2, "0")].join('-')
    + ' ' +
    [(unfDate.getHours() + '').padStart(2, "0"),
    (unfDate.getMinutes() + '').padStart(2, "0"),
    (unfDate.getSeconds() + '').padStart(2, "0")].join(':');
  return fDate;
}

function addUserToRoom(userID, roomID) {
  return new Promise(function (resolve, reject) {
    db.query("INSERT IGNORE INTO `participants`(`userID`, `roomID`) VALUES (?,?)", [userID, roomID], async (err, result) => {
      if (err) resolve({ type: 'negative', message: 'An error occurred while Adding the user to the group.' })
      else resolve({ type: 'positive', message: 'the group member was added successfully' })
    })
  })
}
function createNewGroupChat(groupName) {
  return new Promise(function (resolve, reject) {
    db.query("INSERT INTO `room`( `name`, `type`, `profilePicture`) VALUES (? , ? , ?)", [groupName, 1, null], async (err, result) => {
      if (err) resolve({ type: 'negative', message: 'An error occurred while Adding the user to the group.' })
      else resolve({ type: 'positive', message: 'the group member was added successfully', insertId: result.insertId })
    })
  })
}
function updateDBCoverPicture(userID, fileName) {
  db.query('UPDATE `user` SET `coverPicture` = ? WHERE `user`.`id` = ?', [fileName, userID], async (err, _myEvents) => {
    if (err) return console.log(err)
  })
}
function updateDBProfilePicture(userID, fileName) {
  db.query('UPDATE `user` SET `profilePicture` = ? WHERE `user`.`id` = ?', [fileName, userID], async (err, _myEvents) => {
    if (err) return console.log(err)
  })
}
function updateDBGroupPicture(roomID, fileName) {
  db.query('UPDATE `room` SET `profilePicture`= ? WHERE `chatID` = ?', [fileName, roomID], async (err, _myEvents) => {
    if (err) return console.log(err)
  })
}
function deleteProfilePicture(userID) {
  db.query('UPDATE `user` SET `profilePicture` = ? WHERE `user`.`id` = ?', [null, userID], async (err, _myEvents) => {
    if (err) return console.log(err)
  })
}
function deleteCoverPicture(userID) {
  db.query('UPDATE `user` SET `coverPicture` = ? WHERE `user`.`id` = ?', [null, userID], async (err, _myEvents) => {
    if (err) return console.log(err)
  })
}
function deleteGroupProfilePicture(roomID) {
  db.query('UPDATE `room` SET `profilePicture`= ? WHERE `chatID` = ?', [null, roomID], async (err, _myEvents) => {
    if (err) return console.log(err)
  })
}
let today = new Date()
let lastYear = new Date()
lastYear.setFullYear(today.getFullYear() - 1)
let nextYear = new Date()
nextYear.setFullYear(today.getFullYear() + 1)
getEvents(3, lastYear, nextYear).then(console.log)
// console.log(_events)
function getEvents(userId, initalDate, endDate) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `eventId`, `participantId`, `attending` FROM `eventparticipants` WHERE `participantId` = ?',
      [userId], async (err, _myEvents) => {
        if (err) return console.log(err);
        //create an object with properties which represent all of the dates between thos intervals
        let eventDates = {};
        let currentDate = initalDate
        while (currentDate <= endDate) {
          eventDates[currentDate.toISOString().slice(0, 10)] = [];
          currentDate.setDate(currentDate.getDate() + 1);
        }
        for (let eventNumber = 0; eventNumber < _myEvents.length; eventNumber++) {
          /**
           * {
            eventId: 3,
            owner: {
              userID: 9,
              name: 'Test9Name',
              surname: 'test9Surname',
              profilePicture: null
            },
            title: 'One more test',
            eventLocation: 'Imperium Line',
            context: 'the exchange',
            activityLink: 'no link',
            details: 'now some details',
            startTime: '12:00:00',
            endTime: '18:00:00',
            occurrence: 2,
            recurrenceType: 2,
            startRecurrenceDate: '2022-03-11',
            endRecurrenceDate: '2022-03-05',
            type: 1,
            oneTimeDate: null,
            Participants: [
              {
                userID: 1,
                name: 'Test1Name',
                surname: 'Test1Surname',
                profilePicture: '/images/profiles/user-128.png'
              },
              {
                userID: 2,
                name: 'Test2Name',
                surname: 'Test2Surname',
                profilePicture: '/images/profiles/user-129.png'
              },
              {
                userID: 3,
                name: 'Test3Name',
                surname: 'Test3Surname',
                profilePicture: null
              },
              {
                userID: 4,
                name: 'test4Name',
                surname: 'test4Surname',
                profilePicture: null
              }
            ]
          }
           */
          let eventdetails = await getEventDetails(_myEvents[eventNumber].eventId);
          if (eventdetails.occurrence == 1) {
            if (eventDates[eventdetails.oneTimeDate]) eventDates[eventdetails.oneTimeDate].push(eventdetails);
          }
          else if (eventdetails.occurrence == 2) {
            // { id: 1, name: "Every Day" },
            // { id: 2, name: "Every Week" },
            // { id: 3, name: "Monday - Friday" },
            // { id: 4, name: "Weekend" }

            let checkStartDate = new Date(eventdetails.startRecurrenceDate);
            let checkEndDate = new Date(eventdetails.endRecurrenceDate);
            let operationDate = checkStartDate;
            //number of difference in days
            let dayDifference = dayDif(checkStartDate, checkEndDate) + 1;
            //everyday
            if (eventdetails.recurrenceType == 1) {
              for (let i = 0; i < dayDifference; i++) {
                let operationDateString = operationDate.toISOString().slice(0, 10)
                if (eventDates[operationDateString]) eventDates[operationDateString].push(eventdetails);
                operationDate.setDate(operationDate.getDate() + 1)
              }
            }

            //everyWeek
            else if (eventdetails.recurrenceType == 2) {

              for (let i = 0; i < dayDifference / 7; i++) {
                let operationDateString = operationDate.toISOString().slice(0, 10)
                if (eventDates[operationDateString]) eventDates[operationDateString].push(eventdetails);
                operationDate.setDate(operationDate.getDate() + 7)
              }
            }

            //monday-friday
            else if (eventdetails.recurrenceType == 3) {
              for (let i = 0; i < dayDifference; i++) {
                let operationDateString = operationDate.toISOString().slice(0, 10)
                //get Day(), 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on
                if ((operationDate.getDay() == 1 || operationDate.getDay() == 2 || operationDate.getDay() == 3 || operationDate.getDay() == 4 || operationDate.getDay() == 5) && eventDates[operationDateString]) {
                  eventDates[operationDateString].push(eventdetails);
                }
                operationDate.setDate(operationDate.getDate() + 1)
              }
            }

            //weekend
            else if (eventdetails.recurrenceType == 4) {
              for (let i = 0; i < dayDifference; i++) {
                let operationDateString = operationDate.toISOString().slice(0, 10)
                //get Day(), 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on

                if ((operationDate.getDay() == 0 || operationDate.getDay() == 6) && eventDates[operationDateString]) {
                  eventDates[operationDateString].push(eventdetails);
                  console.log("weekend Found ->", operationDateString)
                }
                operationDate.setDate(operationDate.getDate() + 1)
              }
            }
          }
          else { console.log("Incorrect occurrence type for event ID:", eventdetails.eventId) }
        }
        resolve(eventDates)
      })
  })
}

const dayDif = (date1, date2) => Math.ceil(Math.abs(date1.getTime() - date2.getTime()) / 86400000)

function getEventDetails(givenEventId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `eventId`, `ownerId`, `title`, `eventLocation`, `context`, `activityLink`, `details`, `startTime`, `endTime`, `occurrence`, `recurrenceType`, `startRecurrenceDate`, `endRecurrenceDate`, `type`, `oneTimeDate` FROM `events` WHERE `eventId` = ? LIMIT 1',
      [givenEventId], async (err, myEventResults) => {
        if (err) return console.log(err);
        if (myEventResults.length < 1) {
          console.log("no event found with that Id");
          resolve(undefined)
          return;
        }
        let { eventId, ownerId, title, eventLocation, context, activityLink, details, startTime, endTime, occurrence, recurrenceType, startRecurrenceDate, endRecurrenceDate, type, oneTimeDate } = myEventResults[0];
        var _myEventResults = {
          eventId,
          owner: await getUserInfo(ownerId),
          title,
          eventLocation,
          context,
          activityLink,
          details,
          startTime,
          endTime,
          occurrence,
          recurrenceType,
          startRecurrenceDate,
          endRecurrenceDate,
          type,
          oneTimeDate,
          Participants: await getEventParticipants(givenEventId)
        }
        resolve(_myEventResults)
      })
  })
}

const insertEventParticipant = (eventId, participantId) => {
  /**
   * 0: not attending
   * 1: maybe
   * 2: attending: default
   */
  db.query("INSERT INTO `eventparticipants`(`eventId`, `participantId`, `attending`) VALUES (?,?,?)",
    [eventId, participantId, 2], async (err, addedParticipantResult) => {
      if (err) return console.log(err);
    });
}

function getEventParticipants(givenEventId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `eventId`, `participantId`, `attending` FROM `eventparticipants` WHERE `eventId` = ?', [givenEventId], async (err, eventParticipants) => {
      if (err) return console.log(err)
      let _eventParticipants = eventParticipants.map(async participant => {
        let attending = participant.attending;
        let userInfo = await getUserInfo(participant.participantId)
        return {
          userInfo: userInfo,
          attending: attending
        }
      })
      resolve(Promise.all(_eventParticipants))
    })
  })
}
function getEventTitle(givenEventId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `eventId`, `ownerId`, `title` FROM `events` WHERE `eventId` = ?', [givenEventId], async (err, events) => {
      if (err) { resolve(null); return console.log(err); }
      if (events.length < 1) resolve(null)
      else resolve(events[0].title)
    })
  })
}
function getcallTitle(callUniqueId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callTitle` FROM `calls` WHERE `callUniqueId` = ?', [callUniqueId], async (err, calls) => {
      if (err) console.log(err)
      if (calls.length < 1) resolve(null)
      else resolve(calls[0].callTitle)
    })
  })
}

const insertCallParticipant = (callUniqueId, callId, ParticipantId, initiatorId) => {
  db.query("INSERT INTO `callparticipants`( `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `initiatorId`, `missed`) VALUES (?,?,?,?,?,?)  ON DUPLICATE KEY UPDATE `participantId` = ? ",
    [callUniqueId, callId, ParticipantId, 0, initiatorId, 0, ParticipantId], async (err, changeResult) => {
      if (err) return console.log(err)
    })
}
const setCallAsMissed = (userId, callUniqueId) => {
  db.query("UPDATE `callparticipants` SET `missed`=? WHERE `callUniqueId` = ? AND participantId = ?",
    [1, callUniqueId, userId], async (err, changeResult) => {
      if (err) return console.log(err)
    })
}

function logToDatabaseNewCall(callUniqueId, id, callTo, groupPresentation, endTime, chatPresentation, eventId, callTitle) {
  return new Promise(function (resolve, reject) {
    db.query("INSERT INTO `calls`(`callUniqueId`, `initiatorId`, `destinationId`, `destinationType`, `endTime`, `callChatId`, `eventId`, `callTitle`) VALUES (?,?,?,?,?,?,?,?)",
      [callUniqueId, id, callTo, groupPresentation, endTime, chatPresentation, eventId || null, callTitle || null], async (err, callInserted) => {
        if (err) {
          console.log("Unable to register the call in Database", err)
          resolve(null)
        }
        else {
          resolve(callInserted.insertId)
        }
      }
    )
  })
}

function findRecentEventCalls(eventId) {
  return new Promise(function (resolve, reject) {
    db.query("SELECT `id`, `callUniqueId`, `initiatorId`, `destinationId`, `destinationType`, `initialtionTime`, `endTime`, `callChatId`, `eventId`, `callTitle` FROM `calls` WHERE `eventId` = ? ORDER BY `initialtionTime` DESC",
      [eventId], async (err, previousCalls) => {
        if (err) {
          console.log("Unable to register the call in Database", err)
          resolve(null)
        }
        else if (previousCalls.length < 1) {
          console.log("No previous calls found", err)
          resolve(null)
        }
        else {
          resolve(previousCalls)
        }
      }
    )
  })
}
function checkCallAccess(userId, callUniqueId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `initiatorId`, `startDate`, `missed` FROM `callparticipants` WHERE `callUniqueId` = ? AND `participantId` = ?', [callUniqueId, userId], async (err, myCallResults) => {
      if (err) { resolve(false); return console.log(err) }
      if (myCallResults.length > 0) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

function getCallLog(userId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `initiatorId`, `startDate`, `missed` FROM `callparticipants` WHERE `participantId` = ? ORDER BY `startDate` DESC LIMIT 15', [userId], async (err, myCallResults) => {
      if (err) return console.log(err)
      let callsArray = myCallResults.map(async call => ({
        ...call,
        callTitle: 'Untitled call',
        initiator: await getUserInfo(call.initiatorId),
        participantsOnCall: await getOnCallPeopleByStatus(call.callUniqueId, 1),
        participantsOffCall: await getOnCallPeopleByStatus(call.callUniqueId, 0)
      }))
      resolve(Promise.all(callsArray))
    })
  })
}

function getCallParticipants(callUniqueId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `startDate` FROM `callparticipants` WHERE `callUniqueId` = ?',
      [callUniqueId], async (err, callParticipants) => {
        if (err) return console.log(err)
        let unresolvedUsersArr = callParticipants.map(async (participant) => {
          return await getUserInfo(participant.participantId)
        })
        const resolved = await Promise.all(unresolvedUsersArr)
        resolve(resolved)
      });
  })
}

function getOnCallPeopleByStatus(callUniqueId, status) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `startDate` FROM `callparticipants` WHERE `callUniqueId` = ? and `stillParticipating` = ?',
      [callUniqueId, status], async (err, callParticipants) => {
        if (err) return console.log(err)
        let unresolvedUsersArr = callParticipants.map(async (participant) => {
          return await getUserInfo(participant.participantId)
        })
        const resolved = await Promise.all(unresolvedUsersArr)
        resolve(resolved)
      });
  })
}

function getStillParticipatingCalls(userId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `callUniqueId` FROM `callparticipants` WHERE `participantId` = ? AND `stillParticipating` = ?',
      [userId, 1], async (err, callParticipants) => {
        if (err) return console.log(err)
        const resolved = callParticipants.map(participant => participant.callUniqueId)
        resolve(resolved)
      });
  })
}

function setUserCallStatus(userId, callUniqueId, status) {
  if (!status) return;
  let statusInt;
  if (status == 'onCall') statusInt = 1;
  else if (status == 'offCall') statusInt = 0;
  else return;

  db.query("UPDATE `callparticipants` SET `stillParticipating`= ? WHERE `participantId`= ? AND `callUniqueId` = ?",
    [statusInt, userId, callUniqueId], async (err, changeResult) => {
      if (err) return console.log(err)
    })
}

function getCallParticipants(callUniqueId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating` FROM `callparticipants` WHERE `callUniqueId` = ?',
      [callUniqueId], async (err, callParticipants) => {
        if (err) return console.log(err)
        let unresolvedUsersArr = callParticipants.map(async (participant) => {
          return await getUserInfo(participant.participantId)
        })
        const resolved = await Promise.all(unresolvedUsersArr)
        resolve(resolved)
      });
  })
}

function getMessageTags(messageId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `messageId`, `tagMessageId` FROM `messagetags` WHERE `messageId` = ?',
      [messageId], async (err, messageTags) => {
        if (err) return console.log(err)
        let messageTagsArray = messageTags.map(async messageTag => {
          return await getMessageInfo(messageTag.tagMessageId)
        })
        resolve(Promise.all(messageTagsArray))
      });
  })
}
function checkMessageOwnership(messageId, userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [messageId], async (err, messages) => {
      if (err) return console.log(err)
      if (messages.length < 1) resolve(false)
      else {
        if (messages[0].userID == userID) resolve(messages[0].roomID)
        else resolve(false)
      }
    }
    );
  })
}
function deleteMessage(messageId) {
  return new Promise(function (resolve, reject) {
    db.query('UPDATE `message` SET`message`= "__deleted message__" WHERE `id` = ?',
      [messageId], async (err, messageTags) => {
        if (err) resolve({ type: 'negative', message: 'An error occured while deleting the message' });
        else resolve({ type: 'positive', message: 'The message was deleted successfully' })
      });
  })
}

function getMessageInfo(messageId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [messageId], async (err, MessageResult) => {
      if (err || MessageResult.length < 1) console.log(err, "MessageResult < 1", MessageResult);

      let { id, message, roomID, userID, timeStamp } = MessageResult[0]
      let userInfo = await getUserInfo(userID)
      let reactions = {
        chat: roomID,
        message: id,
        details: await getMessageReactions(id),
        available: await getAvailableMessageReactions()
      }
      resolve({
        id: id,
        message: message,
        roomID: roomID,
        userID: userID,
        timeStamp: timeStamp,
        userInfo: userInfo,
        reactions: reactions
      })
    });
  })
}

//getMessageTags(226).then(result => { console.log("result8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888", result) })
function getMessageReactions(messageId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT reactions.id, reactions.userID, reactions.messageID, reactions.reactionOptionID, reactionoptions.id, reactionoptions.icon, reactionoptions.name, reactionoptions.description, COUNT(reactionoptions.id) AS times FROM reactions INNER JOIN reactionoptions ON reactions.reactionOptionID = reactionoptions.id WHERE reactions.messageID = ? GROUP BY reactionoptions.id',
      [messageId], async (err, reactions) => {
        if (err) return console.log(err)
        let _reactions = reactions.map(async reaction => {

          return {
            reactionId: reaction.id,
            messageId: reaction.messageID,
            users: await getReactors(reaction.messageID, reaction.id),

            icon: reaction.icon,
            name: reaction.name,
            description: reaction.description
          }
        })
        resolve(Promise.all(_reactions))
      });
  })
}
function getAvailableMessageReactions() {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `icon`, `name`, `description` FROM `reactionoptions`',
      [], async (err, reactions) => {
        if (err) return console.log(err)
        resolve(
          Promise.all(
            reactions.map(reaction => {
              return { icon: reaction.icon, name: reaction.name, description: reaction.description }
            })
          ))
      });
  })
}
function getReactors(messageID, reactionID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `userID`, `messageID`, `reactionOptionID` FROM `reactions` WHERE `messageID` = ? AND `reactionOptionID` = ?',
      [messageID, reactionID], async (err, messageReactions) => {
        if (err) return console.log(err)
        let _reaction = messageReactions.map(async messageReaction => {
          return await getUserInfo(messageReaction.userID)
        })
        resolve(await Promise.all(_reaction))
      });
  })
}
function getRoomInfo(roomID, viewerID) {
  return new Promise(async function (resolve, reject) {
    let participants = await getRoomParticipantArray(roomID)
    let roomBasicInfo = await getChatRoomBasicInfo(roomID)

    let { chatID, name, type, profilePicture, creationDate, lastActionDate } = roomBasicInfo

    let lastMessage = await getChatRoomLastMessage(roomID)
    resolve({
      roomID: roomID,
      users: participants,
      roomName: roomBasicInfo.name,
      profilePicture: roomBasicInfo.profilePicture,
      type: roomBasicInfo.type,
      lastmessage: lastMessage == null ? {
        id: 0,
        message: 'New Chat',
        roomID: chatID,
        from: 'No messages Yet',
        timeStamp: creationDate
      } : lastMessage,
      myID: viewerID,
      unreadCount: 0, //tobe done later
    })
  })
}

function getRoomParticipantArray(roomIdentification) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `roomID` = ?', [roomIdentification], async (err, participants) => {
      if (err) return console.log(err)
      resolve(
        Promise.all(
          participants.map(async (participant) => {
            return await getUserInfo(participant.userID)
          })
        )
      )
    })
  })
}
function getRoomParticipantArrayByCallUniqID(roomIdentification) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId` FROM `callparticipants` WHERE `callUniqueId` = ?', [roomIdentification], async (err, participants) => {
      if (err) return console.log(err)
      resolve(
        Promise.all(
          participants.map(async (participant) => {
            return await getUserInfo(participant.participantId)
          })
        )
      )
    })
  })
}
function getChatRoomBasicInfo(roomId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `chatID`, `name`, `type`, `profilePicture`, `creationDate`, `lastActionDate` FROM `room` WHERE `chatID` = ?', [roomId], async (err, participants) => {
      if (err) return console.log(err)
      resolve(participants[0])
    })
  })
}
function getChatRoomLastMessage(roomId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `roomID` = ? ORDER BY timeStamp DESC LIMIT 1', [roomId], async (err, messages) => {
      if (err) return console.log(err)
      if (messages.length < 1) resolve(null)
      else resolve({
        id: messages[0].id,
        message: messages[0].message,
        roomID: messages[0].roomID,
        from: await getUserInfo(messages[0].userID),
        timeStamp: messages[0].timeStamp
      })
    })
  })
}
function getUserInfo(userID) {
  //console.log("getuserinfo function presented ID", userID)
  if (userID < 1) return console.log("requested user info does not exist", userID)
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `name`, `surname`, `email`, `profilePicture`, `coverPicture`, `password`, `company_id`, `positionId`, `registration_date` FROM `user` WHERE `id`= ?', [userID], async (err, profiles) => {
      if (err) return console.log(err)
      if (profiles.length < 1) return console.log('No profile found for user ' + userID)
      resolve({
        email: profiles[0].email,
        userID: profiles[0].id,
        name: profiles[0].name,
        surname: profiles[0].surname,
        profilePicture: profiles[0].profilePicture,
        cover: profiles[0].coverPicture,
        role: await getUserRole(profiles[0].positionId),
        company: await getCompanyInfo(profiles[0].company_id),
        status: connectedUsers.some(e => e.id === profiles[0].id) ? 'online' : 'offline'
      })
    });
  })
}

function searchUsers(searchterm, myId, company_id, includeMe, limit) {
  return new Promise(function (resolve, reject) {
    db.query("SELECT `id` FROM `user` WHERE (`name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ?) AND (`company_id` = ?) LIMIT ?", ['%' + searchterm + '%', '%' + searchterm + '%', '%' + searchterm + '%', company_id, limit], async (err, userSearchResult) => {
      if (err) return console.log(err)
      let foundUsers = []
      for (let i = 0; i < userSearchResult.length; i++) {
        const userID = userSearchResult[i].id;
        if (includeMe == false) {
          if (myId != userID) foundUsers.push(await getUserInfo(userID))
        }
        else { foundUsers.push(await getUserInfo(userID)) }
      }
      resolve(foundUsers)
    })
  })
}
function searchGroupsByName(searchterm, userID, limit) { // returns onlu IDs
  return new Promise(function (resolve, reject) {
    db.query("SELECT participants.id, participants.userID, participants.roomID, `chatID`, `name` FROM `room` FULL JOIN participants ON participants.roomID = chatID HAVING `name` LIKE ? AND participants.userID = ? LIMIT ?", ['%' + searchterm + '%', userID, limit], async (err, chatSearchResult) => {
      if (err) return console.log(err)
      else resolve(chatSearchResult.map(chat => chat.chatID))
    })
  })
}
function getUserRole(roleId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `position` FROM `positions` WHERE `id` = ?', [roleId], async (err, roles) => {
      if (err) return console.log(err)
      if (roles.length < 1) return console.log('no such role ID in the database: ' + roleId)
      resolve(roles[0].position)
    });
  })
}
async function getChatFullInfo(roomId, viewerID) {
  let roomInfo = await getRoomInfo(roomId, viewerID)
  let messagesArray = await getRoomMessages(roomId)
  return { roomInfo, messagesArray }
}

function getRoomMessages(roomId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `roomID` = ? ORDER BY timeStamp ASC', [roomId], async (err, messages) => {
      if (err) return console.log(err)
      resolve(
        Promise.all(
          messages.map(async (oneMessage) => {
            let { id, message, roomID, userID, timeStamp } = oneMessage;
            let userInfo = await getUserInfo(userID)
            let reactions = { chat: roomID, message: id, details: await getMessageReactions(id), available: await getAvailableMessageReactions() }
            let tagContent = await getMessageTags(id)
            return { id, message, roomID, userID, timeStamp, userInfo, reactions, tagContent }
          })
        )
      )
    })
  })
}

function createChat(me, other) {
  return new Promise(function (resolve, reject) {
    db.query('INSERT INTO `room`(`name`, `type`, `profilePicture`) VALUES (null,0,null)', [], async (err, chatInsert) => {
      if (err) return console.log(err)
      let insertedChatId = chatInsert.insertId
      db.query("INSERT INTO `participants`( `userID`, `roomID`) VALUES (?,?)", [me, insertedChatId], async (err, myIdInsert) => {
        if (err) return console.log(err)
        let insertedMe = myIdInsert.insertId
        db.query("INSERT INTO `participants`( `userID`, `roomID`) VALUES (?,?)", [other, insertedChatId], async (err, otherIdInsert) => {
          if (err) return console.log(err)
          let insertedOther = otherIdInsert.insertId
          resolve(insertedChatId)
        })
      })
    });
  })
}

function getuserChatsIds(userID) {
  return new Promise(function (resolve, reject) {
    db.query("SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `userID` = ?", [userID], async (err, userChats) => {
      if (err) return console.log(err)
      else resolve(userChats.map(room => { return room.roomID }))
    })
  })
}
function roomUserCount(roomId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `userID`, `roomID`, `dateGotAccess` FROM `participants` WHERE `roomID` = ?', [roomId], async (err, chatcount) => {
      if (err) return console.log(err)
      resolve(chatcount.length)
    });
  })
}

async function findCommonElement(array1, array2) {
  console.log('array1, array2', array1, array2)
  const filteredArray = array1.filter(value => array2.includes(value));
  var uniqueIds = [];
  filteredArray.forEach(array => { if (!uniqueIds.includes(array)) uniqueIds.push(array) })
  let resultObject = { exists: false, id: null };
  for (let i = 0; i < uniqueIds.length; i++) {
    if (await roomUserCount(uniqueIds[i]) == 2) {
      resultObject = { exists: true, id: uniqueIds[i] };
      break;
    }
  }
  return resultObject
}
async function findAllCommonElements(array1, array2) {
  let resultElements = []
  for (let i = 0; i < array1.length; i++) {
    for (let j = 0; j < array2.length; j++) {
      if (array1[i] == array2[j] && !resultElements.includes(array2[j])) resultElements.push(array2[j]);
    }
  }
  return resultElements
}

function getSuperadminAccess(userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `admin_id` FROM `superadmins` WHERE `admin_id` = ?', [userID], async (err, admins) => {
      if (err) return console.log(err)
      if (admins.length > 0) { resolve(true) }
      else resolve(false)
    })
  })
}
function checkGenericAdminAccess(userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `admin_id` FROM `admins` WHERE `admin_id` = ?', [userID], async (err, admins) => {
      if (err) return console.log(err)
      if (admins.length > 0) { resolve(true) }
      else resolve(false)
    })
  })
}

function checkCompanyAdminAccess(userID, companyID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `admin_id`, `company_id` FROM `admins` WHERE `admin_id` = ?', [userID], async (err, admins) => {
      if (err) return console.log(err)
      if (admins.map(admin => admin.company_id).includes(companyID)) { resolve(true) }
      else resolve(false)
    })
  })
}

function getCompanyInfo(companyID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `comanyname`, `description`, `logopath`, `coverpath` FROM `companies` WHERE `id` = ?', [companyID], async (err, companies) => {
      if (err) return console.log(err)
      if (companies.length > 0) {
        resolve({
          id: companies[0].id,
          name: companies[0].comanyname,
          description: companies[0].description,
          logo: companies[0].logopath,
          cover: companies[0].coverpath
        })
      }
      else { resolve(null) }
    })
  })
}

function getAdminUserCompanies(userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `company_id`, `admin_id`, `done_by`, `registration_date` FROM `admins` WHERE `admin_id` = ?', [userID], async (err, companies) => {
      if (err) return console.log(err)
      let companyArray = []
      for (let i = 0; i < companies.length; i++) { companyArray.push(await getCompanyInfo(companies[i].company_id)) }
      resolve(companyArray)
    })
  })
}
function getNumbersArray(role, companyId) {
  return new Promise(async function (resolve, reject) {
    if (role === 'admin') {
      let numbers = []
      let usersQueryObjectArray = [
        { queryString: 'SELECT count(*) as `count` FROM `user` WHERE `company_id` = ?', queryTerms: [companyId], title: 'Users', resultVariable: 'count' },
        { queryString: 'SELECT count(*) as `count` FROM `admins` WHERE `company_id` = ?', queryTerms: [companyId], title: 'Admins', resultVariable: 'count' },
        { queryString: 'SELECT count(*) as `count` FROM `positions` WHERE `company_id` = ?', queryTerms: [companyId], title: 'Positions', resultVariable: 'count' },
        { queryString: 'SELECT calls.`id`, COUNT(*) as count FROM calls INNER JOIN user ON calls.initiatorId = user.id WHERE user.company_id = ?', queryTerms: [companyId], title: 'Calls', resultVariable: 'count' },
        { queryString: 'SELECT events.`eventId`, COUNT(*) as count FROM events INNER JOIN user ON events.ownerId = user.id WHERE user.company_id = ?', queryTerms: [companyId], title: 'Events', resultVariable: 'count' },
        { queryString: 'SELECT message.`id`, COUNT(*) as count FROM message INNER JOIN user ON message.userID = user.id WHERE user.company_id = ?', queryTerms: [companyId], title: 'Messages', resultVariable: 'count' }
      ]
      for (let i = 0; i < usersQueryObjectArray.length; i++) {
        numbers.push({
          title: usersQueryObjectArray[i].title,
          value: await automaticSingleRowQuerry({
            queryString: usersQueryObjectArray[i].queryString,
            queryTerms: usersQueryObjectArray[i].queryTerms,
            resultVariable: usersQueryObjectArray[i].resultVariable
          })
        })
      }
      resolve(Promise.all(numbers))
    }
    if (role === 'superAdmin') {
      let numbers = []
      let usersQueryObjectArray = [
        { queryString: 'SELECT COUNT(*) AS count FROM `user`', queryTerms: [], title: 'Users', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `message`', queryTerms: [], title: 'Messages', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `reactionoptions`', queryTerms: [], title: 'Reaction Options', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `calls`', queryTerms: [], title: 'Calls', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `events`', queryTerms: [], title: 'Events', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `admins`', queryTerms: [], title: 'Company Admins', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `admins` WHERE `isPirmary` = 1', queryTerms: [], title: 'Primary Admins', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `companies`', queryTerms: [], title: 'Companies', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `superadmins`', queryTerms: [], title: 'Super Admins', resultVariable: 'count' }
      ]
      for (let i = 0; i < usersQueryObjectArray.length; i++) {
        numbers.push({
          title: usersQueryObjectArray[i].title,
          value: await automaticSingleRowQuerry({
            queryString: usersQueryObjectArray[i].queryString,
            queryTerms: usersQueryObjectArray[i].queryTerms,
            resultVariable: usersQueryObjectArray[i].resultVariable
          })
        })
      }
      resolve(numbers)
    }
  })
}

function automaticSingleRowQuerry(queryObject) {
  let { queryString, queryTerms, resultVariable } = queryObject
  return new Promise(function (resolve, reject) {
    db.query(queryString, queryTerms, async (err, obtainedVariables) => {
      if (err) console.log(err)
      // if (obtainedVariables.length == 0) { reject("querry returned 0 results") }
      resolve(obtainedVariables[0][resultVariable])
    })
  })
}
function getCompanyUsers(companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id` FROM `user` WHERE `company_id` = ?', [companyId], async (err, users) => {
      if (err) reject(err)
      resolve(Promise.all(
        users.map(async user => await getUserInfo(user.id))
      ))
    })
  })
}
function getCompanyAdmins(companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `company_id`, `admin_id`, `done_by`, `registration_date` FROM `admins` WHERE `company_id` = ?', [companyId], async (err, users) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          users.map(async user => {
            return {
              admin: await getUserInfo(user.admin_id),
              done_by: await getUserInfo(user.done_by),
              done: user.registration_date,
              company: await getCompanyInfo(user.company_id)
            }
          })
        )
      )
    })
  })
}
function getCompanyPositions(companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `position` FROM `positions` WHERE `company_id` = ?', [companyId], async (err, positions) => {
      if (err) reject(err)
      resolve(Promise.all(
        positions.map(async position => {
          return {
            positionId: position.id,
            position: position.position
          }
        })
      ))
    })
  })
}
function updateUserInfo(userID, name, surname, email, positionId) {
  return new Promise(function (resolve, reject) {
    if (userID == '' || name.trim() == '' || surname.trim() == '' || email.trim() == '' || positionId == '') resolve({ type: 'negative', message: 'Invalid data given Please check the input data' })
    db.query('UPDATE `user` SET `name`=?,`surname`=?,`email`=?,`positionId`=? WHERE `id` = ?',
      [name.trim(), surname.trim(), email.trim(), positionId, userID], async (err, report) => {
        if (err) resolve({ type: 'negative', message: 'An error occured while executing the change' })
        resolve({ type: 'positive', message: 'User Information was updated successfully' })
      })
  })
}
function updateUserPassword(userID, password) {
  return new Promise(async function (resolve, reject) {
    if (!pwValidator.validate(password)) {
      resolve({ type: 'negative', message: 'The specified password does not meet the minimum requirements for a secure password.  Minimum length 8, Maximum length 100, Must have uppercase letters, Must have lowercase letters, Must have at least 2 digits, Should not have spaces, Must not include common known things or places easily guessable passwords' });
      return;
    }
    let hashed_salted_password = await bcrypt.hash(password, 10);
    db.query('UPDATE `user` SET `password`=? WHERE `id` = ?',
      [hashed_salted_password, userID], async (err, report) => {
        if (err) resolve({ type: 'negative', message: 'An error occured while executing password change' });
        resolve({ type: 'positive', message: 'User Password was updated successfully' })
      })
  })
}
function checkCurrentPassword(userID, password) {
  return new Promise(async function (resolve, reject) {
    db.query('SELECT `id`, `password` FROM `user` WHERE `id` = ?', [userID], async (err, report) => {
      if (err || report.length < 1) resolve({ type: 'negative', message: 'An error occured while Checking the password', value: false });
      else resolve({ type: 'positive', message: 'Password checked successfully', value: await bcrypt.compare(password, report[0].password) })
    })
  })
}

function deleteUser(userToDelete) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `user` WHERE `id` = ?', [userToDelete], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while deleting the user' });
      resolve({ type: 'positive', message: 'User was deleted successfully' })
    })
  })
}
function createUser(name, surname, email, positionId, password, companyId) {
  return new Promise(async function (resolve, reject) {
    if (name.trim() == '' || surname.trim() == '' || email.trim() == '' || positionId == '') resolve({ type: 'negative', message: 'Invalid data given Please check the input data' })
    if (!pwValidator.validate(password)) {
      resolve({ type: 'negative', message: 'The specified password does not meet the minimum requirements for a secure password.  Minimum length 8, Maximum length 100, Must have uppercase letters, Must have lowercase letters, Must have at least 2 digits, Should not have spaces, Must not include common known things or places easily guessable passwords' });
      return;
    }
    let hashed_salted_password = await bcrypt.hash(password, 10);
    db.query('INSERT INTO `user`(`name`, `surname`, `email`, `password`, `company_id`, `positionId`) VALUES (?,?,?,?,?,?)',
      [name.trim(), surname.trim(), email.trim(), hashed_salted_password, companyId, positionId], async (err, report) => {
        if (err) resolve({ type: 'negative', message: 'An error occured while creating the user' });
        resolve({ type: 'positive', message: 'User was created successfully' })
      })
  })
}
function revokeAdminAccess(adminToDelete, companyId) {
  console.log('EXECUTED---------------------')
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `admins` WHERE `admin_id`= ?  AND `company_id` = ?', [adminToDelete, companyId], async (err, report) => {
      if (err) {
        console.log(err)
        resolve({ type: 'negative', message: 'An error occured while revoking the admin access' });
      }
      resolve({ type: 'positive', message: 'Admin Access was revoked successfully' })
    })
  })
}
function makeUserAdmin(userId, companyId, id) {
  return new Promise(function (resolve, reject) {
    db.query('INSERT INTO `admins`(`company_id`, `admin_id`, `done_by`) VALUES (?,?,?)', [companyId, userId, id], async (err, report) => {
      if (err) {
        console.log(err)
        if (err.code == 'ER_DUP_ENTRY') resolve({ type: 'negative', message: 'The user is already and admin' });
        else resolve({ type: 'negative', message: 'An error occured while giving the admin access' });
      }
      else resolve({ type: 'positive', message: 'Admin Access was givens successfully' })
    })
  })
}
function searchAdmins(searchTerm, companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT admins.company_id, admins.`admin_id`, admins.`done_by`, admins.`registration_date`, user.name, user.surname, user.email, user.id FROM `admins` INNER JOIN `user` ON `admins`.admin_id = `user`.`id` WHERE (`user`.`name` LIKE ? OR `user`.`surname` LIKE ? Or `user`.`email` LIKE ?) AND admins.`company_id` = ?',
      ['%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%', companyId], async (err, users) => {
        if (err) reject(err)
        resolve(
          Promise.all(
            users.map(async user => {
              return {
                admin: await getUserInfo(user.admin_id),
                done_by: await getUserInfo(user.done_by),
                done: user.registration_date
              }
            })
          )
        )
      })
  })
}
function getCompanyAdmins(companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `company_id`, `admin_id`, `done_by`, `registration_date` FROM `admins` WHERE `company_id` = ?', [companyId], async (err, users) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          users.map(async user => {
            return {
              admin: await getUserInfo(user.admin_id),
              done_by: await getUserInfo(user.done_by),
              done: user.registration_date
            }
          })
        )
      )
    })
  })
}
function editPosition(positionId, companyId, positionName) {
  return new Promise(function (resolve, reject) {
    db.query('UPDATE `positions` SET `position`= ?,`company_id`= ? WHERE `id` = ?', [positionName, companyId, positionId], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while updating the position.' });
      resolve({ type: 'positive', message: 'Position was edited successfully' })
    })
  })
}
function deletePosition(positionId, companyId) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `positions` WHERE `id` = ? AND `company_id` = ?', [positionId, companyId], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while Deleting the position.' });
      resolve({ type: 'positive', message: 'Position was deleted successfully' })
    })
  })
}
function createPosition(positionName, companyId) {
  return new Promise(function (resolve, reject) {
    db.query('INSERT INTO `positions`(`position`, `company_id`) VALUES (?,?)', [positionName, companyId], async (err, report) => {
      if (!report) resolve({ type: 'negative', message: 'The position already exists.' });
      if (err) resolve({ type: 'negative', message: 'An error occured while Creating the position.' });
      resolve({ type: 'positive', message: 'Position was created successfully' })
    })
  })
}
function searchPosition(searchTerm, companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `position`, `company_id` FROM `positions` WHERE (`id` LIKE ? OR `position` LIKE ?) AND `company_id` = ?', ['%' + searchTerm + '%', '%' + searchTerm + '%', companyId], async (err, positions) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          positions.map(async position => {
            return {
              positionId: position.id,
              position: position.position
            }
          })
        )
      )
    })
  })
}

// superAdmin functions
function getAllCompanies() {
  return new Promise((resolve, reject) => {
    db.query('SELECT `id`, `comanyname`, `description`, `logopath`, `coverpath` FROM `companies`', [], async (err, rows) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          rows.map(async company => await getCompanyInfo(company.id))
        )
      )
    })
  })
}
function getAllPrimaryAdmins() {
  return new Promise((resolve, reject) => {
    db.query('SELECT `id`, `company_id`, `admin_id`, `done_by`, `registration_date`, `isPirmary` FROM `admins` WHERE `isPirmary` = 1', [], async (err, rows) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          rows.map(async admin => {
            return {
              admin: await getUserInfo(admin.admin_id),
              done_by: await getUserInfo(admin.done_by),
              done: admin.registration_date,
              company: await getCompanyInfo(admin.company_id)
            }
          })
        )
      )
    })
  })
}
function getAllimperiumlineUsers() {
  return new Promise((resolve, reject) => {
    db.query('SELECT `id` FROM `user`ORDER BY name ASC, surname ASC', [], async (err, rows) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          rows.map(async user => {
            return await getUserInfo(user.id)
          })
        )
      )
    })
  })
}
function getAllSuperAdmins() {
  return new Promise((resolve, reject) => {
    db.query('SELECT `id`, `admin_id`, `done_by`, `registration_date` FROM `superadmins`', [], async (err, rows) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          rows.map(async superAdmin => {
            return {
              admin: await getUserInfo(superAdmin.admin_id),
              done_by: await getUserInfo(superAdmin.done_by),
              done: superAdmin.registration_date,
            }
          })
        )
      )
    })
  })
}
// company operations
function createCompany(companyName, companyDescription) {
  return new Promise(function (resolve, reject) {
    db.query('INSERT INTO `companies`(`comanyname`, `description`) VALUES (?,?)', [companyName, companyDescription], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while Creating the company.' });
      resolve({ type: 'positive', message: 'Company was created successfully' })
    })
  })
}
function editCompany(companyId, companyName, companyDescription) {
  console.log(companyId, companyName, companyDescription)
  return new Promise(function (resolve, reject) {
    db.query('UPDATE `companies` SET `comanyname`= ?,`description`= ? WHERE `id`= ?', [companyName, companyDescription, companyId], async (err, report) => {
      console.log(err);
      if (err) resolve({ type: 'negative', message: 'An error occured while updating the company.' });
      resolve({ type: 'positive', message: 'company was edited successfully' })
    })
  })
}
function deleteCompany(companyId) {
  console.log('superManageDeleteCompanies', companyId)
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `companies` WHERE `id` = ?', [companyId], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while Deleting the company.' });
      resolve({ type: 'positive', message: 'Company was deleted successfully' })
    })
  })
}
function searchCompany(searchTerm) {
  console.log('superManageDeleteCompanies', searchTerm)
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `comanyname`, `description`, `logopath`, `coverpath` FROM `companies` WHERE `comanyname` LIKE ? OR `description` LIKE ?', ['%' + searchTerm + '%', '%' + searchTerm + '%'], async (err, rows) => {
      if (err) reject(err)
      resolve(
        Promise.all(
          rows.map(async company => await getCompanyInfo(company.id))
        )
      )
    })
  })
}

// -- create Admins frm super admins
function createPrimaryAdmin(companyId, adminName, adminSurname, adminEmail, adminPassword, doneBy) {
  return new Promise(async function (resolve, reject) {
    console.log(companyId, adminName, adminSurname, adminEmail, adminPassword, doneBy)
    if (companyId == '' || adminName.trim() == '' || adminSurname.trim() == '' || adminEmail.trim() == '' || adminPassword == '') resolve({ type: 'negative', message: 'Invalid data given Please check the input data' })
    let existingPositionId = await getCompanyPositionId('Company Administrator', companyId)
    if (existingPositionId == null) {
      existingPositionId = await createPositionReturn('Company Administrator', companyId)
    }
    let createdUserResult = await createUserReturn(adminName, adminSurname, adminEmail, existingPositionId, adminPassword, companyId)
    if (createdUserResult.value == null) resolve({ type: createdUserResult.type, message: createdUserResult.message })
    else resolve(await createPrimaryAdminReturn(companyId, createdUserResult.value, doneBy, 1))
  })
}

function getCompanyPositionId(positionName, companyId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `position`, `company_id` FROM `positions` WHERE `position` = ? AND `company_id` = ?', [positionName, companyId], async (err, rows) => {
      if (err) reject(err)
      if (rows.length > 0) resolve(rows[0].id)
      else (resolve(null))
    })
  })
}
function createPositionReturn(positionName, companyId) {
  return new Promise(function (resolve, reject) {
    db.query('INSERT INTO `positions`(`position`, `company_id`) VALUES (?,?)', [positionName, companyId], async (err, report) => {
      if (err) reject(err);
      resolve(report.insertId)
    })
  })
}
function createUserReturn(name, surname, email, positionId, password, companyId) {
  return new Promise(async function (resolve, reject) {
    if (name.trim() == '' || surname.trim() == '' || email.trim() == '' || positionId == '') {
      console.log("one or many properties are empty", name, surname, email, positionId, companyId)
      resolve({ type: 'negative', message: 'One or many fields are missing.', value: null })
      return
    }
    if (!pwValidator.validate(password)) {
      console.log('password is not conform', error)
      resolve({ type: 'negative', message: 'The specified password does not meet the minimum requirements for a secure password.  Minimum length 8, Maximum length 100, Must have uppercase letters, Must have lowercase letters, Must have at least 2 digits, Should not have spaces, Must not include common known things or places easily guessable passwords.', value: null })
      return
    }
    let hashed_salted_password = await bcrypt.hash(password, 10);
    db.query('INSERT INTO `user`(`name`, `surname`, `email`, `password`, `company_id`, `positionId`) VALUES (?,?,?,?,?,?)',
      [name.trim(), surname.trim(), email.trim(), hashed_salted_password, companyId, positionId], async (err, report) => {
        if (err) {
          console.log('error while inserting the user', err);
          resolve({ type: 'negative', message: 'error while inserting the user.', value: null })
          return
        }
        else
          resolve({ type: 'positive', message: 'error while inserting the user.', value: report.insertId })
      })
  })
}
function createPrimaryAdminReturn(companyId, adminId, doneBy, isPirmary) {
  return new Promise(async function (resolve, reject) {
    db.query('INSERT INTO `admins`(`company_id`, `admin_id`, `done_by`, `isPirmary`) VALUES (?,?,?,?)',
      [companyId, adminId, doneBy, isPirmary], async (err, report) => {
        if (err) {
          console.log('error while inserting the Primary Admin', err)
          resolve({ type: 'negative', message: 'User created, But an error occured while inserting the user as Primary Admin.', value: null })
          return;
        }
        else resolve({ type: 'positive', message: 'User created, But an error occured while inserting the user as Primary Admin.', value: report.insertId })
      })
  })
}
function createSuperAdminReturn(adminId, doneBy) {
  return new Promise(async function (resolve, reject) {
    if (adminId == undefined) {
      console.log('User could not be registered thus can not be made admin');
      resolve({ type: 'negative', message: 'User could not be registered thus can not be made admin.' })
      return;
    }
    db.query('INSERT INTO `superadmins`(`admin_id`, `done_by`) VALUES (?,?)',
      [adminId, doneBy], async (err, report) => {
        if (err) {
          console.log('error while inserting user as the Primary Admin', err);
          resolve({ type: 'negative', message: 'User was created successfully, but could not be registered as admin.' })
          return;
        }
        else resolve({ type: 'positive', message: 'Super Admin User created successfully.' })
      })
  })
}
function searchPrimaryAdmins(searchTerm) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT admins.company_id, admins.`admin_id`, admins.`done_by`, admins.`registration_date`, user.name, user.surname, user.email, user.id , companies.id, companies.comanyname, companies.description FROM `admins` INNER JOIN `user` ON `admins`.admin_id = `user`.`id` INNER JOIN `companies` ON `admins`.`company_id` = `companies`.`id` WHERE (`user`.`name` LIKE ? OR `user`.`surname` LIKE ? Or `user`.`email` LIKE ? OR `companies`.`id` LIKE ? or `companies`.`comanyname` LIKE ? OR `companies`.`description` LIKE ? ) AND `admins`.`isPirmary` = 1',
      ['%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%'], async (err, users) => {
        if (err) console.log(err)
        resolve(
          Promise.all(
            users.map(async user => {
              return {
                admin: await getUserInfo(user.admin_id),
                done_by: await getUserInfo(user.done_by),
                done: user.registration_date,
                company: await getCompanyInfo(user.company_id)
              }
            })
          )
        )
      })
  })
}
function deletePrimaryAdmin(adminId) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `user` WHERE `id` = ?', [adminId], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while Deleting the Primary Admin access, and the user account.' });
      resolve({ type: 'positive', message: 'Primary Admin access revoked successfully and the user was deleted successfully' })
    })
  })
}
function deleteSuperAdmin(superAdminId) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `user` WHERE `id` = ?', [superAdminId], async (err, report) => {
      if (err) resolve({ type: 'negative', message: 'An error occured while Deleting the Primary Admin access, and the user account.' });
      resolve({ type: 'positive', message: 'Primary Admin access revoked successfully and the user was deleted successfully' })
    })
  })
}

function createSuperAdmin(companyId, adminName, adminSurname, adminEmail, adminPassword, doneBy) {
  return new Promise(async function (resolve, reject) {
    console.log(companyId, adminName, adminSurname, adminEmail, adminPassword, doneBy)
    if (companyId == '' || adminName.trim() == '' || adminSurname.trim() == '' || adminEmail.trim() == '' || adminPassword == '') resolve({ type: 'negative', message: 'Invalid data given Please check the input data' })
    let existingPositionId = await getCompanyPositionId('Company Administrator', companyId)
    if (existingPositionId == null) {
      existingPositionId = await createPositionReturn('Company Administrator', companyId)
    }
    let createdUserResult = await createUserReturn(adminName, adminSurname, adminEmail, existingPositionId, adminPassword, companyId)

    if (createdUserResult.value == null) resolve({ type: createdUserResult.type, message: createdUserResult.message })
    else resolve(await createSuperAdminReturn(createdUserResult.value, doneBy))
  })
}

function searchSuperAdmins(searchTerm) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT  superadmins.`admin_id`, superadmins.`done_by`, superadmins.`registration_date`, user.name, user.surname, user.email, user.id FROM `superadmins` INNER JOIN `user` ON `superadmins`.admin_id = `user`.`id` WHERE (`user`.`name` LIKE ? OR `user`.`surname` LIKE ? Or `user`.`email` LIKE ?)',
      ['%' + searchTerm + '%', '%' + searchTerm + '%', '%' + searchTerm + '%'], async (err, users) => {
        if (err) reject(err)
        resolve(
          Promise.all(
            users.map(async user => {
              return {
                admin: await getUserInfo(user.admin_id),
                done_by: await getUserInfo(user.done_by),
                done: user.registration_date
              }
            })
          )
        )
      })
  })
}

function getUserFavorites(userID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `favOwner`, `favUser` FROM `favouriteusers` WHERE `favOwner` = ?', [userID], async (err, users) => {
      if (err) {
        console.error(err);
        resolve([]);
      }
      let foundUsers = []
      for (let i = 0; i < users.length; i++) {
        const userID = users[i].favUser;
        foundUsers.push(await getUserInfo(userID))
      }
      resolve(foundUsers)
    })
  })
}
function addFavourite(favOwnerID, favoriteID) {
  return new Promise(function (resolve, reject) {
    db.query('REPLACE INTO `favouriteusers`(`favOwner`, `favUser`) VALUES (?,?)', [favOwnerID, favoriteID], async (err, users) => {
      if (err) {
        console.error(err);
        resolve({ type: 'negative', message: 'An error occurred while adding the user to favorites.' });
        return
      }
      resolve({ type: 'positive', message: 'Favorite added successfully.' })
    })
  })
}
function removeFavourite(favOwnerID, favoriteID) {
  return new Promise(function (resolve, reject) {
    db.query('DELETE FROM `favouriteusers` WHERE `favOwner` = ? AND `favUser` = ?', [favOwnerID, favoriteID], async (err, users) => {
      if (err) {
        console.error(err);
        resolve({ type: 'negative', message: 'An error occurred while removing the user from favorites.' });
        return
      }
      resolve({ type: 'positive', message: 'Favorite removed successfully.' })
    })
  })
}

server.listen(port, () => {
  console.log(`listening on Port number ${port}`);
});