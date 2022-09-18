/*
    Watch: {
        timestamp: Number
        label: String
    }
*/

var config = {
    saved: true,
    watches: [],
    tracked: -1
};

/*function retrieveConfig() {
    config = JSON.parse(localStorage.getItem("config"));
}*/

function clearStorage() {
    localStorage.clear();
}

var display;
async function main() {
    doAccessCheck();
    display = document.getElementById("display");
    config = await retrieveConfig();
    if (typeof config.tracked === "undefined") config.tracked = -1;
    if (location.hash == "#start") {
        location.hash = "";
        startNewStopwatch();
    } else {
        renderStopwatches();
    }
    setInterval(updateStopwatches, 50);
}

window.addEventListener("load", main);

function startNewStopwatch() {
    if (getSelection().toString() != '') {
        processAdminCommand();
        return;
    }
    config.watches.push({
        timestamp: Date.now(),
        label: ""
    });
    if (config.watches.length == 1) config.tracked = 0;
    saveConfig();
    window.scrollTo(0, document.body.scrollHeight)
}

function renderStopwatches() {
    display.innerHTML = "";
    for (var i = 0; i < config.watches.length; i++) {
        display.innerHTML += `
            <div class="stopwatch">
                <h1 onclick='setTime(${i})'></h1>
                <input type="radio" onclick="updateTracked()" name="tracked" class="trackbtn" value="${i}" /><span><button class='labelBtn' onclick='addLabel(${i})'>Add Label</button></span> <u class='deleteBtn' onclick='deleteWatch(${i})'>Delete</u>
            </div>
        `;
    }
}

function updateStopwatches() {
    var els = Array.from(display.children);
    els.forEach(function(el, i) {
        el.children[0].innerText = formatTime(config.watches[i].timestamp);
        if (config.watches[i].label != "") {
            el.children[2].children[0].innerHTML = config.watches[i].label;
        }
        el.children[1].checked = (i == config.tracked);
    });
}

function formatTime(timestamp) {
    var timeDiff = Date.now() - timestamp;
    var hours = Math.floor(timeDiff/1000/60/60);
    timeDiff -= hours*1000*60*60;
    var minutes = Math.floor(timeDiff/1000/60);
    timeDiff -= minutes*1000*60;
    var seconds = Math.floor(timeDiff/1000);
    return `${hours}:${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`;
}

function addLabel(i) {
    var input = prompt("Enter Label", config.watches[i].label || "");
    config.watches[i].label = input;
    saveConfig();
}

function deleteWatch(i) {
    if (!confirm(`Are you sure you want to delete stopwatch ${config.watches[i].label}?`)) return;
    config.watches.splice(i, 1);
    if (config.tracked == i) config.tracked = -1;
    if (i < config.tracked) config.tracked--;
    if (config.watches.length == 0) config.tracked = -1;
    saveConfig();
}

function setTime(i) {
    var input = prompt("Enter time in form h:mm:ss", formatTime(config.watches[i].timestamp));
    if (!input) return;
    var inputs = input.split(":");
    var millis = (+inputs[0])*1000*60*60 + (+inputs[1])*1000*60 + (+inputs[2])*1000;
    config.watches[i].timestamp = Date.now()-millis;
    saveConfig();
}

function updateTracked() {
    if (document.querySelector("input[name='tracked']:checked")) {
        config.tracked = +document.querySelector("input[name='tracked']:checked").value
    } else {
        config.tracked = -1;
    }
    saveConfig();
}

function reorder(reorderCode) {
    /*
        m1,3 => moves 1 to 3 position (shift)
        s1,3 => swaps 1 and 3 position
    */
    var reorderLetter = reorderCode[0];
    var arg1 = +reorderCode.substring(1, reorderCode.indexOf(","));
    var arg2 = +reorderCode.substring(reorderCode.indexOf(",")+1, reorderCode.length);
    if (reorderLetter == "s") {
        var w1 = config.watches[arg1];
        var w2 = config.watches[arg2];
        config.watches[arg1] = w2;
        config.watches[arg2] = w1;
        if (config.tracked == arg1) {
            config.tracked = arg2;
        } else if (config.tracked == arg2) {
            config.tracked = arg1;
        }
    } else if (reorderLetter == "m") {
        var watch = config.watches.splice(arg1, 1)[0];
        config.watches.splice(arg2, 0, watch);
        if (config.tracked <= arg2 && config.tracked > arg1) config.tracked--;
        if (config.tracked == arg1) config.tracked = arg2;
    } else {
        alert("invalid code");
    }
    saveConfig();
}

function processAdminCommand() {
    var cmd = prompt("Enter Command");
    if (cmd[0] == "r") reorder(cmd.substring(1));
    if (cmd[0] == "d") deselect();
}

function deselect() {
    document.querySelector("input[name='tracked']:checked").checked = false;
    saveConfig();
}