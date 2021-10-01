// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';
import { Console } from 'console';

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
							const [isclassdecl, value] = isClassNameDeclaration(child);
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

						const [testFileProperlySetUp, lastDescribeTestPosition] = findLastTestDescribeMethod(testSourceFile);

						if (!testFileProperlySetUp) {
							vscode.window.showInformationMessage(`Could not find the describe enclosing tag for test file ${associatedTestFileName}`);
							return;
						}

						if (testFileContent.includes(`describe(${functoTest})`) ||
							testFileContent.includes(`describe(nameof<${className}>("${functoTest}")`)) {
							vscode.window.showInformationMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
						}
						else {
							vscode.window.showInformationMessage(`Generating test case for function : '${functoTest}'`);
							var template = generateTestTemplate(className, functoTest);

							var fileContent = fs.readFileSync(associatedTestFileName).toString();

							const newFileContent = insert(fileContent, lastDescribeTestPosition, template);

							// console.log(newFileContent);

							fs.open(associatedTestFileName, 'w', function (err: any, fd: any) {
								if (err) {
									console.log('Cant open file');
								} else {
									var bufferedText = Buffer.from(newFileContent);
									fs.write(fd, bufferedText, 0, bufferedText.length, 0,
										(err: NodeJS.ErrnoException | null, writtenbytes: number, buffer: any) => {
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

function isClassNameDeclaration(node: ts.Node): [isclassdecl: boolean, value: string | null] {
	if (ts.isClassDeclaration(node)) {
		return [true, node?.name?.escapedText as string];
	};

	return [false, null];
}

// function findAllPublicDescribeMethodDeclaration(node: ts.Node) {
// 	node.forEachChild(child => {
// 		const [isclassdecl, value] = isDescribeMethodDeclaration(child);
// 		if (isclassdecl) {
// 			console.log(value?.getEnd());
// 		}
// 	});

// 	node.forEachChild(findAllPublicDescribeMethodDeclaration);
// }

/**
 * A typical Angular test file class has one big describe named after the component
 *
 */
function nodeContainsAtLeastOneDescribe(node: ts.Node): [hasDescribe: boolean, node: ts.Node | null] {
	var componentNode: [hasDescribe: boolean, node: ts.Node | null] = [false, null];
	node.forEachChild(child => {
		const [isclassdecl, _] = isDescribeMethodDeclaration(child);
		if (isclassdecl) {
			componentNode = [true, child];
			return;
		}
	});

	return componentNode;
}

function findLastTestDescribeMethod(node: ts.Node): [testFileProperlySetUp: boolean, lastDescribeTestPosition: number] {
	const [hasDescribe, _] = nodeContainsAtLeastOneDescribe(node);
	if (!hasDescribe) {
		return [false, 0];
	}

	var nodeParser = new Queue<ts.Node>();
	nodeParser.push(node);

	var nodesEnds: number[] = [];
	while (nodeParser.count() > 0) {
		const treeNode: ts.Node = nodeParser.pop() as ts.Node;

		treeNode.forEachChild(child => {
			const [isclassdecl, node] = isDescribeMethodDeclaration(child);
			if (isclassdecl) {
				console.log(node?.getEnd());
				nodesEnds.push(node?.getEnd() || 0);
			}
			nodeParser.push(child);
		});
	}

	return [true, nodesEnds[nodesEnds.length - 1]];
}

function isDescribeMethodDeclaration(node: ts.Node): [isDescDecl: boolean, node: ts.Node | null] {
	if (ts.isExpressionStatement(node)) {
		if (node.getFullText().includes("describe")) {
			return [true, node];
		}
	}

	return [false, null];
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
		ts.isGetAccessorDeclaration(node) ||
		ts.isSetAccessorDeclaration(node) ||
		ts.isMethodDeclaration(node) ||
		ts.isArrowFunction(node) ||
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node)
	);
}

function getAccessorDeclaration(node: ts.Node): ts.SyntaxKind | undefined {
	const modifiers: ts.NodeArray<ts.Modifier> | undefined = node.modifiers;
	if (modifiers) {
		return modifiers[0].kind;
	}

	return undefined;
}

function insert(str: string, index: number, value: string): string {
	return str.substr(0, index) + value + str.substr(index);
}

class Queue<T> {
	_store: T[] = [];
	push(val: T) {
		this._store.push(val);
	}
	pop(): T | undefined {
		return this._store.shift();
	}
	count(): number {
		return this._store.length;
	}
}
