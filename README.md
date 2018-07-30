Arc-API - Node Backend for Archer Public

Start instructions:

1. Install stardog: https://www.stardog.com/
2. Navigate to the /bin folder of your stardog distribution then:
    1. Run: stardog-admin server start
    2. Run: stardog-admin db create -o search.enabled=true -n myDB
3. To start elasticsearch and kibana (if needed):
    1. navigate to the root directory of the repo
    2. run: (sudo if needed) docker-compose up
4. To start the app run:
    1. yarn install
    2. yarn start
5. To load sdn.json:
    1. navigate to the /loaders/ofac directory
    2. run 'node index.js'