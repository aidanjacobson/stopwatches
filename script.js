/*
    Watch: {
        timestamp: Number
        label: String
    }
*/

var config = {
    saved: true,
    watches: []
};

/*function retrieveConfig() {
    config = JSON.parse(localStorage.getItem("config"));
}*/

var encrypted_access_token = "U2FsdGVkX1+BS7W57qcuksbGeOhMELdKhPGdFruceXcLa74zjeuaGq1ELrfEpq+GjaeCRQiAA2OaUJY0rfXil0NB/VlMeqHNTxo69hBYu3eQcGHhKSrQGY0hn6obMS3w5nagv1Q+kM6OcoRjewNBgAvEK97AcVapxiusHjPlbpUEfllwb5TgiznJouFPYaUj3hwKq6Km3vVy+cbTIoZxMryMuEPXcvAybrhwrJtsidyWy0Z7VWyDg949CULWnaseJtPR+EGMaOtAP5tXwmmV6A==";
var access_token = "";

function retrieveConfig() {
    return new Promise(function(resolve) {
        var url = `https://aidanjacobson.duckdns.org/api/states/input_text.stopwatch_json`;
        var xhr = new XMLHttpRequest();
        xhr.crossorigin
        xhr.open("GET", url);
        xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function() {
            resolve(JSON.parse(JSON.parse(xhr.responseText).state));
        }
        xhr.send();
    })
}

function clearStorage() {
    localStorage.clear();
}

var display;
async function main() {
    if (localStorage.dkey) {
        access_token = CryptoJS.AES.decrypt(encrypted_access_token, localStorage.dkey).toString(CryptoJS.enc.Utf8);
        if (access_token == "") {
            promptForPassword();
        }
    } else {
        promptForPassword();
    }
    display = document.getElementById("display");
    config = await retrieveConfig();
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
    saveConfig();
}

function saveConfig() {
    var url = `https://aidanjacobson.duckdns.org/api/states/input_text.stopwatch_json`;
    var xhr = new XMLHttpRequest();
    xhr.crossorigin
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({state: JSON.stringify(config)}));
    renderStopwatches();
}

function promptForPassword() {
    localStorage.dkey = prompt("Please Enter Decryption Key");
    location.reload();
}