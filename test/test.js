const assert = require('assert');
const babel = require('babel-core');
const cjsToES = require("../index");

const testCases = [
	{
		before: `require("foo");`,
		after: `import "foo";`
	},
	{
		before: `require("foo");
		module.exports = {};`,
		after: `import "foo";

let _moduleExports;

export default _moduleExports;

_moduleExports = {};`},
	{
		before: `var foo = require("bar");
			module.exports = {};`,
		after: `import foo from "bar";

let _moduleExports;

export default _moduleExports;

_moduleExports = {};`
	}
];

testCases.forEach(testCase => {
	const result = babel.transform(testCase.before, {
		plugins: [ cjsToES ]
	});

	assert.equal(result.code, testCase.after);
});