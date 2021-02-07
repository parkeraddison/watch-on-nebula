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
    closePopup();

    if (!location.pathname.startsWith('/watch')) {
        console.log('NOT A VIDEO');
        return;
    }

    const tryToGetElement = setInterval(() => {

        let channelElement = document.querySelector(
            '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"]'
        );
        let titleElement =  document.querySelector(
            'h1.ytd-video-primary-info-renderer'
        );

        if (channelElement && titleElement) {
            console.log('ABLE TO QUERY VIDEO INFORMATION');
            clearInterval(tryToGetElement);

            let channelURL = channelElement.href;
            let channelID = channelURL.split('/').pop();
        
            let videoTitle = titleElement.textContent;
        
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
    if (window.extensionPopup) {
        console.log('CLOSING POPUP');
        window.extensionPopup.style.visibility = 'hidden';
        window.extensionPopup.classList.remove('displayed');
    }
}

function drawPopup(creatorName, videoTitle, href) {
    if (window.extensionPopup) {
        console.log('MODIFYING POPUP');
        window.extensionPopup.querySelector('nebext-name').innerText = creatorName;
        window.extensionPopup.querySelector('nebext-title').innerText = videoTitle;
        window.extensionPopup.querySelector('a').href = href;
        window.extensionPopup.classList.add('displayed');
        window.extensionPopup.style.visibility = 'visible';
    } else {
        console.log('CREATING POPUP');
        let nebextPopup = document.createElement('nebext-popup');
        nebextPopup.classList.add('displayed');

        let nebextX = document.createElement('nebext-x');
        nebextX.innerText = '\u00d7'; // Multiplication symbol (&times;)
        nebextX.addEventListener('click', closePopup);
        nebextPopup.insertAdjacentElement('beforeend', nebextX);

        let nebextStar = document.createElement('nebext-star');
        nebextStar.innerHTML = `
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve">
        <g id="Layer_1_1_">
            <path fill="#6FBCE6" d="M26.2,30.1l-9.4,6.8h11.6L32,48l3.6-11.1h11.6l-9.4-6.8l3.6-11.1L32,25.9l-9.4-6.8L26.2,30.1z"></path>
        </g>
        </svg>`
        nebextPopup.insertAdjacentElement('beforeend', nebextStar);

        let h1 = document.createElement('h1');
        let nebextName = document.createElement('nebext-name');
        nebextName.innerText = creatorName;
        h1.insertAdjacentElement('beforeend', nebextName);
        h1.insertAdjacentText('beforeend', ' is on Nebula!');
        nebextPopup.insertAdjacentElement('beforeend', h1);
        
        let h2 = document.createElement('h2');
        let nebextTitle = document.createElement('nebext-title');
        nebextTitle.innerText = videoTitle;
        h2.insertAdjacentText('beforeend', 'You can watch ');
        h2.insertAdjacentElement('beforeend', nebextTitle);
        h2.insertAdjacentText('beforeend', ' over there to support this creator more directly.');
        nebextPopup.insertAdjacentElement('beforeend', h2);
        
        let a = document.createElement('a');
        a.innerHTML = '<button>WATCH ON NEBULA</button>';
        a.setAttribute('href', href);
        nebextPopup.insertAdjacentElement('beforeend', a);

        document.body.insertAdjacentElement('afterbegin', nebextPopup);
        window.extensionPopup = nebextPopup;

    }
}

browser.runtime.onMessage.addListener(respond);
