# Nand2Tetris Capstone — Lakshay Anand

A personalised capstone workspace for the three assignment parts: Hack hardware in HDL, a two-pass Python assembler, and a key-controlled personalised box program.

## Personalisation

| Item | Value |
|---|---:|
| Student | Lakshay Anand |
| Personal number K | **49** |
| K mod 3 | **1 — line-numbered assembler errors** |
| K mod 4 | **1 — two 16-bit words per row** |
| Box position | Row 49, left edge |
| Box dimensions | **32 pixels wide × 20 rows high** |
| First screen word | **17952** (`16384 + 32 × 49`) |

The full university roll number is intentionally not reproduced here; add it to the report yourself if required.

## Project contents

- `Part-A-Computer/` — CPU, Memory and Computer HDL source, plus a folder for genuine official simulator evidence.
- `Part-B-Assembler/` — two-pass assembler, K=49 configuration, sample programs, generated machine code and unit tests.
- `Part-C-Box-Program/` — personalised Box.asm / Box.hack, generator and optional Python demonstration emulator.
- `Documentation/` — setup, report template, viva preparation and verification checklist.

## Run on macOS

From Terminal, change into this project directory, then:

```bash
cd Part-B-Assembler
python3 -m unittest discover -s tests -v
python3 assembler.py programs/Add.asm
python3 assembler.py programs/Max.asm
python3 assembler.py programs/Rect.asm
python3 assembler.py programs/Pong.asm
```

Generate and assemble the personalised box:

```bash
cd ../Part-C-Box-Program
python3 generate_box.py
python3 ../Part-B-Assembler/assembler.py Box.asm -o Box.hack
```

Optional visual demonstration (uses Tkinter):

```bash
python3 emulator.py Box.hack
```

Click the emulator window and hold a key to draw the box; release the key to clear it. This is a supplementary Python demonstration, not a replacement for the required official Nand2Tetris CPU Emulator evidence.

## Part A — official hardware verification

Open the three `.hdl` files in the official Hardware Simulator and run the course-provided `CPU.tst`, `Memory.tst`, `ComputerAdd.tst`, `ComputerMax.tst`, and `ComputerRect.tst`. The course test scripts/reference comparison files are not included in the supplied archive, so they have not been fabricated here. Save genuine screenshots under `Part-A-Computer/tests/`.

The HDL uses standard built-in Nand2Tetris chips including ALU, ARegister, DRegister, PC, RAM16K, Screen, Keyboard, ROM32K and mux/demux components. Disclose any built-in substitutions required by your course's lab-chip policy in the report.

## Verification status

- Python assembler unit tests: **4/4 passed** in this workspace.
- Sample Add, Max, Rect and Pong programs: assembled successfully; these bundled samples are smoke tests, not substitutes for the official course programs.
- Personalised Box program: **82 machine instructions** generated; the included Python Hack-machine demonstration verified 20 rows × 2 words at row 49, confirmed adjacent words remained untouched, and confirmed key release clears the box.
- HDL: source has been prepared and reviewed, but **the official Hardware Simulator tests have not yet been run against these local files**. Do not mark Part A as passed until you run the official scripts.

See `Documentation/VERIFICATION_STATUS.md` for the precise evidence checklist.
