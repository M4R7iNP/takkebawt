takkebawt
=========

We live in ((new Date()).getFullYear()), why do we have to reply to every birthday congratulation manually?

#### Step by step
1. Aquire your short lived access token from [Facebook Graph Explorer](https://developers.facebook.com/tools/explorer?method=GET&path=me%2Ffeed&version=v2.2) with required permissions (publish_stream, read_stream)
2. [Optional] Exhange your short lived access token for a long lived one with `node ./exhange_for_long_lived_token.js <SHORT_LIVED_TOKEN>`
3. Insert your access token into `config.json`
4. Start the app
```bash
martin@lapras:~/takkebawt$ node index.js >> stdout.log 2>> stderr.log
```
