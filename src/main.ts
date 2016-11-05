import {AntidoteConnection} from "./antidoteConnection"
import '../proto/antidote_proto' 
import {Connection, Transaction, connect, key, CrdtSet, CrdtCounter} from "./antidote" 
import ByteBuffer = require("bytebuffer")
import http = require('http');
import fs = require('fs');
var Long = require("long");


let connection = connect(8087, "localhost");

async function testAntidote(): Promise<any> {
	let tx = await connection.startTransaction();
	let testKey = tx.counter("testKey");
	tx.update(testKey.increment(1));
	let counterValue = await testKey.read();
	console.log(`counter value = ${counterValue}.`);
	return tx.commit()
}

async function testAntidote2(): Promise<any> {
	let counter = connection.counter("testKey");
	await connection.update(counter.increment(1))
	let counterValue = await counter.read();
	console.log(`counter value = ${counterValue}.`);
}


type UserId = string;

interface User {
	id: UserId,
	name: string
}

function friendSet(userId: UserId): CrdtSet<UserId> {
	return connection.set<UserId>("friends_set_" + userId)
}

function makeFriends(userA: User, userB: User): Promise<any> {
	let friendsOfA = friendSet(userA.id)
	let friendsOfB = friendSet(userB.id)
	return connection.update([
		friendsOfA.add(userB.id),
		friendsOfB.add(userA.id)	
	])
}

async function friendshipExample(): Promise<any> {
	let alice: User = {id: "A", name: "Alice"};
	let bob: User = {id: "B", name: "Bob"};
	let charlie: User = {id: "C", name: "Charlie"};

	// // TODO reset not yet supported by antidote
	// connection.update([
	// 	friendSet(alice.id).reset(),
	// 	friendSet(bob.id).reset(),
	// 	friendSet(charlie.id).reset()
	// ])

	//reset state
	await Promise.all([alice, bob, charlie].map(async user => {
		let set = friendSet(user.id)
		let vals = await set.read()
		await connection.update(set.removeAll(vals))
	}));
	await Promise.all([
		makeFriends(alice, bob),
		makeFriends(bob, charlie)
	])
	let resp = await connection.read([
			friendSet(alice.id),
			friendSet(bob.id),
			friendSet(charlie.id)
		])
	console.log(`Alice is friends with ${JSON.stringify(resp[0])}`)
	console.log(`Bob is friends with ${JSON.stringify(resp[1])}`)
	console.log(`Charlie is friends with ${JSON.stringify(resp[2])}`)
}


let test = Promise.all([
	testAntidote(),
	testAntidote2(),
	friendshipExample()
]);


test.catch((err) => {
	console.log(`Error: ${err}`)
	connection.close()
});
test.then(() => {
	connection.close()
});





