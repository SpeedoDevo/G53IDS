'use strict';

angular.module('bridgeApp')
  .service('KHeap', function () {
    class KHeap {
      //k sized heap built from arr that uses comparator to compare items
      constructor(k, arr, comparator) {
        this.heap = [];
        this.k = k;
        this._sorted = [];
        this.changed = false;

        if (comparator) {
          this.comparator = comparator;
        } else {
          this.comparator = (a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
              return a - b;
            } else {
              a = a.toString();
              b = b.toString();

              if (a == b) return 0;

              return (a > b) ? 1 : -1;
            }
          }
        }
        if (arr) for (let item of arr) this.push(item);
      }

      get isEmpty() {
        return this.length === 0;
      }

      get length() {
        return this.heap.length;
      }

      push(item) {
        //puts the item on the heap
        let size = this.heap.push(item);
        let current = size - 1;

        //retain heap property
        while (current > 0) {
          let parent = Math.floor((current - 1) / 2);

          if (this.compare(current, parent) <= 0) break;

          this.swap(parent, current);
          current = parent;
        }

        //pop one if too big
        let popped = size > this.k ? this.pop() : null;
        this.changed = popped !== item;
        return popped;
      }

      pop() {
        //removes the top of the heap
        let first = this.peek();
        let last = this.heap.pop();
        let size = this.length;

        if (size === 0) return first;

        this.heap[0] = last;
        let current = 0;

        //retain heap property
        while (current < size) {
          let largest = current;
          let left = (2 * current) + 1;
          let right = (2 * current) + 2;

          if (left < size && this.compare(left, largest) >= 0) {
            largest = left;
          }

          if (right < size && this.compare(right, largest) >= 0) {
            largest = right;
          }

          if (largest === current) break;

          this.swap(largest, current);
          current = largest;
        }

        this.changed = true;
        return first;
      }

      peek() {
        //check the top
        if (this.isEmpty) throw new Error('KHeap is empty');

        return this.heap[0];
      }

      sorted() {
        //pop and then push everything, cached
        if (this.changed) {
          this._sorted = [];
          while (!this.isEmpty) {
            this._sorted.unshift(this.pop());
          }
          this._sorted.forEach(v => this.push(v));
          this.changed = false;
          return this._sorted;
        } else {
          return this._sorted;
        }
      }

      swap(i, j) {
        let temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
      }

      compare(i, j) {
        return this.comparator(this.heap[i], this.heap[j]);
      }
    }
    return KHeap;
  });
