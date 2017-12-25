const browser = require("./browser")

let credentials = {
    username: null,
    password: null
}

let dofusUrls = {
    login: "https://www.dofus.com/fr/identification"
}

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

            browser.takeScreenshot()
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

                browser.takeScreenshot()
                page.off("onLoadFinished")
                let nickname = await page.evaluate(function removeNotif() {
                    var notif = document.querySelector(".ak-lazyload-notifications")
                    if (notif)
                        notif.remove()
                    var nickname = document.querySelector(".ak-nickname")
                    var modal = document.querySelector(".ak-button-modal.ak-nav-logged")
                    if (modal)
                        modal.click()
                    return nickname ? nickname.innerText : null
                })
                if(nickname){
                    credentials.nickname = nickname
                    return resolve()
                } else {
                    return reject(new Error("Unable to login to Dofus website"))
                }

            })
        })
        page.open(dofusUrls.login)
    })

}

async function close(){
    browser.close()
}

exports.init = init
exports.close = close