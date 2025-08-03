const { ArgOpt, ArgProcessor } = require("./arg-processor.mts");

// Initiate the processor.
const argProcessor = new ArgProcessor();

// Insert option.
// Using fish shell argparse like syntax.
// Where "/" is the separator between left hand of the right hand.
argProcessor.pushOptStr("h/help");


// Then let's say the arguments are `app --help`.
argProcessor.process(["app", "--help"]);

// Which will "proc" the "h/help" ArgOpt.
// To know if it is "proc":
console.assert(argProcessor.proced("help") === true);

// And if you want to capture a value.
// Consider this syntax, just put "=" at the end.
argProcessor.pushOptStr("i/input=");

// There are 2 ways ArgProcessor can capture value.
// The "after equal"(`-i=img.png`), and "separated"(`-i img.png`) argument.
// Soo something like:
argProcessor.process(["app", "-i=img.png"]);
// and:
argProcessor.process(["app", "-i", "img.png"]);
// will capture the `img.png`
console.assert(argProcessor.value("input") === "img.png");

// ArgProcessor also support "h/help" displayer.
console.log(argProcessor.helpString());
// This will generate "help string" based of it's ArgOpts.

// Kinda empty?
// We're missing description, to add one we need to use ArgOpt constructor.
// Just like the argparse syntax, supply the 2nd argument with the description.
argProcessor.pushOpt(new ArgOpt("h/help", "Show help.")); // dont worry, the 1st one will get replaced.
// It will get shown in `ArgProcessor.helpString()`.

// Eh, you dont want the <input> to be <input>? but more like <file>?
// Just put the name after the capture syntax `=` like:
argProcessor.pushOpt(new ArgOpt("i/input=file", "Input a file to the program."));

// Voila!
console.log(argProcessor.helpString());

// Lastly, you can shortly create ArgProcessor with ArgOpt and its description!
// Consider `ArgProcessor.new()`. another constructor for ArgProcessor.
// Using it like:
const ap = ArgProcessor.new({
    "h/help": "Show this.",
    "i/input=path": "Input a file into this program.",
    "o/output=path": "Where to put?",
});
console.log(ap.helpString());
