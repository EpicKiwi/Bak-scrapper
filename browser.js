const phantom = require("phantom")

let settings = {
    viewport : {
        width: 1920,
        height: 1080
    },
    userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:57.0) Gecko/20100101 Firefox/57.0"
}
let renderId = 0;
let instance = null
let page = null
let screenshots = true

async function init(){
    instance = await phantom.create()
    page = await instance.createPage()
    await page.property('viewportSize',settings.viewport)
    await page.setting("userAgent",settings.userAgent)
}

async function takeScreenshot(filesuffix){
    if(! screenshots)
        return
    renderId++
    let name = filesuffix ? `screenshot-${renderId}-${filesuffix}.png` : `screenshot-${renderId}.png`
    await page.render(`./screenshots/${name}`)
    console.log(`Rendered ${name}`)
}

async function close(){
    await instance.exit()
}

function getPage(){
    return page
}

function getInstance(){
    return instance
}

exports.init = init
exports.close = close
exports.getPage = getPage
exports.getInstance = getInstance
exports.takeScreenshot = takeScreenshot

exports.isScreenshotsEnabled = function isScreenshotsEnabled(){
    return screenshots
}
exports.setScreenshotsEnabled = function setScreenshotsEnabled(enabled){
    screenshots = enabled
}