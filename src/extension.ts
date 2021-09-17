// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('TestHelper.buildTestMethod', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			const lineContent: string = activeEditor.document.lineAt(activeEditor.selection.active.line).text;

			var regex = new RegExp('([a-zA-Z{1}][a-zA-Z0-9_]+)(?=\\()', 'i');

			var match = regex.exec(lineContent);
			if (!match) {
				vscode.window.showErrorMessage('no function to test');
			}

			const functoTest = match![0] as string;

			vscode.window.showInformationMessage(`Generating unit test function template for ${functoTest}`);

			const originalFileName = activeEditor.document.fileName;

			vscode.window.showInformationMessage(`Finding test file for ${originalFileName}`);

			const fs = require('fs');

			// // File name end by component.ts => so it should become component.spec.ts
			const associatedTestFileName = insertAt(originalFileName as string, originalFileName?.length as number - 2, "spec.");

			fs.access(associatedTestFileName, fs.constants.R_OK | fs.constants.W_OK, (err: any) => {
				console.log('\n> Checking Permission for reading and writing to file');
				if (err) {
					vscode.window.showInformationMessage(`No matching associated test file with name:  ${associatedTestFileName}`);
				}
				else {
					// vscode.window.showInformationMessage(`Found matching associated test file with name:  ${associatedTestFileName}`);
					try {
						const activeFileContent = fs.readFileSync(originalFileName, 'utf8') as string;

						const activeSourceFile = ts.createSourceFile(
							originalFileName,   // fileName
							activeFileContent, // source text
							ts.ScriptTarget.Latest, // languageVersion
							true
						);
						var className: string = "";
						activeSourceFile.forEachChild(child => {
							const [isclassdecl, value] = findClassNameDeclaration(child);
							if (isclassdecl) {
								className = value as string;
							}
						});

						const testFileContent = fs.readFileSync(associatedTestFileName, 'utf8') as string;

						const testSourceFile = ts.createSourceFile(
							associatedTestFileName,   // fileName
							testFileContent, // source text
							ts.ScriptTarget.Latest, // languageVersion
							true
						);

						findAllPublicMethodDeclaration(activeSourceFile);
						// printRecursiveFrom(activeSourceFile,0,activeSourceFile);

						// printRecursiveFrom(testSourceFile, 0, testSourceFile);

						if (testFileContent.includes(`describe(${functoTest})`) ||
							testFileContent.includes(`describe(nameof<${className}>("${functoTest}")`)) {
							vscode.window.showInformationMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
						}
						else {
							vscode.window.showInformationMessage(`Generating test case for function : '${functoTest}'`);
							var template = generateTestTemplate(className, functoTest);

							fs.open(associatedTestFileName, 'a', function (err: any, fd: any) {
								if (err) {
									console.log('Cant open file');
								} else {
									fs.write(fd, template, 0,
										null, function (err: any, writtenbytes: string) {
											if (err) {
												console.log('Cant write to file');
												vscode.window.showInformationMessage(`Template generation failed for function: ${functoTest}`);
											} else {
												console.log(writtenbytes + ' characters added to file');
												vscode.window.showInformationMessage(`Template generation completed for function: ${functoTest}`);
											}
										});
								}
							});
						}

					} catch (err) {
						console.error(err);
					}
				}
			});
		};
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function insertAt(originalString: string, index: number, stringToAdd: string) {
	return originalString.substr(0, index) + stringToAdd + originalString.substr(index);
}

function generateTestTemplate(className: string, functionToTest: string): string {
	return `\ndescribe(nameof<${className}>("${functionToTest}"), () => {
	it("should ", () => {
		// Arrange

		// Act

		// Assert

	});
});\n`;
}

function findClassNameDeclaration(node: ts.Node): [isclassdecl: boolean, value: string | null] {
	if (ts.isClassDeclaration(node)) {
		return [true, node?.name?.escapedText as string];
	};

	return [false, null];
}

function findAllPublicMethodDeclaration(node: ts.Node) {
	if (isFunctionLikeDeclaration(node)) {
		if (getAccessorDeclaration(node) === ts.SyntaxKind.PublicKeyword)
			console.log(node?.name?.getText());
	}

	node.forEachChild(findAllPublicMethodDeclaration);
}

// Use printRecursiveFrom(activeSourceFile, 0, activeSourceFile);
// For debugging purposes => Display the AST Tree.
function printRecursiveFrom(
	node: ts.Node, indentLevel: number, sourceFile: ts.SourceFile
) {
	const indentation = "-".repeat(indentLevel);
	const syntaxKind = ts.SyntaxKind[node.kind];
	const nodeText = node.getText(sourceFile);
	console.log(`${indentation}${syntaxKind}: ${nodeText}`);

	node.forEachChild(child =>
		printRecursiveFrom(child, indentLevel + 1, sourceFile)
	);
}

function isFunctionLikeDeclaration(
	node: ts.Node
): node is ts.FunctionLikeDeclaration {
	return (
		ts.isArrowFunction(node) ||
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isGetAccessorDeclaration(node) ||
		ts.isMethodDeclaration(node) ||
		ts.isSetAccessorDeclaration(node)
	);
}

function getAccessorDeclaration(node: ts.Node): ts.SyntaxKind | undefined {
	const modifiers: ts.NodeArray<ts.Modifier> | undefined = node.modifiers;
	if (modifiers) {
		return modifiers[0].kind;
	}

	return undefined;
}
