import ts = require("typescript");
import { Queue } from "./queue";

export class AstTreeFinder {
	static findClassNameMethod(activeSourceFile: ts.Node): string {
		let className = "";
		activeSourceFile.forEachChild(child => {
			const [isclassdecl, value] = isClassNameDeclaration(child);
			if (isclassdecl) {
				className = value as string;
			}
		});

		return className;
	}

	static findLastItExpressionStatement(node: ts.Node): [hasItStatement: boolean, lastItStatementPosition: number] {
		const nodeParser = new Queue<ts.Node>();
		nodeParser.push(node);

		const nodesEnds: number[] = [];
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

	static findLastDescribeExpressionStatement(node: ts.Node): [hasDescribeStatement: boolean, hasOnlyClassDescribeStatement: boolean, lastDescribePosition: number] {
		const nodeParser = new Queue<ts.Node>();
		nodeParser.push(node);

		const nodesEnds: number[] = [];
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

	static findAllPublicExpressionStatement(node: ts.Node): string[] {
		const nodeParser = new Queue<ts.Node>();
		nodeParser.push(node);

		const nodesPublicDeclaration: string[] = [];
		while (nodeParser.count() > 0) {
			const treeNode: ts.Node = nodeParser.pop() as ts.Node;

			treeNode.forEachChild((child: ts.Node) => {
				if (ts.isFunctionLike(child)) {
					const modifiers = child.modifiers;
					if (modifiers) {
						modifiers.forEach(element => {
							if (element.kind === ts.SyntaxKind.PublicKeyword) {
								nodesPublicDeclaration.push(child?.name?.getText() as string);				
							}
						});
					}
				}
				nodeParser.push(child);
			});
		}

		return nodesPublicDeclaration;
	}
}

function isClassNameDeclaration(node: ts.Node): [isclassdecl: boolean, value: string | null] {
	if (ts.isClassDeclaration(node)) {
		return [true, node?.name?.escapedText as string];
	}

	return [false, null];
}

function isExpressionMethodDeclaration(declarationType: string, node: ts.Node): [isDeclaration: boolean, node: ts.Node | null] {
	if (ts.isExpressionStatement(node)) {
		if (node.expression.getText().startsWith(declarationType)) {
			return [true, node];
		}
	}

	return [false, null];
}

function describeStatementAstTreeOutput(nodesEnds: number[]): [hasDescribeStatement: boolean, hasOnlyClassDescribeStatement: boolean, lastDescribeTestPosition: number] {
	// If no describe, the test component is not set correctly since it does not have a Describe("TestComponent").
	if (nodesEnds.length === 0) {
		return [false, false, 0];
	}

	// Has only class One describe statement
	if (nodesEnds.length === 1) {
		return [true, true, 0];
	}

	// Since there wont be any duplicate and we dont want the class describe
	const secondLargestPosition = nodesEnds.sort((a, b) => { return b - a; })[1];

	// The largest describe position is the test file component itself e.g Describe("TestComponent")
	return [true, false, secondLargestPosition];
}

// function isFunctionLikeDeclaration(
// 	node: ts.Node
// ): boolean {
// 	return (
// 		ts.isGetAccessorDeclaration(node) ||
// 		ts.isSetAccessorDeclaration(node) ||
// 		ts.isMethodDeclaration(node) ||
// 		ts.isArrowFunction(node) ||
// 		ts.isFunctionDeclaration(node) ||
// 		ts.isFunctionExpression(node)
// 	);
// }