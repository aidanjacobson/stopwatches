// upload config to server
async function saveConfig() {
    config.hash = generateHash();
    lastHash = config.hash
    server.config = config;
    await server.uploadConfig();
}

function promptForPassword() {
    localStorage.dkey = prompt("Please Enter Decryption Key");
    location.reload();
}

var local = false;
var server;
var store = "stopwatches"; // name of storage bin

// check if password exists and is valid
async function doAccessCheck() {
    if (localStorage.dkey == "") {
        local = true;
    } else if (localStorage.dkey) {
        server = new ConfigLoader({store: store, securityKey: localStorage.dkey});
        if (!(await server.validate)) {
            promptForPassword();
        }
        if (location.hash != "#demo") advert.src = "https://aidanjacobson.duckdns.org:7777/advertisement/random";
    } else {
        promptForPassword();
    }
}

var encrypted_access_token = "U2FsdGVkX1+BS7W57qcuksbGeOhMELdKhPGdFruceXcLa74zjeuaGq1ELrfEpq+GjaeCRQiAA2OaUJY0rfXil0NB/VlMeqHNTxo69hBYu3eQcGHhKSrQGY0hn6obMS3w5nagv1Q+kM6OcoRjewNBgAvEK97AcVapxiusHjPlbpUEfllwb5TgiznJouFPYaUj3hwKq6Km3vVy+cbTIoZxMryMuEPXcvAybrhwrJtsidyWy0Z7VWyDg949CULWnaseJtPR+EGMaOtAP5tXwmmV6A==";
var access_token = "";

// download config from server
async function retrieveConfig() {
    config = await server.downloadConfig();
    return config;
}

function generateHash() {
    return CryptoJS.MD5(JSON.stringify(config)).toString();
}