

let calendarObject;
let selectedDate = new Date().toISOString().slice(0, 10)
let newEventCreation = {}

socket.on('updateCalendar', function (calendar) {
    calendarObject = calendar;
    displayDayEvents(selectedDate)
    console.log("calendar", calendar)
});

var currentMonth = document.querySelector(".current-month");
var calendarDays = document.querySelector(".calendar-days");
var today = new Date();
var date = new Date();

var hidecalendarBtn = document.getElementById("hideCalendar")
var newEventBtn = document.getElementById("CreateNewEvent")

var prevMonthBtn = document.getElementById("prevMonthBtn")
var nextMonthBtn = document.getElementById("nextMonthBtn")

var scheduleDetailsSectionDiv = document.getElementById("scheduleDetailsSectionDiv")
var newScheduleDetailsSection = document.getElementById("newScheduleDetailsSection")



currentMonth.textContent = date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
console.log(currentMonth.textContent)
today.setHours(0, 0, 0, 0);
renderCalendar();

function renderCalendar() {
    console.log(date)
    const prevLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    const totalMonthDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startWeekDay = new Date(date.getFullYear(), date.getMonth(), 0).getDay();

    calendarDays.innerHTML = "";

    let totalCalendarDay = 6 * 7;
    for (let i = 0; i < totalCalendarDay; i++) {
        let day = i - startWeekDay;

        if (i <= startWeekDay) {
            // adding previous month days
            let dayDiv = document.createElement("div")
            dayDiv.textContent = prevLastDay - i;
            dayDiv.classList.add("padding-day");
            calendarDays.append(dayDiv);

        } else if (i <= startWeekDay + totalMonthDay) {
            // adding this month days

            date.setDate(day);
            date.setHours(0, 0, 0, 0);

            let dayClass = date.getTime() === today.getTime() ? 'current-day' : 'month-day';
            let dayDiv = document.createElement("div");
            dayDiv.textContent = day;
            dayDiv.classList.add(dayClass)
            calendarDays.append(dayDiv)

            dayDiv.addEventListener("click", () => {
                let clickedDate = date;
                clickedDate.setDate(day)
                console.log('day clicked', clickedDate)
                displayDayEvents(clickedDate.toISOString().slice(0, 10))
            })

        } else {
            // adding next month days
            let dayDiv = document.createElement('div')
            dayDiv.textContent = (day - totalMonthDay) + "";
            dayDiv.classList.add('padding-day')
            calendarDays.append(dayDiv)
        }
    }
}


prevMonthBtn.addEventListener("click", function () {
    date.setDate(1)
    date.setMonth(date.getMonth() - 1);
    currentMonth.textContent = date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
    renderCalendar();
    console.log(date.getMonth())
});
nextMonthBtn.addEventListener("click", function () {
    //date = new Date(currentMonth.textContent);
    date.setDate(1)
    date.setMonth(date.getMonth() + 1);
    currentMonth.textContent = date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
    renderCalendar();
    console.log(date.getMonth())
});

document.querySelectorAll(".btn").forEach(function (element) {
    element.addEventListener("click", function () {
        //console.log(date)
        let btnClass = element.classList;
        //date = new Date(currentMonth.textContent);
        console.log("dateeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", date)

        if (btnClass.contains("today"))
            date = new Date();
        else if (btnClass.contains("prev-year"))
            date = new Date(date.getFullYear() - 1, 0, 1);
        else
            date = new Date(date.getFullYear() + 1, 0, 1);

        currentMonth.textContent = date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
        renderCalendar();

    });
});



hidecalendarBtn.addEventListener("click", function (e) {
    this.classList.toggle("rotate180")
    document.querySelector('.calendar').classList.toggle('minimized')
    document.querySelector('.goto-buttons').classList.toggle('minimized')
})

newEventBtn.addEventListener("click", function (e) {
    console.log("New Event")

    scheduleDetailsSectionDiv.classList.add("hidden")
    newScheduleDetailsSection.classList.remove("hidden")

})

let scheduleTypeChoiceElement = document.getElementById("scheduleTypeGoodSelectJs")
goodselect(scheduleTypeChoiceElement, {
    availableOptions: [{ id: 1, name: "Meeting" }, { id: 2, name: "Task" }],
    placeHolder: "Type",
    //selectedOptionId: 1,
    onOptionChange: (option) => {
        !option ? scheduleTypeChoiceElement.classList.add("negativegoodselect") : scheduleTypeChoiceElement.classList.remove("negativegoodselect")
        newEventCreation.type = option.id;
    }
});
let recurrenceGoodSelectJs = document.getElementById("recurrenceGoodSelectJs");
goodselect(recurrenceGoodSelectJs, {
    availableOptions: [{ id: 1, name: "One Time" }, { id: 2, name: "Repetitive" }],
    placeHolder: "Ocurrence",
    selectorWidth: '120px',
    marginRight: '1rem',
    onOptionChange: (option) => {
        !option ? recurrenceGoodSelectJs.classList.add("negativegoodselect") : recurrenceGoodSelectJs.classList.remove("negativegoodselect")

        newEventCreation.occurrence = option.id;
        let recurrenceDivCheck = document.getElementById("recurrenceTypeDiv")
        if (option.id == 2) {
            let oneTimeTypeDiv = document.getElementById("oneTimeType")
            if (oneTimeTypeDiv) oneTimeTypeDiv.remove();
            newEventCreation.oneTimeDate = null;
            let oneTimeTypeDateDiv = document.getElementById("oneTimeTypeDiv")
            if (oneTimeTypeDateDiv) oneTimeTypeDateDiv.remove();
            newEventCreation.oneTimeDate = null;

            if (recurrenceDivCheck) return;
            let recurrenceParentEmelent = recurrenceGoodSelectJs.parentElement;
            let recurrenceTypeDiv = document.createElement("div");
            recurrenceTypeDiv.id = "recurrenceTypeDiv";
            goodselect(recurrenceTypeDiv, {
                availableOptions: [
                    { id: 1, name: "Every Day" },
                    { id: 2, name: "Every Week" },
                    { id: 3, name: "Monday - Friday" },
                    { id: 4, name: "Weekend" },
                ],
                placeHolder: "Recurrence",
                selectorWidth: "150px",
                marginRight: '1rem',
                onOptionChange: (option) => {
                    !option ? recurrenceTypeDiv.classList.add("negativegoodselect") : recurrenceTypeDiv.classList.remove("negativegoodselect")
                    newEventCreation.recurrenceType = option.id;
                }
            })
            recurrenceParentEmelent.appendChild(recurrenceTypeDiv)
            //////////////////////

            //let startRecurrenceParentEmelent = recurrenceGoodSelectJs.parentElement;
            let startRecurrenceTypeDiv = document.createElement("input");
            startRecurrenceTypeDiv.id = "startRecurrenceTypeDiv";
            startRecurrenceTypeDiv.classList.add("textField")
            startRecurrenceTypeDiv.placeholder = "Start Date"
            startRecurrenceTypeDiv.style.marginRight = '1rem';
            recurrenceParentEmelent.appendChild(startRecurrenceTypeDiv)
            flatpickr("#startRecurrenceTypeDiv", {
                time_24hr: true,
                enableTime: false,
                noCalendar: false,
                dateFormat: "Y-m-d",
                //defaultDate: "13:30",
                onChange: function (selectedDates, dateStr, instance) {
                    !dateStr ? startRecurrenceTypeDiv.classList.add("negativeDate") : startRecurrenceTypeDiv.classList.remove("negativeDate")
                    newEventCreation.startRecurrenceDate = dateStr;
                }
            });

            //////////////////////
            //let endRecurrenceParentEmelent = recurrenceGoodSelectJs.parentElement;
            let endRecurrenceTypeDiv = document.createElement("input");
            endRecurrenceTypeDiv.id = "endRecurrenceTypeDiv";
            endRecurrenceTypeDiv.classList.add("textField")
            endRecurrenceTypeDiv.placeholder = "End Date"
            recurrenceParentEmelent.appendChild(endRecurrenceTypeDiv)
            flatpickr("#endRecurrenceTypeDiv", {
                time_24hr: true,
                enableTime: false,
                noCalendar: false,
                dateFormat: "Y-m-d",
                //defaultDate: "13:30",
                onChange: function (selectedDates, dateStr, instance) {
                    !dateStr ? endRecurrenceTypeDiv.classList.add("negativeDate") : endRecurrenceTypeDiv.classList.remove("negativeDate")
                    newEventCreation.endRecurrenceDate = dateStr;
                }
            });

        }
        else {
            let oneTimeTypeDivCheck = document.getElementById("oneTimeTypeDiv")
            if (oneTimeTypeDivCheck) return;

            let recurrenceParentEmelent = recurrenceGoodSelectJs.parentElement;

            let recurrenceTypeDiv = document.getElementById("recurrenceTypeDiv")
            let startRecurrenceTypeDiv = document.getElementById("startRecurrenceTypeDiv")
            let endRecurrenceTypeDiv = document.getElementById("endRecurrenceTypeDiv")

            if (recurrenceTypeDiv) recurrenceTypeDiv.remove();
            newEventCreation.recurrenceType = null;
            if (startRecurrenceTypeDiv) startRecurrenceTypeDiv.remove();
            newEventCreation.startRecurrenceDate = null;
            if (endRecurrenceTypeDiv) endRecurrenceTypeDiv.remove();
            newEventCreation.endRecurrenceDate = null;


            let oneTimeTypeDiv = document.createElement("input");
            oneTimeTypeDiv.id = "oneTimeTypeDiv";
            oneTimeTypeDiv.classList.add("textField")
            oneTimeTypeDiv.placeholder = "End Date"
            recurrenceParentEmelent.appendChild(oneTimeTypeDiv)
            flatpickr("#oneTimeTypeDiv", {
                time_24hr: true,
                enableTime: false,
                noCalendar: false,
                dateFormat: "Y-m-d",
                //defaultDate: "13:30",
                onChange: function (selectedDates, dateStr, instance) {
                    !dateStr ? oneTimeTypeDiv.classList.add("negativeDate") : oneTimeTypeDiv.classList.remove("negativeDate")
                    newEventCreation.oneTimeDate = dateStr;
                }
            });
        }
    }
});

let chosenEventStart = document.getElementById("planMeetingStart")
let chosenEventEnd = document.getElementById("planMeetingEnd")

flatpickr("#planMeetingStart", {
    time_24hr: true,
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    //minTime: "07:00",
    //maxTime: "22:00",
    //defaultDate: "13:30",
    onChange: function (selectedDates, dateStr, instance) {
        !dateStr ? chosenEventStart.classList.add("negativeDate") : chosenEventStart.classList.remove("negativeDate")
        newEventCreation.startTime = dateStr + ":00";
    }
});
flatpickr("#planMeetingEnd", {
    time_24hr: true,
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    //minTime: "07:00",
    //maxTime: "22:00",
    //defaultDate: "13:30",
    onChange: function (selectedDates, dateStr, instance) {
        !dateStr ? chosenEventEnd.classList.add("negativeDate") : chosenEventEnd.classList.remove("negativeDate")
        newEventCreation.endTime = dateStr + ":00";

    }
});
let createEventTitle = document.getElementById("createEventTitle")
addBlurFlagEvent(createEventTitle)
let eventLocation = document.getElementById("eventLocation")
addBlurFlagEvent(eventLocation)
let contextField = document.getElementById("contextField")
addBlurFlagEvent(contextField)
let linkField = document.getElementById("linkField")
//addBlurFlagEvent(createEventTitle)
let detailsField = document.getElementById("detailsField")
//addBlurFlagEvent(createEventTitle)

function addBlurFlagEvent(element) {
    element.addEventListener("blur", function () {
        if (checkIfEmpty(element)) flagIncorrectFied(element, "dateSelect")
        else unflagIncorrectFied(element, "dateSelect")
    })
}

function checkIfEmpty(element) {
    if (element.value.trim() == "") return true;
    else return false;
}

var discardNewScheduleCreation = document.getElementById("discardNewScheduleCreation")
discardNewScheduleCreation.addEventListener("click", () => {
    if (confirm('Are you sure you want to discard this action?')) {
        scheduleDetailsSectionDiv.classList.remove("hidden")
        newScheduleDetailsSection.classList.add("hidden")
    } else {

    }
})

let submitEventButton = document.getElementById("submitEventButton")
submitEventButton.addEventListener("click", () => {
    newEventCreation.title = createEventTitle.value;
    newEventCreation.eventLocation = eventLocation.value;
    newEventCreation.context = contextField.value;
    newEventCreation.activityLink = linkField.value;
    newEventCreation.details = detailsField.value;


    console.log(newEventCreation)

    /*
    let chosenEventStart = document.getElementById("planMeetingStart")
    let chosenEventEnd = document.getElementById("planMeetingEnd")
    newEventCreation = 
    {
        "activityLink": ""
        "inviteList": [7,3,2,1],
        "title": "title",
        "context": "iyughij",
        "details": "hellooo details",
        "occurrence": 2,
        "recurrenceType": null,
        "startRecurrenceDate": "2022-03-16",
        "endRecurrenceDate": "2022-03-23",
        "startTime": "12:00:00",
        "endTime": "12:00:00",
        "oneTimeDate": null,
        "recurrenceId": 1,
        "type": 1,
        "eventLocation": "location"
    }*/

    //Check Title
    if (checkIfEmpty(createEventTitle) || !newEventCreation.title) return flagIncorrectFied(createEventTitle, "dateSelect")

    //check Start
    if (checkIfEmpty(chosenEventStart) || !newEventCreation.startTime) return flagIncorrectFied(chosenEventStart, "dateSelect")

    //check End
    if (checkIfEmpty(chosenEventEnd) || !newEventCreation.endTime) return flagIncorrectFied(chosenEventEnd, "dateSelect")

    //check Type
    if (!newEventCreation.type) return flagIncorrectFied(scheduleTypeChoiceElement, "goodSelect")

    //check Occurence
    if (!newEventCreation.occurrence) return flagIncorrectFied(recurrenceGoodSelectJs, "goodSelect")

    //check onetime date
    if (newEventCreation.occurrence == 1) {
        let oneTimeTypeDateDiv = document.getElementById("oneTimeTypeDiv")
        if (!newEventCreation.oneTimeDate || newEventCreation.oneTimeDate == "") return flagIncorrectFied(oneTimeTypeDateDiv, "dateSelect");
    }

    if (newEventCreation.occurrence == 2) {
        //check recurrence type
        let _recurrenceTypeDiv = document.getElementById("recurrenceTypeDiv")
        if (!newEventCreation.recurrenceType) return flagIncorrectFied(_recurrenceTypeDiv, "goodSelect")

        //check recurrence start date
        let _startRecurrenceTypeDiv = document.getElementById("startRecurrenceTypeDiv")
        if (checkIfEmpty(_startRecurrenceTypeDiv) || !newEventCreation.startRecurrenceDate) return flagIncorrectFied(_startRecurrenceTypeDiv, "dateSelect")

        //check recurrence End date
        let _endRecurrenceTypeDiv = document.getElementById("endRecurrenceTypeDiv")
        if (checkIfEmpty(_endRecurrenceTypeDiv) || !newEventCreation.endRecurrenceDate) return flagIncorrectFied(_endRecurrenceTypeDiv, "dateSelect")
    }

    //Check Location
    if (checkIfEmpty(eventLocation) || !newEventCreation.eventLocation) return flagIncorrectFied(eventLocation, "dateSelect")

    //Check Context
    if (checkIfEmpty(contextField) || !newEventCreation.eventLocation) return flagIncorrectFied(contextField, "dateSelect")

    // check linkField is not mandatory

    // check Participants/members/invités is not mandatory

    // check detailsField is not mandatory

    socket.emit("newEventPlan", newEventCreation)

})

function flagIncorrectFied(element, elementType) {
    if (elementType == "goodSelect") {
        element.classList.add("negativegoodselect")
    }
    if (elementType == "dateSelect") {
        element.classList.add("negativeDate")
    }

}
function unflagIncorrectFied(element, elementType) {
    if (elementType == "goodSelect") {
        element.classList.remove("negativegoodselect")
    }
    if (elementType == "dateSelect") {
        element.classList.remove("negativeDate")
    }

}

//insert Invittees
let addMembersField = document.getElementById("addMembersField")
let invitedMembersDiv = document.getElementById("invitedMembersDiv")
let selectedUsersDiv = document.getElementById("selectedUsersDiv")
newEventCreation.inviteList = []
//let newEventCreation.inviteList = []

addMembersField.addEventListener("focus", () => {
    invitedMembersDiv.classList.add('is-visible')
    invitedMembersDiv.focus();
})
addMembersField.addEventListener('blur', (e) => {
    //console.log(e.target)
    //invitedMembersDiv.classList.remove('is-visible')
    //console.log("helloooooooooooooooooooooo")
})

addMembersField.addEventListener('input', function (evt) {
    console.log(this.value);
    socket.emit('scheduleInviteSearch', this.value)
});

socket.on('scheduleInviteResults', (peopleResults) => {
    console.log(peopleResults)
    invitedMembersDiv.innerHTML = '';

    if (peopleResults.length < 1) return invitedMembersDiv.innerHtml = "<i class='bx bxs-binoculars' ></i>" + "No such user in yout Organization";
    peopleResults.forEach(person => {
        if (newEventCreation.inviteList.includes(person.id)) return;


        let avatarElement;
        if (person.profilePicture == null) {
            avatarElement = document.createElement("div")
            avatarElement.textContent = person.name.charAt(0) + " " + person.surname.charAt(0)
            //avatarElement = `<div>${person.name.charAt(0).toUpperCase()} ${person.surname.charAt(0).toUpperCase()}</div>`;
        }
        else {
            avatarElement = document.createElement("img")
            avatarElement.src = person.profilePicture
            //avatarElement = `<img src="${person.profilePicture}" alt="">`
        }

        let invitedMemberDiv = document.createElement("div");
        invitedMemberDiv.id = "invite" + person.id;
        invitedMemberDiv.className = "invitedMemberDiv"
        invitedMemberDiv.setAttribute("data-id", person.id + "")
        //invitedMemberDiv.setAttribute("onclick", "setChosenPerson("+person.id+")");


        let resultItemBundle = document.createElement("div");
        resultItemBundle.className = "resultItemBundle";
        resultItemBundle.title = person.name + " " + person.surname;

        let containerImage = document.createElement("div");
        containerImage.className = "containerImage";

        let meeting_data = document.createElement("div");
        meeting_data.className = "meeting-data"

        let nameScopeTime = document.createElement("div");
        nameScopeTime.className = "nameScopeTime";

        let meetingName = document.createElement("p");
        meetingName.className = "meetingName";
        meetingName.textContent = person.name + " " + person.surname;

        let scope = document.createElement("p")
        scope.className = "scope";
        scope.textContent = "role d'invité"

        invitedMemberDiv.appendChild(resultItemBundle)
        resultItemBundle.append(containerImage, meeting_data)
        containerImage.appendChild(avatarElement)
        meeting_data.appendChild(nameScopeTime)
        nameScopeTime.append(meetingName, scope)

        invitedMembersDiv.appendChild(invitedMemberDiv)

        invitedMemberDiv.addEventListener("click", function () {
            console.log(person.id)
            //invitedMembersDiv.classList.remove('is-visible')
            invitedMemberDiv.remove();
            addMembersField.select();

            let _invitedMemberDiv = document.createElement('div')
            _invitedMemberDiv.className = 'invitedMemberDiv'

            let _resultItemBundle = document.createElement('div')
            _resultItemBundle.className = 'resultItemBundle'

            let _containerImage = document.createElement('div')
            _containerImage.className = 'containerImage'



            let _meeting_data = document.createElement('div')
            _meeting_data.className = 'meeting-data'

            let _nameScopeTime = document.createElement('div')
            _nameScopeTime.className = 'nameScopeTime'

            let _meetingName = document.createElement('p')
            _meetingName.textContent = person.name + " " + person.surname;
            _meetingName.className = 'meetingName'

            let _removePerson = document.createElement('button')
            _removePerson.className = 'removePerson'

            let _icon = document.createElement('i')
            _icon.className = 'bx bx-x-circle'

            _removePerson.appendChild(_icon)
            _nameScopeTime.appendChild(_meetingName)
            _meeting_data.append(_nameScopeTime, _removePerson)
            _containerImage.appendChild(avatarElement.cloneNode(true))
            _resultItemBundle.append(_containerImage, _meeting_data)
            _invitedMemberDiv.append(_resultItemBundle)

            selectedUsersDiv.append(_invitedMemberDiv)
            newEventCreation.inviteList.push(person.id)

            console.log(newEventCreation.inviteList)
            _removePerson.addEventListener("click", function () {
                //newEventCreation.inviteList.remove(person.id)
                const index = newEventCreation.inviteList.indexOf(person.id);
                if (index > -1) {
                    newEventCreation.inviteList.splice(index, 1); // 2nd parameter means remove one item only
                    _invitedMemberDiv.remove();
                    invitedMembersDiv.prepend(invitedMemberDiv)
                }
                //console.log("removing invite", person.id)
                console.log(newEventCreation.inviteList)
            })

        })

    })


})

function displayDayEvents(givenDate) {
    let scheduleTitle = document.getElementById("scheduleTitle")
    let selectedScheduledItemsDiv = document.getElementById("selectedScheduledItemsDiv")
    //remove all ecxisting data from the Div
    while (selectedScheduledItemsDiv.firstChild) {
        selectedScheduledItemsDiv.removeChild(selectedScheduledItemsDiv.firstChild);
    }
    let indicatedDate = new Date(givenDate)
    scheduleTitle.textContent = "Planned for "+ indicatedDate.toString().substring(0, 15)

    if (!calendarObject[givenDate]) return console.warn("an error while getting the events for this date")

    calendarObject[givenDate].forEach(scheduleItem => {

        let _plannedEventItem = document.createElement("div")
        meetingData.classList.add("plannedItem")

        let _resultItemBundle = document.createElement("div")
        _resultItemBundle.classList.add("resultItemBundle")
        _plannedEventItem.append(_resultItemBundle)

        let _containerImage = document.createElement("div")
        _containerImage.classList.add("containerImage")
        _resultItemBundle.append(_containerImage)

        let container = document.createElement("div")
        container.textContent = scheduleItem.title.charAt(0);
        _containerImage.append(container)

        let _meetingData = document.createElement("div")
        _meetingData.classList.add("meeting-data")
        _resultItemBundle.append(_meetingData)

        let _nameScopeTime = document.createElement("div")
        _nameScopeTime.classList.add("_nameScopeTime")
        _meetingData.append(_nameScopeTime)

        let _meetingname = document.createElement("div")
        _meetingname.classList.add("meetingName")
        _meetingname.textContent = scheduleItem.title;
        _nameScopeTime.append(_meetingname)

        let _scope = document.createElement("div")
        _scope.classList.add("scope")
        _scope.textContent = scheduleItem.context;
        _nameScopeTime.append(_scope)

        let _time = document.createElement("div")
        _time.classList.add("time")
        _time.textContent = scheduleItem.context;
        _nameScopeTime.append(_time)

        
        selectedScheduledItemsDiv.append(_plannedEventItem)
    })

}