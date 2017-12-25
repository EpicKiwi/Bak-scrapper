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

            await browser.takeScreenshot("prelogin")
            page.off("onLoadFinished")
            await page.evaluate(function fieldFill(credentials) {
                var loginForm = document.querySelector("form[action=\"https://account.ankama.com/sso\"]")
                var usernameField = document.getElementById("userlogin")
                var passwordField = document.getElementById("userpass")
                usernameField.value = credentials.username
                passwordField.value = credentials.password
                loginForm.submit()
            },credentials)
            page.on("onLoadFinished", async data => {

                await browser.takeScreenshot("postlogin")
                page.off("onLoadFinished")
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

function getRate(){
    return new Promise((resolve,reject) => {
        let page = browser.getPage()
        page.on("onLoadFinished", async data => {
            page.off("onLoadFinished")
            await page.evaluate(function(){
                var rateButton = document.querySelector("a[href=\"/fr/achat-bourses-kamas-ogrines/cours-kama-ogrines\"]")
                rateButton.click()
            })
            setTimeout(async ()=>{
                await browser.takeScreenshot("rate")
                let rate = await page.evaluate(function(){
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
                if(rate) {
                    return resolve(rate)
                } else {
                    return reject(new Error("Unable to get Rates"))
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
exports.getRate = getRate

exports.getBrowser = () => {
    return browser
}