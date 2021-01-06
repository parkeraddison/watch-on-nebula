// Put all the javascript code here, that you want to execute in background.

// Get the collection of Nebula creators and their YouTube links.

async function loadHTML(url, parse=false) {
    let response = await fetch(url);
    let html = await response.text();
    if (parse) {
        let parser = new DOMParser();
        html = parser.parseFromString(html, 'text/html');
    }
    return html;
}

async function run() {

    console.log('RUNNING');

    htmlPromise = loadHTML('https://standard.tv', parse=true);
    htmlPromise.then(function (doc) {

        let creators =  doc.querySelectorAll('.youtube-creator');
        let creatorData = Array.from(creators).map(d => d.querySelector('a').dataset);


        let channelIDs = [];
        creatorData.forEach(function (data) {

            let creatorYT = data.youtube;
            if (!creatorYT) {
                return;
            }
            // We need to clean up the url to avoid CORS problems. Namely, let's
            // make sure they all start with https://.
            if (creatorYT.startsWith('http://')) {
                creatorYT = 'https://' + creatorYT.slice(7,);
            } else if (!creatorYT.startsWith('https://')) {
                creatorYT = 'https://' + creatorYT;
            }
            var channelID;
            
            // If the link is a /channel link then just extract the ID
            if (creatorYT.includes('/channel/')) {
                splitted = creatorYT.split('/');
                channelID = splitted[splitted.indexOf('channel')+1];
                console.log(`${data.title} has direct channel link with ID ${channelID}`);
            }
            
            // If it's a user link or custom url then perform ID extraction
            else {
                console.log(`ATTEMPTING: ${creatorYT}`);
                loadHTML(creatorYT)
                .then(function (html) {
                        // See: https://stackoverflow.com/questions/47096243/how-to-get-youtube-channel-id-using-channel-custom-name
                        let pattern = /(?<=canonical" href="https:\/\/(?:www\.)?youtube.com\/channel\/)[^"]*/;
                        channelID = html.match(pattern);
                        console.log(`${data.title} has indirect link but found ID ${channelID}`)
                    })
            }

            channelIDs.push(channelID);
        });

        window.channelIDs = channelIDs;

    });
        
}

mainRunPromise = run();

async function check(message, sender) {
    console.log(message);
    await mainRunPromise;
    
    channelMatch = String(window.channelIDs.indexOf(message.channelID));
    
    console.log(channelMatch);
    console.log(sender.tab.id);
    browser.tabs.sendMessage(sender.tab.id, {channelMatch: channelMatch});
}

// Listen for a channelID from the content script, then check for a match.
browser.runtime.onMessage.addListener(check);

//     let match = creatorData.filter(d => d.youtube.replace(/\/$/,'') == youtubeChannel)
//     if (match.length > 0) {
//         alert(`You should be watching this on Nebula! Go to ${match[0].nebula}`)
//     }

//     let creatorChannels = creatorData.map(d => d.youtube.replace(/\/$/,''));
//     if ( creatorChannels.includes(youtubeChannel) ) {

//     }
// })
