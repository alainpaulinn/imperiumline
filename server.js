const path = require('path');
const express = require('express');
const app = express();
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
    sameSite: true,
    secure: false,// TODO: This value has tobe true in Production environment and the application has to have HTTPS enabled
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
      console.log('myInformation ID', id)
      socket.emit('myId', myInformation);
      console.log('myInformation', myInformation)
      db.query('SELECT `id`, `userID`, `roomID`, `dateGotAccess`, room.chatID, room.name, room.type, room.profilePicture, room.creationDate, room.lastActionDate FROM `participants` JOIN room ON room.chatID = participants.roomID WHERE participants.userID = ? ORDER BY `room`.`lastActionDate` DESC', [id], async (err, mychatResults) => {
        if (err) return console.log(err)
        mychatResults.forEach(async myChat => {
          let roomID = myChat.roomID + '';
          socket.join(roomID)
          socket.emit('displayChat', await getRoomInfo(roomID, id))
        });

      })
      //send call log to the connected user
      socket.emit('updateCallLog', await getCallLog(id))

      //sendCalendarEvents to the connected user
      let today = new Date()
      let lastYear = new Date()
      lastYear.setFullYear(today.getFullYear() - 1)
      let nextYear = new Date()
      nextYear.setFullYear(today.getFullYear() + 1)
      socket.emit('updateCalendar', await getEvents(id, lastYear, nextYear))

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
      }
      if (!event.file.meta.fileRole) return console.log("unable to upload file: " + event.file.name, "invalid Role")
      switch (event.file.meta.fileRole) {
        case 'profilePicture':
          uploader.dir = "private/profiles"
          break;
        case 'coverPicture':
          uploader.dir = "private/cover"
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
      }
      event.file.clientDetail.name = fileName
      console.log('saved', event)
    });
    // Error handler:
    uploader.on("error", (event) => {
      console.log("Error from uploader", event);
    });
    socket.on("deleteCoverPicture", () => {
      deleteCoverPicture(id)
    })
    socket.on("deleteProfilePicture", () => {
      deleteProfilePicture(id)
    })
    //-----------------------------------
    socket.on('requestChatContent', async (chatIdentification) => {
      socket.emit('chatContent', await getChatInfo(chatIdentification, id))
    });
    socket.on('message', async (message) => {
      /* message = { toRoom: selectedChatId, message: messageContent.innerText.trim(), timeStamp: new Date().toISOString(), taggedMessages: taggedMessages }; */
      let roomUsersInfo = await getRoomInfo(message.toRoom, id)
      let expectedUser = roomUsersInfo.users.find(user => user.userID == id)

      let unfDate = new Date();
      let fDate = [
        (unfDate.getFullYear() + ''),
        ((unfDate.getMonth() + 1) + '').padStart(2, "0"),
        (unfDate.getDate() + '').padStart(2, "0")].join('-')
        + ' ' +
        [(unfDate.getHours() + '').padStart(2, "0"),
        (unfDate.getMinutes() + '').padStart(2, "0"),
        (unfDate.getSeconds() + '').padStart(2, "0")].join(':');

      if (expectedUser && message.message != "") {
        db.query('INSERT INTO `message`(`message`, `roomID`, `userID`, `timeStamp`) VALUES (?,?,?,?)', [message.message, message.toRoom, id, fDate || message.timeStamp], async (err, participantResult) => {
          if (err) return console.log(err)
          db.query('UPDATE `room` SET `lastActionDate` = ? WHERE `room`.`chatID` = ?;', [fDate || message.timeStamp, message.toRoom], async (err, updateLastAction) => {
            if (err) return console.log(err)
            let chatInfo = await getRoomInfo(message.toRoom, id);
            db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id`= ?', [participantResult.insertId], async (err, messageResult) => {
              if (err) return console.log(err)

              message.taggedMessages.forEach(taggedMessage => {
                db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [taggedMessage], async (err, referencedMessageResult) => {
                  if (err) return console.log(err)
                  //console.log(referencedMessageResult)
                  if (referencedMessageResult.length > 0) {
                    if (referencedMessageResult[0].roomID == message.toRoom) {
                      db.query("INSERT INTO `messagetags`(`messageId`, `tagMessageId`) VALUES ('?','?')", [participantResult.insertId, taggedMessage], async (err, insertedTag) => {
                        if (err) return console.log(err)
                        console.log(`Tag ${insertedTag.insertId} is inserted`)
                      })
                    }
                    else {
                      console.log(`User ${id} tried to tag Message ${participantResult.insertId} which is not from group ${message.toRoom} it is from ${referencedMessageResult[0].roomID}`)
                    }
                  }
                })

              });
              let insertedMessage = {
                id: messageResult[0].id,
                toRoom: messageResult[0].roomID,
                message: messageResult[0].message,
                timeStamp: messageResult[0].timeStamp,
                reactions: {
                  chat: messageResult[0].roomID,
                  message: messageResult[0].id,
                  details: await getMessageReactions(messageResult[0].id)
                },
                tagContent: await getMessageTags(messageResult[0].id)
              }
              console.log("Last inserted ID", participantResult.insertId)
              io.sockets.in(message.toRoom).emit('newMessage', { chatInfo, expectedUser, insertedMessage });
            })
          })
        })
      }
      else { console.log(`${id} was prevent to write to ${message.toRoom} because they are not a member`) } //Just for security purposes

      //console.log("EXPECTEEEDDD uuuuuser",await chatInfoforMembers(message.toRoom), expectedUser,id,message)
    });
    socket.on('searchPeople', (searchPeople) => {
      db.query("SELECT `id` FROM `user` WHERE `name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ? LIMIT 15", ['%' + searchPeople + '%', '%' + searchPeople + '%', '%' + searchPeople + '%'], async (err, userSearchResult) => {
        if (err) return console.log(err)
        let foundUsers = await searchUsers(searchPeople, id, company_id, false, 15)
        socket.emit('searchPerson', foundUsers)
      })
    })
    socket.on('makeChat', (makeChat) => {
      if (makeChat == id) return console.log(`user with ID ${id} wanted to create a chat with himself and was dismissed`)
      let memberRooms = [];
      let commonChat = { exists: false, id: null };

      db.query("SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `userID` = ?", [makeChat], async (err, dbChatCheck) => {
        if (err) return console.log(err)
        memberRooms = dbChatCheck.map(room => { return room.roomID })
        db.query("SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `userID` = ?", [id], async (err, dbMyChatCheck) => {
          if (err) return console.log(err)

          let myMemberRooms = dbMyChatCheck.map(room => { return room.roomID })

          //finally check if we have common priavate conversation
          let commonEntry = await findCommonElement(memberRooms, myMemberRooms)
          switch (commonEntry.exists) {
            case true:
              socket.emit('displayChat', await getRoomInfo(commonEntry.id, id))
              socket.emit('clickOnChat', commonEntry.id)
              //socket.emit('chatContent', await getChatInfo(commonEntry.id, id))  
              break;
            case false:
              /////////CREATE A NEW CHAT
              createdChatId = await createChat(id, makeChat)
              let partnerConnectionArray = connectedUsers.filter(user => { return user.id == makeChat })
              let myConnectionArray = connectedUsers.filter(user => { return user.id == id })

              partnerConnectionArray.forEach(connection => { //make partner join the room
                connection.socket.join(createdChatId + '');
              });

              myConnectionArray.forEach(connection => { // join me to the room
                connection.socket.join(createdChatId + '');
              });
              //Send to all concerned people / logged in instances
              io.sockets.in(createdChatId + '').emit('displayNewCreatedChat', await getRoomInfo(createdChatId, id));
              socket.emit('clickOnChat', createdChatId + '')
              //for the person who opened the chat -> open the chat
              //socket.emit
              break;

            default:
              break;
          }
        })

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

                        io.sockets.in(reactionIdentifiers.selectedChatId + '').emit('updateReaction',
                          {
                            chat: reactionIdentifiers.selectedChatId,
                            message: reactionIdentifiers.messageId,
                            details: await getMessageReactions(reactionIdentifiers.messageId)
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

    socket.on('callLogContactSearch', (searchPeople) => {
      db.query("SELECT `id` FROM `user` WHERE `name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ? LIMIT 15", ['%' + searchPeople + '%', '%' + searchPeople + '%', '%' + searchPeople + '%'], async (err, userSearchResult) => {
        if (err) return console.log(err)
        let foundUsers = []
        for (let i = 0; i < userSearchResult.length; i++) {
          const userID = userSearchResult[i].id;
          if (id != userID) foundUsers.push(await getUserInfo(userID))
        }
        socket.emit('callLogContactSearch', foundUsers)
      })
    })



    socket.on("initiateCall", async data => {
      let { callTo, audio, video, group, fromChat, previousCallId } = data;

      // check if this user is already on another call, and end that call before starting a new one
      let currentOngoingCalls = await getStillParticipatingCalls(id)
      for (let c = 0; c < currentOngoingCalls.length; c++) {
        const callUniqueId = currentOngoingCalls[c];
        socket.to(callUniqueId + '').emit('callCancelled', { callUniqueId: callUniqueId });
        socket.to(callUniqueId + '-allAnswered-sockets').emit('userLeftCall', await getUserInfo(id));
        setUserCallStatus(id, callUniqueId, 'offCall')
        try { socket.leave(callUniqueId + '-allAnswered-sockets'); } catch (e) { console.log('[error]', 'leave room :', e); }
        try { socket.leave(callUniqueId); } catch (e) { console.log('[error]', 'leave room :', e); }
        let thisCallparticipants = await getCallParticipants(callUniqueId)
        for (let i = 0; i < connectedUsers.length; i++) {
          for (let j = 0; j < thisCallparticipants.length; j++) {
            if (connectedUsers[i].id == thisCallparticipants[j].userID) {
              connectedUsers[i].socket.emit
              socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
            }
          }
        }
      }
      ///////////////////////

      // console.log(data)
      if (callTo === undefined || audio === undefined || video === undefined || group === undefined || fromChat === undefined) return console.log("invalid call performed by user ID:", id)

      let audioPresentation = 1;
      if (audio === false) audioPresentation = 0;
      let videoPresentation = 1;
      if (video === false) videoPresentation = 0;
      let chatPresentation = 1;
      if (fromChat === true) chatPresentation = 0;
      let groupPresentation = 1;
      if (group === false) groupPresentation = 0;

      let callUniqueId = makeid(20)
      db.query("INSERT INTO `calls`(`callUniqueId`, `initiatorId`, `destinationId`, `destinationType`, `endTime`, `callChatId`) VALUES (?,?,?,?,?,?)",
        [callUniqueId, id, callTo, groupPresentation, null, chatPresentation], async (err, callInserted) => {
          if (err) return console.log("Unable to register the call in Database", err)
          let insertedCallId = callInserted.insertId
          //call from individual call buttons(outside callog and outside chat)
          if (group === false && fromChat === false) { let oneToCall = await getUserInfo(callTo); initiateCall([oneToCall, await getUserInfo(id)]); return; }
          switch (chatPresentation) {
            case 0:  //call from Chat
              let groupMembersToCall = await getParticipantArray(callTo)
              initiateCall(groupMembersToCall)
              break;
            case 1: //call from callogs
              let existingCallParticipants = await getCallParticipants(previousCallId)
              initiateCall(existingCallParticipants)
              break;
            default:
              let thisUser = await getCallParticipants(id)
              initiateCall([thisUser])
              break;
          }
          async function initiateCall(groupMembersToCall) {
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
                  socket.to(connectedUsers[j].socket.id).emit('incomingCall', {
                    callUniqueId: callUniqueId,
                    callType: video == true ? "video" : "audio",
                    caller: await getUserInfo(id),
                    allUsers: groupMembersToCall,
                    myInfo: await getUserInfo(connectedUsers[j].id),
                    callTitle: 'Untitled Call'
                  });
                  console.log("--->connectedUser identified", connectedUsers[j].id)
                  groupMembersToCall_fullInfo.push({ peerId: connectedUsers[j].callId, userProfileIdentifier: groupMembersToCall[i] })
                  connectedUsers[j].socket.join(callUniqueId + '');
                }
                if (groupMembersToCall[i].userID == connectedUsers[j].id) { socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); } //update callog for each connected user
              }
            }
            socket.emit('prepareCallingOthers', { callUniqueId, callType: videoPresentation == 1 ? "video" : "audio", groupMembersToCall_fullInfo, caller: await getUserInfo(id), allUsers: groupMembersToCall, callTitle: 'Untitled Call' });
          }
        })
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
      let { myPeerId, callUniqueId, callType } = data;
      console.log('user ', id, ' has joined the call ', callUniqueId, ' and requests to be called')

      let thisCallparticipants = await getCallParticipants(callUniqueId) //get all people who are allowed in this call
      let thisUsershouldbeinthiscall = false
      for (var i = 0; i < thisCallparticipants.length; i++) { //For security purposes check if the answered person should be able to answer this call
        if (thisCallparticipants[i].userID == id) { thisUsershouldbeinthiscall = true; break; }
      }
      if (thisUsershouldbeinthiscall == false) { return console.log("You are not allowed to answer this call", callUniqueId) }
      socket.emit('updateAllParticipantsList', thisCallparticipants) // this is because if someone answers this call, while the called has added other users, the caller will not have a list

      //inform all users who accepted the call- to call me
      socket.to(callUniqueId + '-allAnswered-sockets').emit('connectUser', { peerId: myPeerId, userInfo: await getUserInfo(id), callType });
      setUserCallStatus(id, callUniqueId, 'onCall') // set this user to in-call status
      socket.join(callUniqueId + '-allAnswered-sockets'); // become a member of the call room

      //check connected people from allowed people
      for (let i = 0; i < connectedUsers.length; i++) {
        for (let j = 0; j < thisCallparticipants.length; j++) {
          if (connectedUsers[i].id == thisCallparticipants[j].userID) {
            connectedUsers[i].socket.emit
            socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
          }
        }
      }
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
            connectedUsers[i].socket.emit
            socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
          }
        }
      }
    })
    // search to add new users to call
    socket.on('searchPeopleToInviteToCall', async (callSearchData) => {
      let access = await checkCallAccess(id, callSearchData.callUniqueId)
      if (access != true) { return console.log('User :', id, ' cannot search to add a person to call because he has no access to this call :', identifications.callUniqueId) }
      let { callUniqueId, searchText } = callSearchData
      console.log('callSearchData', callSearchData)
      db.query("SELECT `id` FROM `user` WHERE `name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ? LIMIT 15", ['%' + searchText + '%', '%' + searchText + '%', '%' + searchText + '%'], async (err, userSearchResult) => {
        if (err) return console.log(err)
        let thisCallparticipantsInFull = await getCallParticipants(callUniqueId)
        let thisCallparticipants = thisCallparticipantsInFull.map(participant => { return participant.userID }) //get all people who are allowed in this call
        foundUsers = []
        for (let i = 0; i < userSearchResult.length; i++) {
          const userID = userSearchResult[i].id;
          if (!thisCallparticipants.includes(userID) && userID != id) { foundUsers.push(await getUserInfo(userID)) }
        }
        socket.emit('searchPeopleToInviteToCall', foundUsers)
      })
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
            callTitle: callTitle
          });
          socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); // update callee callog
        }
      }
      io.sockets.in(callUniqueId + '-allAnswered-sockets').emit('userAddedToCall', { callUniqueId: callUniqueId, userInfo: await getUserInfo(userID) })
      insertCallParticipant(callUniqueId, 1, userID, id) //  is a fictional ID
    })

    // for testing only
    socket.on('showConnectedUsers', () => {
      console.log("showConnectedUsers", connectedUsers)
    })

    ////////////////Meeting/schedule planning/////////////////
    socket.on('scheduleInviteSearch', inviteId => {
      db.query("SELECT `id`, `name`, `surname`, `email`, `profilePicture`, `company_id` FROM `user` WHERE `name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ? LIMIT 10", ['%' + inviteId + '%', '%' + inviteId + '%', '%' + inviteId + '%'], async (err, userSearchResult) => {
        if (err) return console.log(err)
        let foundUsersusers = userSearchResult.map(searchPerson => {
          return {
            company_id: searchPerson.company_id,
            email: searchPerson.email,
            id: searchPerson.id,
            name: searchPerson.name,
            profilePicture: searchPerson.profilePicture,
            surname: searchPerson.surname
          }
        })
        var listWithoutMe = foundUsersusers.filter(function (user) {
          return user.id != id;
        });
        console.log("scheduleInviteResults listWithoutMe", listWithoutMe)
        socket.emit('scheduleInviteResults', listWithoutMe)

      })
    })
    ///////////New Event/schedule/meeting plan////////////////////////////////
    socket.on('newEventPlan', (newEventCreation) => {
      console.log("newEventCreation", newEventCreation)
      let { inviteList, title, eventLocation, context, activityLink, details, startTime, endTime, occurrence, recurrenceType, startRecurrenceDate, endRecurrenceDate, type, oneTimeDate } = newEventCreation;
      db.query("INSERT INTO `events`(`ownerId`, `title`, `eventLocation`, `context`, `activityLink`, `details`, `startTime`, `endTime`, `occurrence`, `recurrenceType`, `startRecurrenceDate`, `endRecurrenceDate`, `type`, `oneTimeDate`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [id, title, eventLocation, context, activityLink, details, startTime, endTime, occurrence, recurrenceType, startRecurrenceDate, endRecurrenceDate, type, oneTimeDate],
        async (err, EventInsertResult) => {
          if (err) return console.log(err);
          if (inviteList) {
            inviteList.forEach(invite => {
              insertEventParticipant(EventInsertResult.insertId, invite)
            })
          }
          insertEventParticipant(EventInsertResult.insertId, id)

          let today = new Date()

          let lastYear = new Date()
          lastYear.setFullYear(today.getFullYear() - 1)

          let nextYear = new Date()
          nextYear.setFullYear(today.getFullYear() + 1)

          let eventsToSend = await getEvents(id, lastYear, nextYear);

          socket.emit('updateCalendar', eventsToSend)
          for (let i = 0; i < inviteList.length; i++) {
            const invite = inviteList[i];
            for (let j = 0; j < connectedUsers.length; j++) {
              const connectedUser = connectedUsers[j];
              if (connectedUser.id == invite) {
                socket.to(connectedUser.socket.id).emit('updateCalendar', await getEvents(id, lastYear, nextYear));
              }
            }
          }
        })
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
      let passwordResult = await updateUserPassword(userID, password)
      socket.emit('manageUsers', await getCompanyUsers(companyId))
      socket.emit('feedback', [userInfoUpdateResult, passwordResult])
    })
    socket.on('editPosition', async (updateObject) => {
      console.log('editPosition', updateObject)
      let { positionId, companyId, positionName } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let editPositionResult = await editPosition(positionId, companyId, positionName)
      socket.emit('managePositions', await getCompanyPositions(companyId))
      socket.emit('feedback', [editPositionResult])
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
      socket.emit('feedback', [deleteUserResult])
    })
    socket.on('revokeAdminAccess', async (updateObject) => {
      console.log('revokeAdminAccess', updateObject)
      let { adminToDelete, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let revokeAdminAccessResult = await revokeAdminAccess(adminToDelete, companyId)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('manageAdmins', await getCompanyAdmins(companyId))
      socket.emit('feedback', [revokeAdminAccessResult])
    })
    socket.on('deletePosition', async (updateObject) => {
      console.log('deletePosition', updateObject)
      let { positionId, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let deletePositionResult = await deletePosition(positionId, companyId)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('managePositions', await getCompanyPositions(companyId))
      socket.emit('feedback', [deletePositionResult])
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
      socket.emit('feedback', [createUserResult])
    })
    socket.on('giveNewAdminAccess', async (updateObject) => {
      console.log('giveNewAdminAccess', updateObject)
      let { userId, companyId } = updateObject
      let adminAccess = await checkCompanyAdminAccess(id, companyId);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestAdminNumbers info')

      let makeUserAdminResult = await makeUserAdmin(userId, companyId, id)
      socket.emit('adminNumbers', await getNumbersArray('admin', companyId))
      socket.emit('manageAdmins', await getCompanyAdmins(companyId))
      socket.emit('feedback', [makeUserAdminResult])
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
      socket.emit('feedback', [createPositionResult])
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
      socket.emit('superManageAdmins', await getAllPrimaryAdmins())
    })
    socket.on('superManageSuperAdmins', async () => {
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')
      socket.emit('superManageSuperAdmins', await await getAllSuperAdmins())
    })
    // Update
    socket.on('superManageEditCompanies', async (updateObject) => {
      let { companyId, companyName, description } = updateObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let editCompaniesResult = await editCompany(companyId, companyName, description)
      socket.emit('superManageCompanies', await getAllCompanies())
      socket.emit('feedback', [editCompaniesResult])
    })
    // Delete
    socket.on('superManageDeleteCompanies', async (deleteObject) => {
      let { companyId } = deleteObject

      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let editCompaniesResult = await deleteCompany(companyId)
      socket.emit('superManageCompanies', await getAllCompanies())
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin', companyId))
      socket.emit('feedback', [editCompaniesResult])
    })
    // Create New
    socket.on('superManageCreateCompany', async (createObject) => {
      let { companyName, companyDescription } = createObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      let editCompaniesResult = await createCompany(companyName, companyDescription)
      socket.emit('superManageCompanies', await getAllCompanies())
      socket.emit('superAdminNumbers', await getNumbersArray('superAdmin'))
      socket.emit('feedback', [editCompaniesResult])
    })
    // Search
    socket.on('superManageSearchCreateCompany', async (searchObject) => {
      let { searchTerm } = searchObject
      let adminAccess = await getSuperadminAccess(id);
      if (adminAccess != true) return console.log('user: ' + id + ' is not admin, hence cannot get Admin requestSuperAdminNumbers info')

      socket.emit('superManageSearchCreateCompany', await searchCompany(searchTerm))
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
    socket.on('disconnecting', () => {
      console.log('socket.roomsssssssssssssssssssssss', socket.rooms); // the Set contains at least the socket ID
      let roomsArray = Array.from(socket.rooms);
      roomsArray.forEach(async function (room) {
        if (isNumeric(room) && !room.includes('-allAnswered-sockets')) {
          socket.to(room).emit('userDisconnected', { id: id, room: room })
        }
        if (!isNumeric(room) && room.includes('-allAnswered-sockets')) {
          socket.to(room).emit('userDisconnectedFromCall', { userInfo: await getUserInfo(id), room: room })
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
      })
    })

    socket.on('disconnect', () => {
      console.log('user disconnected', socket.rooms);
      let _connectedUsers = connectedUsers.filter(function (user) {
        return user.socket != socket;
      });
      connectedUsers = _connectedUsers;
      console.log("connectedUsers", connectedUsers)
    });

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

function getEvents(userId, initalDate, endDate) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `eventId`, `participantId`, `attending` FROM `eventparticipants` WHERE `participantId` = ?',
      [userId], async (err, _myEvents) => {
        if (err) return console.log(err);
        //if (_myEvents.length < 1) return console.log("no participated events found for this user")
        //console.log("my Events", _myEvents)
        //create an object with properties which represent all of the dates between thos intervals
        let eventDates = {};
        let currentDate = initalDate
        //console.log("currentDate", currentDate, initalDate)
        while (currentDate <= endDate) {
          //console.log("curr", currentDate)
          eventDates[currentDate.toISOString().slice(0, 10)] = [];
          currentDate.setDate(currentDate.getDate() + 1);
        }
        //console.log("Event Dates", eventDates);
        //console.log(eventDates)
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
          //console.log("eventdetails", eventdetails)
          //console.log("eventDates", eventDates)
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
            // console.log(checkStartDate, checkEndDate)
            // console.log(dayDifference)

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
                console.log("monday-friday loop running", i)
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
                console.log("weekend loop running", i)
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
        if (myEventResults.length != 1) return console.log("no event found with that Id");
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
//getEventDetails(3).then(console.log)
//getEvents(9, new Date("2022-03-15"), new Date("2022-03-23")).then(console.log)

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
        return {
          userInfo: await getUserInfo(participant.participantId),
          attending: attending
        }
      })
      resolve(Promise.all(_eventParticipants))
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
function checkCallAccess(userId, callUniqueId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `initiatorId`, `startDate`, `missed` FROM `callparticipants` WHERE `callUniqueId` = ? AND `participantId` = ?', [callUniqueId, userId], async (err, myCallResults) => {
      if (err) return console.log(err)
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
//getCallLog(1).then(console.log)
//function getCallParticipants

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

function getMessageInfo(messageId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [messageId], async (err, MessageResult) => {
      if (err || MessageResult.length < 1) console.log(err, "MessageResult < 1", MessageResult);

      let { id, message, roomID, userID, timeStamp } = MessageResult[0]
      let userInfo = await getUserInfo(userID)
      let reactions = {
        chat: roomID,
        message: id,
        details: await getMessageReactions(id)
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

//console.log("hello")
//getMessageReactors(17).then(console.log)
function getRoomInfo(roomID, viewerID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `chatID`, `name`, `type`, `profilePicture`, `creationDate` FROM `room` WHERE `chatID` = ?', [roomID], async (err, room) => {
      if (err) return console.log(err)
      let chatID = null;
      let name = null;
      let roomProfilePicture = null;
      let type = null;
      let creationDate = null;
      room.forEach(roomInfo => {
        chatID = roomInfo.chatID;
        name = roomInfo.name;
        roomProfilePicture = roomInfo.profilePicture;
        type = roomInfo.type;
        creationDate = roomInfo.creationDate;
      })

      let usersArray = [];
      let lastMessage;
      let timestamp;
      let fromID;
      let fromName;
      let fromSurname;
      let myID;
      let fromUserPicture;
      let avatar = roomProfilePicture;
      db.query('SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `roomID` = ?', [roomID], async (err, participants) => {
        if (err) return console.log(err)

        for (let i = 0; i < participants.length; i++) {
          const participant = participants[i];
          usersArray.push(await getUserInfo(participant.userID));
        }

        db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `roomID` = ? ORDER BY timeStamp DESC LIMIT 1', [roomID], async (err, messages) => {
          if (err) return console.log(err)
          //set default if there is no message (new fake message)
          //console.log('messagessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss', roomID, viewerID, messages)

          if (messages.length < 1) {
            lastMessage = `<em>New Chat</em>`;
            timestamp = creationDate;
            fromID = viewerID;
          }
          else {
            messages.forEach(message => {
              lastMessage = message.message;
              timestamp = message.timeStamp;
              fromID = message.userID;
            })
          }

          switch (type) {
            case 0:
              // console.log("usersArray", usersArray)
              //console.log("is a private chat");
              var otherUser = usersArray.filter(user => { return user.userID !== viewerID })[0];
              avatar = otherUser.profilePicture;
              name = otherUser.name + ' ' + otherUser.surname;
              if (avatar == null) avatar = otherUser.name.charAt(0).toUpperCase() + otherUser.surname.charAt(0).toUpperCase();
              break;
            case 1:
              //console.log("is a group chat");
              avatar = roomProfilePicture;
              if (name == null) name = usersArray.map(user => { return "Group: " + user.name + ' ' + user.surname }).join(', ');
              if (avatar == null) avatar = '/private/profiles/group.jpeg';
              break;

            default:
              break;
          }
          resolve({
            roomID: roomID,
            users: await Promise.all(usersArray),
            roomName: name,
            profilePicture: avatar,
            type: type,
            lastmessage: lastMessage,
            from: await getUserInfo(fromID),
            myID: viewerID,
            timestamp: timestamp,
            unreadCount: 0 //tobe done later
          })
        });
      });
    });
  })
}
function getParticipantArray(roomIdentification) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `roomID` = ?', [roomIdentification], async (err, participants) => {
      if (err) return console.log(err)
      let InresolvedUsersArr = participants.map(async (participant) => {
        return await getUserInfo(participant.userID)
      })
      const resolved = await Promise.all(InresolvedUsersArr)
      resolve(resolved)
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
function getUserRole(roleId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `position` FROM `positions` WHERE `id` = ?', [roleId], async (err, roles) => {
      if (err) return console.log(err)
      if (roles.length < 1) return console.log('no such role ID in the database: ' + roleId)
      resolve(roles[0].position)
    });
  })
}
function getChatInfo(chatIdentification, viewerID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `roomID` = ? ORDER BY timeStamp DESC', [chatIdentification], async (err, messages) => {
      if (err) return console.log(err)
      //messagesArray = [];

      let messagesArray = messages.map(async (oneMessage) => {
        let { id, message, roomID, userID, timeStamp } = oneMessage;
        let userInfo = await getUserInfo(userID)
        let reactions = {
          //Promise.all(await getMessageReactions(id))
          chat: roomID,
          message: id,
          details: await getMessageReactions(id)
        }
        let tagContent = await getMessageTags(id)
        console.log(reactions)
        //let reactions = Promise.all(await getMessageReactions(id))
        //messagesArray.push({id, message, roomID, userID, timeStamp, userInfo})

        return { id, message, roomID, userID, timeStamp, userInfo, reactions, tagContent }
      })


      db.query('SELECT `chatID`, `name`, `type`, `profilePicture` FROM `room` WHERE `chatID` = ?', [chatIdentification], async (err, room) => {
        if (err) return console.log(err)
        let _usersArray = await getParticipantArray(chatIdentification);
        let _roomName;
        let _profilePicture;
        switch (room[0].type) {
          case 0:
            var otherUser = _usersArray.filter(user => { return user.userID != viewerID })[0];
            _roomName = otherUser.name + ' ' + otherUser.surname;
            _profilePicture = otherUser.profilePicture

            break;
          case 1:
            if (room[0].name == null) {
              _roomName = _usersArray.map(user => { return user.name }).join(", ")
            } else {
              _roomName = room[0].name
            }
            break;

          default:
            break;
        }
        resolve({
          roomID: chatIdentification,
          roomName: _roomName,
          type: room[0].type,
          profilePicture: room[0].profilePicture,
          myID: viewerID,
          messagesArray: await Promise.all(messagesArray),
          usersArray: _usersArray
        })
      })
    });
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
function roomUserCount(roomId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `userID`, `roomID`, `dateGotAccess` FROM `participants` WHERE `roomID` = ?', [roomId], async (err, chatcount) => {
      if (err) return console.log(err)
      resolve(chatcount.length)
    });
  })
}

function findCommonElement(array1, array2) {
  return new Promise(async function (resolve, reject) {
    const filteredArray = array1.filter(value => array2.includes(value));
    var uniqueIds = [];
    filteredArray.forEach(array => {
      if (!uniqueIds.includes(array)) uniqueIds.push(array)
    })
    let resultObject = {
      exists: false,
      id: null
    };
    for (let i = 0; i < uniqueIds.length; i++) {
      if (await roomUserCount(uniqueIds[i]) == 2) {
        resultObject = {
          exists: true,
          id: uniqueIds[i]
        };
        break;
      }
    }
    resolve(resultObject);
  })
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
        { queryString: 'SELECT COUNT(*) AS count FROM `companies`', queryTerms: [], title: 'Companies', resultVariable: 'count' },
        { queryString: 'SELECT COUNT(*) AS count FROM `admins`', queryTerms: [], title: 'Admins', resultVariable: 'count' },
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
      if (err) reject(err)
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
      resolve({ type: 'negative', message: 'The specified password does not meet the minimum requirements for a secure password' });
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
      resolve({ type: 'negative', message: 'The specified password does not meet the minimum requirements for a secure password' });
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
      if (err) resolve({ type: 'negative', message: 'An error occured while giving the admin access' });
      resolve({ type: 'positive', message: 'Admin Access was givens successfully' })
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

/*
function checkAccess(req, res) {
  if (!req.session.userId || !req.session.email) return res.redirect('/connect')
  var email = req.session.email;
  return db.query('SELECT id, name, surname FROM user WHERE email = ?', [email], async (err, user) => {
    if (err) return console.log(err)
    if (user.length < 1) return console.log("Cannot find the user with email " + email);
    let access = {
      NAdmin: await getAdminAccess(user[0].id),
      SAdmin: await getSuperadminAccess(user[0].id),
      name: user[0].name + ' ' + user[0].surname
    } // SAdmin means super admin, NAdmin means normal admin
    return access
  })
} */


server.listen(port, () => {
  console.log(`listening on Port number ${port}`);
});