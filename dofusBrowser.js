const browser = require("./browser")

let credentials = {
    username: null,
    password: null,
    nickname: null
}

let dofusUrls = {
    login: "https://www.dofus.com/fr/identification",
    bak: "https://www.dofus.com/fr/achat-bourses-kamas-ogrines"
}

let loadingDelay = 1000

async function init(username,password){
    credentials.username = username
    credentials.password = password
    await browser.init()
    await login()
}

function login(){

    return new Promise(function(resolve,reject){

        console.info(`Login to Dofus with username ${credentials.username}`)
        var page = browser.getPage()

        page.on("onLoadFinished", async data => {

            page.off("onLoadFinished")
            await page.evaluate(function fieldFill(credentials) {
                var loginForm = document.querySelector("form[action=\"https://account.ankama.com/sso\"]")
                var usernameField = document.getElementById("userlogin")
                var passwordField = document.getElementById("userpass")
                usernameField.value = credentials.username
                passwordField.value = credentials.password
                loginForm.submit()
            },credentials)
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
                    console.info(`Logged in as ${credentials.nickname}`)
                    return resolve()
                } else {
                    console.error("Can't login")
                    return reject(new Error("Unable to login to Dofus website"))
                }

            })
        })
        page.open(dofusUrls.login)
    })

}

function getWeekRate(){
    return executeOnBakPage("a[href=\"/fr/achat-bourses-kamas-ogrines/cours-kama-ogrines\"]",function(){
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

function getOgrinOffers(){

    return executeOnBakPage(
        "a[href=\"/fr/achat-bourses-kamas-ogrines/0-francaise/achat-kamas/toutes-offres\"]",
        function(){
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

function executeOnBakPage(buttonSelector,evaluateCallback){
    return new Promise((resolve,reject) => {
        let page = browser.getPage()
        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            await page.evaluate(function(buttonSelector){
                var bakButton = document.querySelector(buttonSelector)
                bakButton.click()
            },buttonSelector)
            setTimeout(async ()=>{
                await browser.takeScreenshot()
                let result = await page.evaluate(evaluateCallback)
                if(result) {
                    return resolve(result)
                } else {
                    return reject(new Error("Unable to get result from "+buttonSelector))
                }
            },loadingDelay)
        })
        page.open("https://www.dofus.com/fr/achat-bourses-kamas-ogrines/cours-kama-ogrines")
    })
}

async function close(){
    browser.close()
}

exports.init = init
exports.close = close
exports.getWeekRate = getWeekRate
exports.getOgrinOffers = getOgrinOffers

exports.getBrowser = () => {
    return browser
}