#!/bin/bash
set -e

fileName="proto/antidote_proto"

node_modules/protobufjs/bin/pbjs proto/antidote.proto > proto/antidote_proto.json

#echo "/// <reference path=\"../node_modules/proto2ts/definitions/bytebuffer.d.ts\" />" > $fileName.d.ts
#echo "/// <reference path=\"../node_modules/proto2ts/definitions/long.d.ts\" />" >> $fileName.d.ts
node node_modules/proto2ts/command.js -f proto/antidote_proto.json > proto/antidote_proto.d.ts
