# Custom Block Cipher Analysis

The second VM project we analyzed involved a custom block cipher implementation. Through careful analysis of the VM bytecode, we were able to determine that this was a non-standard implementation of AES-128-CBC.

## Key Findings

The implementation has several distinctive characteristics:

1. **Split Key Schedule**: The key schedule is split into two 4×11 tables, rather than the typical single array structure used in standard AES implementations.

2. **PKCS#7 Padding**: The input is padded using PKCS#7 before encryption. The implementation strictly validates that input length is a multiple of 16 bytes.

3. **Custom Memory Management**: The VM uses custom allocation helpers for working with byte arrays, using functions at specific bytecode offsets to allocate and copy memory.

4. **CBC Mode Implementation**: The cipher implements CBC (Cipher Block Chaining) mode of operation, where each block is XORed with the previous ciphertext block before encryption.

## VM Bytecode Execution Flow

The bytecode execution can be summarized as follows:

1. **Input Validation**: 
   ```
   if (input.length % 16 !== 0) {
     throw new Error("invalid error");
   }
   ```

2. **Buffer Allocation**:
   ```
   resultBuffer = new Uint8Array(input.length);
   scratch = new Uint8Array(16); // Work buffer for each block
   ```

3. **Main Encryption Loop**:
   ```
   for (let offset = 0; offset < input.length; offset += 16) {
     // Copy 16-byte chunk to scratch buffer
     copyBytes(input, scratch, 0, offset, offset + 16);
     
     // XOR with previous ciphertext (or IV for first block)
     for (let i = 0; i < 16; i++) {
       scratch[i] ^= resultBuffer[i];
     }
     
     // Encrypt the block
     encryptBlock(scratch);
     
     // Copy encrypted block to result buffer
     copyBytes(scratch, resultBuffer, offset, 0, 16);
   }
   ```

## AES Key Schedule Analysis

The non-standard key schedule implementation splits the standard AES key schedule into two separate tables:

1. **Round Key Table 1**: Contains the first 4 bytes of each round key (16 bytes × 11 rounds = 44 words)
2. **Round Key Table 2**: Contains the remaining bytes of each round key

This split design makes the implementation harder to recognize as AES at first glance and adds a layer of obfuscation to the algorithm.

## Implementation Notes

The custom implementation follows the core AES steps:
- SubBytes (using a standard S-box)
- ShiftRows 
- MixColumns
- AddRoundKey

However, these operations are heavily obfuscated in the VM bytecode, making direct identification challenging without tracing execution.

## Security Implications

While the custom implementation follows AES's mathematical foundations, the non-standard implementation approach:

1. Makes auditing more difficult
2. Could potentially introduce subtle implementation bugs
3. Doesn't provide any cryptographic advantage over standard AES

From a cryptanalytic perspective, the implementation is still AES and maintains the same security properties, assuming no implementation errors exist.