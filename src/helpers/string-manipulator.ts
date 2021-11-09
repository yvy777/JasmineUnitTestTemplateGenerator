export class StringManipulator {
	static insert(str: string, value: string, index: number): string {
		return str.substr(0, index) + value + str.substr(index);
	}

	static filterAlreadyExistingDescribeDeclarationsFromSourceFile(allPublicDeclarations: string[], className: string, sourceFileContent: string): string[] {
		const filteredPublicDeclarations: string[] = [];

		// Filter already existing test
		allPublicDeclarations.forEach(functoTest => {
			if (!sourceFileContent.includes(`describe("${functoTest}"`) &&
				!sourceFileContent.includes(`describe(nameof<${className}>("${functoTest}")`)) {
				filteredPublicDeclarations.push(functoTest);
			}
		});

		return filteredPublicDeclarations;
	}

	static filterAlreadyExistingItDeclarationsFromSourceFile(allPublicDeclarations: string[], sourceFileContent: string): string[] {
		const filteredPublicDeclarations: string[] = [];

		// Filter already existing test
		allPublicDeclarations.forEach(functoTest => {
			if (!sourceFileContent.includes(`it("should ${functoTest}"`)) {
				filteredPublicDeclarations.push(functoTest);
			}
		});

		return filteredPublicDeclarations;
	}

}