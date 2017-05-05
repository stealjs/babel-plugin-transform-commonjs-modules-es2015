var template = require("babel-template");

var buildLetModuleExports = template(`let NAME;`);
var buildExportModule = template(`export default NAME;`, {
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

				if(path.get("callee").node.name === "require" &&
					t.isStringLiteral(path.get('arguments.0'))) {
					var modulePath = path.get('arguments.0').node.value;
					var identifiers = [];

					if(t.isVariableDeclarator(path.parent)) {
						identifiers = [t.importDefaultSpecifier(
							t.identifier(path.parent.id.name)
						)];
						path.parentPath.remove();
					} else if(t.isAssignmentExpression(path.parent) || 
						t.isCallExpression(path.parent) ||
						t.isObjectProperty(path.parent)) {
						var localVar = path.scope.generateUidIdentifier(modulePath);
						path.replaceWith(t.identifier(localVar.name));
						identifiers = [t.importDefaultSpecifier(
							t.identifier(localVar.name)
						)];
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
			Directive: function(path){
				if(path.get("value").node.value === "use strict") {
					path.remove();
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
						body.push(buildLetModuleExports({
							NAME: moduleExportIdentifier
						}));
					}

					body.push.apply(body, node.body);

					if(moduleExportIdentifier) {
						body.push(buildExportModule({
							NAME: moduleExportIdentifier
						}));
					}

					node.body = body;
				}
			}
		}
	}
};
