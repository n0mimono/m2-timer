chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
        key: 'show_log',
        value: {},
    }, (response) => {
        const records = response.records
        const text = document.getElementById('txt')
        text.innerHTML = JSON.stringify(records)
    })
})
