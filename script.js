/*
    Watch: {
        timestamp: Number
        label: String
    }
*/

var config = {
    saved: true,
    watches: [{
        timestamp: 1661326647593,
        label: ""
    }]
};

function isConfigSaved() {
    return (!!localStorage.getItem("config") && !!JSON.parse(localStorage.config).saved);
}

function saveConfig() {
    localStorage.setItem("config", JSON.stringify(config));
    renderStopwatches();
}

function retrieveConfig() {
    config = JSON.parse(localStorage.getItem("config"));
}

function clearStorage() {
    localStorage.clear();
}

var display;
function main() {
    display = document.getElementById("display");
    if (isConfigSaved()) {
        retrieveConfig();
    }
    if (location.hash == "#start") {
        location.hash = "";
        startNewStopwatch();
    } else {
        renderStopwatches();
    }
}

window.addEventListener("load", main);

function startNewStopwatch() {
    config.watches.push({
        timestamp: Date.now(),
        label: ""
    });
    saveConfig();
    window.scrollTo(0, document.body.scrollHeight)
}

function renderStopwatches() {
    display.innerHTML = "";
    for (var i = 0; i < config.watches.length; i++) {
        display.innerHTML += `
            <div class="stopwatch">
                <h1 onclick='setTime(${i})'></h1>
                <span><button class='labelBtn' onclick='addLabel(${i})'>Add Label</button></span> (<u class='deleteBtn' onclick='deleteWatch(${i})'>Delete</u>)
            </div>
        `;
    }
}

function updateStopwatches() {
    var els = Array.from(display.children);
    els.forEach(function(el, i) {
        el.children[0].innerText = formatTime(config.watches[i].timestamp);
        if (config.watches[i].label != "") {
            el.children[1].children[0].innerHTML = config.watches[i].label;
            el.children[1].children[0].onclick
        }
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
    if (!input) return;
    config.watches[i].label = input;
    saveConfig();
}

setInterval(updateStopwatches, 50);

function deleteWatch(i) {
    if (!confirm(`Are you sure you want to delete stopwatch ${config.watches[i].label}?`)) return;
    config.watches.splice(i, 1);
    saveConfig();
}

function setTime(i) {
    var input = prompt("Enter time in form h:mm:ss", formatTime(config.watches[i].timestamp));
    if (!input) return;
    var inputs = input.split(":");
    var millis = (+inputs[0])*1000*60*60 + (+inputs[1])*1000*60 + (+inputs[2])*1000;
    config.watches[i].timestamp = Date.now()-millis;
}