/// <reference path="antidote_proto.d.ts" />
/// <reference path="../typings/globals/protobufjs/index.d.ts" />

"use strict";

import ProtoBuf = require("protobufjs")
import ByteBuffer = require("bytebuffer")
import { AntidoteConnection } from "./antidoteConnection"
import { MessageCodes } from "./messageCodes"

export function connect(port: number, host: string): Connection {
	return new Connection(new AntidoteConnection(port, host))

}

export function key(key: string, type: AntidotePB.CRDT_type, bucket: string): AntidotePB.ApbBoundObject {
	return {
		key: ByteBuffer.fromUTF8(key),
		type: type,
		bucket: ByteBuffer.fromUTF8(bucket)
	}
}

function encode(message: {encode(): ByteBuffer}): ArrayBuffer {
	return message.encode().toBuffer()
}

export class Connection {
	private connection: AntidoteConnection;

	constructor(conn: AntidoteConnection) {
		this.connection = conn;
	}

	public startTransaction(): Promise<Transaction> {
		let apbStartTransaction = MessageCodes.antidotePb.ApbStartTransaction;
		let message: AntidotePB.ApbStartTransactionMessage = new apbStartTransaction({
			properties: {}
		});
		let tx = this.connection.sendRequest(MessageCodes.apbStartTransaction, encode(message));
		return tx.then((resp: AntidotePB.ApbStartTransactionResp) => {
			if (resp.success) {
				return new Transaction(this.connection, resp.transaction_descriptor);
			}
			return Promise.reject<any>(resp.errorcode);
		})
	}

	public close() {
		this.connection.close();
	}



}


export class Transaction {
	private connection: AntidoteConnection;
	private txId: ByteBuffer;
	constructor(conn: AntidoteConnection, txId: ByteBuffer) {
		this.connection = conn;
		this.txId = txId;
	}

	public readValue(key: AntidotePB.ApbBoundObject): Promise<any> {
		return this.readValues([key]).then(ar => ar[0]);
	}

	public readValues(keys: [AntidotePB.ApbBoundObject]): Promise<[any]> {
		let apb = MessageCodes.antidotePb.ApbReadObjects;
		let message = new apb({
			boundobjects: keys,
			transaction_descriptor: this.txId
		});
		let r = this.connection.sendRequest(MessageCodes.apbReadObjects, encode(message));
		return r.then((resp: AntidotePB.ApbReadObjectsResp) => {
			if (resp.success) {
				return resp.objects.map(obj => {
					if (obj.counter) {
						return obj.counter.value;
					} else {
						throw new Error(`unhandled case.. ${JSON.stringify(resp)}`);
					}
				})
			}
			return Promise.reject<any>(resp.errorcode)
		})
	}

	public updateObject(key: AntidotePB.ApbBoundObject, operation: AntidotePB.ApbUpdateOperation) {
		let apb = MessageCodes.antidotePb.ApbUpdateObjects;
		let message = new apb({
			updates: [{boundobject: key, operation: operation}],
			transaction_descriptor: this.txId
		});
		let r = this.connection.sendRequest(MessageCodes.apbUpdateObjects, encode(message));
		return r.then((resp: AntidotePB.ApbOperationResp) => {
			if (resp.success) {
				return true;
			}
			return Promise.reject<any>(resp.errorcode)
		})
	}

	public commit(): Promise<{ commitTime: ByteBuffer }> {
		let apbCommitTransaction = MessageCodes.antidotePb.ApbCommitTransaction;
		let message: AntidotePB.ApbCommitTransactionMessage = new apbCommitTransaction({
			transaction_descriptor: this.txId
		});
		let r = this.connection.sendRequest(MessageCodes.apbCommitTransaction, encode(message));
		return r.then((resp: AntidotePB.ApbCommitResp) => {
			if (resp.success) {
				return {
					commitTime: resp.commit_time
				}
			}
			return Promise.reject<{ commitTime: ByteBuffer }>(resp.errorcode)
		});
	}

	public toString(): string {
		return `Transaction ${this.txId.toBinary()}`
	}
}