# arg-processor.js

Easily parse the options/switches in argv.

## Install.

Just copy `arg-processor.mts` in `./src/` into your project library.

## Argument Option Syntax.

This Library use [fish](https://fishshell.com/)'s argparse like syntax.

Consider this piece of string:
```
h/help
```
That syntax can catch argument switches such as `-h` or `--help`.

Basically, the left, which is `h` can catch single dashed (`-`) argument switchs.
We will refer that as *short*.
And the right, which is `help` can catch double dashed (`--`) argument options.
And we will refer that as *long*.

Usually there should be some way to capture a supplied value. That way is to put `=`
at the end of *long*:
```
i/input=
```
This syntax will catch argument switches such as `-i` or `--input` and also will capture
the next argument. It also can catch and capture `-i=aFile`.

### Documenting.

We can also put a word after the *capturing character* (`=`) as a placeholder.
Yes, placeholder, not initial value. For initial value we can just use
javascript `value = ArgProcessor.value("input") || "default value"` syntax.

Take a gander on this syntax:
```
i/input=file_path
```
That syntax will work just like previous syntax but also when returning from
`ArgOpt.helpString()` will give you:
```
-i | --input <file_path>
```
Which are pretty more easy for people with `-h` to understand.

> [!IMPORTANT]
> every syntax must have `/` separator and *long*.

## Usage.

1. Import the `arg-processor.mts`:
    - esmodule:
        ```javascript
        import { ArgOpt, ArgProcessor } from "/path/to/arg-processor.mts";
        ```
    - commonjs:
        ```javascript
        const { ArgOpt, ArgProcessor } = require("/path/to/arg-processor.mts");
        ```

2. Create an `ArgProcessor` instance:
```javascript
const ap = new ArgProcessor();
```

3. Insert/Supply an option/switch:
    - Normal:
    ```javascript
    ap.pushOpt(new ArgOpt("h/help"));
    ```
    - With capturing:
    ```javascript
    ap.pushOpt(new ArgOpt("i/input="));
    ```

4. Process argument:
```javascript
ap.processStr("app -h");
```

5. Aquire argument:
    - Normal:
    ```javascript
    const needHelp = ap.proced("help");
    ```
    - With capturing:
    ```javascript
    const input = ap.proced("input") ? ap.value("input") : "default input";
    ```

6. Evaluation:
```javascript
if (needHelp) {
    ap.helpString();
}
if (input) {
    doSmthWith(input);
}
```
