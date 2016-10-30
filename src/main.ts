import {AntidoteConnection} from "./antidoteConnection"
import '../proto/antidote_proto' 
import {Connection, Transaction, connect, key, CrdtSet, CrdtCounter} from "./antidote" 
import ByteBuffer = require("bytebuffer")
import http = require('http');
import fs = require('fs');
var Long = require("long");


let connection = connect(8087, "localhost");

function testAntidote(): Promise<any> {
	let txPromise = connection.startTransaction();
	return txPromise.then(tx => {
		let testKey = tx.counter("testKey");
		tx.update(testKey.increment(1));
		return testKey.read().then(counterValue => {
			console.log(`counter value = ${counterValue}.`);
			return tx.commit()
		});
	})
}

function testAntidote2(): Promise<any> {
	let counter = connection.counter("testKey");
	return connection.update(counter.increment(1)).then(r => {
		return counter.read();
	}).then(counterValue => {
		console.log(`counter value = ${counterValue}.`);
	})
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

function friendshipExample(): Promise<any> {
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
	return Promise.all([alice, bob, charlie].map(user => {
		let set = friendSet(user.id)
		return set.read().then(vals => {
			return connection.update(set.removeAll(vals))
		})
	})).then(_ => Promise.all([
		makeFriends(alice, bob),
		makeFriends(bob, charlie)
	])).then(_ => {
		return connection.read([
			friendSet(alice.id),
			friendSet(bob.id),
			friendSet(charlie.id)
		])
	}).then(resp => {
		console.log(`Alice is friends with ${JSON.stringify(resp[0])}`)
		console.log(`Bob is friends with ${JSON.stringify(resp[1])}`)
		console.log(`Charlie is friends with ${JSON.stringify(resp[2])}`)
		return 0;
	})
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





