declare module "fastbitset" {
    /**
 * FastBitSet.js : a fast bit set implementation in JavaScript.
 * (c) the authors
 * Licensed under the Apache License, Version 2.0.
 *
 * Speed-optimized BitSet implementation for modern browsers and JavaScript engines.
 *
 * A BitSet is an ideal data structure to implement a Set when values being stored are
 * reasonably small integers. It can be orders of magnitude faster than a generic set implementation.
 * The FastBitSet implementation optimizes for speed, leveraging commonly available features
 * like typed arrays.
 *
 * Simple usage :
 *  // var FastBitSet = require("fastbitset");// if you use node
 *  var b = new FastBitSet();// initially empty
 *  b.add(1);// add the value "1"
 *  b.has(1); // check that the value is present! (will return true)
 *  b.add(2);
 *  console.log(""+b);// should display {1,2}
 *  b.add(10);
 *  b.array(); // would return [1,2,10]
 *
 *  var c = new FastBitSet([1,2,3,10]); // create bitset initialized with values 1,2,3,10
 *  c.difference(b); // from c, remove elements that are in b
 *  var su = c.union_size(b);// compute the size of the union (bitsets are unchanged)
 * c.union(b); // c will contain all elements that are in c and b
 * var s1 = c.intersection_size(b);// compute the size of the intersection (bitsets are unchanged)
 * c.intersection(b); // c will only contain elements that are in both c and b
 * c = b.clone(); // create a (deep) copy of b and assign it to c.
 * c.equals(b); // check whether c and b are equal
 *
 *   See README.md file for a more complete description.
 *
 * You can install the library under node with the command line
 *   npm install fastbitset
 */

// you can provide an iterable
namespace FastBitSet {

}
class FastBitSet {
    constructor(iterable: Iterable<number>);

    // Add the value (Set the bit at index to true)
        add(index: number): void;

    // If the value was not in the set, add it, otherwise remove it (flip bit at index)
        flip(index: number): void;

    // Remove all values, reset memory usage
        clear(): void;

    // Set the bit at index to false
        remove(index: number): void;

    // Return true if no bit is set
        isEmpty(index: number): boolean;

    // Is the value contained in the set? Is the bit at index true or false? Returns a boolean
        has(index:number): boolean;

    // Tries to add the value (Set the bit at index to true), return 1 if the
    // value was added, return 0 if the value was already present
        checkedAdd(index: number): number;


    // Reduce the memory usage to a minimum
        trim(index: number): void;


    // Resize the bitset so that we can write a value at index
        resize(index: number): void;

    // fast function to compute the Hamming weight of a 32-bit unsigned integer
        hammingWeight(v: number): number;


    // fast function to compute the Hamming weight of four 32-bit unsigned integers
        hammingWeight4(v1: number, v2: number, v3: number, v4: number): number;

    // How many values stored in the set? How many set bits?
        size(): number;

    // Return an array with the set bit locations (values)
        array(): number[];


    // Return an array with the set bit locations (values)
        forEach(fnc: (e: number) => void): void;

    // Creates a copy of this bitmap
        clone(): FastBitSet;

    // Check if this bitset intersects with another one,
    // no bitmap is modified
        intersects(otherBitmap: FastBitSet): boolean;

    // Computes the intersection between this bitset and another one,
    // the current bitmap is modified  (and returned by the function)
        intersection(otherBitmap: FastBitSet): FastBitSet;

    // Computes the size of the intersection between this bitset and another one
        intersection_size(otherBitmap: FastBitSet): number;

    // Computes the intersection between this bitset and another one,
    // a new bitmap is generated
        new_intersection(otherBitmap: FastBitSet): FastBitSet;

    // Computes the intersection between this bitset and another one,
    // the current bitmap is modified
        equals(otherBitmap: FastBitSet): boolean;

    // Computes the difference between this bitset and another one,
    // the current bitset is modified (and returned by the function)
        difference(otherBitmap: FastBitSet): FastBitSet;

    // Computes the size of the difference between this bitset and another one
        difference_size(otherbitmap: FastBitSet): number;

        // Returns a string representation
        toString(): string;

        // Computes the union between this bitset and another one,
        // the current bitset is modified  (and returned by the function)
        union(otherBitmap: FastBitSet): FastBitSet;

        new_union(otherBitmap: FastBitSet): FastBitSet;

        // Computes the difference between this bitset and another one,
        // a new bitmap is generated
        new_difference(otherBitmap: FastBitSet): FastBitSet;

        // Computes the size union between this bitset and another one
        union_size(otherBitmap: FastBitSet): number;
    }

    ///////////////

    export = FastBitSet;
}