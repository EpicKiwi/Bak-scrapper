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

async function init(){
    instance = await phantom.create()
    page = await instance.createPage()
    await page.property('viewportSize',settings.viewport)
    await page.setting("userAgent",settings.userAgent)
}

async function takeScreenshot(filesuffix){
    increment++
    var name = filesuffix ? `screenshot-${increment}-${filesuffix}.png` : `screenshot-${increment}.png`
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
exports.loadPage = loadPage
exports.close = close
exports.getPage = getPage
exports.getInstance = getInstance
exports.takeScreenshot = takeScreenshot()