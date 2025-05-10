const paypal = require('paypal-rest-sdk');


paypal.configure({
    mode : 'sandbox',
    client_id : 'ATZ_QxXcRJKt5PijmLCobd-7mymPNm2E9K6hDqDdfX2nLb_gdR7Wi0a3Zj1Lrn2vYYAY9U2Uv7YO_44f',
    client_secret : 'EFA1nC7-SPcgmplaB7qSxEijEXDTp6c3IaV4tN9jnhjyxW73Nqkw_udfqmh56oedzXTmjzc238bCSDOL'
}) 

module.exports = paypal;