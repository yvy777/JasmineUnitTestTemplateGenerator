// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';
import * as fs from 'fs';
import { AstTreeFinder } from './ast-tree-finder';
import { TemplateGenerator } from './template-generator';
import { StringManipulator } from './string-manipulator';
import { TestHeaderFormat } from './test-header-format';
import { DocumentWriter } from './document-writer';
import { FileParser } from './file-parser';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('TestHelper.buildTestMethod', async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Starting test template process generation!",
				cancellable: true
			}, async (progress, token) => {
				token.onCancellationRequested(() => {
					console.log("User canceled the operation");
				});

				const lineContent: string = activeEditor.document.lineAt(activeEditor.selection.active.line).text;

				var regex = new RegExp('([a-zA-Z{1}][a-zA-Z0-9_]+)(?=\\()', 'i');

				var match = regex.exec(lineContent);
				if (!match) {
					vscode.window.showErrorMessage('no function to test');
				}

				const functoTest = match![0] as string;

				progress.report({ increment: 20, message: `Generating unit test function template for ${functoTest}` });

				const originalFileName = activeEditor.document.fileName as string;

				progress.report({ increment: 40, message: `Finding test file for ${originalFileName}` });

				// // File name end by component.ts => so it should become component.spec.ts
				const associatedTestFileName = StringManipulator.insert(originalFileName, "spec.", originalFileName?.length as number - 2);

				fs.access(associatedTestFileName, fs.constants.R_OK | fs.constants.W_OK, (err: any) => {

					progress.report({ increment: 60, message: `Checking Permission for reading and writing to file ${associatedTestFileName}` });

					if (err) {
						vscode.window.showInformationMessage(`No matching associated test file with name:  ${associatedTestFileName}`);
					}
					else {
						try {
							progress.report({ increment: 70, message: `Preparing to generate test template for ${functoTest}` });

							const activeSourceFile = FileParser.getFileContent(originalFileName);
							const testSourceFile = FileParser.getFileContent(associatedTestFileName);

							var className = AstTreeFinder.findClassNameMethod(activeSourceFile.sourceFile);

							var testTemplateCursorPosition = 0;

							const [hasDescribeExpression, hasOnlyClassDescribeStatement, lastDescribePosition] =
								AstTreeFinder.findLastDescribeExpressionStatement(testSourceFile.sourceFile);

							if (!hasDescribeExpression) {
								vscode.window.showInformationMessage(`Could not find the describe enclosing tag for test file ${associatedTestFileName}`);
								return;
							}
							else if (hasOnlyClassDescribeStatement) {
								progress.report({ increment: 80, message: `Writing test template for ${functoTest} using 'it' format.` });
								const [hasItStatement, lastItStatementPosition] = AstTreeFinder.findLastItExpressionStatement(testSourceFile.sourceFile);
								if (hasItStatement) {
									testTemplateCursorPosition = lastItStatementPosition;

									if (testSourceFile.fileContent.includes(`it("should ${functoTest}"`)) {
										vscode.window.showInformationMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
									}
									else {
										DocumentWriter.writeItTestTemplate(functoTest, className, associatedTestFileName, testTemplateCursorPosition);
									}
								}
								else {
									vscode.window.showInformationMessage(`Could not find the describe and It statement for test file ${associatedTestFileName}, 
								File must contain at least one of these for the ctor.`);
								}
							} else {
								progress.report({ increment: 80, message: `Writing test template for ${functoTest} using 'describe' format.` });
								testTemplateCursorPosition = lastDescribePosition;

								if (testSourceFile.fileContent.includes(`describe("${functoTest}"`) ||
									testSourceFile.fileContent.includes(`describe(nameof<${className}>("${functoTest}")`)) {
									vscode.window.showInformationMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
								}
								else {
									DocumentWriter.writeDescribeTestTemplate(functoTest, className, associatedTestFileName, testTemplateCursorPosition);
								}
							}

							progress.report({ increment: 100, message: `Template generation completed for function: ${functoTest}` });

						} catch (err) {
							console.error(err);
						}
					}
				});
			});
		}
		else {
			vscode.window.showInformationMessage('Could not find any active document to begin test generating');
		};
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
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
