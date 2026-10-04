class USSDPattern extends URLPattern {
    static baseURL = "http://localhost";

    constructor(input) {
        super(input, USSDPattern.baseURL);
    }

    /**
     * @param {String} input
     * @returns {URLPatternResult}
     */
    exec(input) {
        return super.exec(input, USSDPattern.baseURL);
    }

    /**
     * @param {String} input
     * @returns {URLPatternResult}
     */
    test(input) {
        return super.test(input, USSDPattern.baseURL);
    }
}
exports.USSDPattern = USSDPattern;
