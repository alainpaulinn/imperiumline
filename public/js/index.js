//Get data from the chatsFromDataServer
var socket = io();
let displayedScreen = 'chats'
let taggedMessages = [];
let openchat__box__info // the actual element holding all messages
let messageTagsField;
let inputContainer
let selectedChatId;
let selectedReactionId;
let lastMessageInSelectedChat;
let displayedMessages = [];
let friends = [];
let chats = [];
let mySavedID;
let myName, Mysurname;

let deletedUser = { userID: 0, name: 'Deleted', surname: 'User', role: 'Deleted User', profilePicture: null, status: 'offline' }
// to be used in case we have a deleted user

let openChatInfo;
let availableChats = [];
let chatContainer = document.querySelector("#place_for_chats")
let body = document.getElementsByTagName('body')[0]

let openProfileDiv;
let openPopupDiv;
/////////////////////SIDEPANEL SWITCH///////////////////////////
let appWrapper = document.getElementById("appWrapper")
let messages_panel = document.getElementById("messages_panel")
let call_log_panel = document.getElementById("call_log_panel")
let ongoing_call_panel = document.getElementById("ongoing_call_panel")
let time_scheduling_panel = document.getElementById("time-scheduling_panel")
let work_shift_panel = document.getElementById("work_shifts_Panel")

let document_title = document.getElementsByTagName("title")[0]

// messages elements declaration
let open_chat_box = document.querySelector(".c-openchat")

let functionalityOptionsArray = [
  {
    functionalityId: 1,
    panel: messages_panel,
    title: "Messages",
    icon: "bx bxs-message-square-dots",
    subMenu: []
  },
  {
    functionalityId: 2,
    panel: call_log_panel,
    title: "Calls",
    icon: "bx bxs-phone",
    subMenu: []
  },
  {
    functionalityId: 3,
    panel: ongoing_call_panel,
    title: "Ongoing Call",
    icon: "bx bxs-phone-call bx-flashing",
    subMenu: []
  },
  {
    functionalityId: 4,
    panel: time_scheduling_panel,
    title: "Calendar",
    icon: "bx bxs-calendar",
    subMenu: []
  }
];


((serverOptions) => {
  let sidePanelDiv = document.getElementById('c-sidepanel')
  let sidepanelElements = []
  let defaultElements = []
  // construct sidepanel
  let hamburger = createElement({ elementType: 'ul', childrenArray: [createElement({ elementType: 'li' }), createElement({ elementType: 'li' }), createElement({ elementType: 'li' })] })
  let logo = createElement({ elementType: 'div', class: 'c-sidepanel__app-header', childrenArray: [createElement({ elementType: 'div', class: 'c-sidepanel__app-header__hamburger', childrenArray: [hamburger] }), createElement({ elementType: 'h1', textContent: 'Imperium Line' })] })
  sidePanelDiv.prepend(logo)
  hamburger.addEventListener('click', toggleExpandSidePanel)
  function toggleExpandSidePanel() {
    if (hamburger.classList.contains("active")) collapseSidePanel()
    else expandSidepanel()
  }
  function collapseSidePanel() {
    sidePanelDiv.classList.add("expanded");
    hamburger.classList.remove("active");
    for (let i = 0; i < defaultElements.length; i++) {
      defaultElements[i].subMenuDiv.classList.add('undropped-down')
      defaultElements[i].dropIcon.classList.remove('rotate180');
      sidepanelElements[i].subMenuDiv.classList.add('undropped-down')
      sidepanelElements[i].dropIcon.classList.remove('rotate180');
    }
  }
  function expandSidepanel() {
    hamburger.classList.add("active"); sidePanelDiv.classList.remove("expanded");
  }

  // dark theme switch
  let darkModeCheckBox = createElement({ elementType: 'input', type: 'checkbox', id: 'toggle1' })
  darkModeCheckBox.addEventListener('change', (event) => {
    let darkClass = 'dark';
    if (darkModeCheckBox.checked) { body.classList.add(darkClass); alert('darkClass activated'); }
    else { body.classList.remove(darkClass); alert('darkClass deactivated'); }
  })
  let darkmodeActionSwitch = createElement({ elementType: 'div', class: 'switch', childrenArray: [darkModeCheckBox, createElement({ elementType: 'label', for: 'toggle1' })] })

  // silence audio switch
  let silenceCheckBox = createElement({ elementType: 'input', type: 'checkbox', id: 'toggle2' })
  silenceCheckBox.addEventListener('change', (event) => {
    if (silenceCheckBox.checked) alert('notifications Ring deactivated');
    else alert('notifications Ring activated');
  })
  let silenceActionSwitch = createElement({ elementType: 'div', class: 'switch', childrenArray: [silenceCheckBox, createElement({ elementType: 'label', for: 'toggle2' })] })

  // choose Audio/video output
  let cameraLabel = createElement({ elementType: 'p', textContent: "Cameras: " })
  let videoInputSelection = createElement({ elementType: 'div' })
  let microphoneLabel = createElement({ elementType: 'p', textContent: "Microphone: " })
  let audioInputSelection = createElement({ elementType: 'div' })
  let speakerLabel = createElement({ elementType: 'p', textContent: "Speaker: " })
  let audioOutputSelection = createElement({ elementType: 'div' })
  let importantInfo = createElement({ elementType: 'div', textContent: "*Media access Permissions is required" })

  let availableDevices = { videoInput: [], audioInput: [], audioOutput: [] }
  let chosenDevices = { videoInput: null, audioInput: null, audioOutput: null }
  if (localStorage.getItem("chosenDevices") != null) chosenDevices = JSON.parse(localStorage.getItem("chosenDevices"))
  function savePreferedDevices() {
    localStorage.setItem('chosenDevices', JSON.stringify(chosenDevices));
    console.log('chosenDevices', JSON.parse(localStorage.getItem('chosenDevices')));
  }
  navigator.mediaDevices.enumerateDevices().then(devices => {
    console.log(devices)
    devices.forEach(device => {
      if (device.kind == 'videoinput') { availableDevices.videoInput.push(device) }
      if (device.kind == 'audioinput') { availableDevices.audioInput.push(device) }
      if (device.kind == 'audiooutput') { availableDevices.audioOutput.push(device) }
    });
    function chooseSelection(deviceType) {
      let foundDevice
      switch (deviceType) {
        case 'videoinput':
          // choose which videoinput to use
          let videoInputDeviceChoice1 = chosenDevices.videoInput;
          let videoInputDeviceChoice2 = availableDevices.videoInput.find(device => { return device.deviceId.toLowerCase().includes('default') })
          let videoInputDeviceChoice3 = availableDevices.videoInput[0]
          foundDevice = findNonNullNonUndefined([videoInputDeviceChoice1, videoInputDeviceChoice2, videoInputDeviceChoice3]);
          break;
        case 'audioinput':
          // choose which audioinput to use
          let audioInputDeviceChoice1 = chosenDevices.audioInput;
          let audioInputDeviceChoice2 = availableDevices.audioInput.find(device => { return device.deviceId.toLowerCase().includes('default') })
          let audioInputDeviceChoice3 = availableDevices.audioInput[0]
          foundDevice = findNonNullNonUndefined([audioInputDeviceChoice1, audioInputDeviceChoice2, audioInputDeviceChoice3]);
          break;
        case 'audiooutput':
          // choose which audioOutput to use
          let audioOutputDeviceChoice1 = chosenDevices.audioOutput;
          let audioOutputDeviceChoice2 = availableDevices.audioOutput.find(device => { return device.deviceId.toLowerCase().includes('default') })
          let audioOutputDeviceChoice3 = availableDevices.audioOutput[0]
          foundDevice = findNonNullNonUndefined([audioOutputDeviceChoice1, audioOutputDeviceChoice2, audioOutputDeviceChoice3]);
          break;
      }
      if (foundDevice == null) foundDevice = { id: null, name: null, deviceId: null, groupId: null, kind: null, label: null }
      return foundDevice;
    }

    console.log('chooseSelection(videoinput)', chooseSelection('videoinput'))
    console.log('chooseSelection(audioinput)', chooseSelection('audioinput'))
    console.log('chooseSelection(audiooutput)', chooseSelection('audiooutput'))

    let availableVideoInputOptions = addIndexAndLabelAsName(availableDevices.videoInput)
    goodselect(videoInputSelection, {
      availableOptions: availableVideoInputOptions,
      placeHolder: "Select Camera",
      selectorWidth: "300px",
      marginRight: '0rem',
      selectedOptionId: availableVideoInputOptions.findIndex(device => device.deviceId == chooseSelection('videoinput').deviceId),
      onOptionChange: (option) => {
        chosenDevices.videoInput = option
        savePreferedDevices()
      }
    })
    let availableAudioInputOptions = addIndexAndLabelAsName(availableDevices.audioInput)
    goodselect(audioInputSelection, {
      availableOptions: availableAudioInputOptions,
      placeHolder: "Select Microphone",
      selectorWidth: "300px",
      marginRight: '0rem',
      selectedOptionId: availableAudioInputOptions.findIndex(device => device.deviceId == chooseSelection('audioinput').deviceId),
      onOptionChange: (option) => {
        chosenDevices.audioInput = option
        savePreferedDevices()
      }
    })

    let availableAudioOutputOptions = addIndexAndLabelAsName(availableDevices.audioOutput)
    goodselect(audioOutputSelection, {
      availableOptions: availableAudioOutputOptions,
      placeHolder: "Select Speaker",
      selectorWidth: "300px",
      marginRight: '0rem',
      selectedOptionId: availableAudioOutputOptions.findIndex(device => device.deviceId == chooseSelection('audiooutput').deviceId),
      onOptionChange: (option) => {
        chosenDevices.audioOutput = option
        savePreferedDevices()
      }
    })
  });
  let audioVideoInOutBtn = createElement({
    elementType: 'button', class: 'importantButton', textContent: 'Choose', onclick: () => {
      let devicePopForm = createInScreenPopup({
        icon: 'bx bx-devices',
        title: "Choose Media Devices",
        contentElementsArray: [cameraLabel, videoInputSelection, microphoneLabel, audioInputSelection, speakerLabel, audioOutputSelection, importantInfo],
        actions: [{ element: createElement({ elementType: 'button', textContent: 'Done' }), functionCall: () => { console.log("Done") } }]
      })
    }
  })
  // logout form
  let logoutForm = createElement({ elementType: 'form', action: "/auth/logout", method: "post", childrenArray: [createElement({ elementType: 'input', type: 'text', name: 'logout', hidden: "true" })] })
  let logoutButton = createElement({ elementType: 'button', class: 'importantButton', textContent: 'Logout', onclick: () => { logoutForm.submit(); } })
  // edit profile form
  let editProfileButton = createElement({ elementType: 'button', class: 'importantButton', textContent: 'Edit' })
  let defaultOptions = [
    {
      title: "Preferences",
      icon: "bx bx-slider-alt",
      subMenu: [
        {
          text: "Dark mode",
          icon: "bx bxs-moon",
          actions: [
            { element: darkmodeActionSwitch }
          ]
        },
        {
          text: "Silent notifications",
          icon: "bx bxs-bell-off",
          actions: [{ element: silenceActionSwitch }]
        },
        {
          text: "Audio/Video input",
          icon: "bx bxs-video-recording",
          actions: [{ element: audioVideoInOutBtn }]
        },
      ]
    },
    {
      title: "Profile",
      icon: "bx bxs-user-circle",
      subMenu: [
        {
          text: "Quit the app",
          icon: "bx bx-log-out-circle",
          actions: [{ element: logoutButton }, { element: logoutForm }]
        },
        {
          text: "Edit profile",
          icon: "bx bxs-user-detail",
          actions: [{ element: editProfileButton }]
        },
      ]
    },
  ];

  const showSection = index => () => {
    for (let i = 0; i < sidepanelElements.length; i++) {
      if (sidepanelElements[i].index != index) {
        sidepanelElements[i].panel.style.display = "none";
        sidepanelElements[i].subMenuDiv.classList.add('undropped-down')
        sidepanelElements[i].dropIcon.classList.remove('rotate180');
      }
      else {
        if (sidepanelElements[i].redirect) return window.location.replace(sidepanelElements[i].redirect);

        sidepanelElements[i].panel.style.display = "flex";
        sidepanelElements[i].subMenuDiv.classList.remove('undropped-down')
        sidepanelElements[i].dropIcon.classList.add('rotate180');
        document_title.innerText = sidepanelElements[i].title;
        console.log(sidepanelElements[i])
      }
    }
  }

  const showDefSection = index => () => {
    for (let i = 0; i < defaultElements.length; i++) {
      if (defaultElements[i].index != index) {
        if (defaultElements[i].panel) defaultElements[i].panel.style.display = "none";
        defaultElements[i].subMenuDiv.classList.add('undropped-down')
        defaultElements[i].dropIcon.classList.remove('rotate180');
      }
      else {
        document_title.innerText = defaultElements[i].title;
        if (defaultElements[i].panel) { defaultElements[i].panel.style.display = "flex"; }
        if (defaultElements[i].subMenuDiv.classList.contains('undropped-down') == true) {
          defaultElements[i].subMenuDiv.classList.add('undropped-down');
          defaultElements[i].dropIcon.classList.remove('rotate180');
        } else {
          defaultElements[i].subMenuDiv.classList.remove('undropped-down');
          defaultElements[i].dropIcon.classList.add('rotate180');
        }
      }
    }
  }

  sidepanelElements = serverOptions.map((option, o) => {
    let { functionalityId, panel, title, icon, subMenu } = option
    let builtOption = createSidePanelElement(title, icon, subMenu)
    sidePanelDiv.append(builtOption.optionContainer)
    builtOption.triggerButton.addEventListener("click", showSection(o))
    return {
      index: o,
      panel: panel,
      title: title,
      triggerButton: builtOption.triggerButton,
      subMenuDiv: builtOption.subMenuDiv,
      dropIcon: builtOption.dropIcon,
      optionContainer: builtOption.optionContainer
    }
  });

  let spacer = createElement({ elementType: 'nav', class: 'c-sidepanel__nav c-sidepanel__nav--spacer c-friends' })
  sidePanelDiv.append(spacer)

  defaultElements = defaultOptions.map((option, o) => {
    let { panel, title, icon, subMenu } = option;
    let builtOption = createSidePanelElement(title, icon, subMenu)
    sidePanelDiv.append(builtOption.optionContainer)
    builtOption.triggerButton.addEventListener("click", showDefSection(o))
    return {
      index: o,
      panel: panel ? panel : null,
      title: title,
      triggerButton: builtOption.triggerButton,
      subMenuDiv: builtOption.subMenuDiv,
      dropIcon: builtOption.dropIcon,
      optionContainer: builtOption.optionContainer
    }
  });

  function createSidePanelElement(title, icon, subMenu) {
    let iconElement = createElement({ elementType: 'i', class: icon })
    let textElement = createElement({ elementType: 'p', textContent: title })
    let dropIcon = createElement({ elementType: 'i', class: 'bx bx-chevron-down' })
    let dropElement = createElement({ elementType: 'button', childrenArray: [dropIcon] })

    let subMenuDiv = createElement({ elementType: 'ul', class: 'droppable undropped-down' })
    for (let i = 0; i < subMenu.length; i++) {
      const subMenuElement = subMenu[i];
      let submenuText = createElement({ elementType: 'p', textContent: subMenuElement.text })
      let subMenuIcon = createElement({ elementType: 'i', class: subMenuElement.icon })
      let submenuLink = createElement({ elementType: 'a', class: 'c-sidepanel__nav__link', childrenArray: [subMenuIcon, submenuText] })
      subMenuElement.actions.forEach(action => { submenuLink.append(action.element); })
      let listitems = createElement({ elementType: 'li', class: 'c-sidepanel__nav__li left-spacer', childrenArray: [submenuLink] })
      subMenuDiv.append(listitems)
    }

    dropElement.addEventListener('click', () => {
      dropIcon.classList.toggle('rotate180')
      subMenuDiv.classList.toggle('undropped-down')
      console.log(dropElement, 'dropElement')
    })
    let childrenArray = [iconElement, textElement]
    if (subMenu.length > 0) { childrenArray.push(dropElement) }

    let triggerButton = createElement({ elementType: 'div', class: 'c-sidepanel__nav__link remove-rightpadding', childrenArray: childrenArray })
    let optionListitem = createElement({ elementType: 'div', class: 'c-sidepanel__nav__li', childrenArray: [triggerButton, subMenuDiv] })
    let optionContainer = createElement({ elementType: 'nav', class: 'c-sidepanel__nav c-sidepanel__nav--spacer', childrenArray: [optionListitem] })

    if (subMenu.length < 1) triggerButton.addEventListener('click', collapseSidePanel)
    return {
      optionContainer: optionContainer,
      triggerButton: triggerButton,
      subMenuDiv: subMenuDiv,
      dropIcon: dropIcon
    }
  };
  // fillMessagesPanel;
  // createMessagesPanelElements();
  // callPanel Responsiveness functions
  let call_log_contact_search_panel = document.getElementById('call_log_contact_search_panel');
  let callHistoryPage = document.getElementById("callHistoryPage")
  let callDetailsPanel = document.getElementById('callDetails-section')
  function showCallContactSearchSection() {
    call_log_contact_search_panel.classList.remove('mobileHiddenElement')
    callHistoryPage.classList.add('mobileHiddenElement')
    callDetailsPanel.classList.add('mobileHiddenElement')
  }
  function showCallListSection() {
    call_log_contact_search_panel.classList.add('mobileHiddenElement')
    callHistoryPage.classList.remove('mobileHiddenElement')
    callDetailsPanel.classList.add('mobileHiddenElement')
  }
  function showCallDetailsSection() {
    call_log_contact_search_panel.classList.add('mobileHiddenElement')
    callHistoryPage.classList.add('mobileHiddenElement')
    callDetailsPanel.classList.remove('mobileHiddenElement')
  }

  // call-log-section ------ createCallLogContactSearch
  (() => {

    call_log_contact_search_panel.textContent = '';
    let input = createElement({ elementType: 'input', type: 'text', placeholder: 'Search contacts' })
    let mobileButton = createElement({
      elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-history' })], onclick: showCallListSection
    })
    let header = createElement({
      elementType: 'div', class: 'c-chats__header', childrenArray: [
        createElement({
          elementType: 'div', class: 'chatSearch displayed', childrenArray: [
            createElement({ elementType: 'label', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-search-alt-2' })] }), input]
        }),
        mobileButton
      ]
    })
    input.addEventListener('input', () => { if (input.value != '') { socket.emit('callLogContactSearch', input.value); } })
    let searchResultsDiv = createElement({ elementType: 'div', class: 'searchResultsDiv', textContent: 'Type in the search box above to find any contacts to call' })
    call_log_contact_search_panel.append(header, searchResultsDiv)
    socket.on('callLogContactSearch', searchPeople => {
      console.log(searchPeople)
      if (searchPeople.length == 0) { return searchResultsDiv.textContent = 'No user found.' }
      searchResultsDiv.textContent = ''
      searchPeople.forEach((searchPerson) => {
        let searchPersonElement;
        let audioButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
        let videoButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })] })
        let actions = [
          { element: audioButton, functionCall: () => { call(searchPerson.userID, true, false, false, false, null); showCallListSection(); } },
          { element: videoButton, functionCall: () => { call(searchPerson.userID, true, true, false, false, null); showCallListSection(); } },
        ];
        searchPersonElement = userForAttendanceList(searchPerson, actions)
        searchResultsDiv.append(searchPersonElement)
      })
    })
  })();

  (() => {
    //------------------------ Call Details - 

    callDetailsPanel.textContent = ''

    //-----------------------

    callHistoryPage.textContent = ''
    let callHistoryArray = []

    let searchButton = createElement({
      elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-contact' })], onclick: showCallContactSearchSection
    })
    let incominPill = createElement({ elementType: 'div', class: 'pill', childrenArray: [createElement({ elementType: 'div', class: 'pill-icon', childrenArray: [createElement({ elementType: 'div', class: 'circle' })] }), createElement({ elementType: 'div', class: 'pill-label blue', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-incoming' }), createElement({ elementType: 'p', textContent: 'In' })] })] });
    let outgoingPill = createElement({ elementType: 'div', class: 'pill', childrenArray: [createElement({ elementType: 'div', class: 'pill-icon', childrenArray: [createElement({ elementType: 'div', class: 'circle' })] }), createElement({ elementType: 'div', class: 'pill-label blue', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-incoming' }), createElement({ elementType: 'p', textContent: 'Out' })] })] });
    let missedPill = createElement({ elementType: 'div', class: 'pill', childrenArray: [createElement({ elementType: 'div', class: 'pill-icon', childrenArray: [createElement({ elementType: 'div', class: 'circle' })] }), createElement({ elementType: 'div', class: 'pill-label blue', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-incoming' }), createElement({ elementType: 'p', textContent: 'Missed' })] })] });
    let header = createElement({ elementType: 'div', class: 'header', childrenArray: [createElement({ elementType: 'div', class: 'pillsContainer', childrenArray: [searchButton, incominPill, outgoingPill, missedPill] })] })

    let section_header = createElement({ elementType: 'div', class: 'section-header', childrenArray: [createElement({ elementType: 'h1', textContent: 'Calls' })] })
    let list_call_section_content = createElement({ elementType: 'div', class: 'list-call-section-content' })
    let callHistoryPageBody = createElement({ elementType: 'div', class: 'callHistoryPageBody', childrenArray: [createElement({ elementType: 'div', class: 'list-call-section', childrenArray: [section_header, list_call_section_content] })] })

    callHistoryPage.append(header, callHistoryPageBody)
    socket.on('updateCallLog', (calls) => {
      console.log('updateCallLog', calls)
      list_call_section_content.textContent = ''
      calls.forEach(logUpdate => {
        let callogClass = "";
        let callDirection;
        if (logUpdate.participantsOnCall.length > 0) callogClass = "ongoing";
        let profilePicture;
        if (logUpdate.initiator.profilePicture == null) profilePicture = createElement({ elementType: 'div', textContent: logUpdate.initiator.name.charAt(0) + logUpdate.initiator.surname.charAt(0) })
        else profilePicture = createElement({ elementType: 'img', src: logUpdate.initiator.profilePicture })

        if (logUpdate.missed == 1) {
          callDirection = createElement({ elementType: 'div', class: 'callType red', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' }), createElement({ elementType: 'p', textContent: 'Missed' })] })
        }
        else if (logUpdate.participantId == logUpdate.initiatorId) {
          callDirection = createElement({ elementType: 'div', class: 'callType green', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-outgoing' }), createElement({ elementType: 'p', textContent: 'Out' })] })
        }
        else {
          callDirection = createElement({ elementType: 'div', class: 'callType blue', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-incoming' }), createElement({ elementType: 'p', textContent: 'In' })] })
        }

        let audioAgainButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })], onclick: () => { call(logUpdate.callUniqueId, true, false, true, false, logUpdate.callUniqueId) } })
        let videoAgainButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })], onclick: () => { call(logUpdate.callUniqueId, true, true, true, false, logUpdate.callUniqueId) } })

        let moreButton = createElement({
          elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-right' })], onclick: () => {
            callDetailsPanel.textContent = ''
            let callDirectionIcon;
            if (logUpdate.missed == 1) { callDirectionIcon = createElement({ elementType: 'i', class: 'bx bxs-phone-off' }) }
            else if (logUpdate.participantId == logUpdate.initiatorId) { callDirectionIcon = createElement({ elementType: 'i', class: 'bx bxs-phone-outgoing' }) }
            else { callDirectionIcon = createElement({ elementType: 'i', class: 'bx bxs-phone-incoming' }) }

            let mobileButton = createElement({
              elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-history' })], onclick: showCallListSection
            })
            let detailsPanel_header = createElement({
              elementType: 'div', class: 'section-header', childrenArray: [
                mobileButton,
                createElement({ elementType: 'h1', textContent: 'Call details' })
              ]
            })
            let topDetailsCard = createElement({ elementType: 'div', class: 'topDetailsCard', childrenArray: [createElement({ elementType: 'div', class: 'circle', childrenArray: [callDirectionIcon] })] })
            let callTitleContent = createElement({
              elementType: 'div', class: 'callTitleContent', childrenArray: [
                createElement({ elementType: 'h1', textContent: logUpdate.callTitle })]
            })
            let drop_button = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-right' })] })
            let allPartifipantDiv = createElement({
              elementType: 'div', class: 'allPartifipantDiv', childrenArray: [
                createElement({ elementType: 'div', class: 'header', childrenArray: [createElement({ elementType: 'h1', textContent: 'Participants' }), drop_button] })
              ]
            })
            let callParticipantsDiv = createElement({ elementType: 'div', class: 'callParticipants' })
            let details_section_content = createElement({ elementType: 'div', class: 'details-section-content', childrenArray: [topDetailsCard, callTitleContent, allPartifipantDiv, callParticipantsDiv] })
            callDetailsPanel.append(detailsPanel_header, details_section_content)
            logUpdate.participantsOnCall.forEach(participant => {
              let participantElement;
              let audioButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let videoButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })] })
              let actions = [
                { element: audioButton, functionCall: () => { call(participant.userID, true, false, false, false, null); showCallListSection(); } },
                { element: videoButton, functionCall: () => { call(participant.userID, true, true, false, false, null); showCallListSection(); } },
              ];

              if (participant.userID == mySavedID) actions = []
              participantElement = userForAttendanceList(participant, actions)
              callParticipantsDiv.append(participantElement)
            })
            logUpdate.participantsOffCall.forEach(participant => {
              let participantElement;
              let audioButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let videoButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })] })
              let actions = [
                { element: audioButton, functionCall: () => { call(participant.userID, true, false, false, false, null); showCallListSection(); } },
                { element: videoButton, functionCall: () => { call(participant.userID, true, true, false, false, null); showCallListSection(); } },
              ];

              if (participant.userID == mySavedID) actions = []
              participantElement = userForAttendanceList(participant, actions)
              callParticipantsDiv.append(participantElement)
            })
            showCallDetailsSection();
          }
        })

        let call_log = createElement({
          elementType: 'div', class: 'call-log ' + callogClass, childrenArray: [
            createElement({
              elementType: 'div', class: 'line1', childrenArray: [
                createElement({ elementType: 'div', class: 'picture', childrenArray: [profilePicture] }),
                createElement({
                  elementType: 'div', class: 'nameAndType', childrenArray: [
                    createElement({ elementType: 'div', class: 'callMembers', textContent: logUpdate.initiator.name + ' ' + logUpdate.initiator.surname }),
                    callDirection
                  ]
                }),
                createElement({ elementType: 'div', class: 'dateTime', textContent: new Date(logUpdate.startDate).toString('YYYY-MM-dd').substring(0, 24) }),
                createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: [audioAgainButton, videoAgainButton, moreButton] })
              ]
            })
          ]
        })
        list_call_section_content.append(call_log)
      })
    })
    $(".pill").click(function () { $(this).toggleClass("selectedPill"); });
  })()
  // initial important events to listen to
  socket.on('redirect', function (destination) {
    window.location.href = destination;
  });
  socket.on('feedback', function (feedback) {
    if (feedback.type == 'negative') console.log('feedback', feedback)
    if (feedback.type == 'positie') console.log('feedback', feedback)
  })
  socket.on('myId', function (myInformation) {
    console.log('myId :', myInformation);
    let { userInfo, adminShip } = myInformation;
    let { superAdmin, admin } = adminShip;

    // mySavedInfo = userInfo
    mySavedID = userInfo.userID;
    myName = userInfo.name;
    Mysurname = userInfo.surname;
    editProfileButton.addEventListener('click', function () { createProfilePopup(userInfo, true) })

    if (superAdmin.isSuperAdmin == true || admin.isAdmin == true) {
      let adminPanel = createElement({ elementType: 'section', class: 'c-time-admin_panel' })
      let adminOption = {
        functionalityId: 5,
        panel: adminPanel,
        redirect: "/action",
        title: "Admin",
        icon: "bx bx-shield-quarter",
        subMenu: []
      }

      let { functionalityId, panel, title, icon, subMenu } = adminOption
      let builtOption = createAdminpanel(title, icon, subMenu, superAdmin, admin)
      sidepanelElements[sidepanelElements.length - 1].optionContainer.after(builtOption.optionContainer)
      builtOption.triggerButton.addEventListener("click", showSection(functionalityId - 1))
      sidepanelElements.push({
        index: functionalityId - 1,
        panel: panel,
        title: title,
        triggerButton: builtOption.triggerButton,
        subMenuDiv: builtOption.subMenuDiv,
        dropIcon: builtOption.dropIcon,
        optionContainer: builtOption.optionContainer
      })

      function createAdminpanel(title, icon, subMenu, superAdmin, admin) {
        let { isAdmin, administeredCompaniesInfo } = admin
        let { isSuperAdmin } = superAdmin
        appWrapper.append(adminPanel)

        let responsibilitiesContainer = createElement({ elementType: 'div', class: 'responsibilitiesContainer' })
        let responsibilitiesPanel = createElement({ elementType: 'div', class: 'left-responsibilities', childrenArray: [createElement({ elementType: 'div', class: 'responsibilitiesHeader', textContent: 'Admin Panel' }), responsibilitiesContainer] })
        let contentPanel = createElement({
          elementType: 'div', class: 'central-Options mobileHiddenElement', childrenArray: [
            createElement({
              elementType: 'div', class: 'adminWelcomeDiv', childrenArray: [
                createElement({ elementType: 'img', class: 'adminWelcomeImage', src: 'images/adminKeys.png' }),
                createElement({ elementType: 'p', textContent: 'Click on the menu to choose Groups to manage. Please remember that this Admin panel should only be opened in a safe place with full privacy' })
              ]
            })
          ]
        })
        function showResponsibilitiesPanel() {
          responsibilitiesPanel.classList.remove('mobileHiddenElement')
          contentPanel.classList.add('mobileHiddenElement')
        }
        function showControlPanel() {
          responsibilitiesPanel.classList.add('mobileHiddenElement')
          contentPanel.classList.remove('mobileHiddenElement')
        }
        if (isSuperAdmin === true) {
          let savedCompanies;
          let savedAdmins;
          let savedSuperAdmins;

          let superAdminButton = createElement({ elementType: 'button', class: 'responsibilityOptionButton', textContent: 'Application Administration' })

          // --------------CONTROL ELEMENTS
          let managementDivBodyStored // store the di in order to update it in case of a change
          let managementDiv = createElement({
            elementType: 'div', class: 'managementDiv', childrenArray: [
              createElement({ elementType: 'div', class: 'managementDivTemporary', textContent: "Select any of the above clickable options to manage" })
            ]
          })

          // early define the numbers Div
          let numbersDiv = createElement({ elementType: 'div', class: 'numbersDiv', childrenArray: [createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })] })

          let companyProfilePic = createElement({ elementType: 'img', class: 'companyProfilePic', src: 'favicon.ico' })
          let backButton = createElement({
            elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-left' })], onclick: showResponsibilitiesPanel
          })
          let companyName = createElement({ elementType: 'div', class: 'companyName', textContent: 'Imperium Line' })
          let companyDescription = createElement({ elementType: 'div', class: 'companyDescription', textContent: 'Imperium Line application main administration' })
          let companyNameDescription = createElement({ elementType: 'div', class: 'companyNameDescription', childrenArray: [companyName, companyDescription] })
          let companyInfoDiv = createElement({ elementType: 'div', class: 'companyInfoDiv', childrenArray: [backButton, companyProfilePic, companyNameDescription] })
          let Header = createElement({ elementType: 'div', class: 'centralHeader', childrenArray: [companyInfoDiv] })
          let adminPanelMainContent = createElement({ elementType: 'div', class: 'adminPanelMainContent', childrenArray: [numbersDiv, managementDiv] })

          // listen for superAdmin numbers
          socket.on('superAdminNumbers', numbersArray => {
            console.log('superAdminNumbers', numbersArray)
            numbersDiv.textContent = '';
            numbersArray.map(number => {
              let manageButton = createElement({ elementType: 'div', class: 'manageButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-cog' })] })
              let valueDiv = createElement({ elementType: 'div', class: 'valueDiv ', textContent: number.value + '' })
              let titleDiv = createElement({ elementType: 'div', class: 'titleDiv', textContent: number.title + '' })
              let childrenArray = [valueDiv, titleDiv]

              if (number.title == 'Companies') {
                childrenArray.push(manageButton)
                valueDiv.classList.add('editable')
                manageButton.addEventListener('click', () => {
                  socket.emit('superManageCompanies')
                  managementDiv.textContent = '';
                  managementDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                })

              }
              if (number.title == 'Primary Admins') {
                childrenArray.push(manageButton)
                valueDiv.classList.add('editable')
                manageButton.addEventListener('click', () => {
                  socket.emit('superManageAdmins')
                  managementDiv.textContent = '';
                  managementDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                })
              }
              if (number.title == 'Super Admins') {
                childrenArray.push(manageButton)
                valueDiv.classList.add('editable')
                manageButton.addEventListener('click', () => {
                  socket.emit('superManageSuperAdmins')
                  managementDiv.textContent = '';
                  managementDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                })
              }

              let numberOption = createElement({ elementType: 'div', class: 'numberOption', childrenArray: childrenArray })
              numbersDiv.append(numberOption)
            })
            socket.emit('superAdminPrepareCompanies') // in order to update the positions Array for future use
            socket.emit('superAdminPrepareAdmins') // in order to update the users Array for future use
            socket.emit('superAdminPrepareSuperAdmins') // in order to update the admins Array for future use
          })
          superAdminButton.addEventListener('click', () => {
            contentPanel.textContent = ''
            contentPanel.append(Header, adminPanelMainContent)
            numbersDiv.textContent = ''
            numbersDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
            socket.emit('requestSuperAdminNumbers')
            showControlPanel();
          })
          function SuperAdmin_createCompaniesMgtBodyElement(companies) {
            contentElements = companies.map((company) => {
              let editButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-edit-alt' })] })
              let deleteButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-trash-alt' })] })
              let actions = [
                {
                  element: editButton, functionCall: () => {
                    // -------------------- Editing Company - on popup;
                    let companyNameLabel = createElement({ elementType: 'label', for: 'companyName' + 'chooseNew', textContent: 'Company name' })
                    let companyNameInput = createElement({ elementType: 'input', id: 'companyName' + 'chooseNew', placeHolder: 'Company name', value: company.name })
                    let companyNameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [companyNameLabel, companyNameInput] })

                    let companyDescriptionLabel = createElement({ elementType: 'label', for: 'companyDescription' + 'chooseNew', textContent: 'Company description' })
                    let companyDescriptionInput = createElement({ elementType: 'input', id: 'companyDescription' + 'chooseNew', placeHolder: 'Company description', value: company.description })
                    let companyDescriptionBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [companyDescriptionLabel, companyDescriptionInput] })

                    let icon = 'bx bxs-user-detail'
                    let title = 'Edit User Information'
                    let contentElementsArray = [companyNameBlock, companyDescriptionBlock]
                    let savebutton = createElement({ elementType: 'button', textContent: 'Save' })
                    let actions = [{
                      element: savebutton, functionCall: () => {
                        socket.emit('superManageEditCompanies', { companyId: company.id, companyName: companyNameInput.value, description: companyDescriptionInput.value })
                        console.log({ companyId: company.id, companyName: companyNameInput.value, description: companyDescriptionInput.value })
                      }
                    }]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      savebutton.addEventListener('click', editPopup.closePopup)
                    })
                  }
                },
                {
                  element: deleteButton, functionCall: () => {
                    // -------------------- Deleting user - on popup;
                    let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Are you sure you want to delete:' })
                    let userBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [companyForList(company, [])] })
                    let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that all related Users, positions, calls, events, and messages will be deleted.' })

                    let icon = 'bx bxs-trash-alt'
                    let title = 'Delete Company confirmation'
                    let contentElementsArray = [question, userBlock, emphasis]
                    let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                    let deleteButton = createElement({ elementType: 'button', textContent: 'Yes, Delete' })
                    let actions = [
                      { element: cancelButton, functionCall: () => { } },
                      {
                        element: deleteButton, functionCall: () => {
                          socket.emit('superManageDeleteCompanies', { companyId: company.id })
                        }
                      }
                    ]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      cancelButton.addEventListener('click', editPopup.closePopup);
                      deleteButton.addEventListener('click', editPopup.closePopup);
                    })
                  }
                }
              ]
              return companyForList(company, actions)
            })
            return contentElements
          }
          function SuperAdmin_createAdminMgtBodyElements(admins) {

            contentElements = admins.map((adminObject) => {
              let { admin, done, done_by, company } = adminObject;
              console.log(admin, done, done_by, adminObject)
              // -- for Admin
              let messageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let callButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let revokeAdminAccessButton = createElement({ elementType: 'button', textContent: 'Remove' })
              let actions
              if (admin.userID == mySavedID) actions = []
              else actions = [
                { element: messageButton, functionCall: () => { initiateChat(admin.userID) } },
                // { element: callButton, functionCall: () => { call(admin.userID, true, false, false, false, null) } },
                {
                  element: revokeAdminAccessButton, functionCall: () => {
                    // -------------------- Deleting user - on popup;
                    let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Are you sure you want to revoke admin access adn delete user for:' })
                    let userBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [userForAttendanceList(admin, [])] })
                    let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that the admin account will be deleted. Do this only when authorized to.' })

                    let icon = 'bx bxs-trash-alt'
                    let title = 'Revokation of Admin Access'
                    let contentElementsArray = [question, userBlock, emphasis]
                    let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                    let revokeButton = createElement({ elementType: 'button', textContent: 'Yes, Revoke' })
                    let actions = [
                      { element: cancelButton, functionCall: () => { } },
                      {
                        element: revokeButton, functionCall: () => {
                          socket.emit('revokePrimaryAdminAccess', { adminToDelete: admin.userID })
                        }
                      }
                    ]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      cancelButton.addEventListener('click', editPopup.closePopup);
                      revokeButton.addEventListener('click', editPopup.closePopup);
                    })
                  }
                }
              ]
              // --- for DoneBy
              let DoneByMessageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let DoneByCallButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let DoneByActions
              if (done_by.userID == mySavedID) DoneByActions = []
              else DoneByActions = [
                { element: DoneByMessageButton, functionCall: () => { initiateChat(done_by.userID) } },
                { element: DoneByCallButton, functionCall: () => { call(done_by.userID, true, false, false, false, null) } }
              ]

              let delegatedByDiv = createElement({
                elementType: 'div', class: 'delegatedByDiv', childrenArray: [
                  createElement({ elementType: 'div', class: 'delegatedByLabel', textContent: 'Delegated by:' }),
                  userForAttendanceList(done_by, DoneByActions),
                  createElement({ elementType: 'div', class: 'delegatedByLabel', textContent: 'On: ' + done }),
                ]
              })
              let userCompanyDiv = createElement({
                elementType: 'div', class: 'userCompanyDiv', childrenArray: [
                  userForAttendanceList(admin, actions), companyForList(company, [])
                ]
              })

              // finally
              let adminContainer = createElement({ elementType: 'div', class: 'adminContainer', childrenArray: [userCompanyDiv, delegatedByDiv] })
              return adminContainer
            })
            return contentElements
          }
          function SuperAdmin_createSuperAdminsMgtBodyElement(superAdmins) {
            contentElements = superAdmins.map((adminObject) => {
              let { admin, done, done_by } = adminObject;
              console.log(admin, done, done_by, adminObject)
              // -- for Admin
              let messageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let callButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let revokeAdminAccessButton = createElement({ elementType: 'button', textContent: 'Remove' })
              let actions
              if (admin.userID == mySavedID) actions = []
              else actions = [
                { element: messageButton, functionCall: () => { initiateChat(admin.userID) } },
                // { element: callButton, functionCall: () => { call(admin.userID, true, false, false, false, null) } },
                {
                  element: revokeAdminAccessButton, functionCall: () => {
                    // -------------------- Deleting user - on popup;
                    let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Are you sure you want to revoke super admin access for:' })
                    let userBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [userForAttendanceList(admin, [])] })
                    let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that all super admin accesses for this user will be deleted. Do this only when authorized to.' })

                    let icon = 'bx bxs-trash-alt'
                    let title = 'Revokation of Super Admin Access'
                    let contentElementsArray = [question, userBlock, emphasis]
                    let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                    let revokeButton = createElement({ elementType: 'button', textContent: 'Yes, Revoke' })
                    let actions = [
                      { element: cancelButton, functionCall: () => { } },
                      {
                        element: revokeButton, functionCall: () => {
                          socket.emit('revokeSuperAdminAccess', { superAdminId: admin.userID })
                        }
                      }
                    ]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      cancelButton.addEventListener('click', editPopup.closePopup);
                      revokeButton.addEventListener('click', editPopup.closePopup);
                    })
                  }
                }
              ]
              // --- for DoneBy
              let DoneByMessageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let DoneByCallButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let DoneByActions
              if (done_by.userID == mySavedID) DoneByActions = []
              else DoneByActions = [
                { element: DoneByMessageButton, functionCall: () => { initiateChat(done_by.userID) } },
                { element: DoneByCallButton, functionCall: () => { call(done_by.userID, true, false, false, false, null) } }
              ]

              let delegatedByDiv = createElement({
                elementType: 'div', class: 'delegatedByDiv', childrenArray: [
                  createElement({ elementType: 'div', class: 'delegatedByLabel', textContent: 'Delegated by:' }),
                  userForAttendanceList(done_by, DoneByActions),
                  createElement({ elementType: 'div', class: 'delegatedByLabel', textContent: 'On: ' + done }),
                ]
              })

              // finally
              let adminContainer = createElement({
                elementType: 'div', class: 'adminContainer', childrenArray: [
                  userForAttendanceList(admin, actions),
                  delegatedByDiv
                ]
              })
              return adminContainer
            })
            return contentElements
          }
          socket.on('superManageCompanies', companies => {
            console.log('superManageCompanies', companies)
            savedCompanies = companies

            let icon = 'bx bxs-briefcase-alt-2'
            let title = 'Manage Companies'
            let headerSearchDiv = createElement({ elementType: 'input', textContent: title, placeHolder: 'Search - ' + title })
            let actionsPerItem = [{
              actionIcon: 'bx bxs-user-plus', actionFunction: () => {
                // -------------------- Creating a new company - on popup;
                let companyNameLabel = createElement({ elementType: 'label', for: 'companyName' + 'chooseNew', textContent: 'Company name' })
                let companyNameInput = createElement({ elementType: 'input', id: 'companyName' + 'chooseNew', placeHolder: 'Company name' })
                let companyNameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [companyNameLabel, companyNameInput] })

                let companyDescriptionLabel = createElement({ elementType: 'label', for: 'companyDescription' + 'chooseNew', textContent: 'Company description' })
                let companyDescriptionInput = createElement({ elementType: 'input', id: 'companyDescription' + 'chooseNew', placeHolder: 'Company description' })
                let companyDescriptionBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [companyDescriptionLabel, companyDescriptionInput] })

                let icon = 'bx bx-plus'
                let title = 'Create New Company'
                let contentElementsArray = [companyNameBlock, companyDescriptionBlock]
                let savebutton = createElement({ elementType: 'button', textContent: 'Create' })
                let actions = [{
                  element: savebutton, functionCall: () => {
                    socket.emit('superManageCreateCompany', { companyName: companyNameInput.value, companyDescription: companyDescriptionInput.value })
                    console.log({ companyName: companyNameInput.value, companyDescription: companyDescriptionInput.value })
                  }
                }]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => savebutton.addEventListener('click', editPopup.closePopup))
              }
            }]
            let contentElements = SuperAdmin_createCompaniesMgtBodyElement(companies)
            headerSearchDiv.addEventListener('input', () => {
              socket.emit('superManageSearchCreateCompany', { searchTerm: headerSearchDiv.value });
              managementDivBodyStored.textContent = ''
              managementDivBodyStored.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner  
            })
            let ConfigObj = { icon, title, headerSearchDiv, actionsPerItem, contentElements }
            createmgtPanel(ConfigObj)
          })
          socket.on('superManageAdmins', admins => {
            console.log('superManageAdmins', admins)
            savedAdmins = admins

            let icon = 'bx bxs-check-shield'
            let title = 'Manage Admins'
            let headerSearchDiv = createElement({ elementType: 'input', textContent: title, placeHolder: 'Search - ' + title })
            let actionsPerItem = [{
              actionIcon: 'bx bxs-user-plus', actionFunction: () => {

                // -------------------- Creating a new admin - on popup;
                let questionBlock = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please select the Company for which you want to make an Admin.' })

                let chooseLabel = createElement({ elementType: 'label', for: 'choose' + 'chooseNew', textContent: 'choose' })
                let chooseInput = createElement({ elementType: 'button', id: 'choose' + 'chooseNew', placeHolder: 'choose' })
                let chooseBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [chooseLabel, chooseInput] })

                let nameLabel = createElement({ elementType: 'label', for: 'name' + 'chooseNew', textContent: 'Name' })
                let nameInput = createElement({ elementType: 'input', id: 'name' + 'chooseNew', placeHolder: 'Name' })
                let nameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [nameLabel, nameInput] })

                let surnameLabel = createElement({ elementType: 'label', for: 'surname' + 'chooseNew', textContent: 'Surname' })
                let surnameInput = createElement({ elementType: 'input', id: 'surname' + 'chooseNew', placeHolder: 'Surname' })
                let surnameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [surnameLabel, surnameInput] })

                let emailLabel = createElement({ elementType: 'label', for: 'email' + 'chooseNew', textContent: 'email' })
                let emailInput = createElement({ elementType: 'input', id: 'email' + 'chooseNew', placeHolder: 'email' })
                let emailBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [emailLabel, emailInput] })

                let roleBlock = createElement({ elementType: 'div', class: 'editBlock', textContent: 'The Position will automatically be set to the Company Administrator.' })

                let passwordLabel = createElement({ elementType: 'label', for: 'password' + 'chooseNew', textContent: 'Password' })
                let passwordInput = createElement({ elementType: 'input', id: 'password' + 'chooseNew', placeHolder: 'Password' })
                let passwordBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [passwordLabel, passwordInput] })

                let submitButton = createElement({ elementType: 'button', class: 'editBlockButtons', textContent: 'Create Admin' })
                submitButton.disabled = true;

                let selectedCompanyId;
                goodselect(chooseInput, {
                  availableOptions: savedCompanies,
                  placeHolder: "Select Company",
                  selectorWidth: "100%",
                  onOptionChange: (option) => {
                    if (option != null) {
                      submitButton.disabled = false;
                      selectedCompanyId = option.id
                    }
                    else {
                      submitButton.disabled = true;
                    }
                  }
                })

                let icon = 'bx bxs-user-plus'
                let title = 'Create administrator Account'
                let contentElementsArray = [questionBlock, chooseBlock, nameBlock, surnameBlock, emailBlock, roleBlock, passwordBlock]
                let actions = [
                  {
                    element: submitButton, functionCall: () => {
                      socket.emit('superManageCreateAdmin', { companyId: selectedCompanyId, adminName: nameInput.value, adminSurname: surnameInput.value, adminEmail: emailInput.value, adminPassword: passwordInput.value })
                      console.log('superManageCreateAdmin', { companyId: selectedCompanyId, adminName: nameInput.value, adminSurname: surnameInput.value, adminEmail: emailInput.value, adminPassword: passwordInput.value })
                    }
                  }
                ]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => {

                  submitButton.addEventListener('click', () => {
                    editPopup.closePopup();
                  });
                })

              }
            }]

            let contentElements = SuperAdmin_createAdminMgtBodyElements(admins)
            headerSearchDiv.addEventListener('input', () => {
              socket.emit('superManageAdminsSearch', { searchTerm: headerSearchDiv.value });
              managementDivBodyStored.textContent = ''
              managementDivBodyStored.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner  
            })
            let ConfigObj = { icon, title, headerSearchDiv, actionsPerItem, contentElements }
            createmgtPanel(ConfigObj)
          })
          socket.on('superManageSuperAdmins', superAdmins => {
            console.log('superManageSuperAdmins', superAdmins)
            savedSuperAdmins = superAdmins
            let icon = 'bx bxs-check-shield'
            let title = 'Manage Super Admins'
            let headerSearchDiv = createElement({ elementType: 'input', textContent: title, placeHolder: 'Search - ' + title })
            let actionsPerItem = [{
              actionIcon: 'bx bxs-user-plus', actionFunction: () => {

                // -------------------- Creating a new admin - on popup;
                let questionBlock = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please select the Company for which you want to make an Admin.' })

                let chooseLabel = createElement({ elementType: 'label', for: 'choose' + 'chooseNew', textContent: 'choose' })
                let chooseInput = createElement({ elementType: 'button', id: 'choose' + 'chooseNew', placeHolder: 'choose' })
                let chooseBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [chooseLabel, chooseInput] })

                let nameLabel = createElement({ elementType: 'label', for: 'name' + 'chooseNew', textContent: 'Name' })
                let nameInput = createElement({ elementType: 'input', id: 'name' + 'chooseNew', placeHolder: 'Name' })
                let nameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [nameLabel, nameInput] })

                let surnameLabel = createElement({ elementType: 'label', for: 'surname' + 'chooseNew', textContent: 'Surname' })
                let surnameInput = createElement({ elementType: 'input', id: 'surname' + 'chooseNew', placeHolder: 'Surname' })
                let surnameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [surnameLabel, surnameInput] })

                let emailLabel = createElement({ elementType: 'label', for: 'email' + 'chooseNew', textContent: 'email' })
                let emailInput = createElement({ elementType: 'input', id: 'email' + 'chooseNew', placeHolder: 'email' })
                let emailBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [emailLabel, emailInput] })

                let roleBlock = createElement({
                  elementType: 'div', class: 'editBlock',
                  textContent: 'The Position will automatically be set to the Company Administrator.'
                })

                let passwordLabel = createElement({ elementType: 'label', for: 'password' + 'chooseNew', textContent: 'Password' })
                let passwordInput = createElement({ elementType: 'input', id: 'password' + 'chooseNew', placeHolder: 'Password' })
                let passwordBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [passwordLabel, passwordInput] })

                let submitButton = createElement({ elementType: 'button', class: 'editBlockButtons', textContent: 'Create Admin' })
                submitButton.disabled = true;

                let selectedCompanyId;
                goodselect(chooseInput, {
                  availableOptions: savedCompanies,
                  placeHolder: "Select Company",
                  selectorWidth: "100%",
                  onOptionChange: (option) => {
                    if (option != null) {
                      submitButton.disabled = false;
                      selectedCompanyId = option.id
                    }
                    else {
                      submitButton.disabled = true;
                    }
                  }
                })

                let icon = 'bx bxs-user-plus'
                let title = 'Create Super Admin Account'
                let contentElementsArray = [questionBlock, chooseBlock, nameBlock, surnameBlock, emailBlock, roleBlock, passwordBlock]
                let actions = [
                  {
                    element: submitButton, functionCall: () => {
                      socket.emit('superManageCreateSuperAdmin', { companyId: selectedCompanyId, adminName: nameInput.value, adminSurname: surnameInput.value, adminEmail: emailInput.value, adminPassword: passwordInput.value })
                      console.log('superManageCreateSuperAdmin', { companyId: selectedCompanyId, adminName: nameInput.value, adminSurname: surnameInput.value, adminEmail: emailInput.value, adminPassword: passwordInput.value })
                    }
                  }
                ]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => {

                  submitButton.addEventListener('click', () => {
                    editPopup.closePopup();
                  });
                })

              }
            }]
            let contentElements = SuperAdmin_createSuperAdminsMgtBodyElement(superAdmins)
            headerSearchDiv.addEventListener('input', () => {
              socket.emit('superManageSuperAdminsSearch', { searchTerm: headerSearchDiv.value });
              managementDivBodyStored.textContent = ''
              managementDivBodyStored.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner  
            })
            let ConfigObj = { icon, title, headerSearchDiv, actionsPerItem, contentElements }
            createmgtPanel(ConfigObj)

          })
          // -- companies search
          socket.on('superManageSearchCreateCompany', companies => {
            console.log('superManageSearchCreateCompany', companies)
            managementDivBodyStored.textContent = ''
            let resultElements = SuperAdmin_createCompaniesMgtBodyElement(companies)
            resultElements.forEach(element => managementDivBodyStored.append(element))
            if (companies.length < 1) { managementDivBodyStored.textContent = 'No company found given such criteria' }
          })
          // -- admins search
          socket.on('superManageAdminsSearch', admins => {
            console.log('superManageAdminsSearch', admins)
            managementDivBodyStored.textContent = ''
            let resultElements = SuperAdmin_createAdminMgtBodyElements(admins)
            resultElements.forEach(element => managementDivBodyStored.append(element))
            if (admins.length < 1) { managementDivBodyStored.textContent = 'No admin found given such criteria' }
          })
          // -- SuperAdmin search
          socket.on('superManageSuperAdminsSearch', admins => {
            console.log('superManageSuperAdminsSearch', admins)
            managementDivBodyStored.textContent = ''
            let resultElements = SuperAdmin_createSuperAdminsMgtBodyElement(admins)
            resultElements.forEach(element => managementDivBodyStored.append(element))
            if (admins.length < 1) { managementDivBodyStored.textContent = 'No Super Admin found given such criteria' }
          })

          // -- Preparing the Admin Figures and essential objects
          socket.on('superAdminPrepareCompanies', companies => {
            savedCompanies = companies
            console.log('superAdminPrepareCompanies defined')
          })
          socket.on('superAdminPrepareAdmins', admins => {
            savedAdmins = admins
            console.log('superAdminPrepareAdmins defined')
          })
          socket.on('superAdminPrepareSuperAdmins', superAdmins => {
            savedSuperAdmins = superAdmins
            console.log('superAdminPrepareSuperAdmins defined')
          })

          function createmgtPanel(ConfigObj) {
            let { icon, title, headerSearchDiv, actionsPerItem, contentElements } = ConfigObj
            // actionsPerItem is an array of {actionIcon, actionFunction}
            managementDiv.textContent = ''
            let geaderText = createElement({
              elementType: 'div', class: 'headerText', childrenArray: [
                createElement({ elementType: 'i', class: icon }),
                createElement({ elementType: 'p', textContent: title })
              ]
            })

            let actionButtonArray = actionsPerItem.map(action => {
              let actionButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: action.actionIcon })], onclick: action.actionFunction })
              return actionButton
            })
            let actionButtonsDiv = createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: actionButtonArray })
            let actionPart = createElement({ elementType: 'div', class: 'actionPart', childrenArray: [headerSearchDiv, actionButtonsDiv] })
            let managementDivHeader = createElement({ elementType: 'div', class: 'managementDivHeader', childrenArray: [geaderText, actionPart] })
            let managementDivBody = createElement({ elementType: 'div', class: 'managementDivBody', childrenArray: contentElements })
            managementDivBodyStored = managementDivBody
            managementDiv.append(managementDivHeader, managementDivBody)
          }

          responsibilitiesContainer.append(superAdminButton)
        }
        if (isAdmin === true) {
          let selectedCompanyID
          let companyPositions;
          let companyUsers;
          let companyAdmins;
          let managementDivBodyStored // store the di in order to update it in case of a change
          let companyAdminButton = createElement({ elementType: 'button', class: 'responsibilityOptionDropDown', })
          let numbersDiv = createElement({ elementType: 'div', class: 'numbersDiv', childrenArray: [createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })] }) // create Spinner
          let managementDiv = createElement({
            elementType: 'div', class: 'managementDiv', childrenArray: [
              createElement({ elementType: 'div', class: 'managementDivTemporary', textContent: "Select any of the above clickable options to manage" })
            ]
          })

          socket.on('adminNumbers', numbersArray => {
            numbersDiv.textContent = '';
            numbersArray.map(number => {
              let manageButton = createElement({ elementType: 'div', class: 'manageButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-cog' })] })
              let valueDiv = createElement({ elementType: 'div', class: 'valueDiv ', textContent: number.value })
              let titleDiv = createElement({ elementType: 'div', class: 'titleDiv', textContent: number.title })
              let childrenArray = [valueDiv, titleDiv]
              if (number.title == 'Users') {
                childrenArray.push(manageButton)
                valueDiv.classList.add('editable')
                manageButton.addEventListener('click', () => {
                  socket.emit('manageUsers', selectedCompanyID)
                  managementDiv.textContent = '';
                  managementDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                })
              }
              if (number.title == 'Admins') {
                childrenArray.push(manageButton)
                valueDiv.classList.add('editable')
                manageButton.addEventListener('click', () => {
                  socket.emit('manageAdmins', selectedCompanyID)
                  managementDiv.textContent = '';
                  managementDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                })
              }
              if (number.title == 'Positions') {
                childrenArray.push(manageButton)
                valueDiv.classList.add('editable')
                manageButton.addEventListener('click', () => {
                  socket.emit('managePositions', selectedCompanyID)
                  managementDiv.textContent = '';
                  managementDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                })
              }
              let numberOption = createElement({ elementType: 'div', class: 'numberOption', childrenArray: childrenArray })
              numbersDiv.append(numberOption)
            })
            socket.emit('preparePositions', selectedCompanyID) // in order to update the positions Array for future use
            socket.emit('prepareUsers', selectedCompanyID) // in order to update the users Array for future use
            socket.emit('prepareAdmins', selectedCompanyID) // in order to update the admins Array for future use
          })

          function createUserMgtBodyElements(usersArray) {
            contentElements = usersArray.map((user) => {
              let messageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let callButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let editButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-edit-alt' })] })
              let deleteButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-trash-alt' })] })
              let actions
              if (user.userID == mySavedID) actions = []
              else actions = [
                { element: messageButton, functionCall: () => { initiateChat(user.userID) } },
                { element: callButton, functionCall: () => { call(user.userID, true, false, false, false, null) } },
                {
                  element: editButton, functionCall: () => {
                    // -------------------- Editing user - on popup;
                    let nameLabel = createElement({ elementType: 'label', for: 'name' + user.userID, textContent: 'Name' })
                    let nameInput = createElement({ elementType: 'input', id: 'name' + user.userID, placeHolder: 'Name', value: user.name })
                    let nameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [nameLabel, nameInput] })

                    let surnameLabel = createElement({ elementType: 'label', for: 'surname' + user.userID, textContent: 'Surname' })
                    let surnameInput = createElement({ elementType: 'input', id: 'surname' + user.userID, placeHolder: 'Surname', value: user.surname })
                    let surnameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [surnameLabel, surnameInput] })

                    let emailLabel = createElement({ elementType: 'label', for: 'email' + user.userID, textContent: 'email' })
                    let emailInput = createElement({ elementType: 'input', id: 'email' + user.userID, placeHolder: 'email', value: user.email })
                    let emailBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [emailLabel, emailInput] })

                    let roleLabel = createElement({ elementType: 'label', for: 'role' + user.userID, textContent: 'Position' })
                    let roleInput = createElement({ elementType: 'button', id: 'role' + user.userID })
                    let roleBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [roleLabel, roleInput] })

                    let passwordWarningBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [createElement({ elementType: 'div', textContent: "Warning, filling any Valid Password value in the password field will change the user's password to that value. Please remember to communicate it to the concerned user. If you do not ontend to change the user's password, do not fill the next field" })] })

                    let passwordLabel = createElement({ elementType: 'label', for: 'password' + user.userID, textContent: 'Password' })
                    let passwordInput = createElement({ elementType: 'input', id: 'password' + user.userID, placeHolder: 'Password' })
                    let passwordBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [passwordLabel, passwordInput] })

                    let selectedPositionId = companyPositions.find(position => position.position == user.role).positionId
                    goodselect(roleInput, {
                      availableOptions: companyPositions.map(position => {
                        return { id: position.positionId, name: position.position }
                      }),
                      placeHolder: "Select Position",
                      selectorWidth: "100%",
                      selectedOptionId: companyPositions.find(position => position.position == user.role).positionId,
                      onOptionChange: (option) => {
                        if (option != null) { selectedPositionId = option.id; }
                      }
                    })

                    let icon = 'bx bxs-user-detail'
                    let title = 'Edit User Information'
                    let contentElementsArray = [nameBlock, surnameBlock, emailBlock, roleBlock, passwordWarningBlock, passwordBlock]
                    let savebutton = createElement({ elementType: 'button', textContent: 'Save' })
                    let actions = [{
                      element: savebutton, functionCall: () => {
                        socket.emit('updateUser', { userID: user.userID, name: nameInput.value, surname: surnameInput.value, email: emailInput.value, positionId: selectedPositionId, password: passwordInput.value, companyId: selectedCompanyID })
                        console.log({ name: nameInput.value, surname: surnameInput.value, email: emailInput.value, positionId: selectedPositionId, password: passwordInput.value, companyId: selectedCompanyID })

                      }
                    }]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      savebutton.addEventListener('click', editPopup.closePopup)
                    })
                  }
                },
                {
                  element: deleteButton, functionCall: () => {
                    // -------------------- Deleting user - on popup;
                    let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Are you sure you want to delete:' })
                    let userBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [userForAttendanceList(user, [])] })
                    let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that all related account information such as responsibilities, calls, events, and messages will be deleted.' })

                    let icon = 'bx bxs-trash-alt'
                    let title = 'Delete User confirmation'
                    let contentElementsArray = [question, userBlock, emphasis]
                    let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                    let deleteButton = createElement({ elementType: 'button', textContent: 'Yes, Delete' })
                    let actions = [
                      { element: cancelButton, functionCall: () => { } },
                      {
                        element: deleteButton, functionCall: () => {
                          socket.emit('deleteUserInfo', { userToDelete: user.userID, companyId: selectedCompanyID })
                        }
                      }
                    ]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      cancelButton.addEventListener('click', editPopup.closePopup);
                      deleteButton.addEventListener('click', editPopup.closePopup);
                    })
                  }
                }
              ]
              return userForAttendanceList(user, actions)
            })
            return contentElements
          }
          function createAdminMgtBodyElements(admins) {
            contentElements = admins.map((adminObject) => {
              let { admin, done, done_by } = adminObject;
              console.log(admin, done, done_by, adminObject)
              // -- for Admin
              let messageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let callButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let revokeAdminAccessButton = createElement({ elementType: 'button', textContent: 'Remove' })
              let actions
              if (admin.userID == mySavedID) actions = []
              else actions = [
                { element: messageButton, functionCall: () => { initiateChat(admin.userID) } },
                { element: callButton, functionCall: () => { call(admin.userID, true, false, false, false, null) } },
                {
                  element: revokeAdminAccessButton, functionCall: () => {
                    // -------------------- Deleting user - on popup;
                    let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Are you sure you want to revoke admin access for:' })
                    let userBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [userForAttendanceList(admin, [])] })
                    let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that all admin accesses for this user will be deleted. Do this only when authorized to.' })

                    let icon = 'bx bxs-trash-alt'
                    let title = 'Revokation of Admin Access'
                    let contentElementsArray = [question, userBlock, emphasis]
                    let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                    let revokeButton = createElement({ elementType: 'button', textContent: 'Yes, Revoke' })
                    let actions = [
                      { element: cancelButton, functionCall: () => { } },
                      {
                        element: revokeButton, functionCall: () => {
                          socket.emit('revokeAdminAccess', { adminToDelete: admin.userID, companyId: selectedCompanyID })
                        }
                      }
                    ]
                    let constraints = { icon, title, contentElementsArray, actions }
                    createInScreenPopup(constraints).then(editPopup => {
                      cancelButton.addEventListener('click', editPopup.closePopup);
                      revokeButton.addEventListener('click', editPopup.closePopup);
                    })
                  }
                }
              ]
              // --- for DoneBy
              let DoneByMessageButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
              let DoneByCallButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
              let DoneByActions
              if (done_by.userID == mySavedID) DoneByActions = []
              else DoneByActions = [
                { element: DoneByMessageButton, functionCall: () => { initiateChat(done_by.userID) } },
                { element: DoneByCallButton, functionCall: () => { call(done_by.userID, true, false, false, false, null) } }
              ]

              let delegatedByDiv = createElement({
                elementType: 'div', class: 'delegatedByDiv', childrenArray: [
                  createElement({ elementType: 'div', class: 'delegatedByLabel', textContent: 'Delegated by:' }),
                  userForAttendanceList(done_by, DoneByActions),
                  createElement({ elementType: 'div', class: 'delegatedByLabel', textContent: 'On: ' + done }),
                ]
              })

              // finally
              let adminContainer = createElement({
                elementType: 'div', class: 'adminContainer', childrenArray: [
                  userForAttendanceList(admin, actions),
                  delegatedByDiv
                ]
              })
              return adminContainer
            })
            return contentElements
          }
          function createPositionsBodyElements(positions) {
            contentElements = positions.map((position) => {
              let positionElement = createElement({ elementType: 'div', class: 'position', textContent: position.position })
              let editButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-edit-alt' })] })
              let deleteButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-trash-alt' })] })
              let actionButtons = createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: [editButton, deleteButton] })
              let positionDiv = createElement({ elementType: 'div', class: 'positionDiv', childrenArray: [positionElement, actionButtons] })


              editButton.addEventListener('click', () => {
                // make popup
                let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Type the new name of the position:' })
                let editInput = createElement({ elementType: 'input', placeHolder: 'Position name', value: position.position })
                let editBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [editInput] })
                let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that this will change the name of the positions of all users connected to this position.' })

                let icon = 'bx bxs-edit-alt'
                let title = 'Edit Position'
                let contentElementsArray = [question, editBlock, emphasis]
                let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                let saveButton = createElement({ elementType: 'button', textContent: 'Yes, Save' })
                let actions = [
                  { element: cancelButton, functionCall: () => { } },
                  {
                    element: saveButton, functionCall: () => {
                      socket.emit('editPosition', { positionId: position.positionId, companyId: selectedCompanyID, positionName: editInput.value })
                    }
                  }
                ]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => {
                  cancelButton.addEventListener('click', editPopup.closePopup);
                  saveButton.addEventListener('click', editPopup.closePopup);
                })
              })
              deleteButton.addEventListener('click', () => {
                // make popup
                let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Are you sure to delete this position?' })
                let positionText = createElement({ elementType: 'div', textContent: position.position })
                let editBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [positionText] })
                let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please note that this will delete any user connected to this position.' })

                let icon = 'bx bxs-trash-alt'
                let title = 'Delete Position'
                let contentElementsArray = [question, editBlock, emphasis]
                let cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
                let deleteButton = createElement({ elementType: 'button', textContent: 'Yes, Delete' })
                let actions = [
                  { element: cancelButton, functionCall: () => { } },
                  {
                    element: deleteButton, functionCall: () => {
                      socket.emit('deletePosition', { positionId: position.positionId, companyId: selectedCompanyID })
                    }
                  }
                ]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => {
                  cancelButton.addEventListener('click', editPopup.closePopup);
                  deleteButton.addEventListener('click', editPopup.closePopup);
                })
              })
              return positionDiv
            })
            return contentElements
          }
          socket.on('manageUsers', users => {
            companyUsers = users
            console.log('manageUsers', users)
            let icon = 'bx bxs-user-detail'
            let title = 'Manage Users'
            let headerSearchDiv = createElement({ elementType: 'input', textContent: title, placeHolder: 'Search - ' + title })
            let actionsPerItem = [{
              actionIcon: 'bx bxs-user-plus', actionFunction: () => {
                // -------------------- Creating a new user - on popup;
                let nameLabel = createElement({ elementType: 'label', for: 'name' + 'chooseNew', textContent: 'Name' })
                let nameInput = createElement({ elementType: 'input', id: 'name' + 'chooseNew', placeHolder: 'Name' })
                let nameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [nameLabel, nameInput] })

                let surnameLabel = createElement({ elementType: 'label', for: 'surname' + 'chooseNew', textContent: 'Surname' })
                let surnameInput = createElement({ elementType: 'input', id: 'surname' + 'chooseNew', placeHolder: 'Surname' })
                let surnameBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [surnameLabel, surnameInput] })

                let emailLabel = createElement({ elementType: 'label', for: 'email' + 'chooseNew', textContent: 'email' })
                let emailInput = createElement({ elementType: 'input', id: 'email' + 'chooseNew', placeHolder: 'email' })
                let emailBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [emailLabel, emailInput] })

                let roleLabel = createElement({ elementType: 'label', for: 'role' + 'chooseNew', textContent: 'Position' })
                let roleInput = createElement({ elementType: 'button', id: 'role' + 'chooseNew' })
                let roleBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [roleLabel, roleInput] })

                let passwordLabel = createElement({ elementType: 'label', for: 'password' + 'chooseNew', textContent: 'Password' })
                let passwordInput = createElement({ elementType: 'input', id: 'password' + 'chooseNew', placeHolder: 'Password' })
                let passwordBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [passwordLabel, passwordInput] })

                let selectedPositionId;
                goodselect(roleInput, {
                  availableOptions: companyPositions.map(position => { return { id: position.positionId, name: position.position } }),
                  placeHolder: "Select Position",
                  selectorWidth: "100%",
                  onOptionChange: (option) => {
                    if (option != null) selectedPositionId = option.id;
                    else selectedPositionId = option;
                  }
                })

                let icon = 'bx bxs-user-plus'
                let title = 'Create User Account'
                let contentElementsArray = [nameBlock, surnameBlock, emailBlock, roleBlock, passwordBlock]
                let savebutton = createElement({ elementType: 'button', textContent: 'Save' })
                let actions = [{
                  element: savebutton, functionCall: () => {
                    socket.emit('saveNewUserInfo', { name: nameInput.value, surname: surnameInput.value, email: emailInput.value, positionId: selectedPositionId, password: passwordInput.value, companyId: selectedCompanyID })
                    console.log({ name: nameInput.value, surname: surnameInput.value, email: emailInput.value, positionId: selectedPositionId, password: passwordInput.value, companyId: selectedCompanyID })
                  }
                }]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => savebutton.addEventListener('click', editPopup.closePopup))
              }
            }]
            let contentElements = createUserMgtBodyElements(users)
            headerSearchDiv.addEventListener('input', () => {
              socket.emit('manageUsersSearch', { searchTerm: headerSearchDiv.value, companyId: selectedCompanyID });
              managementDivBodyStored.textContent = ''
              managementDivBodyStored.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner  
            })
            let ConfigObj = { icon, title, headerSearchDiv, actionsPerItem, contentElements }
            createmgtPanel(ConfigObj)
          })
          socket.on('manageUsersSearch', users => {
            console.log('manageUsersSearch', users)
            managementDivBodyStored.textContent = ''
            let resultElements = createUserMgtBodyElements(users)
            resultElements.forEach(element => managementDivBodyStored.append(element))
            if (users.length < 1) { managementDivBodyStored.textContent = 'No user found with such criteria' }
          })
          socket.on('manageAdmins', admins => {
            companyAdmins = admins
            console.log('manageAdmins', admins)
            let icon = 'bx bxs-check-shield'
            let title = 'Manage Admins'
            let headerSearchDiv = createElement({ elementType: 'input', textContent: title, placeHolder: 'Search - ' + title })
            let actionsPerItem = [{
              actionIcon: 'bx bxs-user-plus', actionFunction: () => {

                // -------------------- Creating a new admin - on popup;
                let questionBlock = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Please select the userr that you want to delegate as an admin.' })

                let chooseLabel = createElement({ elementType: 'label', for: 'choose' + 'chooseNew', textContent: 'choose' })
                let chooseInput = createElement({ elementType: 'button', id: 'choose' + 'chooseNew', placeHolder: 'choose' })
                let chooseBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [chooseLabel, chooseInput] })

                let submitButton = createElement({ elementType: 'button', class: 'editBlockButtons', textContent: 'Make Admin' })
                let submitBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [] })

                let selectedUserId;
                goodselect(chooseInput, {
                  availableOptions: companyUsers.map(user => { return { id: user.userID, name: user.name + ' ' + user.surname } }),
                  placeHolder: "Select User to make Admin",
                  selectorWidth: "100%",
                  onOptionChange: (option) => {
                    if (option != null) {
                      submitBlock.append(submitButton)
                      selectedUserId = option.id
                    }
                    else {
                      submitButton.remove()
                    }
                  }
                })

                let icon = 'bx bxs-user-plus'
                let title = 'Create administrator Account'
                let contentElementsArray = [questionBlock, chooseBlock, submitBlock]
                let actions = []
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => {

                  submitButton.addEventListener('click', () => {
                    socket.emit('giveNewAdminAccess', { userId: selectedUserId, companyId: selectedCompanyID })
                    console.log('giveNewAdminAccess', { userId: selectedUserId, companyId: selectedCompanyID })
                    editPopup.closePopup();
                  });
                })

              }
            }]

            let contentElements = createAdminMgtBodyElements(admins/*.map(admin => admin.admin)*/)
            headerSearchDiv.addEventListener('input', () => {
              socket.emit('manageAdminsSearch', { searchTerm: headerSearchDiv.value, companyId: selectedCompanyID });
              managementDivBodyStored.textContent = ''
              managementDivBodyStored.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner  
            })
            let ConfigObj = { icon, title, headerSearchDiv, actionsPerItem, contentElements }
            createmgtPanel(ConfigObj)
          })
          socket.on('manageAdminsSearch', admins => {
            console.log('manageAdminsSearch', admins)
            managementDivBodyStored.textContent = ''
            let resultElements = createAdminMgtBodyElements(admins)
            resultElements.forEach(element => managementDivBodyStored.append(element))
            if (users.length < 1) { managementDivBodyStored.textContent = 'No Admin found with such criteria' }
          })
          socket.on('managePositions', positions => {
            companyPositions = positions
            console.log('managePositions', positions)
            let icon = 'bx bxs-directions'
            let title = 'Manage Positions'
            let headerSearchDiv = createElement({ elementType: 'input', textContent: title, placeHolder: 'Search - ' + title })
            let actionsPerItem = [{
              actionIcon: 'bx bx-plus', actionFunction: () => {
                // make popup
                let question = createElement({ elementType: 'div', class: 'editBlock', textContent: 'Type Here a name for a new Position?' })
                let editInput = createElement({ elementType: 'input', placeHolder: 'Position name' })
                let editBlock = createElement({ elementType: 'div', class: 'editBlock', childrenArray: [editInput] })
                let emphasis = createElement({ elementType: 'div', class: 'editBlock', textContent: 'This position will afterwards be available and visible while creating a new user.' })

                let icon = 'bx bxs-user'
                let title = 'Create Position'
                let contentElementsArray = [question, editBlock, emphasis]
                let cancelButton = createElement({ elementType: 'button', textContent: 'Cancel' })
                let deleteButton = createElement({ elementType: 'button', textContent: 'Save' })
                let actions = [
                  { element: cancelButton, functionCall: () => { } },
                  {
                    element: deleteButton, functionCall: () => {
                      socket.emit('createPosition', { companyId: selectedCompanyID, positionName: editInput.value })
                    }
                  }
                ]
                let constraints = { icon, title, contentElementsArray, actions }
                createInScreenPopup(constraints).then(editPopup => {
                  cancelButton.addEventListener('click', editPopup.closePopup);
                  deleteButton.addEventListener('click', editPopup.closePopup);
                })
              }
            }]

            let contentElements = createPositionsBodyElements(positions)
            headerSearchDiv.addEventListener('input', () => {
              socket.emit('managePositionSearch', { searchTerm: headerSearchDiv.value, companyId: selectedCompanyID });
              managementDivBodyStored.textContent = ''
              managementDivBodyStored.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner  
            })

            let ConfigObj = { icon, title, headerSearchDiv, actionsPerItem, contentElements }
            createmgtPanel(ConfigObj)
          })
          socket.on('managePositionSearch', positions => {
            console.log('managePositionSearch', positions)
            managementDivBodyStored.textContent = ''
            let resultElements = createPositionsBodyElements(positions)
            resultElements.forEach(element => managementDivBodyStored.append(element))
            if (positions.length < 1) { managementDivBodyStored.textContent = 'No Position found with such criteria' }
          })

          // -- Preparing the Admin Figures and essential objects
          socket.on('preparePositions', positions => {
            companyPositions = positions;
            console.log('positions defined');
          })
          socket.on('prepareUsers', users => {
            companyUsers = users
            console.log('companyUsers defined')
          })
          socket.on('prepareAdmins', admins => {
            companyAdmins = admins
            console.log('admins defined')
          })

          function createmgtPanel(ConfigObj) {
            let { icon, title, headerSearchDiv, actionsPerItem, contentElements } = ConfigObj
            // actionsPerItem is an array of {actionIcon, actionFunction}
            managementDiv.textContent = ''
            let geaderText = createElement({
              elementType: 'div', class: 'headerText', childrenArray: [
                createElement({ elementType: 'i', class: icon }),
                createElement({ elementType: 'p', textContent: title })
              ]
            })

            let actionButtonArray = actionsPerItem.map(action => {
              let actionButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: action.actionIcon })], onclick: action.actionFunction })
              return actionButton
            })
            let actionButtonsDiv = createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: actionButtonArray })
            let actionPart = createElement({ elementType: 'div', class: 'actionPart', childrenArray: [headerSearchDiv, actionButtonsDiv] })
            let managementDivHeader = createElement({ elementType: 'div', class: 'managementDivHeader', childrenArray: [geaderText, actionPart] })
            let managementDivBody = createElement({ elementType: 'div', class: 'managementDivBody', childrenArray: contentElements })
            managementDivBodyStored = managementDivBody
            managementDiv.append(managementDivHeader, managementDivBody)
          }
          goodselect(companyAdminButton, {
            availableOptions: administeredCompaniesInfo,
            placeHolder: "Select Company",
            selectorWidth: "100%",
            selectedOptionId: administeredCompaniesInfo[0].id || null,
            onOptionChange: (option) => {
              contentPanel.textContent = '';
              if (option == null) {
                contentPanel.append(createElement({
                  elementType: 'div', class: 'adminWelcomeDiv', childrenArray: [
                    createElement({ elementType: 'img', class: 'adminWelcomeImage', src: 'images/adminKeys.png' }),
                    createElement({ elementType: 'p', textContent: 'Click on the menu to choose Groups to manage' })
                  ]
                }))
              }
              else {
                selectedCompanyID = option.id;
                let companyProfilePic
                if (option.logo == null) companyProfilePic = createElement({ elementType: 'div', class: 'companyProfilePic', textContent: option.name.substring(0, 2) })
                else companyProfilePic = createElement({ elementType: 'img', class: 'companyProfilePic', src: option.logo })
                let backButton = createElement({
                  elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-left' })], onclick: showResponsibilitiesPanel
                })
                let companyName = createElement({ elementType: 'div', class: 'companyName', textContent: option.name })
                let companyDescription = createElement({ elementType: 'div', class: 'companyDescription', textContent: option.description })
                let companyNameDescription = createElement({ elementType: 'div', class: 'companyNameDescription', childrenArray: [companyName, companyDescription] })
                let companyInfoDiv = createElement({ elementType: 'div', class: 'companyInfoDiv', childrenArray: [backButton, companyProfilePic, companyNameDescription] })
                let editButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-edit-alt' })] })
                let universalButtons = createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: [editButton] })
                let Header = createElement({ elementType: 'div', class: 'centralHeader', childrenArray: [companyInfoDiv, universalButtons] })
                socket.emit('requestAdminNumbers', option.id)
                numbersDiv.textContent = '';
                numbersDiv.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // create Spinner
                let adminPanelMainContent = createElement({ elementType: 'div', class: 'adminPanelMainContent', childrenArray: [numbersDiv, managementDiv] })
                contentPanel.append(Header, adminPanelMainContent);
                showControlPanel();
              }
            }
          })
          responsibilitiesContainer.append(companyAdminButton)
        }
        adminPanel.append(responsibilitiesPanel, contentPanel)
        return createSidePanelElement(title, icon, subMenu)
      }
    }
  });
})(functionalityOptionsArray);
function showMessagesPanel() {
  messages_panel.style.display = "flex";
  call_log_panel.style.display = "none";
  ongoing_call_panel.style.display = "none";
  time_scheduling_panel.style.display = "none";

  document_title.innerText = "Messages";
}
function showCallHistoryPanel() {
  messages_panel.style.display = "none";
  call_log_panel.style.display = "flex";
  ongoing_call_panel.style.display = "none";
  time_scheduling_panel.style.display = "none";

  document_title.innerText = "Calls";
}
function showOngoingCallSection() {
  messages_panel.style.display = "none";
  call_log_panel.style.display = "none";
  ongoing_call_panel.style.display = "flex";
  time_scheduling_panel.style.display = "none";

  document_title.innerText = "ongoing call";
}
function showTimeSchedulingSection() {
  messages_panel.style.display = "none";
  call_log_panel.style.display = "none";
  ongoing_call_panel.style.display = "none";
  time_scheduling_panel.style.display = "flex";

  document_title.innerText = "ongoing call";
}
// mobule responsiveness functions
let chats_panel = document.getElementById('chats_panel')
let chatContent_panel = document.getElementById('chatContent_panel')
function showChatList() {
  chats_panel.classList.remove('mobileHiddenElement')
  chatContent_panel.classList.add('mobileHiddenElement')
}
function showChatContent() {
  chats_panel.classList.add('mobileHiddenElement')
  chatContent_panel.classList.remove('mobileHiddenElement')
}

////////////////////////////
function createMessagesPanelElements() {
  messages_panel.textContent = '';
  let chatSearch = createElement({
    elementType: 'div', class: 'chatSearch displayed', childrenArray: [
      createElement({ elementType: 'label', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-search-alt-2' })] }), // label
      createElement({ elementType: 'input', type: 'text', placeholder: 'Search conversations' }), // input
    ]
  })
  let newChatButton = createElement({ elementType: 'button', class: 'newChat rotate45', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-plus' })] })
  let newChatTitle = createElement({
    elementType: 'div', class: 'newChatTitle unDisplayed', childrenArray: [
      createElement({ elementType: 'label', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-search-alt-2' })] }), // label
      createElement({ elementType: 'input', type: 'text', placeholder: 'Search people' }), // input
    ]
  })
  let chats__header = createElement({ elementType: 'div', class: 'c-chats__header', childrenArray: [chatSearch, newChatButton, newChatTitle] })
  let place_for_chats = createElement({ elementType: 'ul', class: 'place_for_chats' })
  let searchResults = createElement({ elementType: 'ul', class: 'searchResults' })
  let chat_search_content = createElement({ elementType: 'div', class: 'chat-search-content', childrenArray: [place_for_chats, searchResults] })
  let c_chats = createElement({ elementType: 'div', class: 'c-chats', childrenArray: [chats__header, chat_search_content] })
  // wide area
  let c_openchat = createElement({
    elementType: 'div', class: 'c-openchat', childrenArray: [
      createElement({
        elementType: 'div', class: 'c-openchat__selectConversation', childrenArray: [
          createElement({ elementType: 'img', src: '/images/yourMessagesWillAppearHere.png' }),
          createElement({ elementType: 'h3', textContent: 'Select any chat or create a new chat to get started with chat' })
        ]
      })
    ]
  })
  messages_panel.appendChild(c_chats)
  messages_panel.appendChild(c_openchat)
}
socket.on('displayChat', function (chat) {
  let conversationButton = showOnChatList(chat)
  chatContainer.append(conversationButton)
  availableChats.push({ roomID: chat.roomID, conversationButton })
});
socket.on('displayNewCreatedChat', function (chat) {
  let conversationButton = showOnChatList(chat)
  chatContainer.prepend(conversationButton)
  availableChats.unshift({ roomID: chat.roomID, conversationButton })
});
socket.on('clickOnChat', function (chatToClick) {
  let existingChat = availableChats.find(chat => chat.roomID == chatToClick)
  if (!existingChat) { }
  else existingChat.conversationButton.click()
});
socket.on('chatContent', function (chatContent) {
  openChatInfo = chatContent;
  console.log("from server: ", chatContent)
  displayChatOnChatArea(openChatInfo)
});
socket.on('newMessage', ({ chatInfo, expectedUser, insertedMessage }) => {
  let chatContainerDiv = showOnChatList(chatInfo);
  let existingChat = availableChats.find(chat => chat.roomID == chatInfo.roomID)
  if (!existingChat) {
    chatContainer.prepend(chatContainerDiv);
    availableChats.unshift({ roomID: chatInfo.roomID, conversationButton })
  }
  else {
    chatContainer.prepend(chatContainerDiv);
    existingChat.conversationButton.remove()
    existingChat.conversationButton = chatContainerDiv
  }
  if (selectedChatId == chatInfo.roomID) { // if this chat is currently opened
    addMessageToChat(insertedMessage, mySavedID)
  }
  else { // if this is not the displayed chat, give  notification
    let shortOrImagType, shortOrImagContent;
    if (chatInfo.type == 0) {
      if (expectedUser.profilePicture == null) { shortOrImagType = 'short'; shortOrImagContent = expectedUser.name.charAt(0) + expectedUser.surname.charAt(0); }
      else { shortOrImagType = 'image'; shortOrImagContent = expectedUser.profilePicture; }
    }
    if (chatInfo.type == 1) {
      if (chatInfo.profilePicture == null) { shortOrImagType = 'image'; shortOrImagContent = '/private/profiles/group.jpeg' }
      else { shortOrImagType = 'image'; shortOrImagContent = chatInfo.profilePicture; }
    }
    let notification = displayNotification({
      title: { iconClass: 'bx bxs-chat', titleText: 'Incoming Message' },
      body: {
        shortOrImage: { shortOrImagType: shortOrImagType, shortOrImagContent: shortOrImagContent },
        bodyContent: 'Message from ' + expectedUser.name + ' ' + expectedUser.surname + ' : ' + insertedMessage.message
      },
      actions: [
        // { type: 'confirm', displayText: 'Answer', actionFunction: () => { console.log('call answered') } }
        { type: 'confirm', displayText: 'Open chat', actionFunction: () => { requestChatContent(chatInfo.roomID) } }
      ],
      obligatoryActions: {
        onDisplay: () => { console.log('Notification Displayed') },
        onHide: () => { console.log('Notification Hidden') },
        onEnd: () => { console.log('Notification Ended') },
      },
      delay: 7000,
      tone: 'notification'
    })

  }

});

function requestChatContent(chatId) {
  socket.emit('requestChatContent', chatId);
  showChatContent()
}
socket.on('updateReaction', function (receivedReactionsInfo) {
  console.log('updateReaction', receivedReactionsInfo, mySavedID, selectedChatId)
  if (selectedChatId == receivedReactionsInfo.chat) { // update reaction in case it is on the open chat
    //  = buildReaction(receivedReactionsInfo.details)
    let msgReactions = createElement({ elementType: 'div', class: 'messageReactions', childrenArray: buildReaction(receivedReactionsInfo.details, mySavedID) })
    let existingMessageObject = displayedMessages.find(displayedMessage => displayedMessage.object.id == receivedReactionsInfo.message)
    if (existingMessageObject) {
      existingMessageObject.reactionsDiv.after(msgReactions)
      existingMessageObject.reactionsDiv.remove()
      existingMessageObject.reactionsDiv = msgReactions
    }
  }
  else {
    if (mySavedID == receivedReactionsInfo.messageOwner.userID) { // show reaction if it is done on my message in chat
      let shortOrImagType, shortOrImagContent;
      if (receivedReactionsInfo.performer.profilePicture == null) { shortOrImagType = 'short'; shortOrImagContent = receivedReactionsInfo.performer.name.charAt(0) + receivedReactionsInfo.performer.surname.charAt(0); }
      else { shortOrImagType = 'image'; shortOrImagContent = receivedReactionsInfo.performer.profilePicture; }

      let notification = displayNotification({
        title: { iconClass: 'bx bxs-wink-smile', titleText: 'Message reaction' },
        body: {
          shortOrImage: { shortOrImagType: shortOrImagType, shortOrImagContent: shortOrImagContent },
          bodyContent: receivedReactionsInfo.performer.name + ' ' + receivedReactionsInfo.performer.surname + ' reacted to your message'
        },
        actions: [ // { type: 'confirm', displayText: 'Answer', actionFunction: () => { console.log('call answered') } }
          { type: 'confirm', displayText: 'Open chat', actionFunction: () => { requestChatContent(receivedReactionsInfo.chat) } }
        ],
        obligatoryActions: {
          onDisplay: () => { console.log('Notification Displayed') },
          onHide: () => { console.log('Notification Hidden') },
          onEnd: () => { console.log('Notification Ended') },
        },
        delay: 7000,
        tone: 'notification'
      })
    }
  }
})
function buildReaction(details, myID) {
  let reactions = details.map(reaction => {
    let reactorsTitle = createElement({ elementType: 'div', class: 'title', textContent: 'Reactions' });
    let reactorsArray = reaction.users.map(user => { return createElement({ elementType: 'li', textContent: myID == user.userID ? 'Me' : user.name + " " + user.surname }) })
    return createElement({
      elementType: 'div', class: 'reactionBox', childrenArray: [
        createElement({ elementType: 'div', class: 'reactionIcon', textContent: reaction.icon }),
        createElement({ elementType: 'ul', class: 'reactorList', childrenArray: [reactorsTitle].concat(reactorsArray) }),
      ]
    })
  })
  return reactions;
}

function showOnChatList(chat) {
  console.log('chat', chat)
  let { roomID, users, roomName, profilePicture, type, lastmessage, myID, unreadCount } = chat;

  console.log("chat to display on list", chat)
  let writenBy = '';
  let imageContainer;
  let chatTitleText = ''
  switch (type) {
    case 0:
      writenBy = "";
      let userToDisplay = users.filter(user => user.userID != mySavedID)
      if (userToDisplay.length < 1) { // in case we have only one user (viewer)
        chatTitleText = 'Deleted User'
        imageContainer = makeProfilePicture(deletedUser)
      } else {
        chatTitleText = userToDisplay[0].name + ' ' + userToDisplay[0].surname;
        imageContainer = makeProfilePicture(userToDisplay[0]);
      }
      break;
    case 1:
      if (mySavedID == lastmessage.from.userID) { writenBy = "Me: "; }
      else { writenBy = lastmessage.from.name + ": "; }
      if (profilePicture == null) { imageContainer = createElement({ elementType: 'img', class: 'memberProfilePicture', src: '/private/profiles/group.jpeg' }) }
      else { imageContainer = createElement({ elementType: 'img', class: 'memberProfilePicture', src: profilePicture }) }
      if (roomName == null) chatTitleText = users.map(user => user.name + ' ' + user.surname).join(', ');
      else chatTitleText = roomName;
      break;
    default:
      break;
  }
  let chatTitle = createElement({ elementType: 'p', class: 'c-chats__title', textContent: chatTitleText })
  let chatDate = createElement({ elementType: 'span', textContent: new Date(lastmessage.timeStamp).toString('YYYY-MM-dd').substring(0, 24) })
  let chatMessage = createElement({ elementType: 'p', class: 'c-chats__excerpt', textContent: writenBy + lastmessage.message })
  let chatInformation = createElement({ elementType: 'div', class: 'c-chats__info', childrenArray: [chatTitle, chatDate, chatMessage] })
  let chatListButton = createElement({ elementType: 'button', class: 'c-chats__link', childrenArray: [imageContainer, chatInformation] })
  let chatListItem = createElement({ elementType: 'li', class: 'c-chats__list', childrenArray: [chatListButton] })
  chatListItem.addEventListener('click', () => {
    open_chat_box.textContent = ''
    open_chat_box.append(createElement({ elementType: 'div', class: 'spinner', childrenArray: [createElement({ elementType: 'div' }), createElement({ elementType: 'div' }), createElement({ elementType: 'div' })] })) // append spinner for waiting server response
    requestChatContent(roomID)
    availableChats.forEach(chat => { chat.conversationButton.classList.remove("openedChat") })
    chatListItem.classList.add("openedChat");
  })
  return chatListItem;
}
function makeProfilePicture(userInfo) {
  let { userID, name, surname, role, profilePicture, status } = userInfo
  let memberProfilePicture;
  if (profilePicture == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: name.charAt(0) + surname.charAt(0) })
  else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: profilePicture })
  return memberProfilePicture;
}

document.getElementById("newChat").addEventListener("click", () => {
  chatSearchToogle()
  var searchField = document.getElementById('searchField')
  searchField.focus();
})

//focu on the typing element
function setFocus() {
  document.getElementById('w-input-text').focus();
}

function displayChatOnChatArea(openChatInfo) {
  let { roomInfo, messagesArray } = openChatInfo
  let { roomID, users, roomName, profilePicture, type, lastmessage, myID, unreadCount } = roomInfo
  // let { roomID, roomName, type, profilePicture, myID, messagesArray, usersArray } = roomInfo;
  selectedChatId = roomID
  taggedMessages = [];
  let imageContainer;
  let chatTitleText = ''
  let openchat__box__header;
  let chatActions = []
  let mobileButton = createElement({
    elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-left' })], onclick: showChatList
  })
  let backToChatsButton;
  switch (type) {
    case 0:
      let callButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
      let videoButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })] })
      let moreButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-right' })] })
      let userToDisplay = users.filter(user => user.userID != myID)
      chatActions = [
        { element: callButton, functionCall: () => { call(userToDisplay[0].userID, true, false, false, true, null) } },
        { element: videoButton, functionCall: () => { call(userToDisplay[0].userID, true, true, false, true, null) } },
        { element: moreButton, functionCall: () => { console.log('moreButton', userToDisplay[0].userID) } }
      ]
      if (userToDisplay.length < 1) { // in case we have only one user (viewer)
        chatTitleText = 'Deleted User'
        openchat__box__header = userForAttendanceList(deletedUser, [], [mobileButton])
      } else {
        chatTitleText = userToDisplay[0].name + ' ' + userToDisplay[0].surname
        imageContainer = makeProfilePicture(userToDisplay[0])
        openchat__box__header = userForAttendanceList(userToDisplay[0], chatActions, [mobileButton])
      }
      break;
    case 1:
      if (profilePicture == null) { imageContainer = createElement({ elementType: 'img', class: 'memberProfilePicture', src: '/private/profiles/group.jpeg' }) }
      else { imageContainer = createElement({ elementType: 'img', class: 'memberProfilePicture', src: profilePicture }) }
      if (roomName == null) chatTitleText = users.map(user => user.name + ' ' + user.surname).join(', ');
      else chatTitleText = roomName;
      let groupCallButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })], onclick: () => { call(roomID, true, false, false, true, null) } })
      let groupVideoButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })], onclick: () => { call(roomID, true, false, false, true, null) } })
      let groupMoreButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-chevron-right' })], onclick: () => { console.log('groupMoreButton clicked') } })
      openchat__box__header = createElement({
        elementType: 'div', class: 'c-openchat__box__header', childrenArray: [
          mobileButton,
          createElement({
            elementType: 'div', class: 'c-chat-title', childrenArray: [
              imageContainer,
              createElement({ elementType: 'p', class: 'c-openchat__box__name', textContent: chatTitleText })
            ]
          }),
          createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: [groupCallButton, groupVideoButton, groupMoreButton] })
        ]
      })
      break;
    default:
      break;
  }
  openchat__box__info = createElement({ elementType: 'div', class: 'c-openchat__box__info' })
  openchat__box__info.style.scrollBehavior = "auto" // so that it does not show scrolling while inserting
  let emojiButton = createElement({ elementType: 'button', class: 'chat-options', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-smile' })] })
  let attachButton = createElement({ elementType: 'button', class: 'chat-options', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-paperclip' })] })
  let inputText = createElement({ elementType: 'div', class: 'w-input-text', contentEditable: true })
  let inputPlaceHolder = createElement({ elementType: 'div', class: 'w-placeholder', textContent: 'Type a message' })
  let inputTextGroup = createElement({ elementType: 'div', class: 'w-input-text-group', childrenArray: [inputText, inputPlaceHolder] })
  inputContainer = createElement({ elementType: 'div', class: 'w-input-container', childrenArray: [inputTextGroup], onclick: (e) => inputText.focus() })
  let sendMessageButton = createElement({ elementType: 'button', class: 'chat-options', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-send' })] })
  let typingBox = createElement({ elementType: 'div', class: 'typingBox', childrenArray: [/* emojiButton, attachButton, */ inputContainer, sendMessageButton] })
  let chatBox = createElement({ elementType: 'div', class: 'c-openchat__box', childrenArray: [openchat__box__header, openchat__box__info, typingBox] })
  open_chat_box.textContent = '';
  open_chat_box.append(chatBox)
  openchat__box__info.textContent = '' // ensure that no element is inside the message container
  messagesArray.forEach((message, index) => { addMessageToChat(message, myID) })
  scrollToBottom(openchat__box__info) // scrool to the last message
  openchat__box__info.style.scrollBehavior = "smooth" // enable smooth scrolling

  if (messagesArray.length < 1) {
    openchat__box__info.textContent = ''
    openchat__box__info.append(
      createElement({
        elementType: 'div', class: 'c-openchat__selectConversation', childrenArray: [
          createElement({ elementType: 'img', src: '/images/createChat.png' }),
          createElement({
            elementType: 'h3', childrenArray: [
              'Start typing',
              createElement({ elementType: 'i', class: 'bx bxs-keyboard' }),
              createElement({ elementType: 'br' })]
          }),
          'Your messages will appear here ...'
        ]
      })
    )
  }
  else { openchat__box__info.prepend(createElement({ elementType: 'div', class: 'push-down' })) }

  //grab text message input and process it
  inputText.addEventListener('keydown', function (e) {
    if (e.key == 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  sendMessageButton.addEventListener('click', function (e) {
    if (inputText.innerText.trim() != '') { sendMessage(); e.preventDefault(); }
  });

  function sendMessage() {
    let fDate = formatDate(new Date())
    let message = { toRoom: selectedChatId, message: inputText.innerText.trim(), timeStamp: fDate, taggedMessages: taggedMessages };
    inputText.innerText = '';
    socket.emit('message', message)
    if (taggedMessages.length > 0) messageTagsField.remove()
    taggedMessages = [];
  }
}

function addMessageToChat(message, myID) {
  let messageElement
  if (displayedMessages.length < 1) { // for the first message on chat

    let separator = createSeparator(new Date(message.timeStamp), 'date')
    let groupMessages;
    if (message.userID == myID) {
      messageElement = createSentMessage(message, myID, 'bx bxs-check-circle')
      groupMessages = createSentGroup(messageElement)
    }
    else {
      let profilePic = makeProfilePicture(message.userInfo)
      messageElement = createReceivedMessage(message, myID, true)
      groupMessages = createReceivedGroup(profilePic, messageElement)
    }
    openchat__box__info.appendChild(separator)
    openchat__box__info.appendChild(groupMessages)
  }
  else {
    let lastMessage = displayedMessages[displayedMessages.length - 1]
    console.log('message, myID', message, myID)
    let prevDate = new Date(lastMessage.object.timeStamp)
    let thisDate = new Date(message.timeStamp)
    if (!sameDay(prevDate, thisDate)) { // first I check if it is from the same date in order to establish a separator
      let separator = createSeparator(new Date(message.timeStamp), 'date')
      openchat__box__info.appendChild(separator)
    }
    if (message.userID == myID) { // if it is my Message
      messageElement = createSentMessage(message, myID, 'bx bxs-check-circle')
      if ((thisDate - prevDate) > 60000 || !sameDay(prevDate, thisDate) || message.userID != lastMessage.object.userID) {
        /* 
        we create a new group, if:
        - the message is older than 1 min
        - if the message is not from the same day
        - the message is coming from a different user, 
        */
        groupMessages = createSentGroup(messageElement)
        openchat__box__info.append(groupMessages)
      }
      else {
        lastMessage.messageElement.after(messageElement)
      }
    }
    else { // if it is a received message
      if ((thisDate - prevDate) > 60000 || !sameDay(prevDate, thisDate) || message.userID != lastMessage.object.userID) {
        messageElement = createReceivedMessage(message, myID, true)
        let profilePic = makeProfilePicture(message.userInfo)
        groupMessages = createReceivedGroup(profilePic, messageElement)
        openchat__box__info.append(groupMessages)
      }
      else {
        messageElement = createReceivedMessage(message, myID, false)
        lastMessage.messageElement.after(messageElement)
      }
    }
  }
  displayedMessages.push({ object: message, messageElement: messageElement, reactionsDiv: messageElement.reactionOptions.reactionOptionsDiv });
  console.log('displayedMessages', displayedMessages)
  scrollToBottom(openchat__box__info) // scroll to bottom
}

function createReceivedMessage(message, myID, showSenderName) {
  console.log('message', message)
  // senserName: true / false allows the message to have the senders name attached
  let tagTemplate = message.tagContent.map(tag => {
    return createElement({
      elementType: 'div', class: 'message-tag-text', textContent: tag.message, onclick: () => {
        let taggedMessage = displayedMessages.find(displayedMessage => displayedMessage.object.id == tag.id)
        taggedMessage.messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    })
  })
  let messageReceivedText = createElement({ elementType: 'div', class: 'message-received-text', childrenArray: tagTemplate.concat([createElement({ elementType: 'p', textContent: message.message })]) })
  let sendersName = createElement({ elementType: 'div', class: 'senderOriginName', textContent: message.userInfo.name + ' ' + message.userInfo.surname })
  let reactionOptions = buildOptions(message, myID, messageReceivedText)
  // reactionOptions.reactionOptionsDiv is the element
  let messageElements = [messageReceivedText, reactionOptions]
  if (showSenderName == true) messageElements.push(sendersName)
  let receivedMessage = createElement({ elementType: 'div', class: 'message-received', childrenArray: messageElements })
  receivedMessage.reactionOptions = reactionOptions
  return receivedMessage
}

function createSentMessage(message, myID, statusIcon) {
  let tagTemplate = message.tagContent.map(tag => {
    return createElement({
      elementType: 'div', class: 'message-tag-text', textContent: tag.message, onclick: () => {
        let taggedMessage = displayedMessages.find(displayedMessage => displayedMessage.object.id == tag.id)
        taggedMessage.messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    })
  })
  let messageSentText = createElement({ elementType: 'div', class: 'message-sent-text', childrenArray: tagTemplate.concat([createElement({ elementType: 'p', textContent: message.message })]) })
  let messageStatus = createElement({ elementType: 'div', class: 'message-sent-status', childrenArray: [createElement({ elementType: 'i', class: statusIcon })] })
  let reactionOptions = buildOptions(message, myID, messageSentText)
  let messageElements = [reactionOptions, messageSentText, messageStatus]
  let sentMessage = createElement({ elementType: 'div', class: 'message-sent', childrenArray: messageElements })
  sentMessage.reactionOptions = reactionOptions
  return sentMessage
}

function createReceivedGroup(profilePic, firstMessage) {
  return receivedGroup = createElement({
    elementType: 'div', class: 'message-group-received', childrenArray: [createElement({ elementType: 'div', childrenArray: [profilePic] }), createElement({ elementType: 'div', childrenArray: [firstMessage] })]
  })
}

function createSentGroup(firstMessage) {
  return createElement({ elementType: 'div', class: 'message-group-sent', childrenArray: [firstMessage] })
}

function createSeparator(factor, type) {
  let separator;
  if (type == 'date') separator = createElement({ elementType: 'div', class: 'message-separator', childrenArray: [createElement({ elementType: 'span', textContent: factor.toString('YYYY-MM-dd').substring(0, 15) })] })
  if (type == 'unread') separator = createElement({ elementType: 'div', class: 'message-separator', childrenArray: [createElement({ elementType: 'span', textContent: 'Unread messages' })] })
  return separator;
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

function scrollToBottom(div) { div.scrollTop = div.scrollHeight; }

function reactionTo(messageId, reaction) { socket.emit('messageReaction', { messageId, selectedChatId, reaction }) }

function sameDay(d1, d2) { return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); }

let searchField = document.getElementById('searchField')
searchField.addEventListener('input', function () {
  var text = this.value;
  socket.emit('searchPeople', text);
})
let searchResults = document.getElementById('searchResults')

socket.on('searchPerson', (searchPeople) => {
  searchResults.textContent = '';
  searchPeople.forEach(userInfo => {
    let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })] })
    let audioButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })] })
    let videoButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })] })
    let actions = [
      { element: chatButton, functionCall: () => { initiateChat(userInfo.userID) } },
      { element: audioButton, functionCall: () => { call(userInfo.userID, true, false, false, false, null) } },
      { element: videoButton, functionCall: () => { call(userInfo.userID, true, true, false, false, null) } },
    ]
    let resultElement = userForAttendanceList(userInfo, actions)
    searchResults.appendChild(resultElement)
  })
})

function initiateChat(userID) { socket.emit('makeChat', userID) }

function chatSearchToogle() {
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
  searchResultsContainer.classList.toggle("searchIntoView")
  chatContainingDiv.classList.toggle("hideLeft")
}

function buildOptions(message, myID, messageTextDiv) {
  let referenceBtn = createElement({
    elementType: 'button', class: 'expandOptions', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-paperclip' })], onclick: () => {
      messageReference(message.id, messageTextDiv, inputContainer)
    }
  })
  let deleteBtn = createElement({
    elementType: 'button', class: 'expandOptions', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-trash-alt' })], onclick: () => {
      let icon, title, contentElementsArray, actions;
      icon = 'bx bxs-trash-alt'
      title = 'Delete Message'
      contentElementsArray = [createElement({ elementType: 'div', textContent: 'Do you really want to delete this message? Note that all of the reactions reated are going to be deleted and the receivers will no longer be able to see the content f the message' })]

      cancelButton = createElement({ elementType: 'button', textContent: 'No, Cancel' })
      confirmButton = createElement({ elementType: 'button', textContent: 'Yes, Delete' })
      actions = [
        {
          element: confirmButton,
          functionCall: () => {
            socket.emit('deleteMessage', message.id);
            messageTextDiv.textContent = '__deleted message__'
          }
        },
        {
          element: cancelButton,
          functionCall: () => { }
        }
      ]
      let constraints = { icon, title, contentElementsArray, actions }
      // actions is an array of a button and a function of what it does
      createInScreenPopup(constraints).then(editPopup => {
        cancelButton.addEventListener('click', editPopup.closePopup);
        confirmButton.addEventListener('click', editPopup.closePopup);
      })
    }
  })
  let availableReactions = message.reactions.available.map(reaction => {
    let reactionIcon = createElement({ elementType: 'div', class: 'reactionIconChoose', textContent: reaction.icon, onclick: () => { reactionTo(message.id, reaction.name) } })
    let reactionElement = createElement({ elementType: 'div', class: 'reactionChoice', childrenArray: [reactionIcon, createElement({ elementType: 'div', class: 'reactionName', textContent: reaction.name })] })
    return reactionElement
  })
  let messageTime = createElement({ elementType: 'div', class: 'ReactionTime', textContent: new Date(message.timeStamp).toString('YYYY-MM-dd').substring(16, 24) })
  let time_reactionChoice = message.userID == myID ? [messageTime].concat(availableReactions) : availableReactions.concat([messageTime])

  let msgReactions = createElement({ elementType: 'div', class: 'messageReactions', childrenArray: buildReaction(message.reactions.details, myID) })
  let time_reactions_options = [
    createElement({ elementType: 'div', class: 'messageOptions', childrenArray: [referenceBtn, deleteBtn] }),
    createElement({ elementType: 'div', class: 'time_reactionChoice', childrenArray: time_reactionChoice }),
    msgReactions,
  ]
  if (message.userID == myID) time_reactions_options.reverse()
  else deleteBtn.remove()
  if (messageTextDiv.textContent == '__deleted message__') {
    deleteBtn.remove();
  }
  let timeReactionOptions = createElement({ elementType: 'div', class: 'time_reactions_options', childrenArray: time_reactions_options })
  timeReactionOptions.reactionOptionsDiv = msgReactions;
  return timeReactionOptions
}

function messageReference(msgID, _messageElement, messagesTagsinputArea) {
  if (taggedMessages.includes(msgID)) return;
  let messageElement, closeBtn, messageToShow
  if (taggedMessages.length < 1) {
    taggedMessages.push(msgID)
    messageTagsField = createElement({ elementType: 'div', class: 'taggedMessageInTying' })
    messagesTagsinputArea.prepend(messageTagsField)

    messageElement = _messageElement.cloneNode(true);
    closeBtn = createElement({ elementType: 'button', class: 'btn-remove-tag', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-x-circle' })] })
    messageToShow = createElement({ elementType: 'div', childrenArray: [messageElement, closeBtn] })
    messageTagsField.appendChild(messageToShow)
  }
  else {
    taggedMessages.push(msgID)
    messageElement = _messageElement.cloneNode(true);
    closeBtn = createElement({ elementType: 'button', class: 'btn-remove-tag', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-x-circle' })] })
    messageToShow = createElement({ elementType: 'div', childrenArray: [messageElement, closeBtn] })
    messageTagsField.appendChild(messageToShow)
  }
  closeBtn.addEventListener('click', function () {
    taggedMessages = taggedMessages.filter((id) => id !== msgID)
    messageToShow.remove()
    if (taggedMessages.length == 0) {
      messageTagsField.remove();
    }
  })
}

socket.on('userDisconnected', disconnectionInfo => {
  console.log('user disconnected', disconnectionInfo)
})

function setUserOffline(id, room) {
  console.log('setUserOffline', id, room);
}

/////////////////////Call filtering////////////////////////

/////////////////////////////Call LOG/////////////////////

/////////////////////////////////in call controls//////////////////

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

///////Video Sizing//////////////////////
function toggleFullscreen(element) {
  if (!document.fullscreenElement) { element.requestFullscreen().catch(err => { alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`); }); }
  else { document.exitFullscreen(); }
}

// responsive functions
let ongoingCallLeftPart = document.getElementById('ongoingCallLeftPart')
let callMainScreen = document.getElementById('callMainScreen')
let ongoingCallRightPart = document.getElementById('ongoingCallRightPart')
function showCallLeftPart() {
  ongoingCallLeftPart.classList.remove('mobileHiddenElement')
  callMainScreen.classList.add('mobileHiddenElement')
  ongoingCallRightPart.classList.add('mobileHiddenElement')
}
function showCallMainScreen() {
  ongoingCallLeftPart.classList.add('mobileHiddenElement')
  callMainScreen.classList.remove('mobileHiddenElement')
  ongoingCallRightPart.classList.add('mobileHiddenElement')
}
function showCallRightPart() {
  ongoingCallLeftPart.classList.add('mobileHiddenElement')
  callMainScreen.classList.add('mobileHiddenElement')
  ongoingCallRightPart.classList.remove('mobileHiddenElement')
}

// when my peer is ready with an ID ---> this means that we cannot receive a call before a peer Id is opened
myPeer.on('open', myPeerId => {
  console.log('my peer is now connected with id: ' + myPeerId)
  let myStream;
  let myScreenStream;
  let _callUniqueId;
  let _callTitle;
  let allUsersArray = []
  let globalCallType = "audio"; // by default
  let globalAudioState = 'enabled';
  let screenSharing = false;
  let globalMainVideoDiv;
  let mySideVideoDiv;
  let myScreenSideVideo;
  let myScreenViewers = [];
  let caller_me;
  let videoCoverDiv;
  let awaitedUserDivs = [];
  let optionalResolutions = [{ minWidth: 320 }, { minWidth: 640 }, { minWidth: 1024 }, { minWidth: 1280 }, { minWidth: 1920 }, { minWidth: 2560 }];
  let participants = [];
  let rightPanel;
  let leftPanel;
  let topBar;
  let bottomPanel;
  let callNotifications = []



  socket.on('prepareCallingOthers', initiatedCallInfo => {
    navigator.getUserMedia({ video: { optional: optionalResolutions }, audio: true }, stream => {
      let { callUniqueId, callType, caller, groupMembersToCall_fullInfo, allUsers, callTitle } = initiatedCallInfo
      let { userID, name, surname, profilePicture, role } = caller

      //save these important variables
      _callTitle = callTitle
      allUsersArray = allUsers
      myInfo = caller
      caller_me = caller
      _callUniqueId = callUniqueId
      saveLocalMediaStream(callType, stream)
      rightPanel = createRightPartPanel()
      leftPanel = createLeftPanel()
      // create topBar
      topBar = createTopBar({ callUniqueId: callUniqueId, callType: globalCallType, callTitle: callTitle, isTeam: 'isTeam' }, caller)
      bottomPanel = createBottomPart()
      mySideVideoDiv = createSideVideo(globalCallType, myStream, caller, 'userMedia', globalAudioState)
      rightPanel.participantsBox.prepend(mySideVideoDiv)
      // create awaited users divs
      awaitedUserDivs = allUsers.map(user => {
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

          let actions
          if (user.userID === caller.userID) actions = [{ element: offlineButton, functionCall: () => { } }]
          else actions = [{ element: offlineButton, functionCall: () => { } }, { element: chatButton, functionCall: () => { console.log('chat with user', userID) } }]

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
      //create Cover waiting
      videoCoverDiv = videoConnectingScreen(prepareVideoCoverDiv(allUsers, caller, 'Dialling...', awaitedUserDivs))
      mainVideoDiv.prepend(videoCoverDiv.videoCoverDiv)

      let { closeVideoBtn, HangUpBtn, muteMicrophoneBtn } = videoCoverDiv.controls
      HangUpBtn.addEventListener('click', () => {
        socket.emit('cancelCall', callUniqueId)
        mySideVideoDiv.remove();
        stopWaitingTone() //on the first call of event 'connectUser' if we are the caller: close the waiting tone
        videoCoverDiv.videoCoverDiv.remove() //on the first call of event 'connectUser' if we are the caller: remove waiting div
        topBar.callScreenHeader.textContent = ''
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


    }, (err) => { alert('Failed to get local media stream', err); });
  })
  // -------------------------------------
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
    leftPanel.updateUserStatus(userInfo, 'rejected')
  })

  //Handle TimedOutCall
  socket.on('callNotAnswered', timeoutDetails => {
    console.log('remote call not answered')
    let { callUniqueId, userInfo } = timeoutDetails
    for (let i = 0; i < awaitedUserDivs.length; i++) {
      const awaitedDiv = awaitedUserDivs[i];
      if (awaitedDiv.userID == userInfo.userID) {

        let memberProfilePicture;
        if (userInfo.profilePicture == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
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
    leftPanel.updateUserStatus(userInfo, 'notAnswered')
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
    if (videoCoverDiv) if (videoCoverDiv.calleesDiv) videoCoverDiv.calleesDiv.prepend(addeduserDiv)
    if (awaitedUserDivs) awaitedUserDivs.push({ userID: userInfo.userID, div: addeduserDiv })

    //add this new users to the attendance list
    allUsersArray.push(userInfo)
    leftPanel.addUser(userInfo)
  })
  // -------------------------------------
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
    notification.callUniqueId = callUniqueId
    callNotifications.push(notification)
  })
  socket.on('callCancelled', (callInfo) => {
    console.log('call cancelled', callInfo)
    let callUniqueId = callInfo.callUniqueId
    for (let i = 0; i < callNotifications.length; i++) {
      if (callNotifications[i].callUniqueId == callUniqueId) {
        callNotifications[i].notificationStop()
        callNotifications.splice(i, 1)
      }
    }
  })

  function callAnswerByType(answertype, myPeerId, callUniqueId, myInfo, allUsers, callTitle) {
    navigator.getUserMedia({ video: true, audio: true }, stream => {
      responded = true
      _callTitle = callTitle
      allUsersArray = allUsers
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
      leftPanel = createLeftPanel()
      showOngoingCallSection()
    }, (err) => { alert('Failed to get local media stream', err); });
  }
  socket.on('updateAllParticipantsList', allUsers => {
    allUsersArray = allUsers
    leftPanel.updateComponentsArray()
  })

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
      participant.userMedia.sideVideoDiv = createSideVideo(callType, userVideoStream, userInfo, 'userMedia', 'enabled') // create and save the side video element // audio is enbaed by default because the acceptant does not have time to disable audio
      rightPanel.participantsBox.append(participant.userMedia.sideVideoDiv) // display this user's video
      participant.userMedia.bubble = bottomPanel.createBubble(callType, userVideoStream, userInfo, 'userMedia', 'enabled') // create and save the side video element
      bottomPanel.availableScreensDiv.append(participant.userMedia.bubble) // display bubble
      stopWaitingTone() //on the first call of event 'connectUser' if we are the caller: close the waiting tone
      leftPanel.updateUserStatus(userInfo, 'present')
      if (videoCoverDiv) if (videoCoverDiv.videoCoverDiv) videoCoverDiv.videoCoverDiv.remove() //on the first call of event 'connectUser' if we are the caller: remove waiting div
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
      leftPanel.updateUserStatus(userInfo, 'absent')
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

    leftPanel.updateUserStatus(incomingPeerInfo, 'present');
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
    console.log(allUsers)
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

    let micText = userID == mySavedID ? 'You have muted your Mic.' : name + ' muted their Mic.'
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
    let { userInfo, room } = disconnectionInfo;
    console.log('userDisconnected', userInfo.userID, room)

    if (isNumeric(room)) setUserOffline(userInfo.userID, room)
    if (!isNumeric(room) && room.includes('-allAnswered-sockets')) {
      removePeer(userInfo.userID);
      leftPanel.updateUserStatus(userInfo, 'offline')
    }
  })

  socket.on('userLeftCall', userInfo => {
    removePeer(userInfo.userID)
    console.log('userLeftCall', userInfo.userID)
    leftPanel.updateUserStatus(userInfo, 'absent')
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
    mySideVideoDiv.remove();
    rightPanel.participantsBox.textContent = '';
    if (globalMainVideoDiv) globalMainVideoDiv.textContent = '';
    awaitedUserDivs = [];
    topBar.callScreenHeader.textContent = '';
    bottomPanel.textContent = '';
    allUsersArray = []
    leftPanel.clearAttendanceList()
  }
  function createRightPartPanel() {
    let participantsCount = 0;
    let unreadmessagesCount = 0;
    // Header
    let backToMainscreenBtn = createElement({ elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-call bx-flashing' })], onclick: showCallMainScreen })

    let participantsSelectorBtn = createElement({ elementType: 'div', class: 'rightHeaderItem participants headerItemSelected', textContent: 'Participants ' + participantsCount })
    let messagesSelectorbtn = createElement({ elementType: 'div', class: 'rightHeaderItem callChat', textContent: 'Messages ' + unreadmessagesCount })
    let rightPartheaderVideoMessaging = createElement({ elementType: 'div', class: 'rightPartheaderVideoMessaging', childrenArray: [backToMainscreenBtn, participantsSelectorBtn, messagesSelectorbtn] })
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
    let Message = createElement({ elementType: 'button', class: 'chat-options', title: 'Send Message', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-send' })] })
    let typingBox = createElement({ elementType: 'div', class: 'typingBox', childrenArray: [iconButton, inputContainer, Message] })

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
    Message.addEventListener('click', sendMessage)
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
        scrollToBottom(c_openchat__box__info)
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
        let senderOriginName = createElement({ elementType: 'div', class: 'senderOriginName', textContent: message.userInfo.name + ' ' + message.userInfo.surname })
        let receivedMessagesHolder = createElement({ elementType: 'div', childrenArray: [firstMessage, senderOriginName] })
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
    let backToMainscreenBtn = createElement({ elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-call bx-flashing' })], onclick: showCallMainScreen })
    let presenceSelectorBtn = createElement({ elementType: 'div', class: 'leftHeaderItem headerItemSelected', textContent: 'Present ' + 1 })
    let absenceSelectorBtn = createElement({ elementType: 'div', class: 'leftHeaderItem', textContent: 'Absent ' + 2 })
    let attendanceTitleSection = createElement({ elementType: 'div', class: 'attendanceTitleSection', childrenArray: [presenceSelectorBtn, absenceSelectorBtn, backToMainscreenBtn] })

    let presentMembersDiv = createElement({ elementType: 'div', class: 'presentMembersDiv' })
    let absentMembersDiv = createElement({ elementType: 'div', class: 'absentMembersDiv hiddenDiv' })
    let attendanceContentDiv = createElement({ elementType: 'div', class: 'attendanceContentDiv', childrenArray: [presentMembersDiv, absentMembersDiv] })

    presenceSelectorBtn.addEventListener('click', () => {
      presenceSelectorBtn.classList.add('headerItemSelected');
      absenceSelectorBtn.classList.remove('headerItemSelected');
      presentMembersDiv.classList.remove('hiddenDiv')
      absentMembersDiv.classList.add('hiddenDiv')
    })
    absenceSelectorBtn.addEventListener('click', () => {
      presenceSelectorBtn.classList.remove('headerItemSelected');
      absenceSelectorBtn.classList.add('headerItemSelected');
      presentMembersDiv.classList.add('hiddenDiv')
      absentMembersDiv.classList.remove('hiddenDiv')
    })
    ongoingCallLeftPart.append(attendanceTitleSection, attendanceContentDiv)

    function updateNumbers() {
      presenceSelectorBtn.textContent = 'Present ' + presentMembersDiv.childElementCount
      absenceSelectorBtn.textContent = 'Absent ' + absentMembersDiv.childElementCount
    }

    let componentsArray = allUsersArray.map(user => {
      if (user.userID == mySavedID) { //do not put any button on my presence div
        let presenceDiv = userForAttendanceList(user, [])
        return { userInfo: user, presenceDiv: presenceDiv, onlineStatus: user.status, onCallStatus: 'present' }
      }
      else {
        if (user.status == 'offline') {
          let offlineButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' }), createElement({ elementType: 'p', textContent: 'Offline' })] })
          let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
          let actions = [
            { element: offlineButton, functionCall: () => { } },
            { element: chatButton, functionCall: () => { console.log('chat with user', user.userID) } }
          ]
          let presenceDiv = userForAttendanceList(user, actions)
          return { userInfo: user, presenceDiv: presenceDiv, onlineStatus: user.status, onCallStatus: 'offline' }
        }
        else {
          let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
          let ringButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ringing...' })] })
          let actions = [
            { element: ringButton, functionCall: () => { console.log('Ring user', user.userID); } },
            { element: chatButton, functionCall: () => { console.log('chat with user', user.userID) } }
          ]
          let presenceDiv = userForAttendanceList(user, actions)
          return { userInfo: user, presenceDiv: presenceDiv, onlineStatus: user.status, onCallStatus: 'ringing' }
        }
      }
    })
    refreshAttendaceList()
    updateNumbers()

    function updateComponentsArray() {
      let currentUsers = componentsArray.map(component => { return component.userInfo.userID })
      for (let i = 0; i < allUsersArray.length; i++) {
        if (!currentUsers.includes(allUsersArray[i].userID)) {
          if (allUsersArray[i].status == 'offline') {
            let offlineButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' }), createElement({ elementType: 'p', textContent: 'Offline' })] })
            let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
            let actions = [
              { element: offlineButton, functionCall: () => { } },
              { element: chatButton, functionCall: () => { console.log('chat with user', allUsersArray[i].userID) } }
            ]
            let presenceDiv = userForAttendanceList(allUsersArray[i], actions)
            componentsArray.push({ userInfo: allUsersArray[i], presenceDiv: presenceDiv, onlineStatus: allUsersArray[i].status, onCallStatus: 'offline' })
          }
          else {
            let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
            let ringButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ringing...' })] })
            let actions = [
              { element: ringButton, functionCall: () => { console.log('Ring user', allUsersArray[i].userID); } },
              { element: chatButton, functionCall: () => { console.log('chat with user', allUsersArray[i].userID) } }
            ]
            let presenceDiv = userForAttendanceList(allUsersArray[i], actions)
            componentsArray.push({ userInfo: allUsersArray[i], presenceDiv: presenceDiv, onlineStatus: allUsersArray[i].status, onCallStatus: 'ringing' })
          }
        }
      }
      refreshAttendaceList()
      updateNumbers()
    }
    function refreshAttendaceList() {
      absentMembersDiv.textContent = ''
      presentMembersDiv.textContent = ''
      for (let i = 0; i < componentsArray.length; i++) {
        switch (componentsArray[i].onCallStatus) {
          case 'present':
            presentMembersDiv.append(componentsArray[i].presenceDiv)
            break;
          case 'ringing':
            absentMembersDiv.append(componentsArray[i].presenceDiv)
            break;
          case 'offline':
            absentMembersDiv.append(componentsArray[i].presenceDiv)
            break;
          case 'rejected':
            absentMembersDiv.append(componentsArray[i].presenceDiv)
            break;
          case 'notAnswered':
            absentMembersDiv.append(componentsArray[i].presenceDiv)
            break;
          case 'absent':
            absentMembersDiv.append(componentsArray[i].presenceDiv)
            break;
          default:
            break;
        }
      }
    }
    function updateUserStatus(userInfo, userStatus) { // userStatus: present, ringing, offline, rejected, notAnswered, absent
      for (let i = 0; i < componentsArray.length; i++) {
        if (componentsArray[i].userInfo.userID == userInfo.userID) {
          let chatButton;
          let offlineButton;
          let actions = [];
          let presenceDiv;
          let callAgainButton;
          switch (userStatus) {
            case 'present':
              chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
              actions = [{ element: chatButton, functionCall: () => { console.log('chat with user', userInfo.userInfo.userID) } }]
              presenceDiv = userForAttendanceList(userInfo, actions)
              componentsArray[i] = { userInfo: userInfo, presenceDiv: presenceDiv, onlineStatus: userInfo.status, onCallStatus: 'present' }
              break;
            case 'ringing':
              ringButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ringing...' })] })
              chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
              actions = [
                { element: ringButton, functionCall: () => { } },
                { element: chatButton, functionCall: () => { console.log('chat with user', userInfo.userID) } }
              ]
              presenceDiv = userForAttendanceList(userInfo, actions)
              componentsArray[i] = { userInfo: userInfo, presenceDiv: presenceDiv, onlineStatus: userInfo.status, onCallStatus: 'ringing' }
              break;
            case 'offline':
              offlineButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' }), createElement({ elementType: 'p', textContent: 'Offline' })] })
              chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
              actions = [
                { element: offlineButton, functionCall: () => { } },
                { element: chatButton, functionCall: () => { console.log('chat with user', userInfo.userID) } }
              ]
              presenceDiv = userForAttendanceList(userInfo, actions)
              componentsArray[i] = { userInfo: userInfo, presenceDiv: presenceDiv, onlineStatus: userInfo.status, onCallStatus: 'offline' }
              break;
            case 'rejected':
              offlineButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-x' }), createElement({ elementType: 'p', textContent: 'Rejected' })] })
              callAgainButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ring' })] })
              chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
              actions = [
                { element: offlineButton, functionCall: () => { } },
                { element: callAgainButton, functionCall: () => { console.log('ring again user', userInfo.userID) } },
                { element: chatButton, functionCall: () => { console.log('chat with user', userInfo.userID) } }
              ]
              presenceDiv = userForAttendanceList(userInfo, actions)
              componentsArray[i] = { userInfo: userInfo, presenceDiv: presenceDiv, onlineStatus: userInfo.status, onCallStatus: 'offline' }
              break;
            case 'absent':
              callAgainButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ring' })] })
              chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
              actions = [
                { element: callAgainButton, functionCall: () => { console.log('ring again user', userInfo.userID) } },
                { element: chatButton, functionCall: () => { console.log('chat with user', userInfo.userID) } }
              ]
              presenceDiv = userForAttendanceList(userInfo, actions)
              componentsArray[i] = { userInfo: userInfo, presenceDiv: presenceDiv, onlineStatus: userInfo.status, onCallStatus: 'absent' }
              break;
            case 'notAnswered':
              notAnsweredButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-x' }), createElement({ elementType: 'p', textContent: 'Not answered' })] })
              callAgainButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ring' })] })
              chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
              actions = [
                { element: notAnsweredButton, functionCall: () => { } },
                { element: callAgainButton, functionCall: () => { console.log('ring again user', userInfo.userID) } },
                { element: chatButton, functionCall: () => { console.log('chat with user', userInfo.userID) } }
              ]
              presenceDiv = userForAttendanceList(userInfo, actions)
              componentsArray[i] = { userInfo: userInfo, presenceDiv: presenceDiv, onlineStatus: userInfo.status, onCallStatus: 'offline' }
              break;
            default:
              break;
          }
        }
      }
      refreshAttendaceList()
      updateNumbers()
    }
    function addUser(user) {
      if (user.userID == mySavedID) { //do not put any button on my presence div
        let presenceDiv = userForAttendanceList(user, [])
        componentsArray.push({ userInfo: user, presenceDiv: presenceDiv, onlineStatus: user.status, onCallStatus: 'present' })
      }
      else {
        if (user.status == 'offline') {
          let offlineButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone-off' }), createElement({ elementType: 'p', textContent: 'Offline' })] })
          let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
          let actions = [
            { element: offlineButton, functionCall: () => { } },
            { element: chatButton, functionCall: () => { console.log('chat with user', user.userID) } }
          ]
          let presenceDiv = userForAttendanceList(user, actions)
          componentsArray.push({ userInfo: user, presenceDiv: presenceDiv, onlineStatus: user.status, onCallStatus: 'offline' })
        }
        else {
          let ringButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-bell-ring' }), createElement({ elementType: 'p', textContent: 'Ringing...' })] })
          let chatButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-detail' })] })
          let actions = [
            { element: ringButton, functionCall: () => { } },
            { element: chatButton, functionCall: () => { console.log('chat with user', user.userID) } },
          ]
          let presenceDiv = userForAttendanceList(user, actions)
          componentsArray.push({ userInfo: user, presenceDiv: presenceDiv, onlineStatus: user.status, onCallStatus: 'ringing' })
        }
      }
      refreshAttendaceList()
      updateNumbers()
    }
    function clearAttendanceList() {
      allUsersArray = []
      componentsArray = []
      refreshAttendaceList()
      updateNumbers()
      presentMembersDiv.textContent = ''
      absentMembersDiv.textContent = ''
    }
    return {
      leftPanel: ongoingCallLeftPart,
      addUser: addUser, // function that accepts (userInfo)
      updateUserStatus: updateUserStatus, // function accepts(userInfo, userStatus) as arguments
      updateComponentsArray: updateComponentsArray,
      clearAttendanceList: clearAttendanceList
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
      if (callMediaType == 'screenMedia') bubble.classList.add('screen')
      return bubble
    }
    return {
      createBubble: createBottomBubble, // it accepts : callType, stream, userInfo, callMediaType, audioState
      availableScreensDiv: availableScreensDiv
    }
  }

  socket.on('searchPeopleToInviteToCall', (searchPeople) => {
    console.log(searchPeople)
    if (searchPeople.length == 0) { return topBar.invitedDiv.textContent = 'No user found.' }
    topBar.invitedDiv.textContent = ''
    searchPeople.forEach((searchPerson) => {
      let searchPersonElement;
      let element = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-user-plus' })] })
      let actions = [
        {
          element, functionCall: () => {
            console.log('add user; ', searchPerson.userID)
            searchPersonElement.remove()
            socket.emit('addUserToCall', { callUniqueId: _callUniqueId, userID: searchPerson.userID, callType: globalCallType, callTitle: _callTitle });
          }
        }
      ];
      searchPersonElement = userForAttendanceList(searchPerson, actions)
      topBar.invitedDiv.append(searchPersonElement)
    })
  })
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
  if (configuration.value) elementToReturn.setAttribute('value', configuration.value)
  if (configuration.srcObject) elementToReturn.srcObject = configuration.srcObject
  if (configuration.src) elementToReturn.src = configuration.src
  if (configuration.textContent) elementToReturn.textContent = configuration.textContent
  if (configuration.childrenArray) configuration.childrenArray.forEach(child => elementToReturn.append(child))
  if (configuration.onclick) elementToReturn.addEventListener('click', configuration.onclick)
  if (configuration.autoPlay) elementToReturn.setAttribute('autoplay', 'true')
  if (configuration.type) elementToReturn.setAttribute('type', configuration.type)
  if (configuration.placeHolder) elementToReturn.setAttribute('placeholder', configuration.placeHolder)
  if (configuration.contentEditable) elementToReturn.setAttribute('contentEditable', configuration.contentEditable)
  if (configuration.for) elementToReturn.setAttribute('for', configuration.for)
  if (configuration.method) elementToReturn.setAttribute('method', configuration.method)
  if (configuration.hidden) elementToReturn.setAttribute('hidden', configuration.hidden)
  if (configuration.name) elementToReturn.setAttribute('name', configuration.name)
  if (configuration.action) elementToReturn.setAttribute('action', configuration.action)
  if (configuration.tabIndex) elementToReturn.setAttribute('tabindex', configuration.tabIndex)
  if (configuration.href) elementToReturn.setAttribute('href', configuration.href)
  if (configuration.style) elementToReturn.setAttribute('style', configuration.style)
  if (configuration.cy) elementToReturn.setAttribute('cy', configuration.cy)
  if (configuration.cx) elementToReturn.setAttribute('cx', configuration.cx)
  if (configuration.r) elementToReturn.setAttribute('r', configuration.r)
  if (configuration.xmlns) elementToReturn.setAttribute('xmlns', configuration.xmlns)
  if (configuration.viewBox) elementToReturn.setAttribute('viewBox', configuration.viewBox)
  if (configuration.autoplay) elementToReturn.autoplay = configuration.autoplay
  return elementToReturn
}

function userForAttendanceList(userInfo, actions, preActions) {
  let { userID, name, surname, role, profilePicture, status } = userInfo
  // actions is an array of buttons where on item is {element, functionCall}
  // container is presentMembersDiv
  let memberProfilePicture = makeProfilePicture(userInfo)

  let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: name + ' ' + surname })
  let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: role })
  let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

  let actionElements = actions.map(action => {
    //let { element, functionCall } = action
    let { element, functionCall } = action
    element.addEventListener('click', functionCall)
    return element;
  })
  let elementsArray = [memberProfilePicture, memberNameRole].concat(actionElements)
  if (preActions != undefined) elementsArray = preActions.concat(elementsArray)

  let presentMember = createElement({ elementType: 'div', class: 'listMember', childrenArray: elementsArray })
  return presentMember
}
function companyForList(companyInfo, actions, preActions) {
  let { id, name, description, logo, cover } = companyInfo;
  console.log('companyInfo', companyInfo)
  // actions is an array of buttons where on item is {element, functionCall}
  let memberProfilePicture;
  if (logo == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: name.slice(0, 2) })
  else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: logo })

  let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: name })
  let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: description })
  let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })

  let actionElements = actions.map(action => {
    let { element, functionCall } = action
    element.addEventListener('click', functionCall)
    return element;
  })
  let elementsArray = [memberProfilePicture, memberNameRole].concat(actionElements)
  if (preActions != undefined) elementsArray = preActions.concat(elementsArray)
  let presentMember = createElement({ elementType: 'div', class: 'listMember', childrenArray: elementsArray })
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
function chat(corespondantId) {
  socket.emit('makeChat', corespondantId)
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

function startWaitingTone() { waitingTone.play() }
function stopWaitingTone() { waitingTone.currentTime = 0; waitingTone.pause() }

function videoConnectingScreen(constraints) {
  let { isGroup, awaitedUserDivs, displayInitials, profilePicture, screenMessage, spinner } = constraints
  // isGroup: isGroup, awaitedUserDivs: awaitedUserDivs, displayInitials: displayInitials, profilePicture: profilePicture, screenMessage: reason, spinner: true,
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

//exemplary app entry Notification Code
let notification = displayNotification({
  title: { iconClass: 'bx bxs-door-open', titleText: 'Welcome' },
  body: {
    shortOrImage: { shortOrImagType: 'image', shortOrImagContent: '/private/profiles/group.jpeg' },
    bodyContent: 'Welcome to ImperiumLine.com, an ezy way to connect with people and teams that/where you belong/care. Enjoy the app'
  },
  actions: [
    // { type: 'confirm', displayText: 'Answer', actionFunction: () => { console.log('call answered') } }
  ],
  obligatoryActions: {
    onDisplay: () => { console.log('Notification Displayed') },
    onHide: () => { console.log('Notification Hidden') },
    onEnd: () => { console.log('Notification Ended') },
  },
  delay: 60000,
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
  let popDown = createElement({ elementType: 'div', class: 'popdown', childrenArray: [searchField, invitedDiv] })
  let inviteSomeone = createElement({
    elementType: 'button',
    class: 'inviteSomeone',
    childrenArray: [
      createElement({ elementType: 'i', class: 'bx bx-plus' }),
      createElement({ elementType: 'p', textContent: 'Add Participants' }),
    ],
    onclick: () => {
      input.focus();
      popDown.classList.toggle('popdownDisplayed');
    }
  })
  doneBtn.addEventListener('click', () => { popDown.classList.toggle('popdownDisplayed') })
  let headerRightPart = createElement({ elementType: 'div', class: 'headerRightPart', childrenArray: [inviteSomeone, popDown] })
  callScreenHeader.textContent = '';
  let showLeftpartBtn = createElement({ elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-list-check' })], onclick: showCallLeftPart })
  let showRightpartBtn = createElement({ elementType: 'button', class: 'mobileButton', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-chat' })], onclick: showCallRightPart })
  callScreenHeader.append(showLeftpartBtn, headerLeftPart, headerRightPart, showRightpartBtn)
  return { callScreenHeader, invitedDiv }
}

async function createInScreenPopup(constraints) {
  let { icon, title, contentElementsArray, actions } = constraints
  // actions is an array of a button and a function of what it does
  if (openPopupDiv) openPopupDiv.closePopup()
  let defaultClosebtn = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-x' })] })
  let headerActions = createElement({ elementType: 'div', class: 'universalCallButtons', childrenArray: [defaultClosebtn] })
  let headerText = createElement({ elementType: 'div', class: 'headerText', childrenArray: [createElement({ elementType: 'i', class: icon }), createElement({ elementType: 'p', textContent: title })] })
  let popupHeader = createElement({ elementType: 'div', class: 'popupTitle', childrenArray: [headerText, headerActions] })
  let popupBody = createElement({ elementType: 'div', class: 'popupBody', childrenArray: contentElementsArray })
  let bottomButtons = actions.map(action => { action.element.addEventListener('click', action.functionCall); return action.element; })
  let popupBottom = createElement({ elementType: 'div', class: 'popupBottom', childrenArray: bottomButtons })
  let inScreenPanel = createElement({ elementType: 'div', class: 'inScreenPanel', childrenArray: [popupHeader, popupBody, popupBottom] })
  body.append(inScreenPanel)
  await new Promise(resolve => setTimeout(resolve, 20)) // wait 20 millisecons / helps the animation
  inScreenPanel.classList.add('visible') // add the visibility class so that the item transitions into screen
  async function removePopup() {
    inScreenPanel.classList.remove('visible')
    await new Promise(resolve => setTimeout(resolve, 3000))
    inScreenPanel.remove()
  }
  defaultClosebtn.addEventListener('click', removePopup)
  inScreenPanel.closePopup = removePopup
  openPopupDiv = inScreenPanel
  return inScreenPanel
}

async function createProfilePopup(userInfo, editProfile = false) {
  // delete the existing Div
  if (openProfileDiv) openProfileDiv.remove()
  //coverPhotoDiv
  let coverPhoto;
  if (userInfo.cover == null) { coverPhoto = createElement({ elementType: 'div', class: 'coverPhoto', textContent: userInfo.name + ' ' + userInfo.surname.charAt(0) + '.' }) }
  else { coverPhoto = createElement({ elementType: 'img', class: 'coverPhoto', src: userInfo.cover }) }
  // close div button
  let closeButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bx-x' })] })
  let photoActionClose = createElement({ elementType: 'div', class: 'photoAction', childrenArray: [closeButton] })
  let coverPhotoActions = createElement({ elementType: 'div', class: 'photoActions', childrenArray: [photoActionClose] })
  let coverPhotoDiv = createElement({ elementType: 'div', class: 'coverPhotoDiv', childrenArray: [coverPhoto, coverPhotoActions] })

  let profilePicture;
  if (userInfo.profilePicture == null) { profilePicture = createElement({ elementType: 'div', class: 'profilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) }) }
  else { profilePicture = createElement({ elementType: 'img', class: 'profilePicture', src: userInfo.profilePicture }) }

  let userProfileDiv = createElement({ elementType: 'div', class: 'userProfileDiv', childrenArray: [profilePicture] })
  // if user is online
  if (userInfo.status != 'offline') {
    let onlineIndicator = createElement({ elementType: 'div', class: 'onlineIndicator' })
    userProfileDiv.append(onlineIndicator)
  }

  // userPrimaryInfo
  let name = createElement({ elementType: 'div', class: 'name', textContent: userInfo.name + ' ' + userInfo.surname })
  let email = createElement({ elementType: 'a', class: 'email', href: "mailto:" + userInfo.email, textContent: userInfo.email })
  let position = createElement({ elementType: 'div', class: 'position', textContent: userInfo.role })
  let userPrimaryInfo = createElement({ elementType: 'div', class: 'userPrimaryInfo', childrenArray: [name, email, position] })

  // organization
  let memberProfilePicture
  if (userInfo.company.logo == null) memberProfilePicture = createElement({ elementType: 'div', class: 'memberProfilePicture', textContent: userInfo.company.name.substring(0, 2) })
  else memberProfilePicture = createElement({ elementType: 'img', class: 'memberProfilePicture', src: userInfo.company.logo })
  let memberName = createElement({ elementType: 'div', class: 'memberName', textContent: userInfo.company.name })
  let memberRole = createElement({ elementType: 'div', class: 'memberRole', textContent: userInfo.company.description })
  let memberNameRole = createElement({ elementType: 'div', class: 'memberNameRole', childrenArray: [memberName, memberRole] })
  let presentMember = createElement({ elementType: 'div', class: 'listMember', childrenArray: [memberProfilePicture, memberNameRole] })
  let presentMembersDiv = createElement({ elementType: 'div', class: 'presentMembersDiv', childrenArray: [presentMember] })

  let userSecondaryInfo = createElement({
    elementType: 'div', class: 'userSecondaryInfo', childrenArray: [presentMembersDiv]
  })
  // userDataDiv
  let userDataDiv = createElement({ elementType: 'div', class: 'userDataDiv', childrenArray: [userProfileDiv, userPrimaryInfo, userSecondaryInfo] })

  //combine cover with user profile
  let mainCentralProfileDiv = createElement({ elementType: 'div', class: 'mainCentralProfileDiv', childrenArray: [coverPhotoDiv, userDataDiv] })

  if (editProfile == true) {
    // cover edit - buttons
    let editButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-edit-alt' })] })
    let coverDeleteBtn = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-trash-alt' })] })
    let changePictureBtn = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-camera' })] })
    let editControls = createElement({ elementType: 'div', class: 'editControls', tabIndex: "0", childrenArray: [coverDeleteBtn, changePictureBtn] })
    let photoActionEdit = createElement({ elementType: 'div', class: 'photoAction', childrenArray: [editButton, editControls] })

    let coverPictureInputElement = createElement({ elementType: 'input', type: 'file', id: 'coverPictureInputElement', class: 'hidden' })
    let selectCoverBtn = createElement({ elementType: 'label', for: 'coverPictureInputElement', class: 'uploadIcon', tabIndex: "0", childrenArray: [createElement({ elementType: 'i', class: 'bx bx-upload' })] })
    let coverPicProgressBar = createBarLoader()
    coverPhotoDiv.append(selectCoverBtn, coverPictureInputElement, coverPicProgressBar)

    coverPhotoActions.prepend(photoActionEdit)
    editButton.addEventListener('click', () => { editControls.classList.toggle('visible'); editControls.focus() })
    editControls.addEventListener('blur', () => { editControls.classList.remove('visible') })

    changePictureBtn.addEventListener('click', () => { selectCoverBtn.classList.add('visible'); selectCoverBtn.focus(); })
    selectCoverBtn.addEventListener('blur', () => { selectCoverBtn.classList.remove('visible'); })

    // listen to coverPhotoUpload
    var coverPictureUploader = new SocketIOFileUpload(socket);
    coverPictureUploader.maxFileSize = 1024 * 1024 * 1024; // 10 MB limit
    coverPictureUploader.listenOnInput(coverPictureInputElement);
    // Do something on start progress:
    coverPictureUploader.addEventListener("start", function (event) {
      event.file.meta.fileRole = "coverPicture";
      coverPicProgressBar.classList.add('visible');
    });
    // Do something on upload progress:
    coverPictureUploader.addEventListener("progress", function (event) {
      var percent = (event.bytesLoaded / event.file.size) * 100;
      coverPicProgressBar.setPercentage(percent.toFixed(2))
      console.log("File is", percent.toFixed(2), "percent loaded");
    });
    // Do something when a file is uploaded:
    coverPictureUploader.addEventListener("complete", function (event) {
      // console.log("complete", event.detail.name);
      coverPicProgressBar.classList.remove('visible');
      console.log("coverPhoto", event);
      let newCoverPhoto = createElement({ elementType: 'img', class: 'coverPhoto', src: 'private/cover/' + event.detail.name })
      coverPhoto.after(newCoverPhoto);
      coverPhoto.remove();
      coverPhoto = newCoverPhoto;
    });


    //-------------------------------------------------------------------
    // profile edit Buttons
    let profileEditButton = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-edit-alt' })] })
    let profileDeleteBtn = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-trash-alt' })] })
    let profileChangePictureBtn = createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-camera' })] })
    let profileEditControls = createElement({ elementType: 'div', class: 'editControls', tabIndex: "0", childrenArray: [profileDeleteBtn, profileChangePictureBtn] })
    let profilePhotoActionEdit = createElement({ elementType: 'div', class: 'photoAction', childrenArray: [profileEditButton, profileEditControls] })
    let profilePhotoActions = createElement({ elementType: 'div', class: 'photoActions', childrenArray: [profilePhotoActionEdit] })

    let profilePictureInputElement = createElement({ elementType: 'input', type: 'file', id: 'profilePictureInputElement', class: 'hidden' })
    let selectPictureBtn = createElement({ elementType: 'label', for: 'profilePictureInputElement', class: 'uploadIcon', tabIndex: "0", childrenArray: [createElement({ elementType: 'i', class: 'bx bx-upload' })] })
    selectPictureBtn.addEventListener('blur', () => { selectPictureBtn.classList.remove('visible') })
    let circleLoader = createCircleLoader()
    userProfileDiv.append(selectPictureBtn, profilePictureInputElement, circleLoader)

    userProfileDiv.prepend(profilePhotoActions)
    profileEditButton.addEventListener('click', () => { profileEditControls.classList.toggle('visible'); profileEditControls.focus() })
    profileEditControls.addEventListener('blur', () => { profileEditControls.classList.remove('visible') })
    profileChangePictureBtn.addEventListener('click', () => { selectPictureBtn.classList.add('visible'); selectPictureBtn.focus(); })

    // listen to coverPhotoUpload
    var profilePictureUploader = new SocketIOFileUpload(socket);
    profilePictureUploader.maxFileSize = 1024 * 1024 * 1024; // 10 MB limit
    profilePictureUploader.listenOnInput(profilePictureInputElement);
    // Do something on start progress:
    profilePictureUploader.addEventListener("start", function (event) {
      event.file.meta.fileRole = "profilePicture";
      circleLoader.classList.add('visible');
    });
    // Do something on upload progress:
    profilePictureUploader.addEventListener("progress", function (event) {
      var percent = (event.bytesLoaded / event.file.size) * 100;
      circleLoader.setPercentage(percent.toFixed(2))
      console.log("File is", percent.toFixed(2), "percent loaded");
    });
    // Do something when a file is uploaded:
    profilePictureUploader.addEventListener("complete", function (event) {
      // console.log("complete", event.detail.name);
      circleLoader.classList.remove('visible');
      console.log("profilePhoto", event);
      let newProfilePhoto = createElement({ elementType: 'img', class: 'profilePicture', src: 'private/profiles/' + event.detail.name })

      profilePicture.after(newProfilePhoto);
      profilePicture.remove();
      profilePicture = newProfilePhoto;
    });

    coverDeleteBtn.addEventListener('click', () => {
      socket.emit('deleteCoverPicture')
      let newCoverPhoto = createElement({ elementType: 'div', class: 'coverPhoto', textContent: userInfo.name + ' ' + userInfo.surname.charAt(0) + '.' })
      coverPhoto.after(newCoverPhoto);
      coverPhoto.remove();
      coverPhoto = newCoverPhoto;

    })

    profileDeleteBtn.addEventListener('click', () => {
      socket.emit('deleteProfilePicture');
      let newProfilePhoto = createElement({ elementType: 'div', class: 'profilePicture', textContent: userInfo.name.charAt(0) + userInfo.surname.charAt(0) })
      profilePicture.after(newProfilePhoto);
      profilePicture.remove();
      profilePicture = newProfilePhoto;
    })

  } else {
    let universalCallButtons = createElement({
      elementType: 'div', class: 'universalCallButtons', childrenArray: [
        createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-message-square-dots' })], onclick: () => { chat(userInfo.userID) } }),
        createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-phone' })], onclick: () => { call(userInfo.userID, true, false, false, false, null) } }),
        createElement({ elementType: 'button', childrenArray: [createElement({ elementType: 'i', class: 'bx bxs-video' })], onclick: () => { call(userInfo.userID, true, true, false, false, null) } })
      ]
    })
    userSecondaryInfo.prepend(universalCallButtons)
  }
  body.append(mainCentralProfileDiv)
  await new Promise(resolve => setTimeout(resolve, 20))
  mainCentralProfileDiv.classList.add('visible')
  closeButton.addEventListener('click', async () => {
    mainCentralProfileDiv.classList.remove('visible')
    await new Promise(resolve => setTimeout(resolve, 3000))
    mainCentralProfileDiv.remove()
  })
  openProfileDiv = mainCentralProfileDiv;
  return mainCentralProfileDiv
}

// Array manipulators
function findNonNullNonUndefined(array) {
  let firstBestValue = null;
  for (let i = 0; i < array.length; i++) { if (array[i] != undefined && array[i] != null) { return array[i] } }
  return firstBestValue;
}

function addIndexAndLabelAsName(array) {
  for (let i = 0; i < array.length; i++) { array[i].id = i; array[i].name = array[i].label; }
  return array;
}

function createBarLoader() {
  let progress_value = createElement({ elementType: 'div', class: 'progress-value' })
  let number = createElement({ elementType: 'div', class: 'number' })
  let progress = createElement({ elementType: 'div', class: 'progress', childrenArray: [progress_value, number] })
  progress.setPercentage = (percentage) => { number.textContent = percentage + '%'; progress_value.style.width = percentage + '%'; }
  return progress
}

function createCircleLoader() {
  let value_container = createElement({ elementType: 'div', class: 'value-container' })
  let circular_progress = createElement({ elementType: 'div', class: 'circular-progress', childrenArray: [value_container] })
  let progress = createElement({ elementType: 'div', class: 'progressBar', childrenArray: [circular_progress] })
  progress.setPercentage = (percentage) => {
    value_container.textContent = percentage + '%';
    circular_progress.style.background = `conic-gradient(#4d5bf9 ${percentage * 3.6}deg, #cadcff ${percentage * 3.6}deg )`
  }
  return progress
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

////////////// EVENTS SCHEDULER //////////////////////
createCalendarEventSection()
function createCalendarEventSection() {
  console.log('happenneddd')
  time_scheduling_panel.textContent = ''
  let weekDays = createElement({
    elementType: 'div', class: 'weekdays', childrenArray: [
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Sunday', textContent: 'Su' }),
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Monday', textContent: 'Mo' }),
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Tuesday', textContent: 'Tu' }),
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Wednesday', textContent: 'We' }),
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Thursday', textContent: 'Th' }),
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Friday', textContent: 'Fr' }),
      createElement({ elementType: 'div', class: 'weekday-name', title: 'Saturday', textContent: 'Sa' }),
    ]
  })
  let calendarDays = createElement({ elementType: 'div', class: 'calendar-days' })
  // card components
  let calendarToolBar = createElement({ elementType: 'div', class: 'calendar-toolbar' })
  let calendar = createElement({ elementType: 'div', class: 'calendar', childrenArray: [weekDays, calendarDays] })
  let jumpButtons = createElement({ elementType: 'div', class: 'goto-buttons' })

  let calendarCard = createElement({ elementType: 'div', class: 'card', childrenArray: [calendarToolBar, calendar, jumpButtons] })
  // main
  let selectionPanel = createElement({ elementType: 'div', class: 'selectionPanel mobileHiddenElement', childrenArray: [calendarCard] })
  let mainScheduleList = createElement({ elementType: 'div', class: 'mainScheduleList' })
  let scheduleDetailsSection = createElement({ elementType: 'div', class: 'scheduleDetailsSection mobileHiddenElement' })
  let schedule_container = createElement({ elementType: 'div', class: 'schedule-container', childrenArray: [selectionPanel, mainScheduleList, scheduleDetailsSection] })
  time_scheduling_panel.append(schedule_container)
  function showSelectionPanel() {
    selectionPanel.classList.remove('scheduleDetailsSection')
    mainScheduleList.classList.add('scheduleDetailsSection')
    scheduleDetailsSection.classList.add('scheduleDetailsSection')
  }
  function showMainScheduleList() {
    selectionPanel.classList.add('scheduleDetailsSection')
    mainScheduleList.classList.remove('scheduleDetailsSection')
    scheduleDetailsSection.classList.add('scheduleDetailsSection')
  }
  function showScheduleDetailsSection() {
    selectionPanel.classList.remove('scheduleDetailsSection')
    mainScheduleList.classList.add('scheduleDetailsSection')
    scheduleDetailsSection.classList.remove('scheduleDetailsSection')
  }

  let today = new Date();
  let date = new Date();
  today.setHours(0, 0, 0, 0);
  const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  const totalMonthDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startWeekDay = new Date(date.getFullYear(), date.getMonth(), 0).getDay();
  calendarDays.textContent = '';
  let totalCalendarDay = 6 * 7;
  for (let i = 0; i < totalCalendarDay; i++) {
    let day = i - startWeekDay;
    if (i <= startWeekDay) {
      // adding previous month days
      let dayDiv = createElement({ elementType: 'div' })
      dayDiv.textContent = prevLastDay + i - startWeekDay;
      dayDiv.classList.add("padding-day");
      calendarDays.appendChild(dayDiv);

    }
    else if (i <= startWeekDay + totalMonthDay) {
      // adding this month days
      date.setDate(day);
      date.setHours(0, 0, 0, 0);
      let dayClass = date.getTime() === today.getTime() ? 'current-day' : 'month-day';
      let dateYYYYMMDD_ISO = formatDate(date)
      let contentClass = 'noMeaning';
      if (calendarObject[dateYYYYMMDD_ISO]) contentClass = calendarObject[dateYYYYMMDD_ISO].length > 0 ? 'contentDay' : 'noMeaning';
      let dayDiv = createElement({
        elementType: 'div', class: contentClass + ' ' + dayClass, textContent: day + '', onclick: () => {
          let ckickDateCheck = date;
          ckickDateCheck.setDate(day);
        }
      })
      calendarDays.appendChild(dayDiv)

    } else {
      // adding next month days
      let dayDiv = createElement({ elementtype: 'div', class: 'padding-day', textContent: (day - totalMonthDay) + "" })
      calendarDays.appendChild(dayDiv)
    }
  }
}