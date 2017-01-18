"use strict";

import '../proto/antidote_proto'
import ByteBuffer = require("bytebuffer")
import { AntidoteConnection } from "./antidoteConnection"
import { MessageCodes } from "./messageCodes"
import * as Long from "long";
import msgpack = require("msgpack-lite")

/** Connects to antidote on the given port and hostname
 * @param port the port number of Antidote's protocol buffer port (for example 8087)
 * @param host the host running Antidote (for example "localhost")
 */
export function connect(port: number, host: string): Connection {
	return new ConnectionImpl(new AntidoteConnection(port, host))

}

/** Creates a BoundObject, wich Antidote uses as key for data */
function key(key: string, type: AntidotePB.CRDT_type, bucket: string): AntidotePB.ApbBoundObject {
	return {
		key: ByteBuffer.fromUTF8(key),
		type: type,
		bucket: ByteBuffer.fromUTF8(bucket)
	}
}

/** takes a message with an encode method and converts it into an ArrayBuffer */
function encode(message: { encode(): ByteBuffer } | any): ArrayBuffer {
	return message.encode().toBuffer()
}

function _debugPrint(obj: any): string {
	return JSON.stringify(obj, (key, val) => {
		if (val instanceof ByteBuffer) {
			return val.toUTF8();
		} else if (val instanceof Long) {
			return val.toNumber();
		}
		return val;
	});
}


/**
 * A CRDT factory is used to create references to stored objects.
 * These references are linked to the factory from which they were created.
 * 
 * There are three kind of factories: the [[Connection]], [[Transaction]]s and [[CrdtMap]]s.
 * 
 */
export interface CrdtFactory {

	/** returns a reference to a counter object */
	counter(key: string): CrdtCounter;

	/** returns a reference to a fat_counter object */
	fatCounter(key: string): CrdtCounter;

	/** returns a reference to a last-writer-wins register */
	register<T>(key: string): CrdtRegister<T>;

	/** returns a reference to a multi-value register */
	multiValueRegister<T>(key: string): CrdtMultiValueRegister<T>;

	/** returns a reference to an integer object */
	integer(key: string): CrdtInteger;

	/** returns a reference to an add-wins set object */
	set<T>(key: string): CrdtSet<T>;

	/** returns a reference to a remove-wins set object */
	set_removeWins<T>(key: string): CrdtSet<T>;

	/** returns a reference to an add-wins map */
	map(key: string): CrdtMap;

	/** returns a reference to a remove-resets map */
	rrmap(key: string): CrdtMap;

	/** returns a reference to a grow-only map */
	gmap(key: string): CrdtMap;
}


abstract class CrdtFactoryImpl implements CrdtFactory {


	abstract getBucket(): string;

	public abstract readBatch(objects: AntidoteObject<any>[]): Promise<any[]>;

	public abstract jsToBinary(obj: any): ByteBuffer;

	public abstract binaryToJs(byteBuffer: ByteBuffer): any;

	/** returns a reference to a counter object */
	public counter(key: string): CrdtCounter {
		return new CrdtCounterImpl(this, key, this.getBucket(), AntidotePB.CRDT_type.COUNTER);
	}

	/** returns a reference to a fat-counter object */
	public fatCounter(key: string): CrdtCounter {
		return new CrdtCounterImpl(this, key, this.getBucket(), AntidotePB.CRDT_type.FATCOUNTER);
	}

	/** returns a reference to a last-writer-wins register */
	public register<T>(key: string): CrdtRegister<T> {
		return new CrdtRegisterImpl<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.LWWREG);
	}

	/** returns a reference to a multi-value register */
	public multiValueRegister<T>(key: string): CrdtMultiValueRegister<T> {
		return new CrdtMultiValueRegisterImpl<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.MVREG);
	}

	/** returns a reference to an integer object */
	public integer(key: string): CrdtInteger {
		return new CrdtIntegerImpl(this, key, this.getBucket(), AntidotePB.CRDT_type.INTEGER);
	}

	/** returns a reference to a add-wins set object */
	public set<T>(key: string): CrdtSet<T> {
		return new CrdtSetImpl<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.ORSET);
	}

	/** returns a reference to a remove-wins set object */
	public set_removeWins<T>(key: string): CrdtSet<T> {
		return new CrdtSetImpl<T>(this, key, this.getBucket(), AntidotePB.CRDT_type.RWSET);
	}

	/** returns a reference to an add-wins map */
	public map(key: string): CrdtMap {
		return new CrdtMapImpl(this, key, this.getBucket(), AntidotePB.CRDT_type.AWMAP);
	}

	/** returns a reference to an remove-resets map */
	public rrmap(key: string): CrdtMap {
		return new CrdtMapImpl(this, key, this.getBucket(), AntidotePB.CRDT_type.RRMAP);
	}

	/** returns a reference to a grow-only map */
	public gmap(key: string): CrdtMap {
		return new CrdtMapImpl(this, key, this.getBucket(), AntidotePB.CRDT_type.GMAP);
	}


	abstract childUpdate(key: AntidotePB.ApbBoundObject, operation: AntidotePB.ApbUpdateOperation): AntidotePB.ApbUpdateOp;

	readResponseToValue(type: AntidotePB.CRDT_type, response: AntidotePB.ApbReadObjectResp): any {
		let obj: AntidoteObject<any>;
		switch (type) {
			case AntidotePB.CRDT_type.COUNTER:
				obj = this.counter("");
				break;
			case AntidotePB.CRDT_type.ORSET:
				obj = this.set("");
				break;
			case AntidotePB.CRDT_type.LWWREG:
				obj = this.register("");
				break;
			case AntidotePB.CRDT_type.MVREG:
				obj = this.multiValueRegister("");
				break;
			case AntidotePB.CRDT_type.INTEGER:
				obj = this.integer("");
				break;
			case AntidotePB.CRDT_type.GMAP:
				obj = this.gmap("");
				break;
			case AntidotePB.CRDT_type.AWMAP:
				obj = this.map("");
				break;
			case AntidotePB.CRDT_type.RWSET:
				obj = this.set_removeWins("");
				break;
			default:
				throw new Error(`unhandled type: ${type}`);
		}
		return (obj as AntidoteObjectImpl<any>).interpretReadResponse(response)
	}
}

/**
 * An `AntidoteSession` is an interface to Antidote, which can be used to read and update values.
 * 
 * There are two possible sessions:  
 * 
 *  - The [[Connection]] for reads and updates which are not part of interactive transactions.
 *  - [[Transaction]] for performing reads and updates within an interactive transaction. 
 */
export interface AntidoteSession extends CrdtFactory {
	/** 
	 * Reads several objects at once.
	 * To read a single object, use the read method on that object.
	 */
	readBatch(objects: AntidoteObject<any>[]): Promise<any[]>;

	/**
	 * Sends a single update operation or an array of update operations to Antidote.
	 */
	update(updates: AntidotePB.ApbUpdateOp[] | AntidotePB.ApbUpdateOp): Promise<any>;
}


/** A connection to AntidoteDB with methods for reading, updating and starting transactions.
 * Use the [[connect]] function to obtain a `Connection`.
 * 
 * The Connection can then be used as a [[CrdtFactory]] to create references to database objects.
 * 
 * The [[readBatch]] and [[update]] methods can be used to perform reads and updates.
 * 
 * Example:
 * 
 * ```
 * let antidote = antidoteClient.connect(8087, "localhost")
 * // create a reference to a set object:
 * let userSet = antidote.set("users")
 * // read the value of the set
 * let val = await userSet.read()
 * // update the set:
 * await antidote.update(userSet.add("Hans"))
 * 
 * ```
 * 
 * The bucket can be configured via the property `defaultBucket`, it defaults to "default-bucket".
 * 
 * Javascript objects stored in sets and registers are encoded using MessagePack (http://msgpack.org) by default.
 * You can override the [[jsToBinary]] and [[binaryToJs]] methods to customize this behavior.
 * 
 */
export interface Connection extends AntidoteSession {

	/**
	 * The minimum snapshot version to use for new transactions.
	 * This will be used when starting a new transaction in order to guarantee
	 * session guarantees like monotonic reads and read-your-writes */
	minSnapshotTime: ByteBuffer | undefined;


	/**
	 * Option, which determines if snapshots should be monotonic.
	 * If set to `true`, this will update minSnapshotTime whenever 
	 * lastCommitTimestamp is updated
	 */
	monotonicSnapshots: boolean;

	/**
	 * the default bucket used for newly created keys
	 */
	defaultBucket: string;

	/** Method to encode objects before they are written to the database */
	jsToBinary(obj: any): ByteBuffer;

	/** Inverse of jsToBinary */
	binaryToJs(byteBuffer: ByteBuffer): any;

	/** Sets the timout for requests */
	setTimeout(ms: number): void;

	/** Starts a new transaction */
	startTransaction(): Promise<Transaction>;

	/**
	 * returns the timestamp for the last commited transaction
	 */
	getLastCommitTimestamp(): ByteBuffer | undefined;

	/**
	 * Closes the connection to Antidote
	 */
	close(): void;

}


class ConnectionImpl extends CrdtFactoryImpl implements Connection {
	readonly connection: AntidoteConnection;
	/**
	 * stores the last commit time.
	 */
	private lastCommitTimestamp: ByteBuffer | undefined = undefined;

	/**
	 * The minimum snapshot version to use for new transactions.
	 * This will be used when starting a new transaction in order to guarantee
	 * session guarantees like monotonic reads and read-your-writes */
	public minSnapshotTime: ByteBuffer | undefined = undefined;


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
		let buffer = new Buffer(byteBuffer.toArrayBuffer());
		if (buffer.byteLength == 0) {
			return null;
		}
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
			return new TransactionImpl(this, resp.transaction_descriptor!);
		}
		return Promise.reject<any>(resp.errorcode);
	}


	/**
	 * returns the timestamp for the last commited transaction
	 */
	public getLastCommitTimestamp(): ByteBuffer | undefined {
		return this.lastCommitTimestamp;
	}


	private setLastCommitTimestamp(lastCommitTimestamp: ByteBuffer | undefined) {
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
	public async readBatch(objects: AntidoteObject<any>[]): Promise<any[]> {
		let objects2 = objects as AntidoteObjectImpl<any>[]
		let messageType = MessageCodes.antidotePb.ApbStaticReadObjects;
		let message: AntidotePB.ApbStaticReadObjectsMessage = new messageType({
			transaction: this.startTransactionPb(),
			objects: objects2.map(o => o.key)
		});
		let resp: AntidotePB.ApbStaticReadObjectsResp = await this.connection.sendRequest(MessageCodes.apbStaticReadObjects, encode(message));
		let cr = await this.completeTransaction(resp.committime!);
		let readResp = resp.objects!;
		if (readResp.success) {
			let resVals: any[] = [];

			for (let i in objects2) {
				var obj = objects2[i];
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
	public async update(updates: AntidotePB.ApbUpdateOp[] | AntidotePB.ApbUpdateOp): Promise<CommitResponse> {
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



interface CommitResponse {
	commitTime: ByteBuffer
}

/**
 * A transaction can be used similar to a [[Connection]] to get references to database and objects
 * and to perform reads and updates.
 * 
 * Example:
 * ```
 *     let tx = await antidote.startTransaction()
 *     // create object reference bound to the transaction:
 *     let reg = tx.multiValueRegister<number>("some-key");
 *     
 *     // read the register in the transaction:
 *     let vals = await reg.read();
 *     
 *     // update the register based on current values 
 *     let newval = f(vals) 
 *     await tx.update(
 *         reg.set(newval)
 *     )
 *     await tx.commit()
 * ```
 * 
 */
export interface Transaction extends AntidoteSession {

	/**
	 * Commits the transaction.
	 */
	commit(): Promise<any>;
}

class TransactionImpl extends CrdtFactoryImpl implements Transaction {
	private connection: ConnectionImpl;
	private antidoteConnection: AntidoteConnection;
	private txId: ByteBuffer;
	constructor(conn: ConnectionImpl, txId: ByteBuffer) {
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
	public async readBatch(objects: AntidoteObject<any>[]): Promise<any[]> {
		let objects2 = objects as AntidoteObjectImpl<any>[]; 
		let apb = MessageCodes.antidotePb.ApbReadObjects;
		let message = new apb({
			boundobjects: objects2.map(o => o.key),
			transaction_descriptor: this.txId
		});
		let resp: AntidotePB.ApbReadObjectsResp = await this.antidoteConnection.sendRequest(MessageCodes.apbReadObjects, encode(message));
		if (resp.success) {
			let resVals: any[] = [];
			for (let i in objects2) {
				var obj = objects2[i];
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
	public async update(updates: AntidotePB.ApbUpdateOp[] | AntidotePB.ApbUpdateOp): Promise<void> {
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


/**
 * An AntidoteObject is a reference to an object in the database and is bound to
 * the [[CrdtFactory]] which created the reference.
 * 
 * For example, when a reference is created from a [[Transaction]] object, 
 * all reads on the object will be performed in the context of the transaction.
 * 
 * @param T the type returned when reading the object
 */
export interface AntidoteObject<T> {
	/** the parent factory */
	readonly parent: CrdtFactory;

	/** 
	 * reads the current value of the object  
	 **/
	read(): Promise<T>;

}

abstract class AntidoteObjectImpl<T> implements AntidoteObject<T> {
	readonly parent: CrdtFactoryImpl;
	readonly key: AntidotePB.ApbBoundObject;

	constructor(conn: CrdtFactoryImpl, key: string, bucket: string, type: AntidotePB.CRDT_type) {
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

	public async read(): Promise<T> {
		let r = await this.parent.readBatch([this])
		return r[0]
	}
}


/**
 * A counter is a object that stores a single integer and can be incremented or decremented.
 * 
 * Example:
 * 
 * ```
 * let counter = connection.counter("myCounter")
 * await connection.update(
 * 	counter.increment(3)
 * );
 * let val = await counter.read();
 * ```
 * 
 */
export interface CrdtCounter extends AntidoteObject<number> {
	/** Creates an operation to increment the counter.
	 * Negative numbers will decrement the value. 
	 * Use [[Connection.update]] to send the update to the database. */
	increment(amount: number | Long): AntidotePB.ApbUpdateOp;

	/**
	 * Reads the current value of the counter
	 */
	read(): Promise<number>;

}

class CrdtCounterImpl extends AntidoteObjectImpl<number> implements CrdtCounter {

	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): number {
		return readResponse.counter!.value!;
	}

	/** Creates an operation to increment the counter.
	 * Negative numbers will decrement the value. 
	 * Use [[[[Connection.update]]]] to send the update to the database. */
	public increment(amount: number | Long): AntidotePB.ApbUpdateOp {
		let amountL = (amount instanceof Long) ? amount : new Long(amount);
		return this.makeUpdate({
			counterop: {
				inc: amountL
			}
		})
	}

}

/**
 * An integer can be incremented and set to a specific value.
 * 
 * ```
 * let num = connection.integer("myint")
 * await connection.update(
 * 	num.set(40)
 * )
 * await connection.update(
 * 	num.increment(2)
 * )
 * let val = await num.read();
 * ```
*/
export interface CrdtInteger extends AntidoteObject<number> {
	/** Creates an operation to increment the integer.
	 * Negative numbers will decrement the value. 
	 * Use [[Connection.update]] to send the update to the database. */
	increment(amount: number | Long): AntidotePB.ApbUpdateOp;

	/** Creates an operation to set the intgeger to a specific value.
	 * Use [[Connection.update]] to send the update to the database. */
	set(value: number | Long): AntidotePB.ApbUpdateOp;
}


class CrdtIntegerImpl extends AntidoteObjectImpl<number> implements CrdtInteger {
	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): number {
		return readResponse.int!.value!.toNumber();
	}

	/** Creates an operation to increment the integer.
	 * Negative numbers will decrement the value. 
	 * Use [[Connection.update]] to send the update to the database. */
	public increment(amount: number | Long): AntidotePB.ApbUpdateOp {
		let amountL = (amount instanceof Long) ? amount : new Long(amount);
		return this.makeUpdate({
			integerop: {
				inc: amountL
			}
		})
	}

	/** Creates an operation to set the intgeger to a specific value.
	 * Use [[Connection.update]] to send the update to the database. */
	public set(value: number | Long): AntidotePB.ApbUpdateOp {
		let valueL = (value instanceof Long) ? value : new Long(value);
		return this.makeUpdate({
			integerop: {
				set: valueL
			}
		})
	}

}

/**
 * A register stores a single value.
 * It provides a [[set]] method to change the value.
 * 
 * Example:
 * 
 * ```
 * let reg = connection.register<string[]>("mylwwreg")
 * await connection.update(
 * 	reg.set(["a", "b"])
 * )
 * let val = await reg.read();
 * ```
 * 
 * @param T the type of the value stored in the register
 */
export interface CrdtRegister<T> extends AntidoteObject<T> {
	/** Creates an operation, which sets the register to the provided value.
	 * Negative numbers will decrement the value. 
	 * Use [[Connection.update]] to send the update to the database. */
	set(value: T): AntidotePB.ApbUpdateOp;
}

class CrdtRegisterImpl<T> extends AntidoteObjectImpl<T> implements CrdtRegister<T> {

	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T {
		let bin = readResponse.reg!.value!;
		return this.parent.binaryToJs(bin);
	}

	/** Creates an operation, which sets the register to the provided value.
	 * 
	 * Use [[Connection.update]] to send the update to the database. */
	public set(value: T): AntidotePB.ApbUpdateOp {
		let bin = this.parent.jsToBinary(value);
		return this.makeUpdate({
			regop: {
				value: bin
			}
		})
	}

}


/**
 * This register can be [[set]] to a single value, but reading the register returns a list of 
 * all concurrently written values.
 * 
 * Example:
 * 
 * ```
 * let reg = connection.multiValueRegister<number>("mymvreg")
 * await connection.update(
 * 	reg.set(15)
 * )
 * let val = await reg.read();
 * // val is now [15]
 * ```
 * 
 * @param T the type of the value stored in the register
 */
export interface CrdtMultiValueRegister<T> extends AntidoteObject<T[]> {
	/** Creates an operation, which sets the register to the provided value.
	 * 
	 * Use [[Connection.update]] to send the update to the database. */
	set(value: T): AntidotePB.ApbUpdateOp;
}

class CrdtMultiValueRegisterImpl<T> extends AntidoteObjectImpl<T[]> implements CrdtMultiValueRegister<T> {


	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T[] {
		let bins = readResponse.mvreg!.values!;
		let res: any = bins.map(bin => this.parent.binaryToJs(bin));
		return res;
	}

	/** Creates an operation, which sets the register to the provided value.
	 * Negative numbers will decrement the value. 
	 * Use [[Connection.update]] to send the update to the database. */
	public set(value: T): AntidotePB.ApbUpdateOp {
		let bin = this.parent.jsToBinary(value);
		return this.makeUpdate({
			regop: {
				value: bin
			}
		})
	}

}

/**
 * A set of elements.
 * Elements can be added and removed.
 * 
 * Example:  
 * ```
 * let set = setType.create<string>("my-set")
 * await connection.update(
 * 	set.addAll(["a", "b", "c", "d", "e"])
 * )
 * await connection.update([
 * 	set.remove("a"),
 * 	set.removeAll(["b", "c"])
 * ])
 * let val = await set.read();
 * // val is now ["d", "e"]
 * ```
 * 
 * @param T the type of the elements stored in the set
 */
export interface CrdtSet<T> extends AntidoteObject<T[]> {
	/** 
	 * Creates an operation, which adds an element to the set. 
	 * Use [[Connection.update]] to send the update to the database. */
	add(elem: T): AntidotePB.ApbUpdateOp;

	/** 
	 * Creates an operation, which adds several elements to the set. 
	 * Use [[Connection.update]] to send the update to the database. */
	addAll(elems: T[]): AntidotePB.ApbUpdateOp;

	/** 
	 * Creates an operation, which removes an element from the set. 
	 * Use [[Connection.update]] to send the update to the database. */
	remove(elem: T): AntidotePB.ApbUpdateOp;

	/** 
	 * Creates an operation, which removes several elements from the set. 
	 * Use [[Connection.update]] to send the update to the database. */
	removeAll(elems: T[]): AntidotePB.ApbUpdateOp;

}

class CrdtSetImpl<T> extends AntidoteObjectImpl<T[]> implements CrdtSet<T> {
	interpretReadResponse(readResponse: AntidotePB.ApbReadObjectResp): T[] {
		let vals = readResponse.set!.value!;
		return vals.map(bin => {
			return this.parent.binaryToJs(bin)
		});
	}

	/** 
	 * Creates an operation, which adds an element to the set. 
	 * Use [[Connection.update]] to send the update to the database. */
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
	 * Use [[Connection.update]] to send the update to the database. */
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
	 * Use [[Connection.update]] to send the update to the database. */
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
	 * Use [[Connection.update]] to send the update to the database. */
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

/**
 * An object representing the value of a [[CrdtMap]].
 */
export interface CrdtMapValue {
	/**
	 * reads the entry with the given key and type
	 */
	get(key: string, type: AntidotePB.CRDT_type): any;

	/** reads the counter value with the given key */
	counterValue(key: string): number | undefined;
	/** reads the set value with the given key */
	setValue(key: string): any[] | undefined;
	/** reads the register value with the given key */
	registerValue(key: string): any;
	/** reads the multi-value-register value with the given key */
	mvRegisterValue(key: string): any[] | undefined;
	/** reads the integer value with the given key */
	integerValue(key: string): number | undefined ;
	/** reads the gmap value with the given key */
	gmapValue(key: string): CrdtMapValue | undefined;
	/** reads the add-wins-map value with the given key */
	awmapValue(key: string): CrdtMapValue | undefined;
	/** reads the remove-wins-set value with the given key */
	rwsetValue(key: string): any[] | undefined;
	
	/** 
	 * Converts this CRDTMapValue into a JavaScript object.
	 * The value of each embedded CRDT is stored under it's key.
	 * 
	 * Warning: If there are two entries with the same keys but different types, then only one of them survives.
	 * */
	toJsObject(): any;
}

class CrdtMapValueImpl implements CrdtMapValue {

	constructor(private factory: CrdtFactoryImpl, private entries: AntidotePB.ApbMapEntry[]) {
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
			if (value instanceof CrdtMapValueImpl) {
				value = value.toJsObject();
			}
			res[entry.key!.key!.toUTF8()] = value;
		}
		return res;
	}
}

/**
 * A map with embedded CRDTs. 
 * Each map implements the [[CrdtFactory]] interface, so it can be used like a connection to create references to embedded objects.
 * The [[remove]] and [[removeAll]] methods can be used to remove entries from the map.  
 * 
 * Example:
 * 
 * ```
 * let map = connection.map("my-map2");
 * await connection.update([
 * 	map.register("a").set("x"),
 * 	map.register("b").set("x"),
 * 	map.register("c").set("x"),
 * 	map.register("d").set("x"),
 * 	map.set("e").addAll([1, 2, 3, 4]),
 * 	map.counter("f").increment(5)
 * ])
 * await connection.update([
 * 	map.remove(map.register("a")),
 * 	map.removeAll([map.register("b"), map.register("c")])
 * ])
 * let val = await map.read();
 * // convert CrdtMapValue to JavaScript object:
 * let obj = val.toJsObject();
 * // obj is now { d: "x", e: [1, 2, 3, 4], f: 5 }
 * ```
 */
export interface CrdtMap extends AntidoteObject<CrdtMapValue>, CrdtFactory {

	/**
	 * Creates an operation to remove an entry from the map.
	 * Use [[Connection.update]] to send the update to the database.
	 */
	remove(object: AntidoteObject<any>): AntidotePB.ApbUpdateOp

	/**
	 * Creates an operation to remove several entries from the map.
	 * Use [[Connection.update]] to send the update to the database.
	 */
	removeAll(objects: AntidoteObject<any>[]): AntidotePB.ApbUpdateOp
}


class CrdtMapImpl extends CrdtFactoryImpl implements CrdtMap {
	readonly parent: CrdtFactoryImpl;
	readonly key: AntidotePB.ApbBoundObject;

	constructor(conn: CrdtFactoryImpl, key: string, bucket: string, type: AntidotePB.CRDT_type) {
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
		return new CrdtMapValueImpl(this.parent, vals);
	}

	public async read(): Promise<CrdtMapValue> {
		let r = await this.parent.readBatch([this])
		return r[0]
	}

	getBucket(): string {
		return "";
	}

	public async readBatch(objects: AntidoteObject<any>[]): Promise<any[]> {
		let objects2 = objects as AntidoteObjectImpl<any>[]
		let r = await this.parent.readBatch([this])
		let map: CrdtMapValue = r[0];
		let values: any[] = [];
		// filter out the actual keys
		for (let obj of objects2) {
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


	public remove(object: AntidoteObject<any>): AntidotePB.ApbUpdateOp {
		return this.removeAll([object]);
	}

	public removeAll(objects: AntidoteObject<any>[]): AntidotePB.ApbUpdateOp {
		let objects2 = objects as AntidoteObjectImpl<any>[];
		let removedKeys: AntidotePB.ApbMapKey[] = objects2.map(obj => {
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