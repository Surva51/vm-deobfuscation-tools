# Deobfuscation Methodology

This document outlines the approach we used to reverse engineer and understand the VM-based obfuscated JavaScript code.

## Overall Strategy

The deobfuscation process followed these high-level steps:

1. **Environment Simulation**: Create a Node.js environment that simulates browser APIs
2. **VM Instrumentation**: Add tracing to track bytecode execution
3. **Dynamic Analysis**: Execute the code with tracing to understand its behavior
4. **Static Analysis**: Map out the bytecode structure and opcode meanings
5. **Reconstruction**: Rebuild the original logic from execution traces

## Detailed Process

### 1. Stripping Away Helper Layers

The first layer of obfuscation used object properties with nonsensical names (like "nwOLN", "kSUUe", etc.) that were actually simple wrapper functions performing basic operations. We:

1. Identified all helper function patterns
2. Created replacement functions that logged their input/output
3. Gradually inlined these functions to reveal their true purpose

### 2. Browser Environment Emulation

To run the obfuscated code in a controlled Node.js environment, we created an environment shim (`env-shim.js`) that:

- Implements minimal DOM APIs needed by the code
- Provides mock objects for `window`, `document`, `navigator`, etc.
- Intercepts API calls to log and control execution
- Returns safe values to prevent unwanted network/storage access

This allowed us to analyze the code without actually executing its side effects.

### 3. VM Analysis

We reverse-engineered the virtual machine by:

1. **Identifying the VM structure**:
   - Found the bytecode array
   - Located the main interpreter loop
   - Mapped the stack and frame implementations

2. **Documenting the instruction set**:
   - Traced each opcode's execution
   - Determined what values it popped/pushed from the stack
   - Mapped out how values moved through the VM

3. **Understanding execution flow**:
   - Traced function creation and calls
   - Analyzed how closures captured variables
   - Mapped exceptions and control flow

### 4. Bytecode Tracing

We implemented VM tracing helpers that:

1. Logged every instruction's execution
2. Tracked stack state before/after each operation
3. Recorded values flowing through the VM

This produced execution traces that revealed the VM's actual behavior.

### 5. Case Study: Authentication Token Generation

For the token generation VM, we:

1. Identified the entry points for token generation functions
2. Traced the construction of the token through the VM
3. Understood the algorithms used (hashing, encoding, etc.)
4. Created a clean implementation that replicated the behavior

### 6. Case Study: Block Cipher (AES)

For the block cipher VM, we:

1. Recognized memory patterns typical of block ciphers
2. Identified the block size (16 bytes) and mode of operation (CBC)
3. Traced key schedule and round operations
4. Determined it was a non-standard AES implementation with split tables
5. Created a simplified implementation while documenting the design

## Challenges Faced

Several challenges made this deobfuscation particularly difficult:

1. **Obfuscated Control Flow**: The VM used special opcodes (80-89) to implement obfuscated jumps, making static analysis challenging.

2. **Non-Standard Implementations**: The AES implementation used a split key schedule, making it harder to recognize.

3. **Multiple Layers**: Both VMs had multiple layers of indirection, with helper functions accessing other helper functions.

4. **Anti-Debugging Mechanisms**: The code included various techniques to hinder debugging and analysis.

## Tools Created

To aid in deobfuscation, we created several tools:

1. **env-shim.js**: Browser environment simulation for Node.js
2. **vm-trace-helpers.js**: Utilities for tracking VM execution
3. **Bytecode disassembler**: Converting raw bytecode to readable instruction sequences
4. **Trace formatters**: Presenting execution traces in an understandable way

These tools allowed us to go from completely obfuscated code to a clear understanding of its behavior.

## Lessons Learned

This project yielded valuable insights:

1. VM-based obfuscation is significantly harder to defeat than standard minification or name mangling, but still analyzable with the right approach.

2. Dynamic analysis (running the code with instrumentation) is more effective than static analysis for VM-based obfuscation.

3. Creating a controlled execution environment is crucial for safe analysis of potentially malicious code.

4. Understanding the VM's design principles makes deobfuscation much more efficient.

5. Looking for patterns in standard cryptographic algorithms can help identify custom implementations.