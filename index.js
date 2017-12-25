const dbrowser = require("./dofusBrowser")

const dusername = "torturaie"
const dpassword = "bananeavion66"

;(async function index(){

    await dbrowser.init(dusername,dpassword)
    let offers = await dbrowser.getOgrinOffers()
    console.log(offers)
    await dbrowser.close()

})()