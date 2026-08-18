const emailjs = require("@emailjs/nodejs")
const allBasic = require("./BasicFX")
emailjs.init({
    publicKey: 'xET-6G5nkOIlnhBWz',
    privateKey: 'buIjBrbcfRf3AqhwPUnAB',
})

const mailUser = async(email, templateId = 'template_irryds5') =>{
    const randomValue = await allBasic.getRandom()
    emailjs.send('service_rql13fa', templateId, {
        email: email,
        OTP: randomValue
    })
    .then(async(response) => {
        console.log('SUCCESS!', response.status, response.text);
        console.log("here");
    })
    .catch((err) => {
        console.log('FAILED...', err);
        return({error: "Error sending OTP"})
    })
    return randomValue

}
module.exports = mailUser