# VM-based JavaScript Deobfuscation Tools

This repository contains tools and documentation for understanding and defeating VM-based JavaScript obfuscation. It's the result of research into advanced JavaScript protection techniques used by some web applications.

## What's inside?

- **Browser Environment Shim**: A lightweight NodeJS implementation of browser APIs that allows running browser-targeted obfuscated code in Node.js
- **VM Tracing Utilities**: Tools to help trace and understand VM bytecode execution
- **Documentation**: Detailed explanations of VM architecture and deobfuscation methodology

## Background

Modern JavaScript obfuscation often uses virtual machine (VM) techniques where the original code is compiled into bytecode and executed by a custom interpreter embedded in the script. This repository provides tools to analyze such protection.

The research focused on two different VM implementations:

1. **A VM-based API token generator** - A complex virtual machine executing custom bytecode to generate authentication tokens
2. **A custom block cipher implementation** - Analysis revealed this to be a non-standard AES implementation with a split key schedule

## Getting Started

The core of this project is the browser environment shim which allows you to execute browser-targeted JavaScript in Node.js:

```javascript
// Example usage
const fs = require('fs');
const vm = require('vm');

// Load the environment shim
const envShim = fs.readFileSync('./src/env-shim.js', 'utf8');

// Create a sandbox with our shim
const sandbox = vm.createContext({});
vm.runInContext(envShim, sandbox);

// Now you can run obfuscated code in this environment
vm.runInContext(obfuscatedCode, sandbox);
```

## Documentation

- [VM Architecture](docs/vm_architecture.md) - Detailed explanation of the VM structure
- [Block Cipher Design](docs/aes_design.md) - Analysis of the custom block cipher implementation
- [Deobfuscation Methodology](docs/deobfuscation_methodology.md) - The approach used to reverse-engineer the VMs

## Ethical Considerations

This repository is published for educational purposes only. The tools have been sanitized to remove any sensitive information:

- No encryption keys or initialization vectors
- No specific API endpoints or authentication details
- No complete implementation of proprietary algorithms

## License

MIT

## Acknowledgements

This research was conducted as a personal project to better understand advanced JavaScript obfuscation techniques.