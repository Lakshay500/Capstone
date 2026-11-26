# Part A — Build the Hack Computer

This folder contains the three top-level HDL chips required by the assignment:

- `CPU.hdl` — registers, ALU control, memory write and jump control.
- `Memory.hdl` — RAM16K, screen and keyboard memory map.
- `Computer.hdl` — joins ROM32K, CPU and Memory.

## Memory map detail

`Memory.hdl` decodes `address[14..13]`: `00` and `01` select the full 16K RAM range, `10` selects Screen, and `11` selects Keyboard. The two RAM select lines are combined for the RAM16K load input, and the read mux routes both RAM regions to the same RAM16K output.

## Run the official tests

1. Open the official Hardware Simulator.
2. Load each chip from this folder.
3. Run the course-provided `CPU.tst`, `Memory.tst`, `ComputerAdd.tst`, `ComputerMax.tst` and `ComputerRect.tst`.
4. Save genuine screenshots in `tests/`.

The official `.tst` scripts and `.cmp` reference files were not included in the supplied assignment archive. Obtain them from your course/Nand2Tetris software distribution; do not invent test results.

## Built-in chips

This implementation uses standard built-in chips such as `ALU`, `ARegister`, `DRegister`, `PC`, `RAM16K`, `Screen`, `Keyboard`, `ROM32K`, and mux/demux chips. Identify any lab chip replaced by a built-in chip in your report, as required by the assignment.
