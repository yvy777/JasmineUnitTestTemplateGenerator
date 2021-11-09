import * as vscode from "vscode";
import * as fs from "fs";
import { StringManipulator } from "../helpers/string-manipulator";
import { AstTreeFinder } from "../helpers/ast-tree-finder";
import { FileParser } from "../helpers/file-parser";
import { DocumentWriter } from "../helpers/document-writer";

export class FileSelectionGeneratorProvider {
    public static register(_: vscode.ExtensionContext): vscode.Disposable {
        return vscode.commands.registerCommand("TestHelper.buildTestMethodForEntireFile", (vscodeResourceUri: vscode.Uri) => {

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Starting test template process generation!",
                cancellable: true
            }, async (progress, token) => {

                const originalFileName = vscodeResourceUri.fsPath;

                token.onCancellationRequested(() => {
                    console.log("User canceled the operation");
                });

                const associatedTestFileName = StringManipulator.insert(originalFileName, "spec.", originalFileName?.length as number - 2);

                fs.access(associatedTestFileName, fs.constants.R_OK | fs.constants.W_OK, (err: any) => {
                    if (err) {
                        vscode.window.showErrorMessage(`No matching associated test file with name:  ${associatedTestFileName}`);
                    }
                    else {
                        const activeSourceFile = FileParser.getFileContent(originalFileName);
                        const testSourceFile = FileParser.getFileContent(associatedTestFileName);

                        const className = AstTreeFinder.findClassNameMethod(activeSourceFile.sourceFile);

                        const allPublicDeclarations: string[] = AstTreeFinder.findAllPublicExpressionStatement(activeSourceFile.sourceFile);

                        let testTemplateCursorPosition = 0;

                        const [hasDescribeExpression, hasOnlyClassDescribeStatement, lastDescribePosition] =
                            AstTreeFinder.findLastDescribeExpressionStatement(testSourceFile.sourceFile);

                        progress.report({ increment: 100, message: `Template generation completed for file: ${originalFileName}` });

                        if (!hasDescribeExpression) {
                            vscode.window.showErrorMessage(`Could not find the describe enclosing tag for test file ${associatedTestFileName}`);
                            return;
                        }
                        else if (hasOnlyClassDescribeStatement) {
                            // progress.report({ increment: 80, message: `Writing test template for ${functoTest} using 'it' format.` });
                            const [hasItStatement, lastItStatementPosition] = AstTreeFinder.findLastItExpressionStatement(testSourceFile.sourceFile);
                            if (hasItStatement) {
                                testTemplateCursorPosition = lastItStatementPosition;

                                const filteredPublicDeclarations = StringManipulator.filterAlreadyExistingItDeclarationsFromSourceFile(allPublicDeclarations, testSourceFile.fileContent);

                                DocumentWriter.writeItTestTemplates(filteredPublicDeclarations, className, associatedTestFileName, testTemplateCursorPosition);
                            }
                            else {
                                vscode.window.showErrorMessage(`Could not find the describe and It statement for test file ${associatedTestFileName}, 
								File must contain at least one of these for the ctor.`);
                            }

                        } else {
                            // progress.report({ increment: 80, message: `Writing test template for ${functoTest} using 'describe' format.` });
                            testTemplateCursorPosition = lastDescribePosition;

                            const filteredPublicDeclarations = StringManipulator.filterAlreadyExistingDescribeDeclarationsFromSourceFile(allPublicDeclarations, className, testSourceFile.fileContent);

                            DocumentWriter.writeDescribeTestTemplates(filteredPublicDeclarations, className, associatedTestFileName, testTemplateCursorPosition);
                        }

                        vscode.window.showInformationMessage(`Template generation completed for file: ${originalFileName}`);
                    }
                });
            });
        });
    }
}




