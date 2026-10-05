class USSDPattern extends URLPattern {
    static baseURL = "http://localhost";

    constructor(input) {
        super(input, USSDPattern.baseURL);
    }

    exec(input) {
        return super.exec(input, USSDPattern.baseURL);
    }

    test(input) {
        return super.test(input, USSDPattern.baseURL);
    }
}
exports.USSDPattern = USSDPattern;
