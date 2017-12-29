const dbrowser = require("../lib/dofusBrowser")

const dusername = "torturaie"
const dpassword = "bananeavion66"

;(async function index(){

    try {
        await dbrowser.init(false)
        console.log("Logging in to Dofus website")
        await dbrowser.login(dusername, dpassword)
        console.log(`Logged in as ${dbrowser.getCredentials().nickname}`)

        console.log("Checking maintenance mode")
        if (!await dbrowser.checkMaintenance()) {
            console.log("Loading ogrin offers")
            let offers = await dbrowser.getOgrinOffers()
            console.log(`${offers.length} ogrin offers`)
            console.log("Loading kamas offers")
            offers = await dbrowser.getKamaOffers()
            console.log(`${offers.length} dofus offers`)
            console.log(`Logging out ${dbrowser.getCredentials().nickname} from Dofus website`)
            await dbrowser.logout()
            console.log("Logged out")
        } else {
            console.log("Maintenance on the BAK, can't get infos")
        }

    } catch(e){
        console.error(e)
    } finally {
        await dbrowser.close()
    }

})()