
import * as fs from "fs";
import { StringManipulator } from "./string-manipulator";
import { TemplateGenerator } from "./template-generator";
import { TestHeaderFormat } from "./test-header-format";

export class DocumentWriter {

    public static writeDescribeTestTemplate(functoTest: string, className: string, fileName: string, testTemplateCursorPosition: number): void {
        writeTestTemplate(functoTest, className, fileName, TestHeaderFormat.describe, testTemplateCursorPosition);
    }

    static writeItTestTemplate(functoTest: string, className: string, associatedTestFileName: string, testTemplateCursorPosition: number) :void {

        writeTestTemplate(functoTest, className, associatedTestFileName, TestHeaderFormat.it, testTemplateCursorPosition);
    }

    static writeDescribeTestTemplates(functoTest: string[], className: string, fileName: string, testTemplateCursorPosition: number):void {
        writeTestTemplates(functoTest, className, fileName, TestHeaderFormat.describe, testTemplateCursorPosition);
    }

    static writeItTestTemplates(functoTest: string[], className: string, associatedTestFileName: string, testTemplateCursorPosition: number) :void{

        writeTestTemplates(functoTest, className, associatedTestFileName, TestHeaderFormat.it, testTemplateCursorPosition);
    }

}

function writeTestTemplates(funcToTests: string[], className: string, fileName: string, testHeaderFormat: TestHeaderFormat, testTemplateCursorPosition: number) {
    const testTemplates: string[] = funcToTests.map(funcToTest => getTestFunctionTemplate(testHeaderFormat, className, funcToTest));

    const generalTemplate: string = testTemplates.join("");

    const fileContent = fs.readFileSync(fileName).toString();

    const newFileContent = StringManipulator.insert(fileContent, generalTemplate, testTemplateCursorPosition);

    writeToFile(fileName, newFileContent);
}

function writeTestTemplate(functoTest: string, className: string, fileName: string, testHeaderFormat: TestHeaderFormat, testTemplateCursorPosition: number) {
    // vscode.window.showInformationMessage(`Generating test case for function : '${functoTest}'`);
    const testTemplate = getTestFunctionTemplate(testHeaderFormat, className, functoTest);

    const fileContent = fs.readFileSync(fileName).toString();

    const newFileContent = StringManipulator.insert(fileContent, testTemplate, testTemplateCursorPosition);

    writeToFile(fileName, newFileContent);
}

function getTestFunctionTemplate(testHeaderFormat: TestHeaderFormat, className: string, functoTest: string) {
    return testHeaderFormat === TestHeaderFormat.describe ?
        TemplateGenerator.generateDescribeTestTemplate(className, functoTest) :
        TemplateGenerator.generateItTestTemplate(functoTest);
}

function writeToFile(fileName: string, newFileContent: string) {
    fs.open(fileName, "w", function (err: any, fd: any) {
        if (err) {
            console.log("Cant open file");
        } else {
            const bufferedText = Buffer.from(newFileContent);
            fs.write(fd, bufferedText, 0, bufferedText.length, 0,
                (err: NodeJS.ErrnoException | null, writtenbytes: number, _buffer: any) => {
                    if (err) {
                        console.log("Cant write to file");
                    } else {
                        console.log(writtenbytes + " characters added to file");
                    }
                });
        }
    });
}
