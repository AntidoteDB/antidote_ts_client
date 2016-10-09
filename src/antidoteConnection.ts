///<reference path="../typings/globals/node/index.d.ts" />
/// <reference path="antidote_proto.d.ts" />
/// <reference path="../typings/globals/protobufjs/index.d.ts" />
// /// <reference path="../typings/globals/es6-promise/index.d.ts" />

"use strict"

import net = require("net")
import {MessageCodes} from "./messageCodes"
var ProtoBuf = require("protobufjs")
var ByteBuffer = ProtoBuf.ByteBuffer


interface ApbRequest {
	resolve: (any) => void,
	reject: (any) => void,
}

export class AntidoteConnection {
	private socket: net.Socket
	private requests: ApbRequest[] = [];
	private buffer: ByteBuffer = new ByteBuffer();

	constructor(port: number, host: string) {
		let socket = this.socket = net.createConnection(port, host);
		socket.on("connect", () => this.onConnect())
		socket.on("data", (data) => this.onData(data));
		socket.on("close", (hasError) => this.onClose(hasError));
		socket.on("timeout", () => this.onTimeout());
	}

	public close() {
		this.socket.destroy()
	}

	private onConnect() {
		// TODO console.log("connected")
	}

	private onData(data: Buffer) {
		this.buffer.append(data);
		this.buffer.flip();
		this.readMessagesFromBuffer()
	}

	private readMessagesFromBuffer() {
		let buffer = this.buffer
		while (buffer.remaining() >= 4) {
			buffer.mark()
			var messageLength = buffer.readUint32();

			// See if we have the complete message
			if (buffer.remaining() >= messageLength) {
				// We have a complete message from riak
				var slice = buffer.slice(undefined, buffer.offset + messageLength);
				var code = slice.readUint8();

				// Our fun API does some creative things like ... returning only
				// a code, with 0 bytes following. In those cases we want to set
				// decoded to null.
				var decoded = null;
				if (messageLength > 1) {
					var ResponseProto = MessageCodes.messageCodeToProto(code)
					// GH issue #45
					// Must use 'true' as argument to force copy of data
					// otherwise, subsequent fetches will clobber data
					decoded = ResponseProto.decode(slice.toBuffer(true));
				}

				this.handleResponse(code, decoded);
				// protobufArray[protobufArray.length] = { msgCode: code, protobuf: decoded };
				// skip past message in buffer
				buffer.skip(messageLength);
				// recursively call this until we are out of messages
			} else {
				// rewind the offset
				buffer.reset();
				break;
			}
		}
		// ByteBuffer's 'flip()' effectively clears the buffer which we don't
		// want. We want to flip while preserving anything in the buffer and
		// compact if necessary.

		var newOffset = buffer.remaining();
		// Compact if necessary
		if (newOffset > 0 && buffer.offset !== 0) {
			buffer.copyTo(buffer, 0);
		}
		buffer.offset = newOffset;
		buffer.limit = buffer.capacity();
	}

	private handleResponse(code: number, decoded: any) {
		let request = this.requests.shift();
		request.resolve(decoded)
	}



	private onClose(hasError: boolean) {
		// TODO console.log(`onClose ${hasError}`)
	}

	private onError(err: Error) {
		console.log(`onError ${err}`)
	}

	private onTimeout() {
		console.log("onTimeout")
	}

	public sendRequest(messageCode: number, encodedMessage: Buffer): Promise<any> {
		return new Promise((resolve, reject) => {
			let header = new Buffer(5);
			header.writeInt32BE(encodedMessage.length + 1, 0);
			header.writeUInt8(messageCode, 4);
			this.socket.write(header)
			this.socket.write(encodedMessage)

			this.requests.push({
				resolve: resolve,
				reject: reject
			})
		})
	}

}