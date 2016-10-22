import * as assert from 'assert';
/// <reference types="mocha" />
import { AntidoteConnection } from "./antidoteConnection"
// import '../proto/antidote_proto'
import { Connection, Transaction, connect, key, CrdtSet, CrdtCounter } from "./antidote"
import ByteBuffer = require("bytebuffer")
import http = require('http');
import fs = require('fs');
var Long = require("long");


describe("antidote client", () => {
	let connection: Connection;

	before(() => {
		connection = connect(8087, "localhost");
		// use random buckets, so that we can rerun the tests without cleaning and restarting antidote
		connection.defaultBucket = "testbucket" + Math.random();
	});


	describe('counters', () => {
		it('should count', () => {
			let counter = connection.counter("myCounter")
			return connection.update(
				counter.increment(3)
			).then(() => {
				return counter.read();
			}).then(val => {
				assert.equal(val, 3);
			});
		});
	});

	let setTypes = [
		{
			name: 'add-wins', 
			create: <T>(name: string) => connection.set<T>(name)
		},
		{
			name: 'remove-wins', 
			create: <T>(name: string) => connection.set_removeWins<T>(name)
		}
	]
	for (let setType of setTypes) {
		describe(`${setType.name}-sets`, () => {
			it('can be used to add elements', () => {
				let set = setType.create(`${setType.name}-set1`)
				return connection.update([
					set.add("x"),
					set.addAll(["y", [1, 2, 3]])
				]).then(() => {
					return set.read();
				}).then(val => {
					assert.deepEqual(val, [[1,2,3], "x", "y"]);
				});
			});

			it('should work with add and remove', () => {
				let set = setType.create<string>(`${setType.name}-set2`)
				return connection.update(
					set.addAll(["a", "b", "c", "d", "e"])
				).then(() => connection.update([
					set.remove("a"),
					set.removeAll(["b", "c"])
				])).then(() => {
					return set.read();
				}).then(val => {
					assert.deepEqual(val, ["d", "e"]);
				});
			});
		});
	}



});




