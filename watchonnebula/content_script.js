// Put all the javascript code here, that you want to execute after page load.

// For handling YouTube navigation, see:
// https://stackoverflow.com/questions/34077641/how-to-detect-page-navigation-on-youtube-and-modify-its-appearance-seamlessly/34100952#34100952

/**
 * Basically:
 * 
 * - We want this to run on a normal page load w/o any YouTube nagivation
 *   - I specified to run at document_end in the manifest, so the page should be
 *     fully loaded when this script executes. Therefore we can just run()
 * - We also want this to run when YouTube conducts navigation.
 *   - If we run too soon then the video title and channel are wrong, though!
 *   - We can add a listener for the youtube navigation perhaps...
 *     - This works... sometimes. The progress bar doesn't always complete! We
 *       could maybe have a fallback if a certain amount of time has passed.
 */
// window.addEventListener('transitionend', (event) => {
//     if (event.target.id != 'progress') return;
//     run();
// });
// const titleObserver = new MutationObserver(function callback(mutationList, observer) {
//     run();
// });
// titleObserver.observe(document.querySelector('h1.ytd-video-primary-info-renderer'));

// To support initial page load (this script runs after fully loaded)
console.log('INITIAL LOAD');
run();

// To support forward/backward page navigation changes.
//
// The setTimeout must be used to ensure that this effectively runs on the *new*
// page.
window.onpopstate = function (event) {
    console.log('HISTORY NAVIGATION');
    if (event.state) {
        setTimeout(run, 0);
    }
}

// To support YouTube navigation events (clicking)
//
// Similar to history navigation, the setTimeout *must* be used, or the function
// will essentially run on the previous page.
window.addEventListener('yt-navigate-finish', function(event) {
    console.log('YT NAVIGATION');
    setTimeout(run, 0);
});

// window.addEventListener('yt-navigate-start', function() {
//     document.addEventListener('transitionend', function(event) {
//         if (event.target.id != 'progress') return;
//         run();
//     });
// });

function run() {
    if (!location.pathname.startsWith('/watch')) {
        return;
    }
    
    // Get channel ID and video information from current page and send it to the
    // background script.
    //
    // TODO: Better to use YouTube API for this.

    // Easier to just serialize the page to a string and search that directly
    // let pageString = new XMLSerializer().serializeToString(document);
    // let channelID = pageString.match(/(?<="channelId":")[^"]*/);

    let channelURL = document.querySelector(
        '.ytd-video-owner-renderer + * .yt-formatted-string[href^="/channel/"]').href;
    let channelID = channelURL.split('/').pop()
    let videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer').textContent;
    console.log(`channelID: ${channelID}`);
    console.log(`videoTitle: ${videoTitle}`);

    browser.runtime.sendMessage({
        'channelID': channelID,
        'videoTitle': videoTitle
    });
}

function respond(message) {
    alert(`${message.creatorName} is on Nebula! Video: ${message.videoTitle}`);
}

browser.runtime.onMessage.addListener(respond);
