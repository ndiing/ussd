const { History } = require("./history");
const { USSDNode } = require("./node");

/**
 * @typedef USSDNavigation
 * @property {USSDNode} back
 * @property {USSDNode} next
 * @property {USSDNode} prev
 * @property {USSDNode} quit
 */

/**
 * @typedef USSDOptions
 * @property {EventEmitter} event
 * @property {USSDNavigation} navigation
 * @property {Number} timeout - Network Timeout between 20 and 180 seconds
 */

class USSD {
    /**
     * @param {USSDNode[]} routes
     * @param {USSDOptions} options
     */
    constructor(routes, options) {
        const { event, navigation, timeout = 60_000 } = options;

        this.routes = routes;

        this.event = event;
        this.navigation = navigation;
        this.timeout = timeout;

        this.history = new History();
    }

    /**
     * @param {String} text
     * @param {Number} [length=120]
     * @returns {Array}
     */
    split(text, length = 120) {
        const parts = [];

        let buff = "";
        for (const word of text.split(" ")) {
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
     * @param {String} text
     * @returns {USSDNode}
     */
    paginate(node, text) {
        const parts = this.split(text);

        node.setText(parts[0]);

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
                if (i > 0) node.add(this.navigation.prev);
                node.add(this.navigation.quit);
                curr = node;
            }

            for (const child of node.clonedChildren) {
                child.parent = curr;
                curr.children.push(child);
            }
        }

        return node;
    }

    getMove(input) {
        let move = "next";
        for (const name in this.navigation) {
            const node = this.navigation[name];
            if (node.pattern.test(input) && this.node && this.node.children.some((child) => child.pattern.test(input))) {
                move = name;
                break;
            }
        }
        return move;
    }

    // getNode(req) {
    //     let node;
    //     let routes = [...this.routes];
    //     for (const input of this.history.data) {
    //         for (const route of routes) {
    //             const match = route.pattern.exec(input);
    //             if (match) {
    //                 node = route;
    //                 req.params = { ...req.params, ...match.pathname.groups };
    //                 break;
    //             }
    //         }

    //         if (!node) break;

    //         routes = node.children;
    //     }
    //     return node;
    // }

    getNode(req) {
        let node;
        let routes = [...this.routes];
        for (const input of this.history.data) {
            let matched = null;
            for (const route of routes) {
                const match = route.pattern.exec(input);
                if (match) {
                    matched = route;
                    req.params = { ...req.params, ...match.pathname.groups };
                    break;
                }
            }
            if (!matched) continue;
            node = matched;
            routes = matched.children;
        }
        return node;
    }

    /**
     * @param {String} input
     */
    request(input) {
        const req = { params: {} };
        const res = {};

        clearTimeout(this.requestTimeout);
        this.requestTimeout = setTimeout(() => {
            res.end("error-code1");
        }, this.timeout);

        const move = this.getMove(input);

        if (move === "back" || move === "prev") {
            this.history.back();
        } else if (move === "next" || move === "quit") {
            this.history.forward(input);
        }

        /**@type {USSDNode[]}*/
        const node = this.getNode(req);

        res.send = (text) => {
            const chunks = [];

            if (text) this.paginate(node, text);

            if (node.text) chunks.push(node.text);

            const menu = node.getMenu();
            if (menu) chunks.push(menu);

            this.event.send(chunks.join("\n"));
        };

        res.end = (text) => {
            clearTimeout(this.requestTimeout);
            this.history.clear();
            res.send(text);
        };

        node.handler(req, res);

        this.node = node;

        if (move === "quit") {
            this.history.clear();
        }
    }
}

module.exports = {
    USSDNode,
    USSD,
};
