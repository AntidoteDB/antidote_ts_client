declare module AntidotePB {
	
	
	interface ProtoBufMapItem<KeyType, ValueType> {
		key : KeyType,
		value : ValueType
	}
	
	interface ProtoBufMap<KeyType, ValueType> {
		clear(): void;
		delete(key: KeyType): void;
		get(key: KeyType): ValueType;
		has(key: KeyType): boolean;
		set(key: KeyType, value: ValueType): void;
		forEach(fn: (value: ValueType, key?: KeyType) => void): void;
		size: number;
		map : { [key: string]: ProtoBufMapItem<KeyType, ValueType> }
	}
	
	export interface ProtoBufBuilder {
		ApbErrorResp: ApbErrorRespBuilder;
		ApbCounterUpdate: ApbCounterUpdateBuilder;
		ApbGetCounterResp: ApbGetCounterRespBuilder;
		ApbSetUpdate: ApbSetUpdateBuilder;
		ApbGetSetResp: ApbGetSetRespBuilder;
		ApbRegUpdate: ApbRegUpdateBuilder;
		ApbGetRegResp: ApbGetRegRespBuilder;
		ApbGetMVRegResp: ApbGetMVRegRespBuilder;
		ApbIntegerUpdate: ApbIntegerUpdateBuilder;
		ApbGetIntegerResp: ApbGetIntegerRespBuilder;
		ApbMapKey: ApbMapKeyBuilder;
		ApbMapUpdate: ApbMapUpdateBuilder;
		ApbMapNestedUpdate: ApbMapNestedUpdateBuilder;
		ApbGetMapResp: ApbGetMapRespBuilder;
		ApbMapEntry: ApbMapEntryBuilder;
		ApbCrdtReset: ApbCrdtResetBuilder;
		ApbOperationResp: ApbOperationRespBuilder;
		ApbTxnProperties: ApbTxnPropertiesBuilder;
		ApbBoundObject: ApbBoundObjectBuilder;
		ApbReadObjects: ApbReadObjectsBuilder;
		ApbUpdateOp: ApbUpdateOpBuilder;
		ApbUpdateOperation: ApbUpdateOperationBuilder;
		ApbUpdateObjects: ApbUpdateObjectsBuilder;
		ApbStartTransaction: ApbStartTransactionBuilder;
		ApbAbortTransaction: ApbAbortTransactionBuilder;
		ApbCommitTransaction: ApbCommitTransactionBuilder;
		ApbStaticUpdateObjects: ApbStaticUpdateObjectsBuilder;
		ApbStaticReadObjects: ApbStaticReadObjectsBuilder;
		ApbStartTransactionResp: ApbStartTransactionRespBuilder;
		ApbReadObjectResp: ApbReadObjectRespBuilder;
		ApbReadObjectsResp: ApbReadObjectsRespBuilder;
		ApbCommitResp: ApbCommitRespBuilder;
		ApbStaticReadObjectsResp: ApbStaticReadObjectsRespBuilder;
		CRDT_type: CRDT_type;
		
}
}

declare module AntidotePB {
	
	export interface ApbErrorResp {
	
		

errmsg?: ByteBuffer;
		

getErrmsg?() : ByteBuffer;
		setErrmsg?(errmsg : ByteBuffer): void;
		



errcode?: number;
		

getErrcode?() : number;
		setErrcode?(errcode : number): void;
		



}
	
	export interface ApbErrorRespMessage extends ApbErrorResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbErrorRespBuilder {
	new(data?: ApbErrorResp): ApbErrorRespMessage;
	decode(buffer: ArrayBuffer) : ApbErrorRespMessage;
	decode(buffer: ByteBuffer) : ApbErrorRespMessage;
	decode64(buffer: string) : ApbErrorRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbCounterUpdate {
	
		

inc?: Long;
		

getInc?() : Long;
		setInc?(inc : Long): void;
		



}
	
	export interface ApbCounterUpdateMessage extends ApbCounterUpdate {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbCounterUpdateBuilder {
	new(data?: ApbCounterUpdate): ApbCounterUpdateMessage;
	decode(buffer: ArrayBuffer) : ApbCounterUpdateMessage;
	decode(buffer: ByteBuffer) : ApbCounterUpdateMessage;
	decode64(buffer: string) : ApbCounterUpdateMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbGetCounterResp {
	
		

value?: number;
		

getValue?() : number;
		setValue?(value : number): void;
		



}
	
	export interface ApbGetCounterRespMessage extends ApbGetCounterResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbGetCounterRespBuilder {
	new(data?: ApbGetCounterResp): ApbGetCounterRespMessage;
	decode(buffer: ArrayBuffer) : ApbGetCounterRespMessage;
	decode(buffer: ByteBuffer) : ApbGetCounterRespMessage;
	decode64(buffer: string) : ApbGetCounterRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbSetUpdate {
	
		

optype?: ApbSetUpdate.SetOpType;
		

getOptype?() : ApbSetUpdate.SetOpType;
		setOptype?(optype : ApbSetUpdate.SetOpType): void;
		



adds?: ByteBuffer[];
		

getAdds?() : ByteBuffer[];
		setAdds?(adds : ByteBuffer[]): void;
		



rems?: ByteBuffer[];
		

getRems?() : ByteBuffer[];
		setRems?(rems : ByteBuffer[]): void;
		



}
	
	export interface ApbSetUpdateMessage extends ApbSetUpdate {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbSetUpdateBuilder {
	new(data?: ApbSetUpdate): ApbSetUpdateMessage;
	decode(buffer: ArrayBuffer) : ApbSetUpdateMessage;
	decode(buffer: ByteBuffer) : ApbSetUpdateMessage;
	decode64(buffer: string) : ApbSetUpdateMessage;
	SetOpType: ApbSetUpdate.SetOpType;
	
}
	
}

declare module AntidotePB.ApbSetUpdate {
	export const enum SetOpType {
		ADD = 1,
		REMOVE = 2,
		
}
}


declare module AntidotePB {
	
	export interface ApbGetSetResp {
	
		

value?: ByteBuffer[];
		

getValue?() : ByteBuffer[];
		setValue?(value : ByteBuffer[]): void;
		



}
	
	export interface ApbGetSetRespMessage extends ApbGetSetResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbGetSetRespBuilder {
	new(data?: ApbGetSetResp): ApbGetSetRespMessage;
	decode(buffer: ArrayBuffer) : ApbGetSetRespMessage;
	decode(buffer: ByteBuffer) : ApbGetSetRespMessage;
	decode64(buffer: string) : ApbGetSetRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbRegUpdate {
	
		

value?: ByteBuffer;
		

getValue?() : ByteBuffer;
		setValue?(value : ByteBuffer): void;
		



}
	
	export interface ApbRegUpdateMessage extends ApbRegUpdate {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbRegUpdateBuilder {
	new(data?: ApbRegUpdate): ApbRegUpdateMessage;
	decode(buffer: ArrayBuffer) : ApbRegUpdateMessage;
	decode(buffer: ByteBuffer) : ApbRegUpdateMessage;
	decode64(buffer: string) : ApbRegUpdateMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbGetRegResp {
	
		

value?: ByteBuffer;
		

getValue?() : ByteBuffer;
		setValue?(value : ByteBuffer): void;
		



}
	
	export interface ApbGetRegRespMessage extends ApbGetRegResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbGetRegRespBuilder {
	new(data?: ApbGetRegResp): ApbGetRegRespMessage;
	decode(buffer: ArrayBuffer) : ApbGetRegRespMessage;
	decode(buffer: ByteBuffer) : ApbGetRegRespMessage;
	decode64(buffer: string) : ApbGetRegRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbGetMVRegResp {
	
		

values?: ByteBuffer[];
		

getValues?() : ByteBuffer[];
		setValues?(values : ByteBuffer[]): void;
		



}
	
	export interface ApbGetMVRegRespMessage extends ApbGetMVRegResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbGetMVRegRespBuilder {
	new(data?: ApbGetMVRegResp): ApbGetMVRegRespMessage;
	decode(buffer: ArrayBuffer) : ApbGetMVRegRespMessage;
	decode(buffer: ByteBuffer) : ApbGetMVRegRespMessage;
	decode64(buffer: string) : ApbGetMVRegRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbIntegerUpdate {
	
		

inc?: Long;
		

getInc?() : Long;
		setInc?(inc : Long): void;
		



set?: Long;
		

getSet?() : Long;
		setSet?(set : Long): void;
		



}
	
	export interface ApbIntegerUpdateMessage extends ApbIntegerUpdate {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbIntegerUpdateBuilder {
	new(data?: ApbIntegerUpdate): ApbIntegerUpdateMessage;
	decode(buffer: ArrayBuffer) : ApbIntegerUpdateMessage;
	decode(buffer: ByteBuffer) : ApbIntegerUpdateMessage;
	decode64(buffer: string) : ApbIntegerUpdateMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbGetIntegerResp {
	
		

value?: Long;
		

getValue?() : Long;
		setValue?(value : Long): void;
		



}
	
	export interface ApbGetIntegerRespMessage extends ApbGetIntegerResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbGetIntegerRespBuilder {
	new(data?: ApbGetIntegerResp): ApbGetIntegerRespMessage;
	decode(buffer: ArrayBuffer) : ApbGetIntegerRespMessage;
	decode(buffer: ByteBuffer) : ApbGetIntegerRespMessage;
	decode64(buffer: string) : ApbGetIntegerRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbMapKey {
	
		

key?: ByteBuffer;
		

getKey?() : ByteBuffer;
		setKey?(key : ByteBuffer): void;
		



type?: CRDT_type;
		

getType?() : CRDT_type;
		setType?(type : CRDT_type): void;
		



}
	
	export interface ApbMapKeyMessage extends ApbMapKey {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbMapKeyBuilder {
	new(data?: ApbMapKey): ApbMapKeyMessage;
	decode(buffer: ArrayBuffer) : ApbMapKeyMessage;
	decode(buffer: ByteBuffer) : ApbMapKeyMessage;
	decode64(buffer: string) : ApbMapKeyMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbMapUpdate {
	
		

updates?: ApbMapNestedUpdate[];
		

getUpdates?() : ApbMapNestedUpdate[];
		setUpdates?(updates : ApbMapNestedUpdate[]): void;
		



removedKeys?: ApbMapKey[];
		

getRemovedKeys?() : ApbMapKey[];
		setRemovedKeys?(removedKeys : ApbMapKey[]): void;
		



}
	
	export interface ApbMapUpdateMessage extends ApbMapUpdate {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbMapUpdateBuilder {
	new(data?: ApbMapUpdate): ApbMapUpdateMessage;
	decode(buffer: ArrayBuffer) : ApbMapUpdateMessage;
	decode(buffer: ByteBuffer) : ApbMapUpdateMessage;
	decode64(buffer: string) : ApbMapUpdateMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbMapNestedUpdate {
	
		

key?: ApbMapKey;
		

getKey?() : ApbMapKey;
		setKey?(key : ApbMapKey): void;
		



update?: ApbUpdateOperation;
		

getUpdate?() : ApbUpdateOperation;
		setUpdate?(update : ApbUpdateOperation): void;
		



}
	
	export interface ApbMapNestedUpdateMessage extends ApbMapNestedUpdate {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbMapNestedUpdateBuilder {
	new(data?: ApbMapNestedUpdate): ApbMapNestedUpdateMessage;
	decode(buffer: ArrayBuffer) : ApbMapNestedUpdateMessage;
	decode(buffer: ByteBuffer) : ApbMapNestedUpdateMessage;
	decode64(buffer: string) : ApbMapNestedUpdateMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbGetMapResp {
	
		

entries?: ApbMapEntry[];
		

getEntries?() : ApbMapEntry[];
		setEntries?(entries : ApbMapEntry[]): void;
		



}
	
	export interface ApbGetMapRespMessage extends ApbGetMapResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbGetMapRespBuilder {
	new(data?: ApbGetMapResp): ApbGetMapRespMessage;
	decode(buffer: ArrayBuffer) : ApbGetMapRespMessage;
	decode(buffer: ByteBuffer) : ApbGetMapRespMessage;
	decode64(buffer: string) : ApbGetMapRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbMapEntry {
	
		

key?: ApbMapKey;
		

getKey?() : ApbMapKey;
		setKey?(key : ApbMapKey): void;
		



value?: ApbReadObjectResp;
		

getValue?() : ApbReadObjectResp;
		setValue?(value : ApbReadObjectResp): void;
		



}
	
	export interface ApbMapEntryMessage extends ApbMapEntry {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbMapEntryBuilder {
	new(data?: ApbMapEntry): ApbMapEntryMessage;
	decode(buffer: ArrayBuffer) : ApbMapEntryMessage;
	decode(buffer: ByteBuffer) : ApbMapEntryMessage;
	decode64(buffer: string) : ApbMapEntryMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbCrdtReset {
	
		

}
	
	export interface ApbCrdtResetMessage extends ApbCrdtReset {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbCrdtResetBuilder {
	new(data?: ApbCrdtReset): ApbCrdtResetMessage;
	decode(buffer: ArrayBuffer) : ApbCrdtResetMessage;
	decode(buffer: ByteBuffer) : ApbCrdtResetMessage;
	decode64(buffer: string) : ApbCrdtResetMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbOperationResp {
	
		

success?: boolean;
		

getSuccess?() : boolean;
		setSuccess?(success : boolean): void;
		



errorcode?: number;
		

getErrorcode?() : number;
		setErrorcode?(errorcode : number): void;
		



}
	
	export interface ApbOperationRespMessage extends ApbOperationResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbOperationRespBuilder {
	new(data?: ApbOperationResp): ApbOperationRespMessage;
	decode(buffer: ArrayBuffer) : ApbOperationRespMessage;
	decode(buffer: ByteBuffer) : ApbOperationRespMessage;
	decode64(buffer: string) : ApbOperationRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbTxnProperties {
	
		

read_write?: number;
		

getReadWrite?() : number;
		setReadWrite?(readWrite : number): void;
		



red_blue?: number;
		

getRedBlue?() : number;
		setRedBlue?(redBlue : number): void;
		



}
	
	export interface ApbTxnPropertiesMessage extends ApbTxnProperties {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbTxnPropertiesBuilder {
	new(data?: ApbTxnProperties): ApbTxnPropertiesMessage;
	decode(buffer: ArrayBuffer) : ApbTxnPropertiesMessage;
	decode(buffer: ByteBuffer) : ApbTxnPropertiesMessage;
	decode64(buffer: string) : ApbTxnPropertiesMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbBoundObject {
	
		

key?: ByteBuffer;
		

getKey?() : ByteBuffer;
		setKey?(key : ByteBuffer): void;
		



type?: CRDT_type;
		

getType?() : CRDT_type;
		setType?(type : CRDT_type): void;
		



bucket?: ByteBuffer;
		

getBucket?() : ByteBuffer;
		setBucket?(bucket : ByteBuffer): void;
		



}
	
	export interface ApbBoundObjectMessage extends ApbBoundObject {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbBoundObjectBuilder {
	new(data?: ApbBoundObject): ApbBoundObjectMessage;
	decode(buffer: ArrayBuffer) : ApbBoundObjectMessage;
	decode(buffer: ByteBuffer) : ApbBoundObjectMessage;
	decode64(buffer: string) : ApbBoundObjectMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbReadObjects {
	
		

boundobjects?: ApbBoundObject[];
		

getBoundobjects?() : ApbBoundObject[];
		setBoundobjects?(boundobjects : ApbBoundObject[]): void;
		



transaction_descriptor?: ByteBuffer;
		

getTransactionDescriptor?() : ByteBuffer;
		setTransactionDescriptor?(transactionDescriptor : ByteBuffer): void;
		



}
	
	export interface ApbReadObjectsMessage extends ApbReadObjects {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbReadObjectsBuilder {
	new(data?: ApbReadObjects): ApbReadObjectsMessage;
	decode(buffer: ArrayBuffer) : ApbReadObjectsMessage;
	decode(buffer: ByteBuffer) : ApbReadObjectsMessage;
	decode64(buffer: string) : ApbReadObjectsMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbUpdateOp {
	
		

boundobject?: ApbBoundObject;
		

getBoundobject?() : ApbBoundObject;
		setBoundobject?(boundobject : ApbBoundObject): void;
		



operation?: ApbUpdateOperation;
		

getOperation?() : ApbUpdateOperation;
		setOperation?(operation : ApbUpdateOperation): void;
		



}
	
	export interface ApbUpdateOpMessage extends ApbUpdateOp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbUpdateOpBuilder {
	new(data?: ApbUpdateOp): ApbUpdateOpMessage;
	decode(buffer: ArrayBuffer) : ApbUpdateOpMessage;
	decode(buffer: ByteBuffer) : ApbUpdateOpMessage;
	decode64(buffer: string) : ApbUpdateOpMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbUpdateOperation {
	
		

counterop?: ApbCounterUpdate;
		

getCounterop?() : ApbCounterUpdate;
		setCounterop?(counterop : ApbCounterUpdate): void;
		



setop?: ApbSetUpdate;
		

getSetop?() : ApbSetUpdate;
		setSetop?(setop : ApbSetUpdate): void;
		



regop?: ApbRegUpdate;
		

getRegop?() : ApbRegUpdate;
		setRegop?(regop : ApbRegUpdate): void;
		



integerop?: ApbIntegerUpdate;
		

getIntegerop?() : ApbIntegerUpdate;
		setIntegerop?(integerop : ApbIntegerUpdate): void;
		



mapop?: ApbMapUpdate;
		

getMapop?() : ApbMapUpdate;
		setMapop?(mapop : ApbMapUpdate): void;
		



resetop?: ApbCrdtReset;
		

getResetop?() : ApbCrdtReset;
		setResetop?(resetop : ApbCrdtReset): void;
		



}
	
	export interface ApbUpdateOperationMessage extends ApbUpdateOperation {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbUpdateOperationBuilder {
	new(data?: ApbUpdateOperation): ApbUpdateOperationMessage;
	decode(buffer: ArrayBuffer) : ApbUpdateOperationMessage;
	decode(buffer: ByteBuffer) : ApbUpdateOperationMessage;
	decode64(buffer: string) : ApbUpdateOperationMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbUpdateObjects {
	
		

updates?: ApbUpdateOp[];
		

getUpdates?() : ApbUpdateOp[];
		setUpdates?(updates : ApbUpdateOp[]): void;
		



transaction_descriptor?: ByteBuffer;
		

getTransactionDescriptor?() : ByteBuffer;
		setTransactionDescriptor?(transactionDescriptor : ByteBuffer): void;
		



}
	
	export interface ApbUpdateObjectsMessage extends ApbUpdateObjects {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbUpdateObjectsBuilder {
	new(data?: ApbUpdateObjects): ApbUpdateObjectsMessage;
	decode(buffer: ArrayBuffer) : ApbUpdateObjectsMessage;
	decode(buffer: ByteBuffer) : ApbUpdateObjectsMessage;
	decode64(buffer: string) : ApbUpdateObjectsMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbStartTransaction {
	
		

timestamp?: ByteBuffer;
		

getTimestamp?() : ByteBuffer;
		setTimestamp?(timestamp : ByteBuffer): void;
		



properties?: ApbTxnProperties;
		

getProperties?() : ApbTxnProperties;
		setProperties?(properties : ApbTxnProperties): void;
		



}
	
	export interface ApbStartTransactionMessage extends ApbStartTransaction {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbStartTransactionBuilder {
	new(data?: ApbStartTransaction): ApbStartTransactionMessage;
	decode(buffer: ArrayBuffer) : ApbStartTransactionMessage;
	decode(buffer: ByteBuffer) : ApbStartTransactionMessage;
	decode64(buffer: string) : ApbStartTransactionMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbAbortTransaction {
	
		

transaction_descriptor?: ByteBuffer;
		

getTransactionDescriptor?() : ByteBuffer;
		setTransactionDescriptor?(transactionDescriptor : ByteBuffer): void;
		



}
	
	export interface ApbAbortTransactionMessage extends ApbAbortTransaction {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbAbortTransactionBuilder {
	new(data?: ApbAbortTransaction): ApbAbortTransactionMessage;
	decode(buffer: ArrayBuffer) : ApbAbortTransactionMessage;
	decode(buffer: ByteBuffer) : ApbAbortTransactionMessage;
	decode64(buffer: string) : ApbAbortTransactionMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbCommitTransaction {
	
		

transaction_descriptor?: ByteBuffer;
		

getTransactionDescriptor?() : ByteBuffer;
		setTransactionDescriptor?(transactionDescriptor : ByteBuffer): void;
		



}
	
	export interface ApbCommitTransactionMessage extends ApbCommitTransaction {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbCommitTransactionBuilder {
	new(data?: ApbCommitTransaction): ApbCommitTransactionMessage;
	decode(buffer: ArrayBuffer) : ApbCommitTransactionMessage;
	decode(buffer: ByteBuffer) : ApbCommitTransactionMessage;
	decode64(buffer: string) : ApbCommitTransactionMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbStaticUpdateObjects {
	
		

transaction?: ApbStartTransaction;
		

getTransaction?() : ApbStartTransaction;
		setTransaction?(transaction : ApbStartTransaction): void;
		



updates?: ApbUpdateOp[];
		

getUpdates?() : ApbUpdateOp[];
		setUpdates?(updates : ApbUpdateOp[]): void;
		



}
	
	export interface ApbStaticUpdateObjectsMessage extends ApbStaticUpdateObjects {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbStaticUpdateObjectsBuilder {
	new(data?: ApbStaticUpdateObjects): ApbStaticUpdateObjectsMessage;
	decode(buffer: ArrayBuffer) : ApbStaticUpdateObjectsMessage;
	decode(buffer: ByteBuffer) : ApbStaticUpdateObjectsMessage;
	decode64(buffer: string) : ApbStaticUpdateObjectsMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbStaticReadObjects {
	
		

transaction?: ApbStartTransaction;
		

getTransaction?() : ApbStartTransaction;
		setTransaction?(transaction : ApbStartTransaction): void;
		



objects?: ApbBoundObject[];
		

getObjects?() : ApbBoundObject[];
		setObjects?(objects : ApbBoundObject[]): void;
		



}
	
	export interface ApbStaticReadObjectsMessage extends ApbStaticReadObjects {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbStaticReadObjectsBuilder {
	new(data?: ApbStaticReadObjects): ApbStaticReadObjectsMessage;
	decode(buffer: ArrayBuffer) : ApbStaticReadObjectsMessage;
	decode(buffer: ByteBuffer) : ApbStaticReadObjectsMessage;
	decode64(buffer: string) : ApbStaticReadObjectsMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbStartTransactionResp {
	
		

success?: boolean;
		

getSuccess?() : boolean;
		setSuccess?(success : boolean): void;
		



transaction_descriptor?: ByteBuffer;
		

getTransactionDescriptor?() : ByteBuffer;
		setTransactionDescriptor?(transactionDescriptor : ByteBuffer): void;
		



errorcode?: number;
		

getErrorcode?() : number;
		setErrorcode?(errorcode : number): void;
		



}
	
	export interface ApbStartTransactionRespMessage extends ApbStartTransactionResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbStartTransactionRespBuilder {
	new(data?: ApbStartTransactionResp): ApbStartTransactionRespMessage;
	decode(buffer: ArrayBuffer) : ApbStartTransactionRespMessage;
	decode(buffer: ByteBuffer) : ApbStartTransactionRespMessage;
	decode64(buffer: string) : ApbStartTransactionRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbReadObjectResp {
	
		

counter?: ApbGetCounterResp;
		

getCounter?() : ApbGetCounterResp;
		setCounter?(counter : ApbGetCounterResp): void;
		



set?: ApbGetSetResp;
		

getSet?() : ApbGetSetResp;
		setSet?(set : ApbGetSetResp): void;
		



reg?: ApbGetRegResp;
		

getReg?() : ApbGetRegResp;
		setReg?(reg : ApbGetRegResp): void;
		



mvreg?: ApbGetMVRegResp;
		

getMvreg?() : ApbGetMVRegResp;
		setMvreg?(mvreg : ApbGetMVRegResp): void;
		



int?: ApbGetIntegerResp;
		

getInt?() : ApbGetIntegerResp;
		setInt?(int : ApbGetIntegerResp): void;
		



map?: ApbGetMapResp;
		

getMap?() : ApbGetMapResp;
		setMap?(map : ApbGetMapResp): void;
		



}
	
	export interface ApbReadObjectRespMessage extends ApbReadObjectResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbReadObjectRespBuilder {
	new(data?: ApbReadObjectResp): ApbReadObjectRespMessage;
	decode(buffer: ArrayBuffer) : ApbReadObjectRespMessage;
	decode(buffer: ByteBuffer) : ApbReadObjectRespMessage;
	decode64(buffer: string) : ApbReadObjectRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbReadObjectsResp {
	
		

success?: boolean;
		

getSuccess?() : boolean;
		setSuccess?(success : boolean): void;
		



objects?: ApbReadObjectResp[];
		

getObjects?() : ApbReadObjectResp[];
		setObjects?(objects : ApbReadObjectResp[]): void;
		



errorcode?: number;
		

getErrorcode?() : number;
		setErrorcode?(errorcode : number): void;
		



}
	
	export interface ApbReadObjectsRespMessage extends ApbReadObjectsResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbReadObjectsRespBuilder {
	new(data?: ApbReadObjectsResp): ApbReadObjectsRespMessage;
	decode(buffer: ArrayBuffer) : ApbReadObjectsRespMessage;
	decode(buffer: ByteBuffer) : ApbReadObjectsRespMessage;
	decode64(buffer: string) : ApbReadObjectsRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbCommitResp {
	
		

success?: boolean;
		

getSuccess?() : boolean;
		setSuccess?(success : boolean): void;
		



commit_time?: ByteBuffer;
		

getCommitTime?() : ByteBuffer;
		setCommitTime?(commitTime : ByteBuffer): void;
		



errorcode?: number;
		

getErrorcode?() : number;
		setErrorcode?(errorcode : number): void;
		



}
	
	export interface ApbCommitRespMessage extends ApbCommitResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbCommitRespBuilder {
	new(data?: ApbCommitResp): ApbCommitRespMessage;
	decode(buffer: ArrayBuffer) : ApbCommitRespMessage;
	decode(buffer: ByteBuffer) : ApbCommitRespMessage;
	decode64(buffer: string) : ApbCommitRespMessage;
	
}
	
}


declare module AntidotePB {
	
	export interface ApbStaticReadObjectsResp {
	
		

objects?: ApbReadObjectsResp;
		

getObjects?() : ApbReadObjectsResp;
		setObjects?(objects : ApbReadObjectsResp): void;
		



committime?: ApbCommitResp;
		

getCommittime?() : ApbCommitResp;
		setCommittime?(committime : ApbCommitResp): void;
		



}
	
	export interface ApbStaticReadObjectsRespMessage extends ApbStaticReadObjectsResp {
	toArrayBuffer(): ArrayBuffer;
	encode(): ByteBuffer;
	encodeJSON(): string;
	toBase64(): string;
	toString(): string;
}

export interface ApbStaticReadObjectsRespBuilder {
	new(data?: ApbStaticReadObjectsResp): ApbStaticReadObjectsRespMessage;
	decode(buffer: ArrayBuffer) : ApbStaticReadObjectsRespMessage;
	decode(buffer: ByteBuffer) : ApbStaticReadObjectsRespMessage;
	decode64(buffer: string) : ApbStaticReadObjectsRespMessage;
	
}
	
}


declare module AntidotePB {
	export const enum CRDT_type {
		COUNTER = 3,
		ORSET = 4,
		LWWREG = 5,
		MVREG = 6,
		INTEGER = 7,
		GMAP = 8,
		AWMAP = 9,
		RWSET = 10,
		
}
}


