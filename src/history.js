class History {
    constructor() {
        this.data = [];
    }

    forward(input) {
        this.data.push(input);
    }

    back() {
        this.data.splice(-1);
    }

    clear() {
        this.data.length = 0;
    }
}
exports.History = History;
