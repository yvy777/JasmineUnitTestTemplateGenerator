export class Regex {
    static findFonctionName(lineContent: string): RegExpExecArray | null {
        const regex = new RegExp("([a-zA-Z{1}][a-zA-Z0-9_]+)(?=\\()", "i");

        const match = regex.exec(lineContent);

        return match;
    }
}