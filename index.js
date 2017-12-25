const phantom = require("phantom");

const dusername = "torturaie"
const dpassword = "bananeavion66"
let nickname = null;
let increment = 0;

(async function (){

    const instance = await phantom.create()
    const page = await instance.createPage();

    page.on("onResourceRequested",data => {
        console.info(`Requesting ${data.method} ${data.url}`)
    })

    page.on("onLoadFinished", async data => {

        if(increment == 0) {
            await page.evaluate(function fieldFill() {
                var loginForm = document.querySelector("form[action=\"https://account.ankama.com/sso\"]")
                var usernameField = document.getElementById("userlogin")
                var passwordField = document.getElementById("userpass")
                usernameField.value = "torturaie"
                passwordField.value = "bananeavion66"
                loginForm.submit()
            })
        }
        nickname = await page.evaluate(function removeNotif(){
            var notif = document.querySelector(".ak-lazyload-notifications")
            if(notif)
                notif.remove()
            var nickname = document.querySelector(".ak-nickname")
            var modal = document.querySelector(".ak-button-modal.ak-nav-logged")
            if(modal)
                modal.click()
            return nickname ? nickname.innerText : null
        })
        console.log(`Nickname : ${nickname}`)
        increment++
        await page.render(`./screenshots/screenshot-${increment}.png`)
        console.log("Rendered")
    })

    await page.property('viewportSize',{width: 1920, height: 1080})
    await page.setting("userAgent","Mozilla/5.0 (X11; Linux x86_64; rv:57.0) Gecko/20100101 Firefox/57.0")

    await page.open('https://www.dofus.com/fr/identification')


})()