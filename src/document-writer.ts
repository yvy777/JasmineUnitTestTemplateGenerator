import { StringManipulator } from "./string-manipulator";
import { TemplateGenerator } from "./template-generator";
import { TestHeaderFormat } from "./test-header-format";
import * as fs from 'fs';

export class DocumentWriter {

    static writeDescribeTestTemplate(functoTest: string, className: string, fileName: string, testTemplateCursorPosition: number) {
        writeTestTemplate(functoTest, className, fileName, TestHeaderFormat.describe, testTemplateCursorPosition);
    }

    static writeItTestTemplate(functoTest: string, className: string, associatedTestFileName: string, testTemplateCursorPosition: number) {

        writeTestTemplate(functoTest, className, associatedTestFileName, TestHeaderFormat.it, testTemplateCursorPosition);
    }
}

function writeTestTemplate(functoTest: string, className: string, fileName: string, testHeaderFormat: TestHeaderFormat, testTemplateCursorPosition: number) {
    // vscode.window.showInformationMessage(`Generating test case for function : '${functoTest}'`);
    var template = testHeaderFormat === TestHeaderFormat.describe ?
        TemplateGenerator.generateDescribeTestTemplate(className, functoTest) :
        TemplateGenerator.generateItTestTemplate(functoTest);

    var fileContent = fs.readFileSync(fileName).toString();

    const newFileContent = StringManipulator.insert(fileContent, template, testTemplateCursorPosition);

    fs.open(fileName, 'w', function (err: any, fd: any) {
        if (err) {
            console.log('Cant open file');
        } else {
            var bufferedText = Buffer.from(newFileContent);
            fs.write(fd, bufferedText, 0, bufferedText.length, 0,
                (err: NodeJS.ErrnoException | null, writtenbytes: number, buffer: any) => {
                    if (err) {
                        console.log('Cant write to file');
                    } else {
                        console.log(writtenbytes + ' characters added to file');
                    }
                });
        }
    });
}