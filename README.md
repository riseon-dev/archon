# Monorepo for Archon
MVP for Riseon SocialFi Project

# Project Structure

- `libraries/`: Contains all the shared libraries for the project.
- `programs/`: Anchor programs for the project.
- `services/`: Contains all the services for the project - mainly `api` and `web`.
  * `api/`: The API service for the project.
  * `web/`: The frontend for the project.


# Running Tests

## Anchor Unit Tests

- Run `anchor build` in the project directory to build the program.
- Run `anchor test` in the project directory to run the unit tests.

## Anchor Integration Tests

- Start two terminal windows
- Run `surfpool start` in the project directory to start the local Solana cluster in the first terminal window.
- Run the following commands in the second terminal window:
- - Run `anchor build` to build the program.
- - Run `anchor deploy` to deploy the program to the local cluster.
- - Run `anchor run swaptest` to run the integration tests.

# Devnet Deployment Details
```text
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/n3m6/.config/solana/id.json
Deploying program "copy_trading"...
Program path: /home/n3m6/src/turbin3/Q2_25_Builder_Faraz/capstone/programs/copy-trading/target/deploy/copy_trading.so...
Program Id: riszVdWEkdGsVJcV5ZbYDzt9TZCJbyJAvmysSrpiWdu

Signature: 5pTp71D6yMKTyx7S1GQbxdSPnNLHfLL4QRot6jwykzA8Z6ibQPAfMwCtkgp6a4QcNhiZ14WmckKNQCbrXrhNnNVh

Deploy success
```