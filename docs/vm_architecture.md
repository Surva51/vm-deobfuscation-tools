# Virtual Machine Architecture

This document describes the architecture of the JavaScript virtual machine (VM) used for code obfuscation that we analyzed in this research.

## Overview

The VM implements a stack-based architecture with a custom bytecode format. The obfuscated code is first compiled into this bytecode, which is then interpreted by the VM at runtime. This approach effectively hides the original code's intent and control flow.

## Core Components

### 1. Call Frame Structure

The VM uses a flat dictionary to represent each function's execution context:

| Field | Purpose |
|-------|---------|
| `0`, `1`, `2`, ... | Function arguments and local variables |
| `length` | Number of arguments passed to the function |
| `d` | Depth of this frame (0 = root frame, 1 = first closure, etc.) |
| `$0`, `$1`, `$2`, ... | References to outer frames for closures |
| `$d` | Self-pointer to the current frame |

Key invariant: `callFrame["$" + callFrame.d] === callFrame`

This structure allows the VM to implement closures by maintaining references to parent frames.

### 2. VM Interpreter

The interpreter function has this signature:

```javascript
function vmInterpreter(
  hexSource,       // Bytecode as hex string
  startOffset,     // Where to start execution
  bytecodeSize,    // How many bytes to interpret
  inputStack,      // Initial operand stack (usually empty)
  callFrame,       // Current execution frame
  contextObject,   // 'this' binding
  exceptionObject, // For exception handling
  scratchFlag      // No-op/anti-debug flag
) {
  // VM implementation
}
```

The interpreter executes bytecode one instruction at a time, maintaining:
- An operand stack for calculations
- A program counter (PC)
- References to various execution contexts

### 3. Bytecode Format

Each instruction consists of:
- 1-byte opcode (determines the operation)
- 0 or more operands (depending on the opcode)

The VM reads the bytecode as hex digits, converting pairs of digits into instruction bytes.

### 4. Instruction Set

The VM has approximately 60 different opcodes, broadly categorized as:

#### Stack Operations
- `PUSH_STRING`, `PUSH_INT8`, `PUSH_INT16` - Push constants onto stack
- `STORE_FRAME` - Pop value from stack and store in callFrame
- `LOAD_LOCAL` - Push value from callFrame onto stack

#### Object Operations
- `LOAD_PROPERTY` - Access object properties
- `STORE_PROPERTY_BY_STRING` - Set object properties

#### Control Flow
- `JMP`, `JMP_IF_FALSE` - Conditional and unconditional jumps
- `OBF_BRANCH_*` - Obfuscated jump instructions (specially encoded)

#### Function Operations
- `CREATE_FUNCTION` - Create a closure function
- `CALL_VARARGS` - Call a function with arguments

#### Other Operations
- `TYPEOF`, `BITNOT`, `INSTANCEOF` - Type and operator instructions
- `TRY_CATCH_FINALLY` - Exception handling

### 5. Execution Model

1. **Function Creation**: When the VM encounters a `CREATE_FUNCTION` opcode, it creates a new function object with metadata about where its bytecode lives.

2. **Function Call**: When a VM function is called, the interpreter:
   - Creates a new callFrame
   - Copies arguments into the new frame
   - Sets up closure links to parent frames
   - Jumps to the function's bytecode

3. **Exception Handling**: The VM implements JavaScript's try/catch/finally using special exception blocks that track where to jump when an exception occurs.

## Obfuscation Techniques

Beyond the VM itself, several techniques make analysis harder:

1. **Obfuscated Jumps**: Opcodes 80-89 implement jumps with additional stack manipulation to confuse static analysis.

2. **Anti-Debugging**: The VM includes countermeasures against debugging, such as:
   - Using a scratch flag to detect tracing
   - Complex control flow patterns

3. **Closure Model**: The VM's implementation of closures makes data flow analysis challenging because variables can be accessed through multiple levels of indirection.

## Deobfuscation Approach

Our deobfuscation strategy involved:

1. Implementing a browser environment shim (included in this repository)
2. Tracing bytecode execution with added instrumentation
3. Reconstructing the original program flow from execution traces
4. Structuring the control flow to produce readable JavaScript

The VM trace helpers (also included) were crucial for this process, allowing us to track:
- Stack operations
- Memory accesses
- Control flow jumps
- Function calls and returns