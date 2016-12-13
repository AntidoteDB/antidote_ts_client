#!/bin/bash
# this generates the file proto/antidote_proto.d.ts
#
# because of bugs in the proto2ts tool some manual adjustments to the output are necessary (fixing compiler-errors)

set -e

node_modules/protobufjs/bin/pbjs proto/antidote.proto > proto/antidote_proto.json

node node_modules/proto2ts/command.js \
    --explicitRequired true \
    --camelCaseGetSet false \
    --file proto/antidote_proto.json \
    > proto/antidote_proto.d.ts
