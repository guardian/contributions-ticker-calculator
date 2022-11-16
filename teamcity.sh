#!/bin/bash
set -e

npm install -g yarn

# So that we can share the code in lib between sub-projects.
# TODO - can we do better than this? Does yarn workspaces help?
cp ../lib/* .

yarn install
# Will place .js files in target
yarn run build

# These also need to be in the RiffRaff package
cp package.json target
cp riff-raff-$1.yaml target/riff-raff.yaml

pushd target
# Ensures the RiffRaff package has the node_modules needed to run
yarn install --production
popd

yarn run package
