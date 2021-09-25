/* eslint-env node */
// The main file that is included when you run `require("eye-of-agamidi")`.
"use strict";
var fluid = require("infusion");

// Register our content so it can be used with calls like fluid.module.resolvePath("%eye-of-agamidi/path/to/content.js");
fluid.module.register("eye-of-agamidi", __dirname, require);
