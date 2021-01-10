// To support initial page load (this script runs after fully loaded)
console.log('INITIAL LOAD');
setTimeout(run, 0);

// To support forward/backward page navigation changes.
//
// The setTimeout must be used to ensure that this effectively runs on the *new*
// page.
window.onpopstate = function (event) {
    console.log('HISTORY NAVIGATION');
    if (event.state) {
        setTimeout(run, 0);
    }
};

// To support YouTube navigation events (clicking)
//
// Similar to history navigation, the setTimeout *must* be used, or the function
// will essentially run on the previous page.
window.addEventListener('yt-navigate-finish', function (event) {
    console.log('YT NAVIGATION');
    setTimeout(run, 0);
});

function run() {

    console.log('CONTENT SCRIPT RUN');

    if (!location.pathname.startsWith('/watch')) {
        console.log('NOT A VIDEO');
        return;
    }

    const tryToGetElement = setInterval(() => {
        if (document.querySelector('.ytd-video-owner-renderer')) {
            console.log('ABLE TO QUERY VIDEO INFORMATION');
            clearInterval(tryToGetElement);

            let channelURL = document.querySelector(
                '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"]'
            ).href;
            let channelID = channelURL.split('/').pop();
        
            let videoTitle = document.querySelector(
                'h1.ytd-video-primary-info-renderer'
            ).textContent;
        
            if (channelID && videoTitle) {
                console.log(`channelID: ${channelID}`);
                console.log(`videoTitle: ${videoTitle}`);
            
                console.log('SENDING INFORMATION');
                browser.runtime.sendMessage({
                    channelID: channelID,
                    videoTitle: videoTitle,
                });
            } else {
                console.log('SOME INFORMATION NOT FOUND');
            }
        } else {
            console.log('WAITING FOR VIDEO INFORMATION');
        }
    }, 100);
}

function respond(message) {
    drawPopup(message.creatorName, message.videoTitle, message.href);
}

window.extensionPopup = null;

function closePopup() {
    console.log('CLOSING POPUP');
    window.extensionPopup.style.visibility = 'hidden';
}

function drawPopup(creatorName, videoTitle, href) {
    if (window.extensionPopup) {
        console.log('MODIFYING POPUP');
        window.extensionPopup.querySelector('nebext-name').innerText = creatorName;
        window.extensionPopup.querySelector('nebext-title').innerText = videoTitle;
        window.extensionPopup.querySelector('a').href = href;
        window.extensionPopup.style.visibility = 'visible';
    } else {
        console.log('CREATING POPUP');
        let extensionPopup = document.createElement('nebext-popup');
        extensionPopup.innerHTML = `
        <nebext-x>&times</nebext-x>
        <nebext-star>
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
        <style type="text/css">
            .st0{fill:none;}
            .st1{fill:#6FBCE6;}
        </style>
        <rect class="st0" width="64" height="64"></rect>
        <g id="Layer_1_1_">
            <circle class="st0" cx="32" cy="32" r="16"></circle>
            <path class="st1" d="M26.2,30.1l-9.4,6.8h11.6L32,48l3.6-11.1h11.6l-9.4-6.8l3.6-11.1L32,25.9l-9.4-6.8L26.2,30.1z"></path>
        </g>
        </svg>
        </nebext-star>
        <h1><nebext-name>${creatorName}</nebext-name> is on Nebula!</h1>
        <h2>You can watch <nebext-title>${videoTitle}</nebext-title> over there.</h2>
        <a href="${href}"><button>WATCH ON NEBULA</button></a>
        `
        document.body.insertAdjacentElement('afterbegin', extensionPopup);
        window.extensionPopup = extensionPopup;

        // Register listener to close the popup
        document.querySelector('nebext-x').addEventListener('click', closePopup);
    }
}

browser.runtime.onMessage.addListener(respond);
