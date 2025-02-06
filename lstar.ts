import Session from "./session";

type Table = { [prefix: string]: string[] };

export class LStar extends Session {
    private mainTable: Table;
    private complementaryTable: Table;
    private suffixes: string[];
    private alphabet: string[];
    private epsilon: string;
    private n: number;
    private m: number;

    constructor(alphabetStr: string, n: number, m: number) {
        super();
        this.mainTable = { "": ["0"] };
        this.complementaryTable = {};
        this.suffixes = [""];
        this.alphabet = alphabetStr.split("");
        this.epsilon = "e";
        this.n = n;
        this.m = m;
    }

    opt1(prefix: string): string {
        let serie = 0;
        let letter = "#";
        const newPrefix: string[] = [];

        for (const currentLetter of prefix) {
            if (currentLetter !== letter) {
                serie = 1;
                letter = currentLetter;
                newPrefix.push(currentLetter);
            } else {
                serie += 1;
                if (letter === "N" || (letter === "S" && serie <= this.n * 2 + 2)) {
                    newPrefix.push(currentLetter);
                }
                if (letter === "W" || (letter === "E" && serie <= this.m * 2 + 2)) {
                    newPrefix.push(currentLetter);
                }
            }
        }
        return newPrefix.join("");
    }
    applySimplifyRule(block: string[], a: string, b: string): string {
        const blockStr = block.join("");
        const groupedLetters: Array<[string, number]> = [];

        if (blockStr.length > 0) {
            let currentChar = blockStr[0];
            let count = 1;
            for (let i = 1; i < blockStr.length; i++) {
                if (blockStr[i] === currentChar) {
                    count++;
                } else {
                    groupedLetters.push([currentChar, count]);
                    currentChar = blockStr[i];
                    count = 1;
                }
            }
            groupedLetters.push([currentChar, count]);
        }

        groupedLetters.push([a, 0]);

        const groupLen = groupedLetters.length - 1;

        let i = 1;
        while (i < groupLen) {
            if (groupedLetters[i][0] === b) {
                const x = groupedLetters[i - 1][1];
                const y = groupedLetters[i][1];
                const z = groupedLetters[i + 1][1];
                if (y <= x && z >= y) {
                    groupedLetters[i + 1][1] = x + z - y;
                    groupedLetters[i][1] = 0;
                    groupedLetters[i - 1][1] = 0;
                }
            }
            i++;
        }
        const result = groupedLetters
            .map(([char, count]) => char.repeat(count))
            .join("");
        return result;
    }
    shortenBlock(block: string[]): string {
        if (block.length === 0) {
            return "";
        }
        if (block[0] === "N" || block[0] === "S") {
            let simplified = this.applySimplifyRule(block, "N", "S");
            simplified = this.applySimplifyRule(simplified.split(""), "S", "N");
            return simplified;
        } else {
            let simplified = this.applySimplifyRule(block, "W", "E");
            simplified = this.applySimplifyRule(simplified.split(""), "E", "W");
            return simplified;
        }
    }
    opt2(prefix: string): string {
        const typeByLetter: { [key: string]: "vertical" | "horizontal" } = {
            N: "vertical",
            S: "vertical",
            W: "horizontal",
            E: "horizontal",
        };
        const blocks: string[][] = [];
        if (prefix.length === 0) return "";
        blocks.push([prefix[0]]);
        for (let i = 1; i < prefix.length; i++) {
            const currentLetter = prefix[i];
            const lastBlock = blocks[blocks.length - 1];
            if (
                typeByLetter[lastBlock[0]] === typeByLetter[currentLetter]
            ) {
                lastBlock.push(currentLetter);
            } else {
                blocks.push([currentLetter]);
            }
        }

        const simplifiedBlocks = blocks.map((block) =>
            this.shortenBlock(block)
        );
        return simplifiedBlocks.join("");
    }
    buildMainPrefixes(): void {
        for (const [compPrefix, row] of Object.entries(this.complementaryTable)) {
            let exists = false;
            for (const mainRow of Object.values(this.mainTable)) {
                if (JSON.stringify(mainRow) === JSON.stringify(row)) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                this.mainTable[compPrefix] = row;
                delete this.complementaryTable[compPrefix];
            }
        }
    }
    addPrefix(prefix: string): void {
        prefix = this.opt2(this.opt1(prefix));
        if (this.mainTable.hasOwnProperty(prefix) || this.complementaryTable.hasOwnProperty(prefix)) {
            return;
        }
        this.complementaryTable[prefix] = [];
        for (const suffix of this.suffixes) {
            const query = prefix + suffix;
            this.checkMembership(query).then((result) => {
                this.complementaryTable[prefix].push(result ?? "");
            }).catch((error) => {
                console.error(`Ошибка при проверке ${query}: ${error}`);
            });
        }
    }
    extendTable(): void {
        for (const mainPrefix in this.mainTable) {
            for (const letter of this.alphabet) {
                this.addPrefix(mainPrefix + letter);
            }
        }
        this.buildMainPrefixes();
    }
    addSuffixesFromCounterExample(counterExample: string): void {
        for (let i = 0; i < counterExample.length; i++) {
            const suffix = counterExample.slice(counterExample.length - 1 - i);
            if (!this.suffixes.includes(suffix)) {
                this.suffixes.push(suffix);

                for (const mainPrefix in this.mainTable) {
                    this.checkMembership(mainPrefix + suffix).then((response) => {
                        this.mainTable[mainPrefix].push(response ?? "");
                    }).catch(error => console.error(`Ошибка checkMembership: ${error}`));
                }

                for (const compPrefix in this.complementaryTable) {
                    this.checkMembership(compPrefix + suffix).then((response) => {
                        this.complementaryTable[compPrefix].push(response ?? "");
                    }).catch(error => console.error(`Ошибка checkMembership: ${error}`));
                }
            }
        }
        this.buildMainPrefixes();
    }

    replaceEmptyWithEpsilon(lst: string[]): string[] {
        return lst.map((x) => (x === "" ? this.epsilon : x));
    }

    getTableJson(): string[] {
        const mainPrefixes: string[] = Object.keys(this.mainTable);
        const complementaryPrefixes: string[] = Object.keys(this.complementaryTable);
        const suffixes: string[] = [...this.suffixes];
        const table: string[] = [];

        for (const mainPrefix of mainPrefixes) {
            for (let i = 0; i < suffixes.length; i++) {
                table.push(String(this.mainTable[mainPrefix][i]));
            }
        }
        for (const compPrefix of complementaryPrefixes) {
            for (let i = 0; i < suffixes.length; i++) {
                table.push(String(this.complementaryTable[compPrefix][i]));
            }
        }

        const mainPrefixesStr = this.replaceEmptyWithEpsilon(mainPrefixes).join(" ");
        const compPrefixesStr = this.replaceEmptyWithEpsilon(complementaryPrefixes).join(" ");
        const suffixesStr = this.replaceEmptyWithEpsilon(suffixes).join(" ");
        const tableStr = table.join("");

        return [mainPrefixesStr, compPrefixesStr, suffixesStr, tableStr];
    }

    toString(): string {
        const tableRows: string[][] = [];
        tableRows.push(["Main prefixes / Suffixes", ...this.replaceEmptyWithEpsilon(this.suffixes)]);

        for (const mainPrefix in this.mainTable) {
            const row = [mainPrefix === "" ? this.epsilon : mainPrefix, ...this.mainTable[mainPrefix]];
            tableRows.push(row);
        }

        tableRows.push(["Complementary prefixes", ...Array(this.suffixes.length - 1).fill("*")]);

        for (const compPrefix in this.complementaryTable) {
            const row = [compPrefix, ...this.replaceEmptyWithEpsilon(this.complementaryTable[compPrefix])];
            tableRows.push(row);
        }

        const formattedRows = tableRows.map((row) => row.join(" | "));
        return formattedRows.join("\n");
    }
}
