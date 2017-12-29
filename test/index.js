const dbrowser = require("../lib/dofusBrowser")

const dusername = "torturaie"
const dpassword = "bananeavion66"

;(async function index(){

    try {
        await dbrowser.init(true,"./screenshots")
        console.log("Logging in to Dofus website")
        await dbrowser.login(dusername, dpassword)
        console.log(`Logged in as ${dbrowser.getCredentials().nickname}`)

        console.log("Checking maintenance mode")
        if (!await dbrowser.checkMaintenance()) {
            console.log("Getting server list")
            let avaliableServers = await dbrowser.getServerList()
            console.log(`${avaliableServers.length} servers avaliable`)
            console.log(`Selecting first server ${avaliableServers[0].name}`)
            await dbrowser.selectServer(avaliableServers[0].id)
            console.log("Server selected")
            console.log("Loading ogrin offers")
            let offers = await dbrowser.getOgrinOffers()
            console.log(`${offers.length} ogrin offers`)
            console.log("Loading kamas offers")
            offers = await dbrowser.getKamaOffers()
            console.log(`${offers.length} dofus offers`)
            console.log("Loading bank")
            let bank = await dbrowser.getBank()
            console.log(`${bank.ogrins.amount} ogrins, ${bank.ogrins.linked} linked`)
            console.log(`${bank.waitingKamas} waiting kamas`)
            bank.servers.forEach(el => console.log(`${el.name} : ${el.kamas} kamas, ${el.waitingKamas} waiting`))

            console.log("Trying to select another server")
            let newServers = await dbrowser.getServerList()
            if(newServers.length > 1) {
                await dbrowser.selectServer(newServers[1].id)
                console.log(`Selected server ${newServers[1].name}`)
            } else {
                console.log("Only one server available")
            }
        } else {
            console.log("Maintenance on the BAK, can't get infos")
        }
        console.log(`Logging out ${dbrowser.getCredentials().nickname} from Dofus website`)
        await dbrowser.logout()
        console.log("Logged out")

        console.log("Try to re-logging in to Dofus website")
        await dbrowser.login(dusername, dpassword)
        console.log(`Logged in as ${dbrowser.getCredentials().nickname}`)
        console.log(`Logging out ${dbrowser.getCredentials().nickname} from Dofus website`)
        await dbrowser.logout()
        console.log("Logged out")

    } catch(e){
        console.error(e)
    } finally {
        await dbrowser.close()
    }

})()