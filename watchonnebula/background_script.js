// Put all the javascript code here, that you want to execute in background.

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

        // for (i in creatorData) {

        //     let creatorYT = creatorData[i].youtube;

        //     if (!creatorYT) continue;

        //     // We need to clean up the url to avoid CORS problems. Namely, let's
        //     // make sure they all start with https://.
        //     if (creatorYT.startsWith('http://')) {
        //         creatorYT = 'https://' + creatorYT.slice(7,);
        //     } else if (!creatorYT.startsWith('https://')) {
        //         creatorYT = 'https://' + creatorYT;
        //     }

        //     var channelID;
        //     // If the link is a /channel link then just extract the ID
        //     if (creatorYT.includes('/channel/')) {
        //         splitted = creatorYT.split('/');
        //         channelID = splitted[splitted.indexOf('channel')+1];
        //         // console.log(`${data.title} has direct channel link with ID ${channelID}`);
        //     } else {
        //         // If it's a user link or custom url then perform ID extraction
        //         loadHTML(creatorYT)
        //         .then(function (html) {
        //             // // See: https://stackoverflow.com/questions/47096243/how-to-get-youtube-channel-id-using-channel-custom-name
        //             // let pattern = /(?<=canonical" href="https:\/\/(?:www\.)?youtube.com\/channel\/)[^"]*/;

        //             // Another way:
        //             let pattern = /(?<="urlCanonical":")[^".]*/;
        //             channelID = html.match(pattern);
        //         })
        //     }

        //     creatorData[i].channelID = channelID ? channelID : false;
        // }

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
            console.log(message.channelID);
            console.log(channelMatch);
        
            // If the creator is also on Nebula then we should get the corresponding
            // data from Nebula and tell the content script to make an alert.
            if (channelMatch > -1) {
                let data = window.creatorData[channelMatch];
        
                console.log(data);
        
                // We should also try to find the link directly to the corresponding video.
                // TODO
        
                browser.tabs.sendMessage(sender.tab.id, {
                    'creatorName': data.title,
                    'videoTitle': message.videoTitle
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
