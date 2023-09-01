# About

Simple session based authentication using cookies.

Session storage is thread safe.

Session storage is only suitable for single instances of a server, and so 'vertical scaling'.

As sessions are stored in a single instance, this solution is not suitable multiple instances, and 'horizontal scaling'.

Session information is stored in variables and so the RAM.

## Memory overuse protection

Older sessions are cleared regularly as the systems assigns, checks and deletes session cookies. Some other tools to combat possible memory leaks are that older sessions can also be cleared manually, and all sessions (even valid sessions) can be cleared (i.e. by an admin through a special endpoint, which would have the same affect as logging everyone out). These manual clearings, could be done via an endpoint (e.g. CRON jobs) or internally within your application, on an interval. This is in no way absolute protection, based on these facts make a decision as to the suitability.

# Setup

## Optional but recommended ( use nvm )

`nvm use`

## set up for Node

`npm i`

# Running

## standard with ts-node

`npm start`

## 'dev' auto-reload interactive mode with nodemon

`npm run dev`

## 'production' style, build then run

`npm run build`
`npm run start-prod`