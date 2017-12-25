const dbrowser = require("./dofusBrowser")

const dusername = "torturaie"
const dpassword = "bananeavion66"

;(async function index(){

    await dbrowser.init(dusername,dpassword)
    let rate = await dbrowser.getRate()
    console.log(rate)
    await dbrowser.close()

})()