#! /bin/bash

git checkout releases/staging-testnet
git rebase main
git push origin releases/staging-testnet

git checkout releases/staging
git rebase main
git push origin releases/staging

git checkout releases/prod
git rebase main
git push origin releases/prod

git checkout main