// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as ts from 'typescript';
import { SingleFunctionSelectionGeneratorProvider as SingleFunctionSelectionGeneratorProvider } from './providers/single-function-selection-generator-provider';
import { FileSelectionGeneratorProvider as FileSelectionGeneratorProvider } from './providers/file-selection-generator-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// For single method selection
	context.subscriptions.push(SingleFunctionSelectionGeneratorProvider.register(context));

	// For entire file selection
	context.subscriptions.push(FileSelectionGeneratorProvider.register(context));

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



function getAccessorDeclaration(node: ts.Node): ts.SyntaxKind | undefined {
	const modifiers: ts.NodeArray<ts.Modifier> | undefined = node.modifiers;
	if (modifiers) {
		return modifiers[0].kind;
	}

	return undefined;
}
