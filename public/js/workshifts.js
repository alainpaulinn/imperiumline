let daysInAWeek = 7;
let daysOfWeek = [
    {
        dayId: 1,
        dayName: "Monday",
    },
    {
        dayId: 2,
        dayName: "Tuesday"
    },
    {
        dayId: 3,
        dayName: "Wednesday"
    },
    {
        dayId: 4,
        dayName: "Thursday"
    },
    {
        dayId: 5,
        dayName: "Friday"
    },
    {
        dayId: 6,
        dayName: "Saturday"
    },
    {
        dayId: 7,
        dayName: "Sunday"
    },
]
let hoursInADay = 24;
let minutesInADay = hoursInADay * 60;
let smallestTimeUnit = 60; //counted in minutes
let sectionsInADay = minutesInADay / smallestTimeUnit;
let earliestStartTime = '00:00:00';
let latestFinishTime = '23:59:59';

let workshiftMatrixCanvas = document.getElementById('workshiftMatrixCanvas')

let isSelecting = false;
let isDeselecting = false;



let startSelectionDay;
let startSelectionTime;
let endSelectionDay;
let endSelectionTime;

//let active_test = event.target.classList.contains("active-test")

workshiftMatrixCanvas.addEventListener('mousedown', function (event) {
    let onDay = event.target.getAttribute("data-day")
    let onTime = event.target.getAttribute("data-time")
    console.log('data-day', onDay, 'data-time', onTime)
    if (!onDay || !onTime) return;


    if (event.target.classList.contains("active-test")) {
        isDeselecting = true;
        isSelecting = false;
    }
    else {
        isDeselecting = false;
        isSelecting = true;
    }

    startSelectionDay = parseInt(onDay)
    startSelectionTime = parseInt(onTime)


})

workshiftMatrixCanvas.addEventListener('mousemove', function (event) {
    if (isSelecting == false && isDeselecting == false) return;

    let onDay = event.target.getAttribute("data-day")
    let onTime = event.target.getAttribute("data-time")
    if (!onDay || !onTime) return;

    endSelectionDay = parseInt(onDay)
    endSelectionTime = parseInt(onTime)

    let smallestTime = findSmallest([startSelectionTime, endSelectionTime])
    let greatestTime = findGreatest([startSelectionTime, endSelectionTime])

    let smallestDay = findSmallest([startSelectionDay, endSelectionDay])
    let greatestDay = findGreatest([startSelectionDay, endSelectionDay])

    for (let d = smallestDay; d <= greatestDay; d++) {
        for (let t = smallestTime; t <= greatestTime; t++) {
            let byPassedElement = document.getElementById(Math.abs(d) + "" + Math.abs(t) + "ScheduleDay")
            if (!byPassedElement) return;

            let previousSibling = byPassedElement.previousSibling
            let nextSibling = byPassedElement.nextSibling

            if (isSelecting == true) {
                byPassedElement.classList.add("active-test")

                //checkNeighboursAndUpdateCurrent(element, operationalClass, highlightClass, leftClass, rightClass)
                checkNeighboursAndUpdateCurrent(byPassedElement, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last")
                if (previousSibling) checkNeighboursAndUpdateCurrent(previousSibling, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last");
                if (nextSibling) checkNeighboursAndUpdateCurrent(nextSibling, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last");
            }
            if (isDeselecting == true) {
                byPassedElement.classList.remove("active-test")

                checkNeighboursAndUpdateCurrent(byPassedElement, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last")
                if (previousSibling) checkNeighboursAndUpdateCurrent(previousSibling, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last");
                if (nextSibling) checkNeighboursAndUpdateCurrent(nextSibling, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last");
                //removeRoundCorners(byPassedElement)
            }
        }
    }
})

function checkNeighboursAndUpdateCurrent(currentEl, operationalClass, highlightClass, leftClass, rightClass) {
    let previousSibling = currentEl.previousSibling
    let nextSibling = currentEl.nextSibling
    let prevActiveElement = false;
    let nextActiveElement = false;
    if (previousSibling) {
        //highlightClass: active-test, operationalclass: dayparts-cell-test
        prevActiveElement = previousSibling.classList.contains(highlightClass) && previousSibling.classList.contains(operationalClass)
        if (!previousSibling.classList.contains(highlightClass)) {
            removeRoundCorners(previousSibling)
        }
    }
    //prevActiveElement == false ? currentEl.classList.add("active-test-first") : currentEl.classList.remove("active-test-first")
    prevActiveElement == false ? currentEl.classList.add(leftClass) : currentEl.classList.remove(leftClass)

    if (nextSibling) {
        //highlightClass: active-test, operationalclass: dayparts-cell-test
        nextActiveElement = nextSibling.classList.contains(highlightClass) && nextSibling.classList.contains(operationalClass)
        if (!nextSibling.classList.contains(highlightClass)) {
            removeRoundCorners(nextSibling)
        }
    }
    //nextActiveElement == false ? currentEl.classList.add("active-test-last") : currentEl.classList.remove("active-test-last")
    nextActiveElement == false ? currentEl.classList.add(rightClass) : currentEl.classList.remove(rightClass)

    if (!currentEl.classList.contains(highlightClass)) {
        removeRoundCorners(currentEl)
    }
}

function removeRoundCorners(element) {
    element.classList.remove("active-test-last")
    element.classList.remove("active-test-first")
}
function addRoundCorners(element) {
    element.classList.add("active-test-last")
    element.classList.add("active-test-first")
}


function findSmallest(numberArray) {
    return Math.min(...numberArray)
}
function findGreatest(numberArray) {
    return Math.max(...numberArray)
}

function getWeekNumber(date_){
    var oneJan = new Date(date_.getFullYear(),0,1);
    var numberOfDays = Math.floor((date_ - oneJan) / (24 * 60 * 60 * 1000));
    return "Week: " + Math.ceil((date_.getDay() + 1 + numberOfDays) / 7) + " " + date_.getFullYear();
}


workshiftMatrixCanvas.addEventListener('mouseup', function (event) {
    isSelecting = false;
    isDeselecting = false;
})

let slotNameRow = document.createElement("div")
slotNameRow.classList.add("slotNameRow")
workshiftMatrixCanvas.append(slotNameRow)

let dayNameDiv = document.createElement("div")
dayNameDiv.classList.add("dayName-test")
dayNameDiv.textContent = getWeekNumber(new Date())
slotNameRow.append(dayNameDiv)



for (let d = 0; d < sectionsInADay; d++) {
    var dayd = new Date();
    dayd.setHours(0,d*smallestTimeUnit,0,0)

    let slotNameCell = document.createElement("div")
    slotNameCell.classList.add("slotNameCell")
    slotNameCell.textContent = dayd.toString('YYYY-MM-dd').substring(16, 24);
    slotNameRow.append(slotNameCell)
}

for (let j = 0; j < daysOfWeek.length; j++) {
    let oneDay = document.createElement('div')
    oneDay.classList.add("day-test")
    workshiftMatrixCanvas.append(oneDay)

    let dayNameDiv = document.createElement("div")
    dayNameDiv.classList.add("dayName-test")
    dayNameDiv.textContent = daysOfWeek[j].dayName;

    oneDay.append(dayNameDiv)



    for (let d = 0; d < sectionsInADay; d++) {



        let shortestTimeUnit = document.createElement("div")
        shortestTimeUnit.classList.add("dayparts-cell-test")
        shortestTimeUnit.id = daysOfWeek[j].dayId + "" + (d) + "ScheduleDay";
        shortestTimeUnit.setAttribute("data-day", daysOfWeek[j].dayId)
        shortestTimeUnit.setAttribute("data-time", (d))// + "-" + (smallestTimeUnit-1))
        oneDay.append(shortestTimeUnit)

        shortestTimeUnit.addEventListener("click", function () {
            console.log('day: ', daysOfWeek[j].dayName, daysOfWeek[j].dayId)
            console.log('smallest Time Unit: ', (d + 1))

            if (!shortestTimeUnit.classList.contains("active-test")) shortestTimeUnit.classList.add("active-test")
            else shortestTimeUnit.classList.remove("active-test")

            //shortestTimeUnit.classList.toggle("active-test-last")

            let previousSibling = shortestTimeUnit.previousSibling
            let nextSibling = shortestTimeUnit.nextSibling

            checkNeighboursAndUpdateCurrent(shortestTimeUnit, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last")
            if (previousSibling) checkNeighboursAndUpdateCurrent(previousSibling, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last");
            if (nextSibling) checkNeighboursAndUpdateCurrent(nextSibling, "dayparts-cell-test", "active-test", "active-test-first", "active-test-last");
        })
    }

}