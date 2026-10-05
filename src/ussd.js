const EventEmitter = require("events");
const { USSDNode } = require("./node.js");

/**
 * @typedef USSDOptions
 * @property {Object<string, USSDNode>} navigation
 * @property {Number} [messageLength=120]
 * @property {Function} menuCompareFn
 * @property {USSDNode} timeout
 * @property {Number} [timeoutMs=60_000]
 */

class USSD extends EventEmitter {
    /**
     * @param {USSDNode[]} routes
     * @param {USSDOptions} options
     */
    constructor(routes, options = {}) {
        super();
        this.setMaxListeners(0);

        const { navigation, messageLength = 120, menuCompareFn, timeout, timeoutMs = 60_000 } = options;

        this.originalRoutes = routes;
        this.routes = this.cloneRoutes(this.originalRoutes);
        this.navigation = navigation;
        this.messageLength = messageLength;
        this.menuCompareFn = menuCompareFn;
        this.timeout = timeout;
        this.timeoutMs = timeoutMs;

        this.inputs = [];
    }

    cloneRoutes(routes) {
        return routes.map((route) => this.cloneNode(route));
    }

    cloneNode(route) {
        const node = new USSDNode([route.value, route.label], route.handler);
        for (const child of route.children) {
            node.add(this.cloneNode(child));
        }
        return node;
    }

    split(message, length = this.messageLength) {
        const parts = [];
        let buff = "";
        for (const word of message.split(" ")) {
            const part = buff ? buff + " " + word : word;
            if (part.length > length) {
                parts.push(buff);
                buff = word;
            } else {
                buff = part;
            }
        }
        if (buff) parts.push(buff);
        return parts;
    }

    /**
     * @param {USSDNode} node
     * @param {String} message
     * @returns {USSDNode}
     */
    paginate(node, message) {
        const parts = this.split(message);

        node.setMessage(parts[0]);

        const total = parts.length;
        if (total > 1) {
            if (!node.clonedChildren) {
                node.clonedChildren = [...node.children];
            }
            node.children.length = 0;

            node.add(this.navigation.quit);

            let curr = node;
            for (let i = 1; i < total; i++) {
                const node = curr.add(new USSDNode([this.navigation.next.value, this.navigation.next.label], parts[i]));
                node.add(this.navigation.prev);
                node.add(this.navigation.quit);
                curr = node;
            }

            for (const child of node.clonedChildren) {
                curr.add(child);
            }
        }

        return node;
    }

    setRoute(req) {
        let routes = this.routes;
        for (const input of this.inputs) {
            let matched = null;
            for (const route of routes) {
                const match = route.pattern.exec(input);
                if (match) {
                    matched = route;
                    req.params = { ...req.params, ...match.pathname.groups };
                    break;
                }
            }

            if (!matched) {
                this.inputs.splice(-1);
                continue;
            }

            this.route = matched;
            routes = matched.children;
        }
    }

    setTimeout(req, res) {
        this.clearTimeout();
        this.requestTimeout = setTimeout(async () => {
            this.route = this.timeout;
            await this.route.handler(req, res);
        }, this.timeoutMs);
    }

    clearTimeout() {
        clearTimeout(this.requestTimeout);
    }

    async resolve(req, res) {
        this.setRoute(req);

        this.setTimeout(req, res);

        res.send = (message) => {
            const arr = [];

            if (message) this.paginate(this.route, message);

            if (this.route.message) arr.push(this.route.message);

            const menu = this.route.getMenu(this.menuCompareFn);
            if (menu) arr.push(menu);

            this.emit("response", arr.join("\n"));
        };

        res.back = async () => {
            this.inputs.splice(-2);

            await this.resolve(req, res);
        };

        res.end = async (message) => {
            this.clearTimeout();
            res.send(message);
            this.route = null;
            this.routes = this.cloneRoutes(this.originalRoutes);
            this.inputs.length = 0;
        };

        await this.route.handler(req, res);
    }

    async request(input) {
        const req = { params: {} };
        const res = {};

        const inputs = input.match(/^\*?(.*?)#?$/)[1].split("*");
        if (inputs.length > 1) this.inputs = inputs;
        else this.inputs.push(inputs[0]);

        await this.resolve(req, res);
    }
}

module.exports = {
    USSDNode,
    USSD,
};
