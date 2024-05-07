chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        chrome.tabs.sendMessage(tabId, {
            key: 'tab_changed',
            value: {
                url: changeInfo.url
            }
        }, (response) => {

        })
    }
})
