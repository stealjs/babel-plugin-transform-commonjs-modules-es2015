const assert = require('assert');
const babel = require('babel-core');
const cjsToES = require("../index");

const testCases = [
	{
		before: `require("foo");`,
		after: `import "foo";`
	},
	{
		before: `"use strict";\nrequire("foo");`,
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
	},
	{
		before: `var foo = require("../foo");
			module.exports = require("../bar");`,
		after: `import foo from "../foo";
import _bar from "../bar";

let _moduleExports;

export default _moduleExports;

_moduleExports = _bar;`
	},
	{
		before: `var foo = require("../foo")();`,
		after: `import _foo from "../foo";
var foo = _foo();`
	},
	{
		before: `var foo = require(process.cwd() + "/bar");`,
		after: `var foo = require(process.cwd() + "/bar");`
	},
	{
		before: `module.exports = { foo: require("bar") }`,
		after: `import _bar from "bar";

let _moduleExports;

export default _moduleExports;
_moduleExports = { foo: _bar };`
	}
];

testCases.forEach(testCase => {
	const result = babel.transform(testCase.before, {
		plugins: [ cjsToES ]
	});

	assert.equal(result.code, testCase.after);
});
