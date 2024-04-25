class TimeExpression {
    constructor(str) {
        this.overtimeColor = chrome.i18n.getMessage('overtimeColor')

        const prefix = chrome.i18n.getMessage('prefix')
        const splitter = chrome.i18n.getMessage('splitter')
        const suffix = chrome.i18n.getMessage('suffix')

        const regex = new RegExp(`${prefix}(\\d{2}):(\\d{2})${splitter}([0-9a-zA-Z]+)${suffix}`)
        const matches = regex.exec(str)

        if (!matches) {
            this.ok = false
            return
        }

        this.ok = true
        this.limit = parseInt(matches[1]) * 60 + parseInt(matches[2])
        this.label = matches[3]
    }

    now(elapsed) {
        const left = this.limit - elapsed

        const num = Math.abs(left)
        const mm = parseInt(num / 60)
        const ss = num % 60
        const f = (x) => ('00' + x).slice(-2)
        const text = `${f(mm)}:${f(ss)}`

        const overtime = Math.sign(left) < 0
        const color = overtime ? this.overtimeColor : undefined

        return {
            text: text,
            color: color,
        }
    }
}

class Timer {
    constructor(element) {
        let html = element.innerHTML
        if (element.m2timer) {
            html = element.m2timer.innerHTML
        } else {
            element.m2timer = {
                innerHTML: element.innerHTML
            }
        }

        this.exp = new TimeExpression(html)

        this.enabled = this.exp.ok
        this.label = this.exp.label
        this.elapsed = -1
        this.element = element
    }

    update(elapsed) {
        elapsed = parseInt(elapsed)

        if (this.elapsed === elapsed) {
            return
        }
        this.elapsed = elapsed

        const disp = this.exp.now(elapsed)
        this.element.innerHTML = disp.text
        this.element.style.fill = disp.color
    }
}

class Session {
    constructor() {
        this.timers = []
        this.monitors = {}
    }

    initMonitors() {
        this.monitors = {}
    }

    initTimers() {
        this.timers = []

        const iframe = document.querySelector('iframe.punch-present-iframe')
        const texts = [...iframe.contentWindow.document.getElementsByTagName('text')]

        texts.forEach((text) => {
            const timer = new Timer(text)
            if (timer.enabled) {
                this.timers.push(timer)
            }
        })

        this.timers.forEach((timer) => {
            if (timer.label in this.monitors) {
                // nop
            } else {
                this.monitors[timer.label] = Date.now()
            }
        })
    }

    updateTimers() {
        const now = Date.now()

        this.timers.forEach(timer => {
            const start = this.monitors[timer.label]
            const elapsed = (now - start) / 1000
            timer.update(elapsed)
        })
    }
}

{
    (function () {
        let session = new Session()
        let presenterRunning = false

        // update by document body change
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.className == 'punch-full-screen-element punch-full-window-overlay') {
                        presenterRunning = true
                        onPresenterEnable(session)
                    }
                })
                mutation.removedNodes.forEach((node) => {
                    if (node.className == 'punch-full-screen-element punch-full-window-overlay') {
                        presenterRunning = false
                        onPresenterDesable(session)
                    }
                })
            })

            if (presenterRunning) {
                onPresenterSlideUpdate(session)
            }
        })
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // update by time
        setInterval(() => {
            if (presenterRunning) {
                onPresenterTimeUpdate(session)
            }
        }, 100)
    })()

    function onPresenterEnable(session) {
        //console.log('onPresenterEnable')
        session.initMonitors()
    }

    function onPresenterDesable(session) {
        //console.log('onPresenterDesable')
        // nop
    }

    function onPresenterSlideUpdate(session) {
        //console.log('onPresenterSlideUpdate')
        session.initTimers()
        session.updateTimers()
    }

    function onPresenterTimeUpdate(session) {
        //console.log('onPresenterTimeUpdate')
        session.updateTimers()
    }
}
