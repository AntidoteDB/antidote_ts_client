import * as assert from 'assert';
/// <reference types="mocha" />
import { AntidoteConnection } from "./antidoteConnection"
// import '../proto/antidote_proto'
import { Connection, Transaction, connect, CrdtSet, CrdtCounter } from "./antidote"
import ByteBuffer = require("bytebuffer")
import http = require('http');
import fs = require('fs');
var Long = require("long");


describe("antidote client", function () {
	// 60 second timeout, because travis sometimes needs longer
	let timeout = 60000
	this.timeout(timeout)
	let connection: Connection;

	before(() => {
		connection = connect(8087, "localhost");
		// use random buckets, so that we can rerun the tests without cleaning and restarting antidote
		connection.defaultBucket = "testbucket" + Math.random();
		connection.setTimeout(timeout);
	});


	describe('counters', () => {
		it('should count', async () => {
			let counter = connection.counter("myCounter")
			await connection.update(
				counter.increment(3)
			)
			let val = await counter.read();
			assert.equal(val, 3);
		});
	});

	describe('integers', () => {
		it('can be incremented and assigned to', async () => {
			let num = connection.integer("myint")
			await connection.update(
				num.set(40)
			)
			await connection.update(
				num.increment(2)
			)
			let val = await num.read();
			assert.equal(val, 42);
		});
	});


	describe('last-writer-wins register', () => {
		it('can be used to store and read values', async () => {
			let reg = connection.register<string[]>("mylwwreg")
			await connection.update(
				reg.set(["a", "b"])
			)
			let val = await reg.read();
			assert.deepEqual(val, ["a", "b"]);
		});
	});

	describe('multi-value register', async () => {
		it('can be used to store and read values', async () => {
			let reg = connection.multiValueRegister<number>("mymvreg")
			await connection.update(
				reg.set(15)
			)
			let val = await reg.read();
			assert.deepEqual(val, [15]);
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
			it('can be used to add elements', async () => {
				let set = setType.create(`${setType.name}-set1`)
				await connection.update([
					set.add("x"),
					set.addAll(["y", [1, 2, 3]])
				])
				let val = await set.read();
				assert.deepEqual(val, [[1, 2, 3], "x", "y"]);
			});

			it('should work with add and remove', async () => {
				let set = setType.create<string>(`${setType.name}-set2`)
				await connection.update(
					set.addAll(["a", "b", "c", "d", "e"])
				)
				await connection.update([
					set.remove("a"),
					set.removeAll(["b", "c"])
				])
				let val = await set.read();
				assert.deepEqual(val, ["d", "e"]);
			});
		});
	}

	describe('grow-only map', () => {

		it('should be possible to store things', async () => {
			let map = connection.gmap("my-gmap");
			await connection.update([
				map.register("a").set("x"),
				map.counter("b").increment(5)
			])
			let val = await map.read();
			let obj = val.toJsObject();
			assert.deepEqual(obj, { a: "x", b: 5 });
		});
	});

	describe('add-wins map', () => {

		it('should be possible to store things', async () => {
			let map = connection.map("my-map1");
			await connection.update([
				map.register("a").set("x"),
				map.counter("b").increment(5)
			])
			let val = await map.read();
			let obj = val.toJsObject();
			assert.deepEqual(obj, { a: "x", b: 5 });
		});

		it('should be possible to store and then remove things', async () => {
			let map = connection.map("my-map2");
			await connection.update([
				map.register("a").set("x"),
				map.register("b").set("x"),
				map.register("c").set("x"),
				map.register("d").set("x"),
				map.set("e").addAll([1, 2, 3, 4]),
				map.counter("f").increment(5)
			])
			await connection.update([
				map.remove(map.register("a")),
				map.removeAll([map.register("b"), map.register("c")])
			])
			let val = await map.read();
			let obj = val.toJsObject();
			assert.deepEqual(obj, { d: "x", e: [1, 2, 3, 4], f: 5 });
		});
	});

	describe('transactions', () => {
		it('can read and update', async () => {
			let tx = await connection.startTransaction()
			let reg = tx.multiValueRegister<number>("tr-reg");
			let vals = await reg.read();
			let max = 0
			for (let n of vals) {
				if (n > max) {
					max = n;
				}
			}
			await tx.update(
				reg.set(max + 1)
			)
			await tx.commit()

			let reg2 = connection.multiValueRegister<number>("tr-reg");
			let vals2 = await reg2.read()
			assert.deepEqual(vals2, [1]);
		})

		it('can do batch-reads', async () => {
			let a = connection.counter("batch-read-counter-a")
			let b = connection.counter("batch-read-counter-b")
			let c = connection.counter("batch-read-counter-c")
			await connection.update([
				a.increment(1),
				b.increment(2),
				c.increment(3)
			]);
			let vals = await connection.readBatch([a,b,c]); 
			vals.sort(); // TODO remove this when order is fixed in Antidote
			assert.deepEqual(vals, [1,2,3]);
		});
	});

});




