export class StringManipulator {
	static insert(str: string, value: string, index: number): string {
		return str.substr(0, index) + value + str.substr(index);
	}
}