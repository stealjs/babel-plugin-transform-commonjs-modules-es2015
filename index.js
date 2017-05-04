var template = require("babel-template");

var buildModuleExports = template(`
let NAME;
export default ONAME;
`, {
	sourceType: "module"
});

module.exports = function(options){
	var t = options.types;
	var imports = [];
	var moduleExportIdentifier;

	return {
		visitor: {
			CallExpression: function(path){
				var node = path.node;

				if(path.get("callee").node.name === "require") {
					var modulePath = path.get('arguments.0').node.value;
					var identifiers = [];

					if(t.isVariableDeclarator(path.parent)) {
						identifiers = [t.importDefaultSpecifier(
							t.identifier(path.parent.id.name)
						)];
						path.parentPath.remove();
					} else {
						path.remove();
					}

					imports.push(
						t.importDeclaration(
							identifiers,
							t.stringLiteral(modulePath)
						)
					);
				}
			},
			MemberExpression: function(path){
				var node = path.node;
				if(path.get("object").node.name === "module" &&
					path.get("property").node.name === "exports") {
					// Do stuff
					if(!moduleExportIdentifier) {
						moduleExportIdentifier = path.scope.generateUidIdentifier("moduleExports")
					}

					path.replaceWith(t.identifier(moduleExportIdentifier.name));
				}
			},
			Program: {
				enter: function(){
					imports = [];
					moduleExportIdentifier = null;
				},
				exit: function(path){
					// Move the imports to the top of the stack
					var node = path.node;
					var body = imports.slice();

					if(moduleExportIdentifier) {
						body.push.apply(body, buildModuleExports({
							NAME: moduleExportIdentifier,
							ONAME: moduleExportIdentifier
						}));
					}

					body.push.apply(body, node.body);
					node.body = body;
				}
			}
		}
	}
};
