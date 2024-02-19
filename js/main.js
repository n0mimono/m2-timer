class TimeExpression {
    constructor() {
        this.prefix = chrome.i18n.getMessage('prefix')
        this.splitter = chrome.i18n.getMessage('splitter')
        this.suffix = chrome.i18n.getMessage('suffix')
        this.timeout = chrome.i18n.getMessage('timeout')
    }

    build(str) {
        const regex = new RegExp(`${this.prefix}\\d{2}:\\d{2}${this.splitter}[0-9a-zA-Z]+${this.suffix}`)
        const matched = str.match(regex)

        if (!matched) {
            this.ok = false
            return
        }
        this.ok = true

        const xs = matched[0].replace(this.prefix, '').replace(this.suffix, '').split(this.splitter)
        const mmss = xs[0].split(':')
        this.limit = parseInt(mmss[0]) * 60 + parseInt(mmss[1])
        this.label = xs[1]
    }

    now(elapsed) {
        const left = this.limit - elapsed

        if (left <= 0) {
            return this.timeout
        }

        const mm = parseInt(left / 60)
        const ss = left % 60
        const f = (x) => ('00' + x).slice(-2)

        return `${f(mm)}:${f(ss)}`
    }
}

class Timer {
    constructor(element) {
        let html = element.innerHTML
        if (element.m2timer) {
            html = element.m2timer
        } else {
            element.m2timer = element.innerHTML
        }

        this.exp = new TimeExpression()
        this.exp.build(html)

        this.active = this.exp.ok
        this.element = element
        this.label = this.exp.label
        this.elapsed = -1
    }

    update(elapsed) {
        elapsed = parseInt(elapsed)

        if (this.elapsed === elapsed) {
            return
        }
        this.elapsed = elapsed

        this.element.innerHTML = this.exp.now(elapsed)
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
            if (timer.active) {
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

        // update by time
        setInterval(() => {
            if (document.fullscreenElement) {
                onFullScreenUpdate(session)
            }
        }, 100)

        // update by full screen change
        document.addEventListener("fullscreenchange", () => {
            if (document.fullscreenElement) {
                onFullScreenEnable(session)
            } else {
                onFullScreenDesable(session)
            }
        })

        // update by document body change
        const observer = new MutationObserver((mutations) => {
            if (document.fullscreenElement) {
                onDocumentChange(session)
            }
        })
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    })()

    function onFullScreenEnable(session) {
        //console.log('onFullScreenEnable')
        session.initMonitors()
    }

    function onFullScreenDesable(session) {
        //console.log('onFullScreenDesable')
        // nop
    }

    function onFullScreenUpdate(session) {
        //console.log('onFullScreenUpdate')
        session.updateTimers()
    }

    function onDocumentChange(session) {
        //console.log('onDocumentChange')
        session.initTimers()
        session.updateTimers()
    }
}
