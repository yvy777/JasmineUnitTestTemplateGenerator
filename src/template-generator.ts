export class TemplateGenerator {
    static generateDescribeTestTemplate(className: string, functionToTest: string): string {
        return `\n\n	describe(nameof<${className}>("${functionToTest}"), () => {
		it("should ", () => {
			// Arrange

			// Act

			// Assert

		});
	});`;
    }

    static generateItTestTemplate(functionToTest: string): string {
        return `\n\n	it("should ${functionToTest}", () => {
			// Arrange

			// Act

			// Assert
	});`;
    }
}