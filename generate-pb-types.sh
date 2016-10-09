#!/bin/bash
set -e

fileName="src/antidote_proto"

node_modules/protobufjs/bin/pbjs src/antidote.proto > src/antidote_proto.json

echo "/// <reference path=\"../node_modules/proto2ts/definitions/bytebuffer.d.ts\" />" > $fileName.d.ts
echo "/// <reference path=\"../node_modules/proto2ts/definitions/long.d.ts\" />" >> $fileName.d.ts
echo "///<reference path=\"../typings/globals/node/index.d.ts\" />" >> $fileName.d.ts
node node_modules/proto2ts/command.js -f src/antidote_proto.json >> src/antidote_proto.d.ts
