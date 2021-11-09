import * as vscode from "vscode";
import * as fs from "fs";
import { AstTreeFinder } from "../helpers/ast-tree-finder";
import { DocumentWriter } from "../helpers/document-writer";
import { FileParser } from "../helpers/file-parser";
import { Regex } from "../helpers/regex";
import { StringManipulator } from "../helpers/string-manipulator";

export class SingleFunctionSelectionGeneratorProvider {

    public static register(_ : vscode.ExtensionContext): vscode.Disposable {
        return vscode.commands.registerCommand("TestHelper.buildTestMethod", () => {

            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Starting test template process generation!",
                    cancellable: true
                }, async (progress, token) => {

                    token.onCancellationRequested(() => {
                        console.log("User canceled the operation");
                    });

                    const lineContent: string = activeEditor.document.lineAt(activeEditor.selection.active.line).text;

                    const match: RegExpExecArray | null = Regex.findFonctionName(lineContent);

                    if (!match) {
                        vscode.window.showErrorMessage("No function to test");
                    }

                    const functoTest = match![0] as string;

                    progress.report({ increment: 80, message: `Generating unit test function template for ${functoTest}` });

                    const originalFileName = activeEditor.document.fileName;

                    // // File name end by component.ts => so it should become component.spec.ts
                    const associatedTestFileName = StringManipulator.insert(originalFileName, "spec.", originalFileName?.length as number - 2);

                    fs.access(associatedTestFileName, fs.constants.R_OK | fs.constants.W_OK, (err: any) => {

                        // progress.report({ increment: 60, message: `Checking Permission for reading and writing to file ${associatedTestFileName}` });

                        if (err) {
                            vscode.window.showErrorMessage(`No matching associated test file with name:  ${associatedTestFileName}`);
                        }
                        else {
                            try {
                                // progress.report({ increment: 70, message: `Preparing to generate test template for ${functoTest}` });

                                const activeSourceFile = FileParser.getFileContent(originalFileName);
                                const testSourceFile = FileParser.getFileContent(associatedTestFileName);

                                const className = AstTreeFinder.findClassNameMethod(activeSourceFile.sourceFile);

                                let testTemplateCursorPosition = 0;

                                const [hasDescribeExpression, hasOnlyClassDescribeStatement, lastDescribePosition] =
                                    AstTreeFinder.findLastDescribeExpressionStatement(testSourceFile.sourceFile);

                                if (!hasDescribeExpression) {
                                    vscode.window.showErrorMessage(`Could not find the describe enclosing tag for test file ${associatedTestFileName}`);
                                    return;
                                }
                                else if (hasOnlyClassDescribeStatement) {
                                    // progress.report({ increment: 80, message: `Writing test template for ${functoTest} using 'it' format.` });
                                    const [hasItStatement, lastItStatementPosition] = AstTreeFinder.findLastItExpressionStatement(testSourceFile.sourceFile);
                                    if (hasItStatement) {
                                        testTemplateCursorPosition = lastItStatementPosition;

                                        if (testSourceFile.fileContent.includes(`it("should ${functoTest}"`)) {
                                            vscode.window.showErrorMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);
                                        }
                                        else {
                                            DocumentWriter.writeItTestTemplate(functoTest, className, associatedTestFileName, testTemplateCursorPosition);
                                        }
                                    }
                                    else {
                                        vscode.window.showErrorMessage(`Could not find the describe and It statement for test file ${associatedTestFileName}, 
								File must contain at least one of these for the ctor.`);
                                    }
                                } else {
                                    // progress.report({ increment: 80, message: `Writing test template for ${functoTest} using 'describe' format.` });
                                    testTemplateCursorPosition = lastDescribePosition;

                                    if (testSourceFile.fileContent.includes(`describe("${functoTest}"`) ||
                                        testSourceFile.fileContent.includes(`describe(nameof<${className}>("${functoTest}")`)) {
                                        vscode.window.showErrorMessage(`Function : '${functoTest}'' already has a test case in ${associatedTestFileName}`);

                                        return;
                                    }
                                    else {
                                        DocumentWriter.writeDescribeTestTemplate(functoTest, className, associatedTestFileName, testTemplateCursorPosition);
                                    }
                                }

                                // progress.report({ increment: 100, message: `Template generation completed for function: ${functoTest}` });
                                vscode.window.showInformationMessage(`Template generation completed for function: ${functoTest}`);

                            } catch (err) {
                                console.error(err);
                            }
                        }
                    });
                });
            }
            else {
                vscode.window.showErrorMessage("Could not find any active document to begin test generating");
            }
        });
    }
}