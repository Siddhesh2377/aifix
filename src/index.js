const { scan, scanFile, rules } = require("./scanner");
const { formatText, formatJSON } = require("./reporter");

module.exports = { scan, scanFile, rules, formatText, formatJSON };
