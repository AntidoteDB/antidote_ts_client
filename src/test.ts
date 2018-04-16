import * as assert from 'assert';
import "mocha";
import { AntidoteConnection } from "./antidoteConnection"
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

	let counterImpls = [
		{ name: "counter", create: (name: string) => connection.counter(name) },
		{ name: "fat-counter", create: (name: string) => connection.fatCounter(name) },
	];
	for (let impl of counterImpls) {
		describe(impl.name, () => {
			it('should count', async () => {
				let counter = impl.create(`my${impl.name}`)
				await connection.update(
					counter.increment(3)
				)
				let val = await counter.read();
				assert.equal(val, 3);
			});

			it('should be able to decrement', async () => {
				let counter = impl.create(`my${impl.name}_dec`)
				await connection.update(
					counter.increment(-1)
				)
				let val = await counter.read();
				assert.equal(val, -1);
			});
		});
	}

	describe('fat-counters', () => {
		it('should count', async () => {
			let counter = connection.fatCounter("myFatCounter")
			await connection.update(
				counter.increment(3)
			)
			let val = await counter.read();
			assert.equal(val, 3);
		});
	});

	describe('flags', () => {
		it('can be set', async () => {
			let flag = connection.flag_ew("my_flag_ew")
			assert.equal(await flag.read() , false);
			await connection.update(
				flag.set(true)
			)
			assert.equal(await flag.read() , true);
			await connection.update(
				flag.set(false)
			)
			assert.equal(await flag.read() , false);
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


	describe('remove-resets map', () => {

		it('should be possible to store things', async () => {
			let map = connection.rrmap("my-rrmap1");
			await connection.update([
				map.register("a").set("x"),
				map.counter("b").increment(5)
			])
			let val = await map.read();
			let obj = val.toJsObject();
			assert.deepEqual(obj, { a: "x", b: 5 });
		});

		it('should be possible to store and then remove things', async () => {
			let map = connection.rrmap("my-rrmap2");
			await connection.update([
				map.multiValueRegister("a").set("x"),
				map.multiValueRegister("b").set("x"),
				map.multiValueRegister("c").set("x"),
				map.multiValueRegister("d").set("x"),
				map.set("e").addAll([1, 2, 3, 4]),
				map.counter("f").increment(5)
			])
			await connection.update([
				map.remove(map.multiValueRegister("a")),
				map.removeAll([map.multiValueRegister("b"), map.multiValueRegister("c")])
			])
			let val = await map.read();
			let obj = val.toJsObject();
			assert.deepEqual(obj, { d: ["x"], e: [1, 2, 3, 4], f: 5 });
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

		it('can abort transaction', async () => {
			let tx = await connection.startTransaction()
			let reg = tx.multiValueRegister<number>("tr-reg2");
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
			await tx.abort()

			// no change:
			let reg2 = connection.multiValueRegister<number>("tr-reg2");
			let vals2 = await reg2.read()
			assert.deepEqual(vals2, []);
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
			let vals = await connection.readBatch([a, b, c]);
			vals.sort(); // TODO remove this when order is fixed in Antidote
			assert.deepEqual(vals, [1, 2, 3]);
		});

		it('can do big batch-reads', async () => {
			let registers = [];
			for (let i=0; i<1000; i++) {
				registers.push(connection.register(`batch-reg-${i}`))
			}
			let longStr = "a".repeat(165537);
			await connection.update(
				registers.map(r => r.set(longStr))
			);
			let vals = await connection.readBatch(registers);
			assert.equal(vals.length, registers.length);
			for (let i=0; i<1000; i++) {
				assert.equal(vals[i], longStr);
			}
		});

		it('can do batch-reads object api', async () => {
			let objA = connection.counter("batch-object-read counter a")
			let objB = connection.register<string>("batch-object-read register b")
			await connection.update([
				objA.increment(1),
				objB.set("hi")
			]);

			let vals = await connection.readObjectsBatch({
				a: objA,
				b: objB
			});
			assert.deepEqual(vals, { a: 1, b: "hi" });
		});

	});

	describe("corner cases", () => {
		it('can read empty registers', async () => {
			let x = connection.register("empty-register-1");
			let val = await x.read();
			assert.equal(val, null);
		});

		it('can write null', async () => {
			let x = connection.register<any>("null-test-register");
			await x.set(null);
			let val = await x.read();
			assert.equal(val, null);
		});

		it('can read empty registers in batch', async () => {
			let x = connection.register("empty-register-2");
			let y = connection.register("empty-register-3");
			let vals = await connection.readBatch([x, y]);
			assert.deepEqual(vals, [null, null]);
		});
	});

	// example from antidote tutorial
	describe("tutorial example", () => {
		it('tutorial example', async () => {
			let connection = connect(8087, "localhost")

			let set = connection.set("set")
			{ // Variant 1:
				let tx = await connection.startTransaction()
				await tx.update(set.remove("Java"))
				await tx.update(set.add("Kotlin"))
				await tx.commit()
			}
			{ // Variant 2: (faster: don't wait for update 1 to complete before sending update 2)
				let tx = await connection.startTransaction()
				let f1 = tx.update(set.remove("Java"))
				let f2 = tx.update(set.add("Kotlin"))
				await f1
				await f2
				await tx.commit()
			}
			{ // Variant 3: (fastest: use a static transaction / batch update)
				await connection.update([
					set.remove("Java"),
					set.add("Kotlin")])
			}

			let tx = await connection.startTransaction()
			let value = await set.read()
			await tx.update(set.add("Java"))
			await tx.commit()


			connection.defaultBucket = "user_bucket"
			let user1 = connection.set("michael")
			await connection.update(user1.addAll(["Michel", "michel@blub.org"]))
			let res = await user1.read()

		});
	});

	describe("message formats", () => {
		it('can use custom formats', async () => {
			let oldFormat = connection.dataFormat;
			connection.dataFormat = {
				jsToBinary: (obj) => ByteBuffer.fromUTF8(JSON.stringify(obj)),
				binaryToJs: (byteBuffer: ByteBuffer) => {
					if (byteBuffer.remaining() == null) {
						return null;
					}
					let str = byteBuffer.readUTF8String(byteBuffer.remaining()) as string;
					return JSON.parse(str);
				}
			}
			let x = connection.register("json-register");
			let obj = { a: 7, b: "hello" };
			await connection.update(x.set(obj))
			let obj2 = await x.read();
			assert.deepEqual(obj2, obj);
			connection.dataFormat = oldFormat;
		});
	});

});




