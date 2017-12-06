const express = require('express');

const router = express.Router();

const fetch = require('node-fetch');
const btoa = require('btoa');

const CLIENT_ID = '387098195580289025';
const CLIENT_SECRET = '2di4O2F4KGY__Rap87DqiKLM4Q0Yahae';
const redirect = encodeURIComponent('http://spookelton.net:25565/api/discord/callback');

router.get('/login', (req, res) => {
  res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=identify&response_type=code&redirect_uri=${redirect}`);
});

router.get('/callback', (req, res) => {
  if (!req.query.code) throw new Error('NoCodeProvided');
  const code = req.query.code;
  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const response = fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
      },
    });
  const json = response.json();
  res.redirect(`/?token=${json.access_token}`);
});

module.exports = router;
