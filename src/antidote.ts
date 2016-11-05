"use strict";

import '../proto/antidote_proto'
import ByteBuffer = require("bytebuffer")
import { AntidoteConnection } from "./antidoteConnection"
import { MessageCodes } from "./messageCodes"
import * as Long from "long";
import msgpack = require("msgpack-lite")

/** Connects to antidote on the given port and hostname */
export function connect(port: number, host: string): Connection {
	return new Connection(new AntidoteConnection(port, host))

}

/** Creates a BoundObject, wich Antidote uses as key for data */
export function key(key: string, type: AntidotePB.CRDT_type, bucket: string): AntidotePB.ApbBoundObject {
	return {
		key: ByteBuffer.fromUTF8(key),
		type: type,
		bucket: ByteBuffer.fromUTF8(bucket)
	}
}

/** takes a message with an encode method and converts it into an ArrayBuffer */
function encode(message: {encode(): ByteBuffer}|any): ArrayBuffer {
	return message.encode().toBuffer()
}

function _debugPrint(obj: any):string {
	return JSON.stringify(obj, (key, val) => {
		if (val instanceof ByteBuffer) {
			return val.toUTF8();
		} else if (val instanceof Long) {
			return val.toNumber();
		}
		return val;
	});
}


export abstract class CrdtFactory {


	abstract getBucket(): string;

	public abstract read(objects: AntidoteObject[]): Promise<any[]>;

	public abstract jsToBinary(obj: any): ByteBuffer;

	public abstract binaryToJs(byteBuffer: ByteBuffer): any;

	/** returns a reference to a counter object */
	public counter(key: string): CrdtCounter {
		return new CrdtCounter(this, key, this.getBucket(), AntidotePB.CRDT_type.COUNTER);
	}

	/** returns a reference to a last-writer-wins register */
	public register<T>(key: string): CrdtRegister<T> {
		return new CrdtRegister<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.LWWREG);
	}

	/** returns a reference to a multi-value register */
	public multiValueRegister<T>(key: string): CrdtMultiValueRegister<T> {
		return new CrdtMultiValueRegister<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.MVREG);
	}

	/** returns a reference to an integer object */
	public integer(key: string): CrdtInteger {
		return new CrdtInteger(this, key, this.getBucket(), AntidotePB.CRDT_type.INTEGER);
	}

	/** returns a reference to a add-wins set object */
	public set<T>(key: string): CrdtSet<T> {
		return new CrdtSet<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.ORSET);
	}

	/** returns a reference to a remove-wins set object */
	public set_removeWins<T>(key: string): CrdtSet<T> {
		return new CrdtSet<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.RWSET);
	}

	/** returns a reference to an add-wins map */
	public map(key: string): CrdtMap {
		return new CrdtMap(this, key, this.getBucket(), AntidotePB.CRDT_type.AWMAP);
	}

	/** returns a reference to a grow-only map */
	public gmap(key: string): CrdtMap {
		return new CrdtMap(this, key, this.getBucket(), AntidotePB.CRDT_type.GMAP);
	}


	abstract childUpdate(key: AntidotePB.ApbBoundObject, operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp;

	readResponseToValue(type: AntidotePB.CRDT_type, response: AntidotePB.ApbReadObjectResp): any {
		switch (type) {
		case AntidotePB.CRDT_type.COUNTER:
			return this.counter("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.ORSET:
			return this.set("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.LWWREG:
			return this.register("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.MVREG:
			return this.multiValueRegister("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.INTEGER:
			return this.integer("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.GMAP:
			return this.gmap("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.AWMAP:
			return this.map("").interpretReadResponse(response);
		case AntidotePB.CRDT_type.RWSET:
			return this.set_removeWins("").interpretReadResponse(response);
		}
	}
}


/** A connection to AntidoteDB with methods for reading, updating and starting transactions
 * 
 * By default each operation takes the snapshot time from the last successful operation. 
 * Set the lastCommitTimestamp to override this behavior for the following operation.
 * 
 * The bucket can be configured via the property `defaultBucket`, it defaults to "default-bucket".
 * 
 * Javascript objects stored in sets and registers are encoded using MessagePack (http://msgpack.org) by default.
 * You can override the jsToBinary and binaryToJs methods to customize this behavior.
 * 
 */
export class Connection extends CrdtFactory {
	readonly connection: AntidoteConnection;
	/**
	 * stores the last commit time.
	 */
	private lastCommitTimestamp: ByteBuffer|undefined = undefined;

	/**
	 * The minimum snapshot version to use for new transactions.
	 * This will be used when starting a new transaction in order to guarantee
	 * session guarantees like monotonic reads and read-your-writes */
	public minSnapshotTime: ByteBuffer|undefined = undefined;


	/**
	 * Option, which determines if snapshots should be monotonic.
	 * If set to `true`, this will update minSnapshotTime whenever 
	 * lastCommitTimestamp is updated
	 */
	public monotonicSnapshots: boolean = false;

	/**
	 * the default bucket used for newly created keys
	 */
	public defaultBucket = "default-bucket";


	constructor(conn: AntidoteConnection) {
		super();
		this.connection = conn;
	}

	public getBucket(): string {
		return this.defaultBucket;
	}

	childUpdate(key: AntidotePB.ApbBoundObject, operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp {
		var op = {
			boundobject: key,
			operation: operation
		};
		return op;
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

	/** Sets the timout for requests */
	public setTimeout(ms: number) {
		this.connection.requestTimeoutMs = ms;
	}

	/** Starts a new transaction */
	public async startTransaction(): Promise<Transaction> {
		let apbStartTransaction = MessageCodes.antidotePb.ApbStartTransaction;
		let message: AntidotePB.ApbStartTransactionMessage = new apbStartTransaction(this.startTransactionPb());
		let resp: AntidotePB.ApbStartTransactionResp = await this.connection.sendRequest(MessageCodes.apbStartTransaction, encode(message));
		if (resp.success) {
			return new Transaction(this, resp.transaction_descriptor!);
		}
		return Promise.reject<any>(resp.errorcode);
	}


	/**
	 * returns the timestamp for the last commited transaction
	 */
	public getLastCommitTimestamp(): ByteBuffer|undefined {
		return this.lastCommitTimestamp;
	}


	private setLastCommitTimestamp(lastCommitTimestamp: ByteBuffer|undefined) {
		this.lastCommitTimestamp = lastCommitTimestamp;
		if (this.monotonicSnapshots) {
			this.minSnapshotTime = lastCommitTimestamp;
		}
	}

	/**
	 * creates a startTransaction message with the last timestamp
	 * and default transaction properties
	 */
	private startTransactionPb(): AntidotePB.ApbStartTransaction {
		return {
			timestamp: this.minSnapshotTime,
			properties: {}
		};
	}

	/** 
	 * Reads several objects at once.
	 * To read a single object, use the read method on that object.
	 */
	public async read(objects: AntidoteObject[]): Promise<any[]> {
		let messageType = MessageCodes.antidotePb.ApbStaticReadObjects;
		let message: AntidotePB.ApbStaticReadObjectsMessage = new messageType({
			transaction: this.startTransactionPb(),
			objects: objects.map(o => o.key)
		});
		let resp: AntidotePB.ApbStaticReadObjectsResp = await this.connection.sendRequest(MessageCodes.apbStaticReadObjects, encode(message));
		let cr = await this.completeTransaction(resp.committime!);
		let readResp = resp.objects!;
		if (readResp.success) {
			let resVals: any[] = [];

			for (let i in objects) {
				var obj = objects[i];
				resVals.push(obj.interpretReadResponse(readResp.objects![i]))
			}

			this.lastCommitTimestamp = cr.commitTime;
			return Promise.resolve(resVals);
		} else {
			return Promise.reject<any[]>(readResp.errorcode)
		}
	}

	/**
	 * Sends a single update operation or an array of update operations to Antidote.
	 */
	public async update(updates: AntidotePB.ApbUpdateOp[]|AntidotePB.ApbUpdateOp): Promise<CommitResponse> {
		let messageType = MessageCodes.antidotePb.ApbStaticUpdateObjects;
		let updatesAr: AntidotePB.ApbUpdateOp[] = (updates instanceof Array) ? updates : [updates];
		let message: AntidotePB.ApbStaticUpdateObjectsMessage = new messageType({
			transaction: this.startTransactionPb(),
			updates: updatesAr
		});
		let resp = await this.connection.sendRequest(MessageCodes.apbStaticUpdateObjects, encode(message));
		return this.completeTransaction(resp)
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

	/**
	 * Closes the connection to Antidote
	 */
	public close() {
		this.connection.close();
	}


}



export interface CommitResponse {
	commitTime: ByteBuffer
}

export interface StaticReadResponse {
	commitTime: ByteBuffer,
	values: any[]
}



export class Transaction extends CrdtFactory {
	private connection: Connection;
	private antidoteConnection: AntidoteConnection;
	private txId: ByteBuffer;
	constructor(conn: Connection, txId: ByteBuffer) {
		super();
		this.connection = conn;
		this.antidoteConnection = conn.connection;
		this.txId = txId;
	}

	public getBucket() {
		return this.connection.getBucket();
	}

	public jsToBinary(obj: any): ByteBuffer {
		return this.connection.jsToBinary(obj);
	}

	public binaryToJs(byteBuffer: ByteBuffer): any {
		return this.connection.binaryToJs(byteBuffer);
	}

	childUpdate(key: AntidotePB.ApbBoundObject, operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp {
		return this.connection.childUpdate(key, operation);	
	}

	/** 
	 * Reads several objects at once.
	 */
	public async read(objects: AntidoteObject[]): Promise<any[]> {
		let apb = MessageCodes.antidotePb.ApbReadObjects;
		let message = new apb({
			boundobjects: objects.map(o => o.key),
			transaction_descriptor: this.txId
		});
		let resp: AntidotePB.ApbReadObjectsResp = await this.antidoteConnection.sendRequest(MessageCodes.apbReadObjects, encode(message));
		if (resp.success) {
			let resVals: any[] = [];
			for (let i in objects) {
				var obj = objects[i];
				let objVal = obj.interpretReadResponse(resp.objects![i]);
				resVals.push(objVal)
			}
			return resVals;
		}
		return Promise.reject<any[]>(resp.errorcode)
	}

	/**
	 * Sends a single update operation or an array of update operations to Antidote.
	 */
	public async update(updates: AntidotePB.ApbUpdateOp[]|AntidotePB.ApbUpdateOp): Promise<void> {
		let messageType = MessageCodes.antidotePb.ApbUpdateObjects;
		let updatesAr: AntidotePB.ApbUpdateOp[] = (updates instanceof Array) ? updates : [updates];
		let message = new messageType({
			transaction_descriptor: this.txId,
			updates: updatesAr
		});
		await this.antidoteConnection.sendRequest(MessageCodes.apbUpdateObjects, encode(message));
	}

	public async commit(): Promise<CommitResponse> {
		let apbCommitTransaction = MessageCodes.antidotePb.ApbCommitTransaction;
		let message: AntidotePB.ApbCommitTransactionMessage = new apbCommitTransaction({
			transaction_descriptor: this.txId
		});
		let resp = await this.antidoteConnection.sendRequest(MessageCodes.apbCommitTransaction, encode(message));
		return this.connection.completeTransaction(resp)
	}

	public toString(): string {
		return `Transaction ${this.txId.toBinary()}`
	}
}


export abstract class AntidoteObject {
	readonly parent: CrdtFactory;
	readonly key: AntidotePB.ApbBoundObject;

	constructor(conn: CrdtFactory,  key: string, bucket: string, type: AntidotePB.CRDT_type) {
		this.parent = conn;
		this.key = {
			key: ByteBuffer.fromUTF8(key),
			bucket: ByteBuffer.fromUTF8(bucket),
			type: type
		}
	}

	makeUpdate(operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp {
		return this.parent.childUpdate(this.key, operation);
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

	/** Creates an operation to increment the counter.
	 * Negative numbers will decrement the value. 
	 * Use Connection.update to send the update to the database. */
	public increment(amount: number|Long): AntidotePB.ApbUpdateOp {
		let amountL = (amount instanceof Long) ? amount : new Long(amount);
		return this.makeUpdate({
			counterop: {
				inc: amountL
			}
		})
	}

	public async read(): Promise<number> {
		let r = await this.parent.read([this])
		return r[0]
	}

}




export class CrdtInteger extends AntidoteObject {
	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): number {
		return readResponse.int!.value!.toNumber();
	}

	/** Creates an operation to increment the integer.
	 * Negative numbers will decrement the value. 
	 * Use Connection.update to send the update to the database. */
	public increment(amount: number|Long): AntidotePB.ApbUpdateOp {
		let amountL = (amount instanceof Long) ? amount : new Long(amount);
		return this.makeUpdate({
			integerop: {
				inc: amountL
			}
		})
	}

	/** Creates an operation to set the intgeger to a specific value.
	 * Use Connection.update to send the update to the database. */
	public set(value: number|Long): AntidotePB.ApbUpdateOp {
		let valueL = (value instanceof Long) ? value : new Long(value);
		return this.makeUpdate({
			integerop: {
				set: valueL
			}
		})
	}

	public async read(): Promise<number> {
		let r = await this.parent.read([this])
		return r[0]
	}

}




export class CrdtRegister<T> extends AntidoteObject {


	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T {
		let bin = readResponse.reg!.value!;
		return this.parent.binaryToJs(bin);
	}

	/** Creates an operation, which sets the register to the provided value.
	 * Negative numbers will decrement the value. 
	 * Use Connection.update to send the update to the database. */
	public set(value: T): AntidotePB.ApbUpdateOp {
		let bin = this.parent.jsToBinary(value);
		return this.makeUpdate({
			regop: {
				value: bin
			}
		})
	}

	public async read(): Promise<T> {
		let r = await this.parent.read([this])
		return r[0]
	}

}

export class CrdtMultiValueRegister<T> extends AntidoteObject {


	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T[] {
		let bins = readResponse.mvreg!.values!;
		let res: any = bins.map(bin => this.parent.binaryToJs(bin));
		return res;
	}

	/** Creates an operation, which sets the register to the provided value.
	 * Negative numbers will decrement the value. 
	 * Use Connection.update to send the update to the database. */
	public set(value: T): AntidotePB.ApbUpdateOp {
		let bin = this.parent.jsToBinary(value);
		return this.makeUpdate({
			regop: {
				value: bin
			}
		})
	}

	public async read(): Promise<T[]> {
		let r = await this.parent.read([this])
		return r[0]
	}

}

export class CrdtSet<T> extends AntidoteObjectWithReset {
	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T[] {
		let vals = readResponse.set!.value!;
		return vals.map(bin => {
			return this.parent.binaryToJs(bin)
		});
	}

	public async read(): Promise<T[]> {
		let r = await this.parent.read([this])
		return r[0]
	}

	/** 
	 * Creates an operation, which adds an element to the set. 
	 * Use Connection.update to send the update to the database. */
	public add(elem: T): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.ADD,
				adds: [this.parent.jsToBinary(elem)],
				rems: []
			}
		})
	}

	/** 
	 * Creates an operation, which adds several elements to the set. 
	 * Use Connection.update to send the update to the database. */
	public addAll(elems: T[]): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.ADD,
				adds: elems.map(elem => this.parent.jsToBinary(elem)),
				rems: []
			}
		})
	}

	/** 
	 * Creates an operation, which removes an element from the set. 
	 * Use Connection.update to send the update to the database. */
	public remove(elem: T): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.REMOVE,
				adds: [],
				rems: [this.parent.jsToBinary(elem)]
			}
		})
	}

	/** 
	 * Creates an operation, which removes several elements from the set. 
	 * Use Connection.update to send the update to the database. */
	public removeAll(elems: T[]): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			setop: {
				optype: AntidotePB.ApbSetUpdate.SetOpType.REMOVE,
				adds: [],
				rems: elems.map(elem => this.parent.jsToBinary(elem))
			}
		})
	}
}

export class CrdtMapValue {
	private factory: CrdtFactory;
	private entries: AntidotePB.ApbMapEntry[];

	constructor(factory: CrdtFactory, entries: AntidotePB.ApbMapEntry[]) {
		this.factory = factory;
		this.entries = entries;
	}

	public get(key: string, type: AntidotePB.CRDT_type): any {
		for (let entry of this.entries) {
			let entryKey = entry.key!;
			if (entryKey.type === type && entryKey.key!.toUTF8() === key) {
				return this.factory.readResponseToValue(type, entry.value!);
			}
		}
		return undefined;
	}

	public counterValue(key: string): number | undefined {
		return this.get(key, AntidotePB.CRDT_type.COUNTER)
	}
	public setValue(key: string): any[] | undefined {
		return this.get(key, AntidotePB.CRDT_type.ORSET)
	}
	public registerValue(key: string): any {
		return this.get(key, AntidotePB.CRDT_type.LWWREG)
	}
	public mvRegisterValue(key: string): any[] | undefined {
		return this.get(key, AntidotePB.CRDT_type.MVREG)
	}
	public integerValue(key: string): number | undefined {
		return this.get(key, AntidotePB.CRDT_type.INTEGER)
	}
	public gmapValue(key: string): CrdtMapValue | undefined {
		return this.get(key, AntidotePB.CRDT_type.GMAP)
	}
	public awmapValue(key: string): CrdtMapValue | undefined {
		return this.get(key, AntidotePB.CRDT_type.AWMAP)
	}
	public rwsetValue(key: string): any[] | undefined {
		return this.get(key, AntidotePB.CRDT_type.RWSET)
	}
	
	public toJsObject(): any {
		let res: any = {};
		for (let entry of this.entries) {
			let type = entry.key!.type!;
			let value = this.factory.readResponseToValue(type, entry.value!);
			if (value instanceof CrdtMapValue) {
				value = value.toJsObject();
			}
			res[entry.key!.key!.toUTF8()] = value;
		}
		return res;
	} 
}

export class CrdtMap extends CrdtFactory implements AntidoteObject {
	readonly parent: CrdtFactory;
	readonly key: AntidotePB.ApbBoundObject;

	constructor(conn: CrdtFactory,  key: string, bucket: string, type: AntidotePB.CRDT_type) {
		super();
		this.parent = conn;
		this.key = {
			key: ByteBuffer.fromUTF8(key),
			bucket: ByteBuffer.fromUTF8(bucket),
			type: type
		}
	}

	childUpdate(key: AntidotePB.ApbBoundObject, operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp {
		return this.makeUpdate({
			mapop: {
				updates: [{
					key: {
						key: key.key,
						type: key.type
					},
					update: operation
				}],
				removedKeys: []
			}
		});
	}

	makeUpdate(operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp {
		return this.parent.childUpdate(this.key, operation);
	}

	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): any {
		let vals = readResponse.map!.entries!;
		return new CrdtMapValue(this.parent, vals);
	}

	public async readMapValue(): Promise<CrdtMapValue> {
		let r = await this.parent.read([this])
		return r[0]
	}

	getBucket(): string {
		return "";
	}

	public async read(objects: AntidoteObject[]): Promise<any[]> {
		let r = await this.parent.read([this])
		let map: CrdtMapValue = r[0];
		let values: any[] = [];
		// filter out the actual keys
		for (let obj of objects) {
			values.push(map.get(obj.key.key!.toUTF8(), obj.key.type!));
		}
		return values; 
	}

	public jsToBinary(obj: any): ByteBuffer {
		return this.parent.jsToBinary(obj);
	}

	public binaryToJs(byteBuffer: ByteBuffer): any {
		return this.parent.binaryToJs(byteBuffer);
	}


	public remove(object: AntidoteObject): AntidotePB.ApbUpdateOp {
		return this.removeAll([object]);
	}

	public removeAll(objects: AntidoteObject[]): AntidotePB.ApbUpdateOp {
		let removedKeys: AntidotePB.ApbMapKey[] = objects.map(obj => {
			return {
				key: obj.key.key,
				type: obj.key.type
			};
		});
		return this.makeUpdate({
			mapop: {
				updates: [],
				removedKeys: removedKeys
			}
		})
	}

}