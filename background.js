chrome.runtime.onMessage.addListener((arg, sender) => {
    const fs = {
        logger_save: loggerSave
    }
    fs[arg.key](arg.value)
})

function loggerSave(records) {
    const json = JSON.stringify(records)
    const url = 'data:application/json;base64,' + btoa(encodeURIComponent(json))
    const ts = Date.now()
    chrome.downloads.download({
        url: url,
        filename: `m2timer_log_${ts}`
    });
}
