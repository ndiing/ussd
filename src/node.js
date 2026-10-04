
const { isFunction, isString } = require("./util");
const { USSDPattern } = require("./pattern");

/**
 * @typedef USSDRequest
 * @property {Object} params
 */
/**
 * @typedef USSDResponse
 * @property {Function} send
 */
/**
 * @callback USSDHandler
 * @property {USSDRequest} req
 * @property {USSDResponse} res
 */
class USSDNode {
    // value
    // pattern
    // label
    // handler
    // text
    // parent
    // children
    /**
     * @param {String|Array} pattern
     * @param {USSDHandler|String} handler
     */
    constructor(pattern, handler) {
        const [value, label] = Array.isArray(pattern) ? pattern : [pattern];
        this.value = value;
        this.pattern = new USSDPattern(value);

        if (label) this.label = label;

        this.handler = (isFunction(handler) && handler) || ((req, res) => res.send());

        const text = (isString(handler) && handler) || null;
        if (text !== null) this.text = text;

        this.parent = null;
        this.children = [];

        Object.defineProperty(this, "parent", { configurable: true, enumerable: false, writable: true });
    }

    /**
     * @param {USSDNode} child
     * @returns {USSDNode}
     */
    add(child) {
        child.parent = this;

        this.children.push(child);

        return child;
    }

    /**
     * @param {String} text
     */
    setText(text) {
        this.text = text;
    }

    /**
     * @returns {String}
     */
    getMenu() {
        return this.children
            .filter(({ label }) => label)
            .toSorted((a, b) => {
                const aValue = Number(a.value);
                const bValue = Number(b.value);

                if (aValue === 0) return 1;
                if (bValue === 0) return -1;

                return aValue - bValue;
            })
            .map(({ value, label }) => [value, label].join(" "))
            .join("\n");
    }
}

module.exports={USSDNode}