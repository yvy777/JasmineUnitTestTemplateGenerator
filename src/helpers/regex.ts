export class Regex {
    static findFonctionName(lineContent: string): RegExpExecArray | null {
        var regex = new RegExp('([a-zA-Z{1}][a-zA-Z0-9_]+)(?=\\()', 'i');

        var match = regex.exec(lineContent);

        return match;
    }
}