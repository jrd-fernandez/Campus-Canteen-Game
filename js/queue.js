
// Queue Data Structure
// First In, First Out (FIFO)

class Queue {

    constructor() {
        this.items = [];
    }

    // Add a customer at the rear
    enqueue(customer) {
        this.items.push(customer);
    }

    // Remove the customer at the front
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        return this.items.shift();
    }

    // Get the customer at the front
    peek() {
        if (this.isEmpty()) {
            return null;
        }

        return this.items[0];
    }

    // Get the customer at the rear
    rear() {
        if (this.isEmpty()) {
            return null;
        }

        return this.items[this.items.length - 1];
    }

    // Check if the queue is empty
    isEmpty() {
        return this.items.length === 0;
    }

    // Get the number of customers
    size() {
        return this.items.length;
    }

    // Check if the queue is full
    isFull(limit = 6) {
        return this.items.length >= limit;
    }

    // Get all customers
    getItems() {
        return [...this.items];
    }

    // Clear the entire queue
    clear() {
        this.items = [];
    }

    

}
