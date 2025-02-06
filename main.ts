import * as readline from 'readline';
import { LStar } from './lstar';

function measureTime<T>(func: () => Promise<T>): () => Promise<T> {
    return async () => {
        const startTime = Date.now();
        const result = await func();
        const endTime = Date.now();
        console.log(`Время выполнения ${(func as any).name}: ${((endTime - startTime) / 1000).toFixed(4)} секунд`);
        return result;
    };
}

const main = measureTime(async function main(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    function question(query: string): Promise<string> {
        return new Promise((resolve) => {
            rl.question(query, resolve);
        });
    }

    console.log('Введите n:');
    const nInput: string = await question('');
    const n: number = parseInt(nInput, 10);

    console.log('Введите m:');
    const mInput: string = await question('');
    const m: number = parseInt(mInput, 10);

    console.log('Введите число выходов:');
    const exitNumInput: string = await question('');
    const exit_num: number = parseInt(exitNumInput, 10);

    console.log('Определите разрывы стен:');
    const wallBreakInput: string = await question('');
    const wall_break: number = parseInt(wallBreakInput, 10);

    const table = new LStar('NSWE', n, m);

    table.generateGraph(n, m, exit_num, wall_break);

    table.extendTable();
    let response: string =  (await table.checkTable(table.getTableJson())) ?? "";
    console.log(`Контрпример: ${response}`);

    while (response !== "true") {
        table.addSuffixesFromCounterExample(response);
        table.extendTable();
        response = await table.checkTable(table.getTableJson()) ?? "";
        if (response !== "true") {
            console.log(`Контрпример: ${response}`);
        }
    }

    console.log(table.toString());
    console.log(`Проверок таблицы: ${table.checkTableCounter}, Проверок вхождения: ${table.checkMembershipCounter}`);

    rl.close();
});

main();
