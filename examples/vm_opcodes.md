# VM Opcode Reference

This document provides a reference for the virtual machine's instruction set, based on our analysis of the obfuscated code.

## Stack Operations

| Opcode | Name | Description |
|--------|------|-----------|
| 0x01 | PUSH_NULL | Push null onto the stack |
| 0x02 | PUSH_UNDEFINED | Push undefined onto the stack |
| 0x03 | PUSH_THIS | Push the current 'this' context onto the stack |
| 0x04 | PUSH_TRUE | Push boolean true onto the stack |
| 0x05 | PUSH_FALSE | Push boolean false onto the stack |
| 0x06 | PUSH_INT8 | Push an 8-bit integer from the next bytecode byte |
| 0x07 | PUSH_INT16 | Push a 16-bit integer from the next two bytecode bytes |
| 0x08 | PUSH_INT32 | Push a 32-bit integer from the next four bytecode bytes |
| 0x09 | PUSH_STRING | Push a string from the string table using the next bytecode word as index |
| 0x0A | PUSH_GLOBAL | Push the global object onto the stack |
| 0x0B | PUSH_ARRAY | Push a new empty array onto the stack |
| 0x0C | PUSH_TREG0 | Push the value of temporary register 0 |
| 0x0D | POP | Discard the top value from the stack |
| 0x0E | STORE_FRAME | Pop value and store in callFrame[operand] |
| 0x0F | LOAD_LOCAL | Push value from callFrame[operand] |

## Arithmetic & Logical Operations

| Opcode | Name | Description |
|--------|------|-----------|
| 0x10 | ADD | Pop two values, push their sum |
| 0x11 | SUB | Pop two values, push their difference |
| 0x12 | MUL | Pop two values, push their product |
| 0x13 | DIV | Pop two values, push their quotient |
| 0x14 | MOD | Pop two values, push remainder after division |
| 0x15 | NEG | Negate top value |
| 0x16 | BIT_AND | Bitwise AND |
| 0x17 | BIT_OR | Bitwise OR |
| 0x18 | BIT_XOR | Bitwise XOR |
| 0x19 | BIT_NOT | Bitwise NOT |
| 0x1A | LSHIFT | Left shift |
| 0x1B | RSHIFT | Right shift |
| 0x1C | URSHIFT | Unsigned right shift |
| 0x1D | LT | Less than |
| 0x1E | GT | Greater than |
| 0x1F | LE | Less than or equal |
| 0x20 | GE | Greater than or equal |
| 0x21 | EQ | Equality (==) |
| 0x22 | NE | Inequality (!=) |
| 0x23 | STRICT_EQ | Strict equality (===) |
| 0x24 | STRICT_NE | Strict inequality (!==) |
| 0x25 | LOGICAL_AND | Logical AND (&&) |
| 0x26 | LOGICAL_OR | Logical OR (||) |
| 0x27 | LOGICAL_NOT | Logical NOT (!) |

## Object Operations

| Opcode | Name | Description |
|--------|------|-----------|
| 0x30 | LOAD_PROPERTY | Load property value from object |
| 0x31 | STORE_PROPERTY | Store value to object property |
| 0x32 | DELETE_PROPERTY | Delete object property |
| 0x33 | HAS_OWN_PROPERTY | Check if object has own property |
| 0x34 | LOAD_PROPERTY_BY_STRING | Load property using string name |
| 0x35 | STORE_PROPERTY_BY_STRING | Store property using string name |
| 0x36 | MAKE_LVALUE_WRAPPER | Create reference to object property |
| 0x37 | COPY_TO_TREG | Copy stack value to temporary register |
| 0x38 | INSTANCE_OF | Check if object is instance of constructor |
| 0x39 | TYPE_OF | Get type of value |
| 0x3A | IN | Test if property exists in object |

## Control Flow

| Opcode | Name | Description |
|--------|------|-----------|
| 0x40 | JMP | Unconditional jump |
| 0x41 | JMP_IF_TRUE | Jump if top of stack is truthy |
| 0x42 | JMP_IF_FALSE | Jump if top of stack is falsy |
| 0x43 | THROW | Throw exception |
| 0x44 | TRY_CATCH_FINALLY | Set up exception handler |
| 0x45 | END_TRY | End exception handler |
| 0x46 | SAVE_STACKLEN | Save current stack length (debug helper) |
| 0x47 | ENTER_SCOPE | Begin a new lexical scope |
| 0x48 | EXIT_SCOPE | End a lexical scope |
| 0x49 | NOP | No operation |
| 0x4A | NOP3 | No operation (3 bytes) |

## Function Operations

| Opcode | Name | Description |
|--------|------|-----------|
| 0x50 | CREATE_FUNCTION | Create a function object |
| 0x51 | CALL_FUNCTION | Call a function |
| 0x52 | CALL_METHOD | Call an object method |
| 0x53 | CALL_VARARGS | Call with variable arguments |
| 0x54 | RETURN_VALUE | Return from function with value |
| 0x55 | RETURN_VOID | Return from function with no value |
| 0x56 | NEW | Create object with constructor |
| 0x57 | NEW_VARARGS | Create object with variable arguments |
| 0x58 | LOAD_FRAME_CELL | Load value from closure frame |
| 0x59 | LOAD_GLOBAL | Load value from global object |

## Obfuscation-specific Opcodes

| Opcode | Name | Description |
|--------|------|-----------|
| 0x80-0x89 | OBF_BRANCH_* | Obfuscated jump instructions |
| 0x8A | OBF_LOADINDEX_BRANCH | Load array index then branch |
| 0x8B | OBF_LOADPROP_BRANCH | Load property then branch |
| 0x8C | OBF_STORE_BRANCH | Store value then branch |
| 0x8D | OBF_JUNK_PUSH | Push junk value (anti-analysis) |
| 0x8E | OBF_JUNK_POP | Pop junk value (anti-analysis) |

## Notes on Usage

- Most opcodes follow a stack-based model: they pop their arguments from the stack and push results back.
- Jumps use relative offsets: the operand is added to the current PC.
- Function calls store their return address so execution can continue after the call.
- The obfuscated branch opcodes (0x80-0x89) are designed to confuse static analysis.