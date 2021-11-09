import * as ts from "typescript";
import * as fs from "fs";

export class FileParser {
    static getFileContent(fileName: string): { fileContent: string, sourceFile: ts.SourceFile } {
        const fileContent = fs.readFileSync(fileName, "utf8") as string;
        const sourceFile = createSourceFile(fileName, fileContent);
        return { fileContent, sourceFile };
    }
}

function createSourceFile(associatedTestFileName: string, testFileContent: string): ts.SourceFile {
    return ts.createSourceFile(
        associatedTestFileName,  // fileName
        testFileContent, // source text
        ts.ScriptTarget.Latest, // file version
        true
    );
}