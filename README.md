Arc-API - Node Backend for Archer Public

Start instructions:

1. Install stardog: https://www.stardog.com/
2. Navigate to the /bin folder of your stardog distribution
    Run: stardog-admin server start
    Run: stardog-admin db create -o search.enabled=true -n myDB
3. To start elasticsearch and kibana (if needed):
    navigate to the root directory of the repo
    run: (sudo if needed) docker-compose up
4. To start the app run:
    yarn install
    yarn start
5. To load sdn.json:
    navigate to the /loaders/ofac directory
    run 'node index.js'