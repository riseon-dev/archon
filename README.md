# Monorepo for Archon
MVP for Riseon SocialFi Project

# Project Structure

- `libraries/`: Contains all the shared libraries for the project.
- `programs/`: Anchor programs for the project.
- `services/`: Contains all the services for the project - mainly `api` and `web`.
  * `api/`: The API service for the project.
  * `web/`: The frontend for the project.

# Devnet Deployment Details
```text
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/n3m6/.config/solana/id.json
Deploying program "copy_trading"...
Program path: /home/n3m6/src/turbin3/Q2_25_Builder_Faraz/capstone/programs/copy-trading/target/deploy/copy_trading.so...
Program Id: 2kywgkjyBSJi6qwmXA1EBBZeMb4P8MFqfDvHEPdBLYB2

Signature: 2kVw5usa5qs4ZAVcD1EeLoFWxizPXoxvdYaNMnAbV1cgv7vHbiD7vKeAhF84uMMvJzg67TC6B1oxRAtbaz91cFbW

Deploy success
```