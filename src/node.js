const { Pattern } = require("./pattern.js");

class Node {
    constructor(pattern, handler) {
        const [value, label] = Array.isArray(pattern) ? pattern : [pattern];
        if (value) {
            this.value = value;
            this.pattern = new Pattern(value);
        }

        if (label) this.label = label;

        this.handler = (typeof handler === "function" && handler) || ((req, res) => res.send());

        const message = typeof handler === "string" && handler;
        if (message) this.message = message;

        this.parent = null;
        Object.defineProperty(this, "parent", { configurable: true, enumerable: false, writable: true });

        this.children = [];
    }

    /**
     * @param {Node} child
     * @returns {Node}
     */
    add(child) {
        child.parent = this;

        this.children.push(child);

        return child;
    }

    getMenu(menuCompareFn) {
        if (!menuCompareFn) {
            menuCompareFn = (a, b) => {
                const aValue = Number(a.value);
                const bValue = Number(b.value);

                if (aValue === 0) return 1;
                if (bValue === 0) return -1;

                return aValue - bValue;
            };
        }
        return this.children
            .filter(({ label }) => label)
            .toSorted(menuCompareFn)
            .map(({ value, label }) => [value, label].join(" "))
            .join("\n");
    }

    setMessage(message) {
        this.message = message;
    }
}
module.exports.Node = Node;
