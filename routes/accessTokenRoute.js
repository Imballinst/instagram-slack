// Import modules
const querystring = require('querystring');

const app = require('../app');
const httpsRequest = require('../libs/HttpsRequest');
const replaceAccessToken = require('../libs/ReplaceAccessToken');
const LogUtil = require('../libs/LogUtil');

// API things
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const enableAuthorize = process.env.ENABLE_AUTHORIZE;
const changeTokenPassword = process.env.SECURE_CHANGE_KEY;
const serverUrl = process.env.SERVER_URL;

// First step to authorize, redirect to Instagram's redirect URI
app.get('/authorize', (_, res) => {
  if (enableAuthorize === 'TRUE') {
    // JSON Object of POST data
    const getCodeJSON = {
      client_id: clientID,
      redirect_uri: `${serverUrl}/get-response-code`,
      response_type: 'code',
    };

    // Stringify JSON and set header options
    const getCodeString = querystring.stringify(getCodeJSON);

    // Build up the complete path
    const getCodeURL = `https://api.instagram.com/oauth/authorize/?${getCodeString}`;

    res.redirect(getCodeURL);
  } else {
    res.send('Authorization is disabled currently!');
  }
});

// Second step to authorize, get response code
app.get('/get-response-code', (req, res) => {
  if (req.query.code !== undefined) {
    // JSON Object of POST data
    const getTokenJSON = {
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: `${serverUrl}/get-response-code`,
      code: req.query.code,
    };

    // Stringify JSON and set header options
    const getTokenString = querystring.stringify(getTokenJSON);
    const options = {
      hostname: 'api.instagram.com',
      path: '/oauth/access_token/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(getTokenString),
      },
    };

    const callback = (json) => {
      const accessToken = JSON.parse(json).access_token;

      res.render('index', { accessToken });
    };

    // Send request
    httpsRequest(options, getTokenString, callback);
  } else {
    res.send(req.query);
  }
});

// Change access token, POST
app.post('/change-access-token', (req, res) => {
  const token = req.body.access_token;
  const password = req.body.password;

  if (password === changeTokenPassword) {
    replaceAccessToken(token);

    res.send('Access token change successful');

    LogUtil.winston.log('info', `Access Token changed to ${token}`);
  } else {
    LogUtil.winston.log('error', `Access Token change failed with password ${password}`);

    res.send('Access token change failed');
  }
});
