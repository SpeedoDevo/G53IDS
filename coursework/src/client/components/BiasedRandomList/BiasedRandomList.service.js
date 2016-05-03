'use strict';

angular.module('bridgeApp')
  .service('BiasedRandomList', function () {
    class HeapNode {
      constructor(obj, weighter) {
        this.o = obj;
        this.weight = this.total = weighter(obj);
      }
    }

    class WeightedHeap {
      constructor(items, weighter) {
        this.heap = [null];

        // First put everything on the heap
        items.forEach(i => this.heap.push(new HeapNode(i, weighter)));

        // Now go through the heap and add each node's weight to its parent
        for (let i = this.heap.length - 1; i > 1; i--) {
          this.heap[i >> 1].total += this.heap[i].total;
        }
      }

      pop() {
        // Start with a random amount of gas
        let gas = this.heap[1].total * Math.random();

        // Start driving at the root node
        let i = 1;

        // While we have enough gas to keep going past i:
        while (gas > this.heap[i].weight) {
          gas -= this.heap[i].weight;     // Drive past i
          i <<= 1;                        // Move to first child
          if (gas > this.heap[i].total) {
            gas -= this.heap[i].total;    // Drive past first child and its descendants
            i++;                          // Move on to second child
          }
        }
        // Out of gas - i is our selected node.
        let value = this.heap[i].o;
        let selectedWeight = this.heap[i].weight;

        this.heap[i].weight = 0;          // Make sure i isn't chosen again
        while (i > 0) {
          // Remove the weight from its parent's total
          this.heap[i].total -= selectedWeight;
          i >>= 1;  // Move to the next parent
        }
        return value;
      }

      *gen(num) {
        let i = num;
        while (i--) {
          yield this.pop();
        }
      }
    }

    class BiasedRandomList {
      constructor(weightedObjects, weighter) {
        this.items = [];
        this.weighter = weighter || (o => typeof o.weight === 'undefined' ? 1 : o.weight);

        weightedObjects = typeof weightedObjects !== 'undefined' ? weightedObjects : [];

        weightedObjects.forEach(obj => this.push(obj));
      }

      push(obj) {
        if (typeof this.weighter(obj) !== typeof 1) {
          throw new Error('Weight must be numeric (got ' + this.weighter(obj).toString() + ')');
        }
        if (this.weighter(obj) <= 0) {
          if (this.weighter(obj) === 0) {
            return;
          }
          throw new Error('Weight must be >= 0 (got ' + this.weighter(obj) + ')');
        }

        this.items.push(obj);
      }

      get length() {
        return this.items.length;
      }

      peek(n, andRemove) {
        if (typeof n === 'undefined') {
          n = 1;
        }
        andRemove = !!andRemove;

        if (this.length - n < 0) {
          throw new Error(
            `Stack underflow! Tried to retrieve ${n} element${n === 1 ? '' : 's'} from a list of ${this.length}`
          );
        }

        let heap = new WeightedHeap(this.items, this.weighter);

        let result = [...heap.gen(n)];

        if (andRemove) {
          result.forEach(i => {
            let index = this.items.indexOf(i);
            this.items.splice(index, 1);
          });
        }

        return n === 1 ? result[0] : result;
      }

      shuffle() {
        return this.peek(this.length);
      }

      pop(n) {
        return this.peek(n, true);
      }

      *stream() {
        //noinspection InfiniteLoopJS
        while (true) {
          yield ((new WeightedHeap(this.items, this.weighter)).pop());
        }
      }
    }

    return BiasedRandomList;
  });
