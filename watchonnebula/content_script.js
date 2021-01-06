// Put all the javascript code here, that you want to execute after page load.

// For handling YouTube navigation, see:
// https://stackoverflow.com/questions/34077641/how-to-detect-page-navigation-on-youtube-and-modify-its-appearance-seamlessly/34100952#34100952

window.addEventListener('yt-navigate-start', run);

if (document.body) {
    run();
} else {
    document.addEventListener('DOMContentLoaded', run);
}

function run() {
    if (!location.pathname.startsWith('/watch')) {
        return;
    }
    
    // Get channel ID and video information from current page and send it to the
    // background script.
    //
    // TODO: Better to use YouTube API for this.
    let channelURL = document.querySelector('.yt-formatted-string[href^="/channel/"]').href;
    let channelID = channelURL.split('/').pop()
    console.log(channelID);
    alert(channelID);

    browser.runtime.sendMessage({"channelID": channelID});
}

function respond(message) {
    alert(message.channelMatch);
}

browser.runtime.onMessage.addListener(respond);
