const browser = require("./browser")

let credentials = {
    username: null,
    nickname: null,
    connected: false,
    server: null
}

let dofusUrls = {
    login: "https://www.dofus.com/fr/identification",
    bak: "https://www.dofus.com/fr/achat-bourses-kamas-ogrines",
    logout: "https://account.ankama.com/sso?action=logout&from=https%3A%2F%2Fwww.dofus.com%2Ffr",
    serverSelect: "https://www.dofus.com/fr/achat-bourses-kamas-ogrines/selection-serveur?server_id="
}

let bakSelectors = {
    rate: "a[href=\"/fr/achat-bourses-kamas-ogrines/cours-kama-ogrines\"]",
    kamaOffers: "a[href=\"/fr/achat-bourses-kamas-ogrines/0-francaise/achat-ogrines/toutes-offres\"]",
    ogrinOffers: "a[href=\"/fr/achat-bourses-kamas-ogrines/0-francaise/achat-kamas/toutes-offres\"]",
    createOffer: "a[href=\"/fr/achat-bourses-kamas-ogrines/0-francaise/achat-kamas/creer-offre\"]",
    accounts: "a[href=\"/fr/achat-bourses-kamas-ogrines/banque-ogrines-kamas\"]"
}

let loadingDelay = 100

async function init(enableScreenshots,screenLoc){
    await browser.init(screenLoc)
    if(enableScreenshots !== undefined)
        browser.setScreenshotsEnabled(enableScreenshots)
}

function login(username,password){
    return new Promise(function(resolve,reject){

        credentials.username = username

        var page = browser.getPage()

        page.on("onLoadFinished", async data => {

            page.off("onLoadFinished")
            await page.evaluate(function fieldFill(credentials,password) {
                var loginForm = document.querySelector("form[action=\"https://account.ankama.com/sso\"]")
                var usernameField = document.getElementById("userlogin")
                var passwordField = document.getElementById("userpass")
                usernameField.value = credentials.username
                passwordField.value = password
                loginForm.submit()
            },credentials,password)
            await browser.takeScreenshot("prelogin")
            page.on("onLoadFinished", async data => {

                page.off("onLoadFinished")
                await browser.takeScreenshot("postlogin")
                let nickname = await page.evaluate(function removeNotif() {
                    var notif = document.querySelector(".ak-lazyload-notifications")
                    if (notif)
                        notif.remove()
                    var nickname = document.querySelector(".ak-nickname")
                    var modal = document.querySelector(".ak-button-modal.ak-nav-logged")
                    if (modal)
                        modal.click()
                    return nickname ? nickname.innerText.toLowerCase() : null
                })
                if(nickname){
                    credentials.nickname = nickname
                    credentials.connected = true
                    return resolve()
                } else {
                    credentials.connected = false
                    return reject(new Error("Unable to login to Dofus website"))
                }

            })
        })
        page.open(dofusUrls.login)
    })

}

function getWeekRate(){
    return executeOnBakPage(bakSelectors.rate,function(){
        var rateBoxes = document.querySelectorAll(".ak-rate-block")
        if(rateBoxes.length == 2) {
            return {
                lowest: parseFloat(rateBoxes[0].innerText),
                average: parseFloat(rateBoxes[1].innerText)
            }
        } else {
            return null
        }
    })
}

function getBank(){
    return executeOnBakPage(bakSelectors.accounts,function(){
        var result = {}

        result.waitingKamas = parseInt(document.querySelector(".ak-waiting-kamas-ammount").innerText.replace(/ /g,""));

        result.servers = []
        var kamaServers = document.querySelectorAll(".ak-block-server")
        for(var i = 0; i<kamaServers.length; i++){
            var serverE = kamaServers[i]
            var server = {}
            server.name = serverE.querySelector(".ak-name").innerText
            server.kamas = parseInt(serverE.querySelector(".ak-nb-kamas").innerText.replace(/ /g,""));
            server.waitingKamas = parseInt(serverE
                .querySelector(".ak-nb-kamas-waiting")
                .innerText
                .replace(" en attente","")
                .replace(/ /g,""));
            result.servers.push(server)
        }

        result.ogrins = {
            amount: parseInt(document.querySelector(".ak-nb-ogrines").innerText.replace(/ /g,"")),
            linked: parseInt(document.querySelector(".ak-nb-linked-ogrines strong").innerText.replace(/ /g,"")),
            total: this.amount+this.linked
        }

        return result
    })
}

function getOgrinOffers(){

    return executeOnBakPage(bakSelectors.ogrinOffers, function(){
            var offersLines = document.querySelectorAll(".ak-ladder tbody tr")
            if(offersLines.length > 0) {
                var offers = []
                for(var i = 0; i<offersLines.length; i++ ) {
                    var el = offersLines[i]
                    offers.push({
                        ogrins: parseFloat(el.querySelector("td:nth-child(1)").innerText.replace(/ /g,'')),
                        kamas: parseFloat(el.querySelector("td:nth-child(2)").innerText.replace(/ /g,'')),
                        rate: parseFloat(el.querySelector("td:nth-child(3) .ogrines").innerText.replace(/ /g,'')),
                        unit: "k/o",
                        type: "ogrin offer"
                    })
                }
                return offers
            } else {
                return null
            }
        })
}

function getKamaOffers(){

    return executeOnBakPage(bakSelectors.kamaOffers, function(){
            var offersLines = document.querySelectorAll(".ak-ladder tbody tr")
            if(offersLines.length > 0) {
                var offers = []
                for(var i = 0; i<offersLines.length; i++ ) {
                    var el = offersLines[i]
                    offers.push({
                        ogrins: parseFloat(el.querySelector("td:nth-child(2)").innerText.replace(/ /g,'')),
                        kamas: parseFloat(el.querySelector("td:nth-child(1)").innerText.replace(/ /g,'')),
                        rate: parseFloat(el.querySelector("td:nth-child(3) .kamas").innerText.replace(/ /g,'')),
                        unit: "k/o",
                        type: "kama offer"
                    })
                }
                return offers
            } else {
                return null
            }
        })
}

function executeOnBakPage(buttonSelector,evaluateCallback){
    return new Promise((resolve,reject) => {
        if(! credentials.server)
            return reject(new Error("No server ID defined, user setServer() to set the server ID and getAvailableServers() to get the server list."))
        let page = browser.getPage()
        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            await page.evaluate(function(buttonSelector){
                var bakButton = document.querySelector(buttonSelector)
                bakButton.click()
            },buttonSelector)
            waitLoadedBak(async ()=>{
                await browser.takeScreenshot()
                let result = await page.evaluate(evaluateCallback)
                if(result) {
                    return resolve(result)
                } else {
                    return reject(new Error("Unable to get result from "+buttonSelector))
                }
            },loadingDelay)
        })
        page.open(dofusUrls.bak)
    })
}

async function waitLoadedBak(callback,delay){
    let page = browser.getPage()
    setTimeout(async () => {
        let isLoaded = await page.evaluate(function(){
            var elem = document.querySelector(".loadmask")
            return !(!!elem)
        })
        if(isLoaded){
            return callback()
        } else {
            return waitLoadedBak(callback,delay)
        }
    },delay)
}

function getServerList(){
    return new Promise((resolve,reject) => {
        let page = browser.getPage()
        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            let servers = null
            if((await page.property("url")).indexOf("selection-serveur") !== -1){
                servers = await page.evaluate(function () {
                    var serversElements = document.querySelectorAll(".ak-inside-bak .ak-block-server")
                    var servers = []
                    for (var i = 0; i < serversElements.length; i++) {
                        var serverElem = serversElements[i]
                        var server = {
                            name: serverElem.querySelector(".ak-name").innerText
                        }
                        if(serverElem.tagName == "A")
                            server.id = parseInt(serverElem.href.replace(/.*server_id=/,""))
                        else
                            continue
                        servers.push(server)
                    }
                    return servers
                })
            } else {
                servers = await page.evaluate(function () {
                    var serversElements = document.querySelectorAll(".ak-right-block-server select[name=\"dofus-server\"] option")
                    var servers = []
                    for (var i = 0; i < serversElements.length; i++) {
                        var serverElem = serversElements[i]
                        servers.push({
                            name: serverElem.innerText,
                            id: parseInt(serverElem.value)
                        })
                    }
                    return servers
                })
            }
            await browser.takeScreenshot("serverlist")
            return resolve(servers)
        })
        page.open(dofusUrls.bak)
    })
}

function selectServer(serverId){
    return new Promise((resolve,reject) => {
        let page = browser.getPage()
        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            await browser.takeScreenshot("selectserver")
            credentials.server = serverId
            return resolve()
        })
        page.open(dofusUrls.serverSelect+serverId.toString())
    })
}

function checkMaintenance(){
    return new Promise((resolve,reject) => {
        let page = browser.getPage()
        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            let isMaintenance = await page.evaluate(function(){
                var maintenanceIndicator = document.querySelector(".ak-maintenance")
                return !!maintenanceIndicator
            })
            await browser.takeScreenshot("maintenance")
            return resolve(isMaintenance)
        })
        page.open("https://www.dofus.com/fr/achat-bourses-kamas-ogrines/cours-kama-ogrines")
    })
}

function logout(){
    return new Promise(function(resolve,reject){
        let page = browser.getPage()

        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            credentials.username = null
            credentials.connected = false
            credentials.nickname = null
            await browser.takeScreenshot("logout")
            return resolve()
        })

        page.open(dofusUrls.logout)
    })
}

async function close(){
    browser.close()
}

exports.init = init
exports.close = close
exports.login = login
exports.logout = logout
exports.getWeekRate = getWeekRate
exports.getOgrinOffers = getOgrinOffers
exports.getKamaOffers = getKamaOffers
exports.checkMaintenance = checkMaintenance
exports.getBank = getBank
exports.getServerList = getServerList
exports.selectServer = selectServer

exports.getBrowser = () => {
    return browser
}

exports.getCredentials = () => {
    return credentials
}

exports.getLoadingDelay = () => {
    return loadingDelay
}

exports.setLoadingDelay = (value) => {
    loadingDelay = value
}