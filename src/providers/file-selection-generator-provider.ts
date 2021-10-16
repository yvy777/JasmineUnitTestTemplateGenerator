import * as vscode from 'vscode';
import * as fs from 'fs';

export class FileSelectionGeneratorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.commands.registerCommand('TestHelper.buildTestMethodForEntireFile', () => {
            // The code you place here will be executed every time your command is executed

            // Display a message box to the user
            vscode.window.showInformationMessage('Hello World!');
        });
    }
}