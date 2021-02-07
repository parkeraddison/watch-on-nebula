
// Get all of the creators that are on Nebula and their youtube channels.
getNebulaCreators()

// When a content script visits a youtube video, it'll send the channel info and
// we'll check if the channel belongs to a Nebula creator.
browser.runtime.onMessage.addListener(checkCreator);

async function getNebulaCreators() {

    console.log('GETTING CREATORS');

    htmlPromise = loadHTML('https://standard.tv', parse=true);
    htmlPromise.then(function (doc) {

        let creators =  Array.from(doc.querySelectorAll('.youtube-creator'));
        let creatorData = creators.map(d => {

            // Not all creators on StandardTV have a Nebula link yet. If this is
            // the case, they shouldn't pop up.
            let nebulaAnchor = d.querySelector('a.nebula');
            if (!nebulaAnchor) {
                return null
            }
            return {
                'channelID': d.dataset.video,
                'creatorName': d.querySelector('h3').innerText,
                'nebulaPage': nebulaAnchor.href
            }
        }).filter(d => d);

        // Expose to other functions
        window.creatorData = creatorData;
        console.log('GETTING CREATORS COMPLETE');
    });
}

function checkCreator(message, sender) {

    console.log('CHECKING YOUTUBE CHANNEL');

    // Not the most elegant solution, but I was having a hard time mixing
    // Promises with synchronous dependencies (i.e. this function relies on our
    // getNebulaCreators being complete). But hey, this works!
    let timeWaited = 0;
    const waitForData = setInterval(() => {
        if (window.creatorData) {

            clearInterval(waitForData);
            
            console.log('CREATOR DATA DEFINED');

            let channelIDs = window.creatorData.map(d => d.channelID);

            let channelMatch = channelIDs.indexOf(message.channelID);

            console.log(channelIDs);
            console.log(channelMatch);
            
            // If the creator is also on Nebula then we should get the corres-
            // ponding data from Nebula and tell the content script to prompt.
            if (channelMatch > -1) {
                console.log("IT'S A MATCH!");
                
                let data = window.creatorData[channelMatch];
        
                console.log(data);
        
                // It's challenging to link directly to the video since the
                // video results on Nebula pages are deferred -- thus not easily
                // scrapable!
                //
                // What we *can* do is just link to the search query, so you'd
                // be taken to the search page. I don't think we can filter our
                // search by creators yet.
                //
                // Previously we searched for the creatorName followed by the
                // videoTitle... but that produced strange inconsistencies where
                // sometimes the addition of the creatorName caused zero search
                // results.
                //
                // For now we're searching just the videoTitle... but there are
                // times where a video will have a different title on YouTube vs
                // on Nebula.
                //
                // See corresponding issue on GitHub.
                //
                // The alternative is to just link to the creator's page.
                let query = encodeURIComponent(`${message.videoTitle}`);
                browser.tabs.sendMessage(sender.tab.id, {
                    'creatorName': data.creatorName,
                    'videoTitle': message.videoTitle,
                    'href': `https://watchnebula.com/search?q=${query}`
                    // 'href': data.nebulaPage // Alternate
                })
            } else {
                console.log('CHANNEL NOT ON NEBULA');
            }
        } else {
            console.log('CREATOR DATA UNDEFINED - WAITING');
            timeWaited += 1000;
            
            // If it's been a while and we *still* haven't seen the data, try
            // running the scrape again.
            if (timeWaited > 8000) {
                console.log('CREATOR DATA STILL NOT SEEN - REQUESTING AGAIN');
                getNebulaCreators();
                timeWaited = 0;
            }
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
