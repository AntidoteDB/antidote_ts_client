"use strict";

import '../proto/antidote_proto'
import ByteBuffer = require("bytebuffer")
import { AntidoteConnection } from "./antidoteConnection"
import { MessageCodes } from "./messageCodes"
import * as Long from "long";
import msgpack = require("msgpack-lite")

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
	readonly connection: AntidoteConnection;
	/**
	 * stores the last commit time.
	 * This will be used when starting a new transaction in order to guarantee
	 * session guarantees like monotonic reads and read-your-writes
	 */
	public lastCommitTimestamp: ByteBuffer|undefined = undefined;

	/**
	 * the default bucket used for newly created keys
	 */
	public defaultBucket = "default-bucket";


	constructor(conn: AntidoteConnection) {
		this.connection = conn;
	}

	/** Method to encode objects before they are written to the database */
	public jsToBinary(obj: any): ByteBuffer {
		// TODO there must be a better way to do this
		let buffer: Buffer = msgpack.encode(obj);
		let res = new ByteBuffer();
		res.append(buffer);
		res.flip();
		return res;
	}

	/** Inverse of jsToBinary */
	public binaryToJs(byteBuffer: ByteBuffer): any {
		let buffer= new Buffer(byteBuffer.toArrayBuffer());
		let decoded = msgpack.decode(buffer);
		return decoded
	}

	public startTransaction(): Promise<Transaction> {
		let apbStartTransaction = MessageCodes.antidotePb.ApbStartTransaction;
		let message: AntidotePB.ApbStartTransactionMessage = new apbStartTransaction(this.startTransactionPb());
		let tx = this.connection.sendRequest(MessageCodes.apbStartTransaction, encode(message));
		return tx.then((resp: AntidotePB.ApbStartTransactionResp) => {
			if (resp.success) {
				return new Transaction(this, resp.transaction_descriptor!);
			}
			return Promise.reject<any>(resp.errorcode);
		})
	}

	/**
	 * creates a startTransaction message with the last timestamp
	 * and default transaction properties
	 */
	private startTransactionPb(): AntidotePB.ApbStartTransaction {
		return {
			timestamp: this.lastCommitTimestamp,
			properties: {}
		};
	}

	public read(objects: AntidoteObject[]): Promise<StaticReadResponse> {
		let messageType = MessageCodes.antidotePb.ApbStaticReadObjects;
		let message: AntidotePB.ApbStaticReadObjectsMessage = new messageType({
			transaction: this.startTransactionPb(),
			objects: objects.map(o => o.key)
		});
		let r = this.connection.sendRequest(MessageCodes.apbStaticReadObjects, encode(message));
		return r.then((resp: AntidotePB.ApbStaticReadObjectsResp) => {
			return this.completeTransaction(resp.committime!).then(cr => {
				let readResp = resp.objects!;
				if (readResp.success) {
					let resVals: any[] = [];

					for (let i in objects) {
						var obj = objects[i];
						resVals.push(obj.interpretReadResponse(readResp.objects![i]))
					}
					return {
						commitTime: cr.commitTime,
						values: resVals
					}
				} else {
					return Promise.reject<StaticReadResponse>(readResp.errorcode)
				}
			})
		})
	}

	public update(updates: AntidotePB.ApbUpdateOp[]|AntidotePB.ApbUpdateOp) {
		let messageType = MessageCodes.antidotePb.ApbStaticUpdateObjects;
		let updatesAr: AntidotePB.ApbUpdateOp[] = (updates instanceof Array) ? updates : [updates];
		let message: AntidotePB.ApbStaticReadObjectsMessage = new messageType({
			transaction: this.startTransactionPb(),
			updates: updatesAr
		});
		let r = this.connection.sendRequest(MessageCodes.apbStaticUpdateObjects, encode(message));
		return r.then(resp => this.completeTransaction(resp))
	}

	completeTransaction(resp: AntidotePB.ApbCommitResp): Promise<CommitResponse> {
		if (resp.commit_time) {
			this.lastCommitTimestamp = resp.commit_time;
		}
		if (resp.success) {
			return Promise.resolve({
				commitTime: resp.commit_time
			});
		}
		return Promise.reject<any>(resp.errorcode);
	}

	public close() {
		this.connection.close();
	}


	/** returns a reference to a counter object */
	public counter(key: string): CrdtCounter {
		return new CrdtCounter(this, key, this.defaultBucket, AntidotePB.CRDT_type.COUNTER);
	}

	/** returns a reference to a counter object */
	public set<T>(key: string): CrdtSet<T> {
		return new CrdtSet<T>(this, key, this.defaultBucket, AntidotePB.CRDT_type.ORSET);
	}
}

export interface CommitResponse {
	commitTime: ByteBuffer
}

export interface StaticReadResponse {
	commitTime: ByteBuffer,
	values: any[]
}



export class Transaction {
	private connection: Connection;
	private antidoteConnection: AntidoteConnection;
	private txId: ByteBuffer;
	constructor(conn: Connection, txId: ByteBuffer) {
		this.connection = conn;
		this.antidoteConnection = conn.connection;
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
		let r = this.antidoteConnection.sendRequest(MessageCodes.apbReadObjects, encode(message));
		return r.then((resp: AntidotePB.ApbReadObjectsResp) => {
			if (resp.success) {
				return resp.objects!.map(obj => {
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
		let r = this.antidoteConnection.sendRequest(MessageCodes.apbUpdateObjects, encode(message));
		return r.then((resp: AntidotePB.ApbOperationResp) => {
			if (resp.success) {
				return true;
			}
			return Promise.reject<any>(resp.errorcode)
		})
	}

	public commit(): Promise<CommitResponse> {
		let apbCommitTransaction = MessageCodes.antidotePb.ApbCommitTransaction;
		let message: AntidotePB.ApbCommitTransactionMessage = new apbCommitTransaction({
			transaction_descriptor: this.txId
		});
		let r = this.antidoteConnection.sendRequest(MessageCodes.apbCommitTransaction, encode(message));
		return r.then(resp => this.connection.completeTransaction(resp))
	}

	public toString(): string {
		return `Transaction ${this.txId.toBinary()}`
	}
}


export abstract class AntidoteObject {
	readonly connection: Connection;
	readonly key: AntidotePB.ApbBoundObject;

	constructor(conn: Connection,  key: string, bucket: string, type: AntidotePB.CRDT_type) {
		this.connection = conn;
		this.key = {
			key: ByteBuffer.fromUTF8(key),
			bucket: ByteBuffer.fromUTF8(bucket),
			type: type
		}
	}

	makeUpdate(operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp {
		var op = {
			boundobject: this.key,
			operation: operation
		};
		return op;
	}

	abstract interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): any;
}

export abstract class AntidoteObjectWithReset extends AntidoteObject {

	public reset(): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			resetop: {}
		})
	}

}

export class CrdtCounter extends AntidoteObject {


	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): number {
		return readResponse.counter!.value!;
	}

	public increment(amount: number|Long): AntidotePB.ApbUpdateOp {
		let amountL = (amount instanceof Long) ? amount : new Long(amount);
		return this.makeUpdate({
			counterop: {
				inc: amountL
			}
		})
	}

	public read(): Promise<number> {
		return this.connection.read([this]).then(r => {
			return r.values[0]
		})
	}

}

export class CrdtSet<T> extends AntidoteObjectWithReset {
	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T[] {
		let vals = readResponse.set!.value!;
		return vals.map(bin => {
			return this.connection.binaryToJs(bin)
		});
	}

	public read(): Promise<T[]> {
		return this.connection.read([this]).then(r => {
			return r.values[0]
		})
	}

	public add(elem: T): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.ADD,
				adds: [this.connection.jsToBinary(elem)]
			}
		})
	}

	public addAll(elems: T[]): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.ADD,
				adds: elems.map(elem => this.connection.jsToBinary(elem))
			}
		})
	}

	public remove(elem: T): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.REMOVE,
				rems: [this.connection.jsToBinary(elem)]
			}
		})
	}

	public removeAll(elems: T[]): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.REMOVE,
				rems: elems.map(elem => this.connection.jsToBinary(elem))
			}
		})
	}

}