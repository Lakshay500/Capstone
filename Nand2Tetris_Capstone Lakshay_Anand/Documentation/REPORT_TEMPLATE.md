# Nand2Tetris Capstone Report — Make the Computer Draw a Box

**Student:** Lakshay Anand  
**University roll number:** [enter your full roll number]  
**Personal number K:** 49  
**K mod 3:** 1 — line-numbered errors for invalid assembler input  
**K mod 4:** 1 — two words per row  
**Submission deadline:** 30 November 2026

## 1. Objective

The objective is to integrate the Hack computer hardware using HDL, implement a two-pass Hack assembler in Python, and create a Hack assembly program that draws a personalised black rectangle while a keyboard key is pressed and clears it when the key is released.

## 2. Personalised box calculation

- Top row: `K = 49`
- Height: 20 screen rows
- Words per row: `(49 mod 4) + 1 = 2`
- Width: `2 × 16 = 32` pixels
- Horizontal position: left edge of the screen
- First screen word: `16384 + (32 × 49) = 17952`

Each screen row contains 32 words. Each word controls 16 horizontal pixels.

## 3. Part A — Hardware implementation

Describe the role and wiring of `CPU.hdl`, `Memory.hdl` and `Computer.hdl`. Identify any lab chips replaced by built-in chips, in accordance with the assignment instructions.

| Official test | Actual result | Evidence file |
|---|---|---|
| CPU.tst | [Pending — record actual result] | [screenshot filename] |
| Memory.tst | [Pending — record actual result] | [screenshot filename] |
| ComputerAdd.tst | [Pending — record actual result] | [screenshot filename] |
| ComputerMax.tst | [Pending — record actual result] | [screenshot filename] |
| ComputerRect.tst | [Pending — record actual result] | [screenshot filename] |

Do not mark a test as passed until it has been run against these project files in the official Hardware Simulator.

## 4. Part B — Python two-pass assembler

Explain:

1. Pass 1 removes comments and blank lines, counts ROM instructions and records label addresses.
2. Pass 2 translates A-instructions and C-instructions into 16-bit machine code.
3. Predefined symbols include `SP`, `LCL`, `ARG`, `THIS`, `THAT`, `R0`–`R15`, `SCREEN` and `KBD`.
4. Variables are allocated from RAM address 16.
5. The K-dependent feature for this submission is line-numbered error reporting because `49 mod 3 = 1`.

**Evidence to insert:** real unit-test output, assembly output, and comparison against the official assembler using the official course programs.

## 5. Part C — Personalised box program

Explain how `Box.asm` repeatedly checks the keyboard-mapped address. When a key is pressed, it writes `-1` to the two screen words on each of 20 rows. When the key is released, it writes `0` to those same words.

**Evidence to insert:** a genuine CPU Emulator screenshot with the box visible, and (if required) a screenshot after it is cleared. The bundled Python emulator is supplementary only.

## 6. One mistake I fixed

During HDL compilation, the PC chip's 16-bit output was initially connected directly to the CPU's 15-bit `pc` output. The Hardware Simulator reported a bus-width mismatch. The connection was corrected by exposing only `PC.out[0..14]` as the CPU's `pc[15]` output. Record the final official test used to verify the corrected implementation after you run it.

## 7. Conclusion

Summarise what was learned about CPU control, memory mapping, machine-code translation, symbol resolution and memory-mapped screen/keyboard I/O. Distinguish completed and tested work from work that remains unverified.
