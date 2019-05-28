# duocun-driver
duocun-driver is an app to help food delivery

# Dependencies
Angular Material

# Install
git clone project

cd to project root folder /, (remove package-lock.json), then run `npm install`

## Config
copy duocun.cfg.json file to the parent folder of root /

## Run

### Run Server

cd to project duocun's root folder /,  and run `npm run build`
then `npm run start` or open Visual Studio Code and hit Debug menu.

### Run client
cd to /client and run `npm start`

### Generate language template
cd to /client then run `ng xi18n --output-path locale` and under the locale folder you will see messages.xlf, use your merge tools merge the differences to messages-zh-Hans.xlf, and add <target> to your new items to be translate.

#### Run client locale version
run `ng serve --port 5003 --configuration=zh-Hans`

#### Build production locale version
run `ng build --prod --i18n-file src/locale/messages.zh-Hans.xlf --i18n-format xlf --i18n-locale zh-Hans`


