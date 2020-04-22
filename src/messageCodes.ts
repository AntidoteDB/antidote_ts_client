import '../proto/antidote_proto'
import path = require('path');

export module MessageCodes {
	export const apbRegUpdate = 107;
	export const apbGetRegResp = 108;
	export const apbCounterUpdate = 109;
	export const apbGetCounterResp = 110;
	export const apbOperationResp = 111;
	export const apbSetUpdate = 112;
	export const apbGetSetResp = 113;
	export const apbTxnProperties = 114;
	export const apbBoundObject = 115;
	export const apbReadObjects = 116;
	export const apbUpdateOp = 117;
	export const apbUpdateObjects = 118;
	export const apbStartTransaction = 119;
	export const apbAbortTransaction = 120;
	export const apbCommitTransaction = 121;
	export const apbStaticUpdateObjects = 122;
	export const apbStaticReadObjects = 123;
	export const apbStartTransactionResp = 124;
	export const apbReadObjectResp = 125;
	export const apbReadObjectsResp = 126;
	export const apbCommitResp = 127;
	export const apbStaticReadObjectsResp = 128;

	export var ProtoBuf = require("protobufjs");
	var antidoteProtoSrc = path.join(__dirname, '..', 'proto', 'antidote.proto');
	export var antidotePb: AntidotePB.ProtoBufBuilder = ProtoBuf.protoFromFile(antidoteProtoSrc).build("AntidotePB");

	export function messageCodeToProto(code: number): any {
		switch (code) {
			case apbRegUpdate:
				return antidotePb.ApbRegUpdate;
			case apbGetRegResp:
				return antidotePb.ApbGetRegResp;
			case apbCounterUpdate:
				return antidotePb.ApbCounterUpdate;
			case apbGetCounterResp:
				return antidotePb.ApbGetCounterResp;
			case apbOperationResp:
				return antidotePb.ApbOperationResp;
			case apbSetUpdate:
				return antidotePb.ApbSetUpdate;
			case apbGetSetResp:
				return antidotePb.ApbGetSetResp;
			case apbTxnProperties:
				return antidotePb.ApbTxnProperties;
			case apbBoundObject:
				return antidotePb.ApbBoundObject;
			case apbReadObjects:
				return antidotePb.ApbReadObjects;
			case apbUpdateOp:
				return antidotePb.ApbUpdateOp;
			case apbUpdateObjects:
				return antidotePb.ApbUpdateObjects;
			case apbStartTransaction:
				return antidotePb.ApbStartTransaction;
			case apbAbortTransaction:
				return antidotePb.ApbAbortTransaction;
			case apbCommitTransaction:
				return antidotePb.ApbCommitTransaction;
			case apbStaticUpdateObjects:
				return antidotePb.ApbStaticUpdateObjects;
			case apbStaticReadObjects:
				return antidotePb.ApbStaticReadObjects;
			case apbStartTransactionResp:
				return antidotePb.ApbStartTransactionResp;
			case apbReadObjectResp:
				return antidotePb.ApbReadObjectResp;
			case apbReadObjectsResp:
				return antidotePb.ApbReadObjectsResp;
			case apbCommitResp:
				return antidotePb.ApbCommitResp;
			case apbStaticReadObjectsResp:
				return antidotePb.ApbStaticReadObjectsResp
		}
		throw new Error(`invalid code: ${code}`);
	}

}