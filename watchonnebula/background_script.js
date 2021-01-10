
// Get all of the creators that are on Nebula and their youtube channels.
getNebulaCreators()

// When a content script visits a youtube video, it'll send the channel info and
// we'll check if the channel belongs to a Nebula creator.
browser.runtime.onMessage.addListener(checkCreator);

async function getNebulaCreators() {

    console.log('GETTING CREATORS');

    htmlPromise = loadHTML('https://standard.tv', parse=true);
    htmlPromise.then(function (doc) {

        let creators =  doc.querySelectorAll('.youtube-creator');
        let creatorData = Array.from(creators).map(d => {
            return JSON.parse(JSON.stringify(d.querySelector('a').dataset))
        });

        // Expose to other functions
        window.creatorData = creatorData;
        console.log('GETTING CREATORS COMPLETE');
    });
}

function checkCreator(message, sender) {

    console.log('CHECKING YOUTUBE CHANNEL')

    // Not the most elegant solution, but I was having a hard time mixing
    // Promises with synchronous dependencies (i.e. this function relies on our
    // getNebulaCreators being complete). But hey, this works!
    const waitForData = setInterval(() => {
        if (window.creatorData) {

            clearInterval(waitForData);
            
            console.log('CREATOR DATA DEFINED');

            let channelIDs = window.creatorData.map(d => d.video);

            let channelMatch = channelIDs.indexOf(message.channelID);
        
            // If the creator is also on Nebula then we should get the corresponding
            // data from Nebula and tell the content script to make an alert.
            if (channelMatch > -1) {
                console.log("IT'S A MATCH!")
                
                let data = window.creatorData[channelMatch];
        
                console.log(data);
        
                // TODO: We should also try to find the link directly to the
                // corresponding video. For now, we'll just link to the creator
                // page.
                browser.tabs.sendMessage(sender.tab.id, {
                    'creatorName': data.title,
                    'videoTitle': message.videoTitle,
                    'href': data.nebula
                })
            }
        } else {
            console.log('CREATOR DATA UNDEFINED - WAITING');
        }
    }, 1000);
}

async function loadHTML(url, parse=false) {
    let response = await fetch(url);
    let html = await response.text();
    if (parse) {
        let parser = new DOMParser();
        html = parser.parseFromString(html, 'text/html');
    }
    return html;
}
