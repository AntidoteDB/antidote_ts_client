import {AntidoteConnection} from "./antidoteConnection" 
import {Connection, Transaction, connect, key} from "./antidote" 
import http = require('http');
import fs = require('fs');
var Long = require("long");


let connection = connect(8087, "localhost");

async function testAntidote() {
	let tx: Transaction = await connection.startTransaction()
	console.log(`Started transaction ${tx}`)

	let testKey: AntidotePB.ApbBoundObject = key("testKey", AntidotePB.CRDT_type.COUNTER, "myBucket")

	await tx.updateObject(testKey, {counterop: {inc: new Long(1)}})

	let counterValue = await tx.readValue(testKey)
	console.log(`counter value = ${counterValue}.`)

	
	await tx.commit()
}

let test = testAntidote()

test.catch((err) => {
	console.log(`Error: ${err}`)
})
test.then(() => {
	connection.close()
})





