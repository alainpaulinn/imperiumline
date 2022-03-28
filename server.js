const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const dotenv = require('dotenv');
const session = require('express-session');
//const { v4: uuidv4 } = require('uuid');
//console.log(uuidv4())
const fs = require('fs')

dotenv.config({ path: './.env' });

const db = require('./db/db.js');
const { connect } = require('tls');

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

let connectedUsers = [];
io.on('connection', (socket) => {
  console.log(socket.request.session.email ? "a user came online and has session opened" : " a user came online and has No session");
  if (socket.request.session.email) {
    var email = socket.request.session.email;
    let id;
    db.query('SELECT id, name, surname FROM user WHERE email = ?', [email], async (err, result) => {
      if (result.length < 1) {
        console.log("Connected user's cookie's email does not exist in the database!! Modified cookie");
        return;
      }

      id = result[0].id;
      let randomPeerId = makeid(25)
      connectedUsers.push({ id: id, email: email, socket: socket, callId: randomPeerId })
      socket.emit('myId', { id: id, name: result[0].name, surname: result[0].surname, callId: randomPeerId });

      db.query('SELECT `id`, `userID`, `roomID`, `dateGotAccess`, room.chatID, room.name, room.type, room.profilePicture, room.creationDate, room.lastActionDate FROM `participants` JOIN room ON room.chatID = participants.roomID WHERE participants.userID = ? ORDER BY `room`.`lastActionDate` DESC', [id], async (err, mychatResults) => {

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
      console.log("Lasttttttttttttttttt Yearr", lastYear)
      nextYear.setFullYear(today.getFullYear() + 1)
      socket.emit('updateCalendar', await getEvents(id, lastYear, nextYear))

    })
    socket.on('requestChatContent', async (chatIdentification) => {
      socket.emit('chatContent', await getChatInfo(chatIdentification, id))
    });
    socket.on('message', async (message) => {
      /* 
      message = 
      {
        toRoom: selectedChatId,
        message: messageContent.innerText.trim(),
        timeStamp: new Date().toISOString(),
        taggedMessages: taggedMessages
      };
      */
      console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMESSAGE", message)
      console.log(message.taggedMessages)
      let roomUsersInfo = await getRoomInfo(message.toRoom, id)
      let expectedUser = roomUsersInfo.users.find(user => user.userID == id)

      if (expectedUser && message.message != "") {
        db.query('INSERT INTO `message`(`message`, `roomID`, `userID`, `timeStamp`) VALUES (?,?,?,?)', [message.message, message.toRoom, id, message.timeStamp], async (err, participantResult) => {
          db.query('UPDATE `room` SET `lastActionDate` = ? WHERE `room`.`chatID` = ?;', [message.timeStamp, message.toRoom], async (err, updateLastAction) => {
            let chatInfo = await getRoomInfo(message.toRoom, id);
            db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id`= ?', [participantResult.insertId], async (err, messageResult) => {

              message.taggedMessages.forEach(taggedMessage => {
                db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [taggedMessage], async (err, referencedMessageResult) => {
                  //console.log(referencedMessageResult)
                  if (referencedMessageResult.length > 0) {
                    if (referencedMessageResult[0].roomID == message.toRoom) {
                      console.log("Valuessssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss", participantResult.insertId, taggedMessage)
                      db.query("INSERT INTO `messagetags`(`id`,`messageId`, `tagMessageId`) VALUES (null,'?','?')", [participantResult.insertId, taggedMessage], async (err, insertedTag) => {
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
      db.query("SELECT `id`, `name`, `surname`, `email`, `profilePicture`, `company_id` FROM `user` WHERE `name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ? LIMIT 15", ['%' + searchPeople + '%', '%' + searchPeople + '%', '%' + searchPeople + '%'], async (err, userSearchResult) => {
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

        socket.emit('searchPerson', listWithoutMe)

      })
    })
    socket.on('makeChat', (makeChat) => {
      if(makeChat == id) return console.log(`user with ID ${id} wanted to create a chat with himself and was dismissed`)
      let memberRooms = [];
      let commonChat = { exists: false, id: null };

      db.query("SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `userID` = ?", [makeChat], async (err, dbChatCheck) => {
        memberRooms = dbChatCheck.map(room => { return room.roomID })
        db.query("SELECT `id`, `userID`, `roomID` FROM `participants` WHERE `userID` = ?", [id], async (err, dbMyChatCheck) => {

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
        if (messageCheck.length > 0 && !err) {
          db.query("SELECT `roomID`  FROM `participants` WHERE `userID`=?", [id], async (err, chatCheck) => {
            if (messageCheck.length > 0 && !err) {
              db.query("SELECT `id`, `icon`, `name`, `description` FROM `reactionoptions` WHERE `name`=?", [reactionIdentifiers.reaction], async (err, reactions) => {
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


    /*
    function makeGroupCall(config){
      console.log("call a group", config)
      
    }
    function makePrivateCall(data){
      console.log("call a person", data)
      let calleeConnections = connectedUsers.filter(connectedUser => {
        return connectedUser.id === data.calleeIdentification.callTo;
      })
      calleeConnections.forEach(calleeConnection => {
        socket.to(calleeConnection.socket.id).emit("incomingCallRequest", {
            caller: id,
            rtcMessage: data.rtcMessage
        });
      })
    }
    */
    /*
     socket.on('requestCall', async data => {
       let { callTo, audio, video, group } = data.calleeIdentification;
       let rtcMessage = data.rtcMessage;
       let callerIdentification = { "caller": await getUserInfo(id), audio, video, group }
 
       console.log("requesting call to: ", callTo, audio, video, group, rtcMessage)
       console.log("callerIdentification: ", await getUserInfo(id), audio, video, group, rtcMessage)
       
       if(group == true){
         makeGroupCall(data)
       }
       if(group == false){
         makePrivateCall(data)
       }
       let calleeConnections = connectedUsers.filter(connectedUser => {
         return connectedUser.id === callTo;
       })
       console.log("calleeConnections", calleeConnections)
       calleeConnections.forEach(calleeConnection => {
         socket.to(calleeConnection.socket.id).emit("incomingCallRequest", {
           callerIdentification: callerIdentification,
           rtcMessage: rtcMessage
         });
       })
     })
     socket.on('ICEcandidate', (datainf) => {
       console.log("ICEcandidateoooooooooooooo", datainf)
       //let otherUser = datainf.calleeIdentification.callTo;
       let rtcMessage = datainf.rtcMessage;
 
 
       //i will later put select only the answered socket instead of all connected sockets on one user 
       let calleeConnections = connectedUsers.filter(connectedUser => {
         return connectedUser.id === datainf.calleeIdentification.callTo;
       })
       calleeConnections.forEach(calleeConnection => {
         socket.to(calleeConnection.socket.id).emit("ICEcandidate", {
           sender: id,
           rtcMessage: rtcMessage
         });
       })
     })
 
     socket.on('answerCall', (data) => {
       let caller = data.caller;
       rtcMessage = data.rtcMessage
 
       socket.to(caller).emit("callAnswered", {
         callee: socket.user,
         rtcMessage: rtcMessage
       })
 
     })*/

    /////////////Call Handling//////////
    /*
    console.log(socket.user, "Connected");
    socket.join(socket.user);

    socket.on('call', (data) => {
        let callee = data.name;
        let rtcMessage = data.rtcMessage;

        socket.to(callee).emit("newCall", {
            caller: socket.user,
            rtcMessage: rtcMessage
        })

    })

    socket.on('answerCall', (data) => {
        let caller = data.caller;
        rtcMessage = data.rtcMessage

        socket.to(caller).emit("callAnswered", {
            callee: socket.user,
            rtcMessage: rtcMessage
        })

    })

    socket.on('ICEcandidate', (data) => {
        let otherUser = data.user;
        let rtcMessage = data.rtcMessage;

        socket.to(otherUser).emit("ICEcandidate", {
            sender: socket.user,
            rtcMessage: rtcMessage
        })
    })
    */
    //////////////////////////////////////

    function initializeCall(callMembersArray) {

    }

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

    socket.on("join-room", async data => {

      let { callTo, audio, video, group, fromChat, previousCallId } = data;
      console.log(data)
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

          let groupMembersToCall_fullInfo = []
          //call from individual call buttons(outside callog and outside chat)
          if (group === false && fromChat === false) {
            let oneToCall = await getUserInfo(callTo)
            //callUniqueId, callId, ParticipantId, initiatorId
            insertCallParticipant(callUniqueId, insertedCallId, callTo, id)
            insertCallParticipant(callUniqueId, insertedCallId, id, id)
            setUserCallStatus(id, callUniqueId, 'onCall')
            socket.join(callUniqueId + '-allAnswered-sockets');
            socket.emit('updateCallLog', await getCallLog(id));

            for (let i = 0; i < connectedUsers.length; i++) {
              console.log("connectedUsers--", connectedUsers[i].id)
              if (connectedUsers[i].id == callTo && connectedUsers[i].id != id) {
                connectedUsers[i].socket.join(callUniqueId + '');
                console.log("--->connectedUser identified", connectedUsers[i].id)
              }
              if (connectedUsers[i].id == callTo) {
                socket.to(connectedUsers[i].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[i].id));
              }
            }
            //send to all other connected users an incoming call
            socket.to(callUniqueId + '').emit('incomingCall', { callUniqueId, groupMembersToCall_fullInfo, caller: await getUserInfo(id) });
            socket.emit('prepareCallingOthers', { callUniqueId, groupMembersToCall_fullInfo, caller: await getUserInfo(id) });
            socket.join(callUniqueId + '');

            return;
          }
          switch (chatPresentation) {
            //call from Chat
            case 0:
              let groupMembersToCall = await getParticipantArray(callTo)

              groupMembersToCall.forEach(callParticipant => {
                insertCallParticipant(callUniqueId, insertedCallId, callParticipant.userID, id)
              })

              //join a room for answered call people
              socket.join(callUniqueId + '-allAnswered-sockets');
              setUserCallStatus(id, callUniqueId, 'onCall')
              socket.emit('updateCallLog', await getCallLog(id));

              for (let i = 0; i < groupMembersToCall.length; i++) {
                console.log("groupMembersToCall", groupMembersToCall[i].userID)

                for (let j = 0; j < connectedUsers.length; j++) {
                  console.log("connectedUsers", connectedUsers[j].id)
                  if (groupMembersToCall[i].userID == connectedUsers[j].id && groupMembersToCall[i].userID != id) { //&& groupMembersToCall[i].userID != id will eliminate my other onnected computers from reciving my call
                    console.log("--->connectedUser identified", connectedUsers[j].id)
                    groupMembersToCall_fullInfo.push({ peerId: connectedUsers[j].callId, userProfileIdentifier: groupMembersToCall[i] })
                    connectedUsers[j].socket.join(callUniqueId + '');
                  }
                  if (groupMembersToCall[i].userID == connectedUsers[j].id) {
                    socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id));
                  }

                }
              }
              //send to all other connected users an incoming call
              socket.to(callUniqueId + '').emit('incomingCall', { callUniqueId, groupMembersToCall_fullInfo, caller: await getUserInfo(id) });
              socket.emit('prepareCallingOthers', { callUniqueId, groupMembersToCall_fullInfo, caller: await getUserInfo(id) });
              socket.join(callUniqueId + '');

              break;

            case 1:
              //call from callogs
              let existingCallParticipants = await getCallParticipants(previousCallId)

              existingCallParticipants.forEach(callParticipant => {
                insertCallParticipant(callUniqueId, insertedCallId, callParticipant.userID, id)
              })

              socket.join(callUniqueId + '-allAnswered-sockets'); //caller join the place for answered members
              setUserCallStatus(id, callUniqueId, 'onCall') //register the caller in the database that he is on call
              socket.emit('updateCallLog', await getCallLog(id)); //update caller's callog

              for (let i = 0; i < existingCallParticipants.length; i++) {
                console.log("groupMembersToCall", existingCallParticipants[i].userID)
                for (let j = 0; j < connectedUsers.length; j++) {
                  console.log("connectedUsers", connectedUsers[j].id)

                  if (existingCallParticipants[i].userID == connectedUsers[j].id && existingCallParticipants[i].userID != id) { //&& existingCallParticipants[i].userID != id will eliminate my other onnected computers from reciving my call
                    console.log("--->connectedUser identified", connectedUsers[j].id)
                    groupMembersToCall_fullInfo.push(
                      {
                        peerId: connectedUsers[j].callId,
                        userProfileIdentifier: existingCallParticipants[i]
                      }
                    )
                    connectedUsers[j].socket.join(callUniqueId + '');
                  }
                  if (existingCallParticipants[i].userID == connectedUsers[j].id) {
                    socket.to(connectedUsers[j].socket.id).emit('updateCallLog', await getCallLog(connectedUsers[j].id)); // update callee callog
                  }
                }
              }
              socket.to(callUniqueId + '').emit('incomingCall', { callUniqueId, groupMembersToCall_fullInfo, caller: await getUserInfo(id) });
              socket.emit('prepareCallingOthers', { callUniqueId, groupMembersToCall_fullInfo, caller: await getUserInfo(id) });
              socket.join(callUniqueId + '');



              break;
            default:
              break;
          }
        })
      console.log("initialting call", data)
    })
    socket.on('answerCall', async data => {
      //{myPeerId, callUniqueId: currentCallInfo.callUniqueId}
      socket.to(data.callUniqueId + '-allAnswered-sockets').emit('user-connected', data.myPeerId);
      setUserCallStatus(id, data.callUniqueId, 'onCall')
      socket.join(data.callUniqueId + '-allAnswered-sockets');
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

    socket.on('leaveCall', async data => {
      //{myPeerId, callUniqueId: currentCallInfo.callUniqueId}
      socket.to(data.callUniqueId + '-allAnswered-sockets').emit('user-disconnected', data.myPeerId);
      setUserCallStatus(id, data.callUniqueId, 'offCall')

      try {
        socket.leave(data.callUniqueId + '-allAnswered-sockets');
      } catch (e) {
        console.log('[error]', 'leave room :', e);
      }

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

    // for testing only
    socket.on('showConnectedUsers', () => {
      console.log(connectedUsers)
    })

    ////////////////Meeting/schedule planning/////////////////
    socket.on('scheduleInviteSearch', inviteId => {

      db.query("SELECT `id`, `name`, `surname`, `email`, `profilePicture`, `company_id` FROM `user` WHERE `name` LIKE ? OR `surname` LIKE ? OR `email` LIKE ? LIMIT 10", ['%' + inviteId + '%', '%' + inviteId + '%', '%' + inviteId + '%'], async (err, userSearchResult) => {
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
        console.log(listWithoutMe)
        socket.emit('scheduleInviteResults', listWithoutMe)

      })
    })
    ///////////New Event/schedule/meeting plan////////////////////////////////
    socket.on('newEventPlan', (newEventCreation) => {
      console.log(newEventCreation)
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

    ///////////////
    socket.on('disconnect', () => {
      console.log('user disconnected');
      let _connectedUsers = connectedUsers.filter(function (user) {
        return user.socket != socket;
      });
      connectedUsers = _connectedUsers;
      console.log("connectedUsers", connectedUsers)
    });
  }
  else {
    var destination = '/connect';
    socket.emit('redirect', destination);
  }

});

function getEvents(userId, initalDate, endDate) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `eventId`, `participantId`, `attending` FROM `eventparticipants` WHERE `participantId` = ?',
      [userId], async (err, _myEvents) => {
        if (err) return console.log(err);
        //if (_myEvents.length < 1) return console.log("no participated events found for this user")
        console.log("my Events", _myEvents)
        //create an object with properties which represent all of the dates between thos intervals
        let eventDates = {};
        let currentDate = initalDate
        //console.log("currentDate", currentDate, initalDate)
        while (currentDate <= endDate) {
          console.log("curr", currentDate)
          eventDates[currentDate.toISOString().slice(0, 10)] = [];
          currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log("Event Dates", eventDates);
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
          console.log("eventdetails", eventdetails)
          if (eventdetails.occurrence == 1) {
            eventDates[eventdetails.oneTimeDate].push(eventdetails)
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
            console.log(checkStartDate, checkEndDate)
            console.log(dayDifference)

            //everyday
            if (eventdetails.recurrenceType == 1) {
              for (let i = 0; i < dayDifference; i++) {
                console.log("day loop running", i)
                let operationDateString = operationDate.toISOString().slice(0, 10)
                if (eventDates[operationDateString]) eventDates[operationDateString].push(eventdetails);
                operationDate.setDate(operationDate.getDate() + 1)
              }
            }

            //everyWeek
            else if (eventdetails.recurrenceType == 2) {

              for (let i = 0; i < dayDifference/7; i++) {
                console.log("week loop running", i)
                let operationDateString = operationDate.toISOString().slice(0, 10)
                if (eventDates[operationDateString]) eventDates[operationDateString].push(eventdetails); console.log("week loop found ->", operationDateString)
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
getEvents(9, new Date("2022-03-15"), new Date("2022-03-23")).then(console.log)

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
  db.query("INSERT INTO `callparticipants`( `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `initiatorId`) VALUES (?,?,?,?,?)  ON DUPLICATE KEY UPDATE `participantId` = ? ",
    [callUniqueId, callId, ParticipantId, 0, initiatorId, ParticipantId], async (err, changeResult) => {
      if (err) return console.log(err)
    })
}

function getCallLog(userId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `callUniqueId`, `callId`, `participantId`, `stillParticipating`, `initiatorId`, `startDate`, `missed` FROM `callparticipants` WHERE `participantId` = ? ORDER BY `startDate` DESC LIMIT 15', [userId], async (err, myCallResults) => {
      let callsArray = myCallResults.map(async call => ({
        ...call,
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

        let unresolvedUsersArr = callParticipants.map(async (participant) => {
          return await getUserInfo(participant.participantId)
        })
        const resolved = await Promise.all(unresolvedUsersArr)
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

        let messageTagsArray = messageTags.map(async messageTag => {
          return await getMessageInfo(messageTag.tagMessageId)
        })
        console.log("Taaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaags", Promise.all(messageTagsArray))
        resolve(Promise.all(messageTagsArray))
      });
  })
}

function getMessageInfo(messageId) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `id` = ?', [messageId], async (err, MessageResult) => {
      if (err || MessageResult.length < 1) return;

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
        participants.forEach(async participant => {
          usersArray.push(await getUserInfo(participant.userID));
        });
        db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `roomID` = ? ORDER BY timeStamp DESC LIMIT 1', [roomID], async (err, messages) => {
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
              //console.log("is a private chat");
              var otherUser = await usersArray.filter(user => { return user.userID !== viewerID })[0];
              avatar = otherUser.profilePicture;
              name = otherUser.name + ' ' + otherUser.surname;
              if (avatar == null) avatar = otherUser.name.charAt(0).toUpperCase() + otherUser.surname.charAt(0).toUpperCase();
              break;
            case 1:
              //console.log("is a group chat");
              avatar = roomProfilePicture;
              if (name == null) name = usersArray.map(user => { return "Group: " + user.name + ' ' + user.surname }).join(', ');
              if (avatar == null) avatar = '/images/profiles/group.jpeg';
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
  if (userID < 1) userID = 1
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `name`, `surname`, `email`, `profilePicture`, `password`, `company_id`, `registration_date` FROM `user` WHERE `id`= ?', [userID], async (err, profiles) => {
      resolve({
        userID: profiles[0].id,
        name: profiles[0].name,
        surname: profiles[0].surname,
        profilePicture: profiles[0].profilePicture
      })
    });
  })
}
function getChatInfo(chatIdentification, viewerID) {
  return new Promise(function (resolve, reject) {
    db.query('SELECT `id`, `message`, `roomID`, `userID`, `timeStamp` FROM `message` WHERE `roomID` = ? ORDER BY timeStamp DESC', [chatIdentification], async (err, messages) => {
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
      let insertedChatId = chatInsert.insertId
      db.query("INSERT INTO `participants`( `userID`, `roomID`) VALUES (?,?)", [me, insertedChatId], async (err, myIdInsert) => {
        let insertedMe = myIdInsert.insertId
        db.query("INSERT INTO `participants`( `userID`, `roomID`) VALUES (?,?)", [other, insertedChatId], async (err, otherIdInsert) => {
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

//createChat(108,128).then(console.log)
//getChatInfo(105,22).then(console.log)
/*console.log(__dirname)
getRoomInfo(106, 128).then(console.log)
getParticipantArray(105).then(console.log)*/
server.listen(port, () => {
  console.log(`listening on Port number ${port}`);
});