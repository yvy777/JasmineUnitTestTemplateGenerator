// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';

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
					try {
						const activeFileContent = fs.readFileSync(originalFileName, 'utf8') as string;

						const activeSourceFile = ts.createSourceFile(
							originalFileName,   // fileName
							activeFileContent, // source text
							ts.ScriptTarget.Latest, // languageVersion
							true
						);

						var className = findClassNameMethod(activeSourceFile);

						const testFileContent = fs.readFileSync(associatedTestFileName, 'utf8') as string;

						const testSourceFile = ts.createSourceFile(
							associatedTestFileName,   // fileName
							testFileContent, // source text
							ts.ScriptTarget.Latest, // languageVersion
							true
						);

						var testTemplateCursorPosition = 0;

						const [hasDescribeExpression, hasOnlyClassDescribeStatement, lastDescribePosition] = findLastDescribeExpressionStatement(testSourceFile);

						if (!hasDescribeExpression) {
							vscode.window.showInformationMessage(`Could not find the describe enclosing tag for test file ${associatedTestFileName}`);
							return;
						}
						else if (hasOnlyClassDescribeStatement) {
							const [hasItStatement, lastItStatementPosition] = findLastItExpressionStatement(testSourceFile);
							if (hasItStatement) {
								testTemplateCursorPosition = lastItStatementPosition;
								addItTestTemplate(testFileContent, functoTest, className, associatedTestFileName, testTemplateCursorPosition);
							}
							else {
								vscode.window.showInformationMessage(`Could not find the describe and It statement for test file ${associatedTestFileName}, 
								File must contain at least one of these for the ctor.`);
							}
						} else {
							testTemplateCursorPosition = lastDescribePosition;
							addDescribeTestTemplate(testFileContent, functoTest, className, associatedTestFileName, testTemplateCursorPosition);
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
function addDescribeTestTemplate(testFileContent: string, functoTest: string, className: string, associatedTestFileName: string, testTemplateCursorPosition: number) {
	if (testFileContent.includes(`describe("${functoTest}"`) ||
		testFileContent.includes(`describe(nameof<${className}>("${functoTest}")`)) {
		vscode.window.showInformationMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
	}
	else {
		writeTestTemplate(functoTest, className, associatedTestFileName, TestHeaderFormat.describe, testTemplateCursorPosition);
	}
}

function addItTestTemplate(testFileContent: string, functoTest: string, className: string, associatedTestFileName: string, testTemplateCursorPosition: number) {
	if (testFileContent.includes(`it("should ${functoTest}"`)) {
		vscode.window.showInformationMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
	}
	else {
		writeTestTemplate(functoTest, className, associatedTestFileName, TestHeaderFormat.it, testTemplateCursorPosition);
	}
}

function writeTestTemplate(functoTest: string, className: string, associatedTestFileName: string, testHeaderFormat: TestHeaderFormat, testTemplateCursorPosition: number) {
	vscode.window.showInformationMessage(`Generating test case for function : '${functoTest}'`);
	var template = testHeaderFormat === TestHeaderFormat.describe ?
		generateDescribeTestTemplate(className, functoTest) :
		generateItTestTemplate(functoTest);

	var fileContent = fs.readFileSync(associatedTestFileName).toString();

	const newFileContent = insert(fileContent, testTemplateCursorPosition, template);

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

// this method is called when your extension is deactivated
export function deactivate() {
}

function insertAt(originalString: string, index: number, stringToAdd: string) {
	return originalString.substr(0, index) + stringToAdd + originalString.substr(index);
}

function generateDescribeTestTemplate(className: string, functionToTest: string): string {
	return `\n\n	describe(nameof<${className}>("${functionToTest}"), () => {
		it("should ", () => {
			// Arrange

			// Act

			// Assert

		});
	});`;
}

function generateItTestTemplate(functionToTest: string): string {
	return `\n\n	it("should ${functionToTest}", () => {
			// Arrange

			// Act

			// Assert
	});`;
}

function isClassNameDeclaration(node: ts.Node): [isclassdecl: boolean, value: string | null] {
	if (ts.isClassDeclaration(node)) {
		return [true, node?.name?.escapedText as string];
	};

	return [false, null];
}

function findClassNameMethod(activeSourceFile: ts.Node): string {
	var className = "";
	activeSourceFile.forEachChild(child => {
		const [isclassdecl, value] = isClassNameDeclaration(child);
		if (isclassdecl) {
			className = value as string;
		}
	});

	return className;
}

function findLastItExpressionStatement(node: ts.Node): [hasItStatement: boolean, lastItStatementPosition: number] {
	var nodeParser = new Queue<ts.Node>();
	nodeParser.push(node);

	var nodesEnds: number[] = [];
	while (nodeParser.count() > 0) {
		const treeNode: ts.Node = nodeParser.pop() as ts.Node;

		treeNode.forEachChild(child => {
			const [isclassdecl, node] = isExpressionMethodDeclaration("it", child);
			if (isclassdecl) {
				nodesEnds.push(node?.getEnd() || 0);
			}
			nodeParser.push(child);
		});
	}

	if (nodesEnds.length < 1) {
		return [false, 0];
	}

	// Since there wont be any duplicate
	const largestPosition = nodesEnds.sort((a, b) => { return b - a; })[0];

	return [true, largestPosition];
}

function findLastDescribeExpressionStatement(node: ts.Node): [hasDescribeStatement: boolean, hasOnlyClassDescribeStatement: boolean, lastDescribePosition: number] {
	var nodeParser = new Queue<ts.Node>();
	nodeParser.push(node);

	var nodesEnds: number[] = [];
	while (nodeParser.count() > 0) {
		const treeNode: ts.Node = nodeParser.pop() as ts.Node;

		treeNode.forEachChild(child => {
			const [isclassdecl, node] = isExpressionMethodDeclaration("describe", child);
			if (isclassdecl) {
				nodesEnds.push(node?.getEnd() || 0);
			}
			nodeParser.push(child);
		});
	}

	return describeStatementAstTreeOutput(nodesEnds);
}

function describeStatementAstTreeOutput(nodesEnds: number[]): [hasDescribeStatement: boolean, hasOnlyClassDescribeStatement: boolean, lastDescribeTestPosition: number] {
	// If no describe, the test component is not set correctly since it does not have a Describe("TestComponent").
	if (nodesEnds.length === 0) {
		return [false, false, 0];
	}

	// Has only class describe statement
	if (nodesEnds.length === 1) {
		return [true, true, 0];
	}

	// Since there wont be any duplicate and we dont want the class describe
	const secondLargestPosition = nodesEnds.sort((a, b) => { return b - a; })[1];

	// The largest describe position is the test file component itself e.g Describe("TestComponent")
	return [true, false, secondLargestPosition];
}

function isExpressionMethodDeclaration(declarationType: string, node: ts.Node): [isDeclaration: boolean, node: ts.Node | null] {
	if (ts.isExpressionStatement(node)) {
		if (node.expression.getText().startsWith(declarationType)) {
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

function insert(str: string, index: number, value: string): string {
	return str.substr(0, index) + value + str.substr(index);
}

function getAccessorDeclaration(node: ts.Node): ts.SyntaxKind | undefined {
	const modifiers: ts.NodeArray<ts.Modifier> | undefined = node.modifiers;
	if (modifiers) {
		return modifiers[0].kind;
	}

	return undefined;
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

const enum TestHeaderFormat {
	it,
	describe,
}
