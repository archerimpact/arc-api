arc-api - Node Backend for Archer Public

Start instructions:

1. Install stardog: https://www.stardog.com/docs/#_searching
2. Navigate to the /bin folder of your stardog distribution
3. Run: stardog-admin server start
4. Run: stardog-admin db create -o search.enabled=true -n myDB
5. To start elasticsearch and kibana (if needed), navigate to the root directory of the repo and run: (sudo if needed) docker-compose up
6. To start the app run: yarn install && yarn start
7. To load sdn.json, navigate to the /loaders/ofac directory and run 'node index.js'