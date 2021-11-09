
# Jasmine test template generator README

This extension gives you the ability to generate test cases by a single click.
 
Removing the need for redundant copy paste and increasing efficiency when generating unit tests.

Below is a small demo about it's 2 main usages.

1- To generate single method unit test declaration by clicking on wanted method to test:
<img src="assets/docs/SingleFunctionUnitTestGeneration.gif" width="481px">

2- To generate all public method declarations by clicking on file: 
<img src="assets/docs/FileUnitTestGeneration.gif" width="481px">

## Features

Currently supports 2 jasmine Syntax.

1- Using "it" nested inside parent Describe as build by the angular-cli template component generator.

```
describe("Component", () => {
  ...
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
```
2- Using nested Describe inside parent Describe for every public method declarations.
```
describe("Component", () => {
  ...
  describe("ctor", () => {
	  it('should create the app', () => {
	    const fixture = TestBed.createComponent(AppComponent);
	    const app = fixture.componentInstance;
	    expect(app).toBeTruthy();
	  });
  });
});
```
## Requirements

Must have VS Code version 1.57.0 or higher.

## Known Issues

- If there is no "it" or "describe" test already present in the spec.ts file than the template generation will fail.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of Test template generator 

## Limitations
- If there is no "it" or "describe" test already present in the spec.ts file than the template generation will fail.


##  Releases
See the [changelog](CHANGELOG.md).