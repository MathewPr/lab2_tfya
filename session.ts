import axios, { AxiosInstance } from "axios";

class Session {
    private axiosInstance: AxiosInstance;
    public checkMembershipCounter: number;
    public checkTableCounter: number;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: 5000,
            headers: {"Content-Type": "application/json"}
        });
        this.checkMembershipCounter = 0;
        this.checkTableCounter = 0;
    }
    public async checkMembership(word: string): Promise<string | null> {
        this.checkMembershipCounter++;
        const url = "http://localhost:8080/check_membership";

        try {
            const response = await this.axiosInstance.post(url, word);
            return response.data;
        } catch (error) {
            console.error(`check_membership (${word}):`, error);
            return null;
        }
    }
    public async checkTable(args: any[]): Promise<string | null> {
        this.checkTableCounter++;

        const data = {
            main_prefixes: args[0],
            complementary_prefixes: args[1],
            suffixes: args[2],
            table: args[3]
        };
    
        const url = "http://localhost:8080/check_table";

        try {
            const response = await this.axiosInstance.post(url, data);

            if (response.status === 200) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error("check_table:", error);
            return null;
        }
    }
    public async generateGraph(n: number, m: number, exitNum: number, wallBreak: number): Promise<void> {
        const url = "http://localhost:8080/generate_graph";
        const data = {
            num_of_finish_edge: exitNum,
            pr_of_break_wall: wallBreak,
            width: m,
            height: n
        };

        try {
            const response = await axios.post(url, data);

            if (response.status === 200) {
                console.log("Граф успешно сгенерирован");
            }
        } catch (error) {
            console.error("Ошибка соединения:", error);
        }
    }
}

export default Session;
