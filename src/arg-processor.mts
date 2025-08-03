import { argv } from "node:process";

/**
 * A class holding data of an argument option.
 */
export class ArgOpt {
    /**
     * The short, left hand. The "h" in `h/help`.
     */
    short: string;
    /**
     * The long, right hand. The "help" in `h/help`.
     * Cannot be empty.
     */
    long: string;
    
    /**
     * Optional usage string placeholder for `ArgProcessor.helpString()`.
     */
    placeholder = "";
    /**
     * Optional description for `ArgProcessor.helpString()`.
     */
    description = "";
    
    /**
     * Whether to capture a value.
     */
    capture = false;
    /**
     * Captured value. Available after `ArgProcessor.process()`.
     */
    captured = "";
    /**
     * Whether option is a hit after `ArgProcessor.process()`.
     */
    proc = false;
    
    /**
     * Create an ArgOpt.
     * @param {string} argOptStr - The ArgOpt syntax string. Check "https://github.com/ello-guby/arg-processor.js" for more info.
     * @param {string} description - Optional description for `ArgProcessor.helpString()`.
     * @throws {SyntaxError} - If `argOptStr` is not valid.
     */
    constructor(argOptStr: string, description = "") {
        const { short, long, placeholder, capture } = ArgOpt.parse(argOptStr);
        this.short = short;
        this.long = long;
        this.capture = capture;
        this.placeholder = placeholder;
        this.description = description;
    }
    
    /**
     * Return this in ArgOpt syntax string.
     * @returns {string} - The "i/input=DIR" string.
     */
    toString(): string {
        const cap = this.capture ? "=" : "";
        return `${this.short}/${this.long}${cap}${this.placeholder}`;
    }

    /**
     * Generate a help string.
     * @returns {string} - Generated help string.
     */
    helpString(): string {
        let usageStr = "";
        if (this.short) {
            usageStr += `\x1b[34;1m-${this.short}\x1b[0m`;
        }
        if (this.long) {
            if (usageStr) {
                usageStr += `\x1b[90;1m | \x1b[0m`;
            }
            usageStr += `\x1b[34;1m--${this.long}\x1b[0m`;
        }
        if (this.capture) {
            const placeholder = this.placeholder || this.long;
            usageStr += `\x1b[32;1m <${placeholder}>\x1b[0m`;
        }
        const desc = this.description ? `\r\n\t\x1b[35;1m${this.description}\x1b[0m` : "";
        return `
            \r${usageStr}${desc}
        `;
    }

    valueOf(): string {
        return this.toString();
    }
    
    /**
     * Parse `ArgOpt` syntax string to an object.
     * Check "https://github.com/ello-guby/arg-processor.js" for more info.
     * @param {string} argOptStr - the `ArgOpt` syntax string: "h/help".
     * @throws {SyntaxError} - If the syntax of `argOptStr` is invalid.
     * @returns {{ short: string, long: string, capture: boolean, placeholder: string } }
     *          - An object containing a parsed `argOptStr`.
     */
    static parse(
        argOptStr: string
    ): {
        short: string,
        long: string,
        capture: boolean,
        placeholder: string,
    } {
        let short = "";
        let long = "";
        let capture = false;
        let placeholder = "";

        let split = false;
        let str = argOptStr;
        
        if (str.search("=") !== -1) {
            capture = true;
            placeholder = str.substring(str.search("=") + 1);
            str = str.substring(0, str.search("="));
        }

        for (const char of str) {
            if (char === "/") {
                split = true;
                continue;
            }
            if (char.search(/[\w\d]/) === -1) {
                throw SyntaxError(`"${char}" in "${argOptStr}" is not right.`);
            }
            if (!split) {
                short = short + char;
            }
            else {
                long = long + char;
            }
        }

        if (!split) {
            throw SyntaxError(`"${argOptStr}" did not have separator ("/").`);
        }

        if (long.length === 0) {
            throw SyntaxError(`"${argOptStr}" cannot have empty long.`);
        }
        
        return { short: short, long: long, capture: capture, placeholder: placeholder };
    }
}

/**
 * A class simplifying the parsing of node:process.argv.
 */
export class ArgProcessor {
    /**
     * Throw any invalid argument options.
     */
    strict: boolean = true;

    /**
     * A list of the options (ArgOpt) that will be parsed.
     */
    opts: Record<string, ArgOpt> = {};

    /**
     * Create an ArgProcessor.
     * @param {ArgOpt[]} opts - An array of ArgOpts that will get prepared for `ArgProcessor.process()`.
     * @throws {ReferenceError} - If `opts` intersect. ["i/input", "i/interact"] will trhow due to same short.
     */
    constructor(opts: ArgOpt[] = []) {
        for (const [iter, opt] of opts.entries()) {
            // matching
            for (const [miter, mopt] of opts.entries()) {
                if (iter === miter) { continue; }
                if (opt.short === mopt.short) {
                    throw ReferenceError(
                        `"${opt.toString()}" in "opts[${iter}]" and "${mopt.toString()}" in "opts[${miter}]" have an identical short.`
                    )
                }
                if (opt.long === mopt.long) {
                    throw ReferenceError(
                        `"${opt.toString()}" in "opts[${iter}]" and "${mopt.toString()}" in "opts[${miter}]" have an identical long.`
                    )
                }
            }
            this.opts[opt.long] = opt;
        }
    }
    
    /**
     * Insert/Replace an opt.
     * @param {ArgOpt} opt - An ArgOpt to get inserted.
     * @throws {ReferenceError} - If the short is matching with other opts.
     */
    pushOpt(opt: ArgOpt): void {
        for (const mopt of Object.values(this.opts)) {
            if ((opt.short === mopt.short) && !(opt.long === mopt.long)) {
                throw ReferenceError(
                    `${opt.toString()} and ${mopt.toString()} have the same short.`
                );
            }
        }
        this.dropOpt(opt.long);
        this.opts[opt.long] = opt;
    }
    
    /**
     * Insert/Replace an opt with ArgOpt syntax string.
     * @param {string} optStr - ArgOpt syntax string.
     * @param {string} desc - The description.
     * @throws {ReferenceError} - If the short is matching with other opts.
     */
    pushOptStr(optStr: string, desc = ""): void {
        const o = new ArgOpt(optStr, desc);
        this.pushOpt(o);
    }

    /**
     * Remove an opt from `ArgProcessor.opts` or all with "*".
     * @param {string|"*"} opt - A long to be removed. Or "*" to remove all.
     */
    dropOpt(opt: string|"*"): void {
        if (opt === "*") {
            for (const opt of Object.keys(this.opts)) {
                delete this.opts[opt];
            }
        } else {
            delete this.opts[opt];
        }
    }
    
    /**
     * Process the opts with arrayed arguments.
     * @param {string[]} [args=argv] - An array of arguments. Default `node:process.argv`.
     * @throws {ReferenceError} - If an option that require value is not supplied. Or if an argument option doesn't match any ArgOpts, set `ArgProcessor.strict` to `true` to disable.
     * @returns {string[]} - Non-argument-options arguments.
     */
    process(args: string[] = argv): string[] {
        this.resetOpt();

        const filtered: string[] = [];

        let captureNext = false;
        let lastCapKey = "";

        for (const [iter, arg] of args.entries()) {

            if (captureNext) {
                captureNext = false;
                this.opts[lastCapKey].captured = arg;
                lastCapKey = "";
                continue;
            }

            let optKey = "";
            let long = false;
            let recog = false; //nized
            if (arg.startsWith("--")) {
                optKey = arg.substring(2);
                long = true;
            } else if (arg.startsWith("-")) {
                optKey = arg.substring(1);
            }
            if (optKey) {
                const key = optKey.substring(0, optKey.search("=")) || optKey;
                for (const [keyOpt, argOpt] of Object.entries(this.opts)) {
                    if ((long && (key === argOpt.long)) || (!long && (key === argOpt.short))) {
                        this.opts[keyOpt].proc = recog = true;
                        if (argOpt.capture) {
                            const valIdx = optKey.search("=");
                            if (valIdx !== -1) {
                                const val = optKey.substring(valIdx + 1);
                                if (!val) {
                                    throw ReferenceError(`must supply value for "${arg}".`);
                                }
                                this.opts[keyOpt].captured = val;
                            } else {
                                if (args[iter + 1] === undefined) {
                                    throw ReferenceError(`must supply value for "${arg}".`);
                                }
                                captureNext = true;
                                lastCapKey = keyOpt; 
                            }
                        }
                        break;
                    }
                }
            } else {
                filtered.push(arg);
            }

            if (this.strict && optKey && !recog) {
                throw ReferenceError(`Unrecognized option: "${arg}"`);
            }
            if (!this.strict && optKey && !recog) {
                filtered.push(arg);
            }
        }
        return filtered;
    }

    /**
     * `ArgProcessor.process()` but whole string.
     * @param {string} args - an argument string.
     * @returns {string[]} - Non-argument-option arguments
     */
    processStr(args: string) {
        const argStack: string[] = [];
        for (const arg of args.split(" ")) {
            if (arg) {
                argStack.push(arg);
            }
        }
        return this.process(argStack);
    }

    /**
     * Reset all the `ArgProcessor.opts`'s `.proc` and `.captured`.
     */
    resetOpt(): void {
        for (const key of Object.keys(this.opts)) {
            this.opts[key].captured = "";
            this.opts[key].proc = false;
        }
    }

    /**
     * Generate an help help string of all the `ArgProcessor.opts`.
     * @returns {string} - help string.
     */
    helpString(): string {
        let helpStr = "";
        for (const opt of Object.values(this.opts)) {
            helpStr += opt.helpString();
        }
        return helpStr;
    }

    /**
     * Get proc.
     * @param {string} long - The option-to-get-proc's long.
     * @returns {boolean|undefined} - undefined if `long` deosn't exist.
     */
    proced(long: string): boolean|undefined {
        return this.opts[long].proc;
    }

    /**
     * Get captured value.
     * @param {string} long - The option-to-get-value's long.
     * @returns {string|undefined} - undefined if `long` doesn't exist.
     */
    value(long: string): string|undefined {
        return this.opts[long].captured;
    }
    
    /**
     * Just like the constructor but using object,
     * where the keys are the ArgOpt syntax strings and the values are the descriptions.
     * @param {Record<string, string>} opts - object with ArgOpt syntax string keys and descriptsion values.
     */
    static new(opts: Record<string, string>): ArgProcessor {
        const stack: ArgOpt[] = [];
        for (const [synstr, desc] of Object.entries(opts)) {
            stack.push(new ArgOpt(synstr, desc));
        }
        return new ArgProcessor(stack);
    }
}
