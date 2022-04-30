let visibleLabel = document.getElementById('visibleLabel')
let passwordVisible = document.getElementById('passwordVisible')
let password_login = document.getElementById("password_login");
visibleLabel.addEventListener('click', () => {
  visibleLabel.textContent = '';
  if (passwordVisible.checked) {
    let icon = document.createElement('i'); icon.setAttribute('class', 'bx bxs-show');
    let text = document.createElement('p'); text.textContent = 'Show Password';
    visibleLabel.append(icon, text)
    
    password_login.type = 'password'; 
    
  }
  else {
    let icon = document.createElement('i'); icon.setAttribute('class', 'bx bxs-hide');
    let text = document.createElement('p'); text.textContent = 'Hide Password';
    visibleLabel.append(icon, text)

    password_login.type = 'text'
    
  }
  console.log(passwordVisible.checked)
  console.log(visibleLabel.checked)
})

let visibleLabelRegister = document.getElementById('visibleLabelRegister')
let passwordCheckboxRegister = document.getElementById('passwordCheckboxRegister')
let password_loginRegister = document.getElementById("password_login");
visibleLabelRegister.addEventListener('click', () => {
  visibleLabelRegister.textContent = '';
  if (passwordCheckboxRegister.checked) {
    let icon = document.createElement('i'); icon.setAttribute('class', 'bx bxs-show');
    let text = document.createElement('p'); text.textContent = 'Show Password';
    visibleLabelRegister.append(icon, text)
    
    password_loginRegister.type = 'password'; 
    
  }
  else {
    let icon = document.createElement('i'); icon.setAttribute('class', 'bx bxs-hide');
    let text = document.createElement('p'); text.textContent = 'Hide Password';
    visibleLabelRegister.append(icon, text)
    
    password_loginRegister.type = 'text'
    
  }
  console.log(passwordVisible.checked)
  console.log(visibleLabelRegister.checked)
})

//cookie notification
if(localStorage.getItem("cookieConsentIL") != 'given'){
  displayNotification({
    title: { iconClass: 'bx bxs-cookie', titleText: 'Cookie usage consent' },
    body: {
      shortOrImage: { shortOrImagType: 'image', shortOrImagContent: '/images/cookie.jpg' },
      bodyContent: `This website uses cookies to store remember sessions. Cookies are small text files that can be used by websites to make a user's experience more efficient. 
      The law states that we can store cookies on your device upon your consent. 
      This site uses only session cookies which is strictly necessary. In case you don't give consent please do not proceed with login.`
    },
    actions: [
      {
        type: 'confirm', displayText: 'I give consent', actionFunction: () => {
          localStorage.setItem("cookieConsentIL", 'given')
        }
      }
    ],
    obligatoryActions: {
      onHide: () => { localStorage.setItem("cookieConsentIL", 'hidden');},
      onEnd: () => { localStorage.setItem("cookieConsentIL", 'ended');},
    },
    delay: 86400000,
    tone: 'notification'
  })
}


// notifications
function displayNotification(notificationConfig) {
  let { title, body, actions, obligatoryActions, delay, tone } = notificationConfig
  let { iconClass, titleText } = title
  let { shortOrImage, bodyContent } = body
  let { shortOrImagType, shortOrImagContent } = shortOrImage
  let { onEnd, onHide } = obligatoryActions

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
  if (tone == 'notification') { if(notificationTone) {notificationTone = new Audio('/private/audio/imperiumLineNotification.mp3'); notificationTone.play() }}
  if (tone == 'call') {
    notificationTone = new Audio('/private/audio/imperiumLineCall.mp3'); notificationTone.play()
    notificationTone.addEventListener('ended', function () { this.currentTime = 0; this.play(); }, false);
  }
  function notificationStop() { 
    notification.remove(); 
    if(notificationTone) {notificationTone.currentTime = 0; notificationTone.pause(); }
  }

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