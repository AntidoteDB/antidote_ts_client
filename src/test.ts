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

	describe('integers', () => {
		it('can be incremented and assigned to', () => {
			let num = connection.integer("myint")
			return connection.update(
				num.set(40)
			).then(() => connection.update(
				num.increment(2)
			)).then(() => {
				return num.read();
			}).then(val => {
				assert.equal(val, 42);
			});
		});
	});

	
	describe('last-writer-wins register', () => {
		it('can be used to store and read values', () => {
			let reg = connection.register<string[]>("mylwwreg")
			return connection.update(
				reg.set(["a", "b"])
			).then(() => {
				return reg.read();
			}).then(val => {
				assert.deepEqual(val, ["a", "b"]);
			});
		});
	});

	describe('multi-value register', () => {
		it('can be used to store and read values', () => {
			let reg = connection.multiValueRegister<number>("mymvreg")
			return connection.update(
				reg.set(15)
			).then(() => {
				return reg.read();
			}).then(val => {
				assert.deepEqual(val, [15]);
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

	describe('grow-only map', () => {

		it('should be possible to store things', () => {
			let map = connection.gmap("my-gmap");
			return connection.update([
				map.register("a").set("x"),
				map.counter("b").increment(5)
			]).then(() => {
				return map.readMapValue();
			}).then(val => {
				let obj = val.toJsObject();
				assert.deepEqual(obj, {a: "x", b: 5});
			})

		});
	});

	describe('add-wins map', () => {

		it('should be possible to store things', () => {
			let map = connection.map("my-map1");
			return connection.update([
				map.register("a").set("x"),
				map.counter("b").increment(5)
			]).then(() => {
				return map.readMapValue();
			}).then(val => {
				let obj = val.toJsObject();
				assert.deepEqual(obj, {a: "x", b: 5});
			})

		});

		it('should be possible to store and then remove things', () => {
			let map = connection.map("my-map2");
			return connection.update([
				map.register("a").set("x"),
				map.register("b").set("x"),
				map.register("c").set("x"),
				map.register("d").set("x"),
				map.set("e").addAll([1,2,3,4]),
				map.counter("f").increment(5)
			]).then(() => connection.update([
				map.remove(map.register("a")),
				map.removeAll([map.register("b"), map.register("c")])
			])).then(() => {
				return map.readMapValue();
			}).then(val => {
				let obj = val.toJsObject();
				assert.deepEqual(obj, {d: "x", e: [1,2,3,4], f: 5});
			})

		});
	});

	describe('transactions', () => {
		it('can read and update', () => {
			 
			return connection.startTransaction().then(tx => {
				let reg = tx.multiValueRegister<number>("tr-reg");
				return reg.read().then((vals: number[]) => {
					let max = 0
					for (let n of vals) {
						if (n > max) {
							max = n;
						}
					}
					return max;
				}).then(n => tx.update(
					reg.set(n + 1)
				)).then(_ => 
					tx.commit()
				)
			}).then(_ => {
				let reg = connection.multiValueRegister<number>("tr-reg");
				return reg.read()
			}).then(vals => {
				assert.deepEqual(vals, [1]);
			})
		})
	});

});




