# Monorepo for Archon
MVP for Riseon SocialFi Project

## Project Structure

- `libraries/`: Contains all the shared libraries for the project.
- `programs/`: Anchor programs for the project.
- `services/`: Contains all the services for the project - mainly `api` and `web`.
  * `api/`: The API service for the project.
  * `web/`: The frontend for the project.

## Minimum Requirements

```bash
$ rustc --version
rustc 1.81.0 (eeb90cda1 2024-09-04)

$ avm --version
avm 0.30.1

$ node --version
v23.9.0

$ pnpm --version
9.9.0
```

## Running Locally 

- Setup your local environment by running the following command:

```bash
pnpm install 
```

### Web

```bash
$ cd services/web/
$ pnpm dev
```

### API

Create a `.env` file in the `services/api/` directory and add the following environment variables:

```text
SERVICE_WEB_URL=http://localhost:5173/
SERVICE_API_PORT=3000
SERVICE_API_JWT_SECRET_KEY=helloworld
VITE_SERVICE_API_URL=http://localhost:3000/
DATABASE_URL=file:./dev.db
```

Then run the following commands:

```bash
$ cd services/api/
$ pnpm prisma:generate
$ export $(cat .env)
$ pnpm dev
```

## Anchor Programs

This project currently contains one Anchor program inside `programs/copy-trading/`.

### Running Tests

#### Anchor Unit Tests

- Run `anchor build` in the project directory to build the program.
- Run `anchor test` in the project directory to run the unit tests.

#### Anchor Integration Tests

You need to install surfpool to run the integration tests. If you're on Linux it can be installed with `sudo snap 
install surfpool`.

- Start two terminal windows
- Run `surfpool start --watch` in the project directory to start the local Solana cluster in the first terminal window.
- Run the following commands in the second terminal window:
- - Run `anchor build` to build the program.
- - Run `anchor deploy` to deploy the program to the local cluster.
- - Run `anchor run swaptest` to run the integration tests.

### Anchor Project Deployment Details

#### Devnet Deployment Details

```text
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/n3m6/src/turbin3/gen-wallet/keypair.json
Deploying program "copy_trading"...
Program path: /home/n3m6/src/turbin3/Q2_25_Builder_Faraz/capstone/programs/copy-trading/target/deploy/copy_trading.so...
Program Id: Ex9jkemuGgEEGnUiNoQPzNjHqhWdtyuDsrYSiZynCqCx

Signature: 2nTxHAZgeqF5KYvFhC9WXzGD79YCgVTBxS3wAeqGjurTGr9PMbPfcZkJVYC7e58ofcwqaFNGireek8y5kgvhKYgn

Deploy success
```

