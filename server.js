require('dotenv').config()
const moment = require('moment');
const cron = require('node-cron');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const bot = new TelegramBot(token);
const chatId = process.env.CHATID

const PINCODE = process.env.PINCODE
const AGE = process.env.AGE

async function main(){
    try {
        cron.schedule('* * * * *', async () => {
            await checkAvailability();
        });
    } catch (e) {
        console.log('an error occured: ' + JSON.stringify(e, null, 2));
        throw e;
    }
}

async function checkAvailability() {

    let datesArray = await fetchNext10Days();
    datesArray.forEach(date => {
        getSlotsForDate(date);
    })
}

function getSlotsForDate(DATE) {
    axios.get('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=' + PINCODE + '&date=' + DATE)
        .then(function (slots) {
            let sessions = slots.data.sessions;
            let validSlots = sessions.filter(slot => slot.min_age_limit <= AGE &&  slot.available_capacity > 0)
            console.log({date:DATE, validSlots: validSlots.length})
            if(validSlots.length > 0) {
                notifyMe(validSlots);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function

notifyMe(validSlots){
    let slotDetails = JSON.stringify(validSlots, null, '\t');
    console.log(slotDetails)

    slotDetails.map((i) => {
        const center = 'center name: ' + i.name;
        const state = 'state name: ' + i.state_name;
        const district = 'district name: ' + i.district_name;
        const block = 'Block name: ' + i.district_name;
        const feeType = 'Fee Type: ' + i.fee_type;
        const vaccine = 'Vaccine: ' + i.vaccine;
        const fee = 'Fee: ' + i.fee;
        let slot = '';
        i.slots.map((sl) => {
            slot = slot + '\n' + sl;
        });
        const msg = center + '\n' + state + '\n' + district + '\n' + block + '\n' + feeType + '\n' + fee + '\n' + vaccine + '\n' + 'Slots: ' + slot + '\n';
        bot.sendMessage(chatId, 'Vaccination Slot:' + msg);
    })
};

async function fetchNext10Days(){
    let dates = [];
    let today = moment();
    for(let i = 0 ; i < 10 ; i ++ ){
        let dateString = today.format('DD-MM-YYYY')
        dates.push(dateString);
        today.add(1, 'day');
    }
    return dates;
}


main()
    .then(() => {
        const msg = 'Vaccine availability Checker Started.'
        console.log(msg);
        bot.sendMessage(chatId, msg);
    });
