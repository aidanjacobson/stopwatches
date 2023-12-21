/*
    Watch: {
        timestamp: Number
        label: String
    }

    config: {
        saved: Boolean,
        watches: Array[Watch],
        tracked: Number,
        settings: {
            autoclear: {
                enabled: Boolean,
                time: Number
            },
            reload_minutes: Number
        },
        hash: String
    }
*/

async function correctConfig() {
    if (typeof config.saved === "undefined") config.saved = true;
    if (typeof config.watches === "undefined") config.watches = [];
    if (typeof config.tracked === "undefined") config.tracked = -1;
    if (typeof config.settings === "undefined") config.settings = {};
    if (typeof config.settings.reload_minutes === "undefined") config.settings.reload_minutes = 3;
    if (typeof config.settings.autoclear === "undefined") config.settings.autoclear = {};
    if (typeof config.settings.autoclear.enabled === "undefined") config.settings.autoclear.enabled = false;
    if (typeof config.settings.autoclear.time === "undefined") config.settings.autoclear.time = 18000;
    if (typeof config.hash === "undefined") config.hash = "";
    await saveConfig();
}

var default_config = {
    saved: true,
    watches: [],
    tracked: -1,
    settings: {
        autoclear: {
            enabled: false,
            time: 18000
        },
        reload_minutes: 3
    },
    hash: ""
};

config = default_config;

function clearStorage() {
    localStorage.clear();
}

var display;
var lastReload;
var lastHash = "";
async function main() {
    display = document.getElementById("display");
    if (localStorage.stConfig) {
        config = JSON.parse(localStorage.stConfig);
        renderStopwatches();
    }
    setInterval(updateStopwatches, 50);
    await doAccessCheck();
    config = await retrieveConfig();
    setSettingsFromConfig();
    if (typeof config.tracked === "undefined") config.tracked = -1;
    if (location.hash == "#start") {
        location.hash = "";
        startNewStopwatch();
    } else {
        renderStopwatches();
    }
    lastReload = Date.now();
    lastHash = config.hash;
}
window.addEventListener("load", async function() {
    switchTo(mainwindow);
    await main();
    await correctConfig();
});

// start a new stopwatch with no label
function startNewStopwatch() {
    if (getSelection().toString() != '') { // check if any text on the screen is highlighted, which is the secret code to process an admin command instead
        processAdminCommand();
        return;
    }
    config.watches.push({
        timestamp: Date.now(),
        label: ""
    });
    if (config.watches.length == 1) config.tracked = 0;
    saveConfig();
    renderStopwatches();
    window.scrollTo(0, document.body.scrollHeight)
}

// populate window with stopwatches according to config
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

// update times on existing stopwatches
function updateStopwatches() {
    doReloadCheck();
    var els = Array.from(display.children);
    els.forEach(function(el, i) {
        if (!config.watches[i]) return;
        el.children[0].innerText = formatTime(config.watches[i].timestamp);
        if (config.watches[i].label != "") {
            el.children[2].children[0].innerHTML = config.watches[i].label;
        }
        el.children[1].checked = (i == config.tracked);
    });
}

// format time in h:mm:ss format
function formatTime(timestamp) {
    var timeDiff = Date.now() - timestamp;
    var hours = Math.floor(timeDiff/1000/60/60);
    timeDiff -= hours*1000*60*60;
    var minutes = Math.floor(timeDiff/1000/60);
    timeDiff -= minutes*1000*60;
    var seconds = Math.floor(timeDiff/1000);
    return `${hours}:${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`;
}

// set label for stopwatch by index
function addLabel(i) {
    var input = prompt("Enter Label", config.watches[i].label || "");
    config.watches[i].label = input;
    saveConfig();
}

// delete stopwatch by index
function deleteWatch(i) {
    if (!confirm(`Are you sure you want to delete stopwatch ${config.watches[i].label}?`)) return;
    config.watches.splice(i, 1);
    if (config.tracked == i) config.tracked = -1;
    if (i < config.tracked) config.tracked--;
    if (config.watches.length == 0) config.tracked = -1;
    saveConfig();
    renderStopwatches();
}

// set new time by index
function setTime(i) {
    var input = prompt("Enter time in form h:mm:ss", formatTime(config.watches[i].timestamp));
    if (!input) return;
    var inputs = input.split(":");
    var millis = (+inputs[0])*1000*60*60 + (+inputs[1])*1000*60 + (+inputs[2])*1000;
    config.watches[i].timestamp = Date.now()-millis;
    saveConfig();
}

// update index of selected stopwatch to track (display on my home screen)
function updateTracked() {
    if (document.querySelector("input[name='tracked']:checked")) {
        config.tracked = +document.querySelector("input[name='tracked']:checked").value
    } else {
        config.tracked = -1;
    }
    saveConfig();
}

/*
    Admin commands are a series of letters and arguments, to achieve things that are not strictly
    necessary for operation but still helpful tools to have.
    Commands:
        r: reorder
            rm: move (example: rm1,3 => insert position 1 to position 3)
            rs: swap (example: rs1,3 => swap positions 1 and 3)
        d: deselect tracked stopwatch
        l: logout (clears login data)
*/
function processAdminCommand() {
    var cmd = prompt("Enter Command");
    if (cmd[0] == "r") reorder(cmd.substring(1));
    if (cmd[0] == "d") deselect();
    if (cmd[0] == "l") logout();
}

// reorder two stopwatches (move or swap)
function reorder(reorderCode) {
    /*
        rm1,3 => moves 1 to 3 position (shift)
        rs1,3 => swaps 1 and 3 position
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

// deselect tracked stopwatch
function deselect() {
    document.querySelector("input[name='tracked']:checked").checked = false;
    updateTracked();
}

// clear credentials
function logout() {
    localStorage.removeItem("dkey");
    location.reload();
}

HTMLElement.prototype.show = function() {
    this.removeAttribute("hidden");
}

HTMLElement.prototype.hide = function() {
    this.setAttribute("hidden", "true");
}

function hideAll() {
    var elements = document.getElementsByClassName("hideable");
    Array.from(elements).forEach(element=>element.hide());
}

function switchTo(element) {
    hideAll();
    element.show();
}

function settingsClick() {
    switchTo(settings);
}

function setSettingsFromConfig() {
    autoclear_check.checked = config.settings.autoclear.enabled;
    autoclear_time.disabled = !autoclear_check.checked;
    autoclear_time.value = convertSecondsToTimestring(config.settings.autoclear.time);

    reload_minutes_input.value = config.settings.reload_minutes*60;
}

async function doAutoclearChange() {
    config.settings.autoclear.enabled = autoclear_check.checked;
    autoclear_time.disabled = !autoclear_check.checked;
    config.settings.autoclear.time = convertTimestringToSeconds(autoclear_time.value);
    await saveConfig();
}

async function doReloadTimeChange() {
    config.settings.reload_minutes = (+reload_minutes_input.value)/60;
    await saveConfig();
}

function convertTimestringToSeconds(timestring) {
    var parts = timestring.split(":");
    var hours = +parts[0];
    var minutes = +parts[1];
    return (hours*60+minutes)*60;
}

function convertSecondsToTimestring(seconds) {
    var hours = Math.floor(seconds/60/60);
    var minutes = Math.floor((seconds-hours*60*60)/60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

async function doReloadCheck() {
    if (typeof config.settings.reload_minutes === "undefined") return;
    var current = Date.now();
    var delay = config.settings.reload_minutes*60*1000;
    if (current > lastReload + delay) {
        lastReload = current;
        await retrieveConfig();
        if (config.hash != lastHash) main();
    }
}