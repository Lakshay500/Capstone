# Setup and execution — macOS

## 1. Check Python

```bash
python3 --version
```

Python 3.10+ is recommended. The assembler itself uses only the Python standard library.

## 2. Confirm personalisation

Open `Part-B-Assembler/config.json`. It is already configured for **K=49**. This gives:

- `49 % 3 = 1`: invalid assembler lines must report their source line number.
- `49 % 4 = 1`: two words per screen row, or 32 pixels.
- Box top row: 49; height: 20 rows; first screen address: 17952.

## 3. Run the assembler tests

```bash
cd Part-B-Assembler
python3 -m unittest discover -s tests -v
```

Expected: all four unit tests pass.

## 4. Assemble sample programs

```bash
python3 assembler.py programs/Add.asm
python3 assembler.py programs/Max.asm
python3 assembler.py programs/Rect.asm
python3 assembler.py programs/Pong.asm
```

The included Pong sample is a short assembler smoke test, not the complete official Pong program. For official comparison, use the `.asm` files supplied with your course distribution.

## 5. Regenerate the box

```bash
cd ../Part-C-Box-Program
python3 generate_box.py
python3 ../Part-B-Assembler/assembler.py Box.asm -o Box.hack
```

The generator reads K from `Part-B-Assembler/config.json`. You can override it with `python3 generate_box.py --k 49`.

## 6. Optional Python demonstration

```bash
python3 emulator.py Box.hack
```

Click inside the window, hold a key to draw, and release to erase. This demonstration is supplementary. The assignment asks for a screenshot from the official Nand2Tetris CPU Emulator; capture that separately.

## 7. Official HDL tests

Open the official Hardware Simulator, load each local `.hdl` file, and run the official `CPU.tst`, `Memory.tst`, `ComputerAdd.tst`, `ComputerMax.tst` and `ComputerRect.tst`. The assignment archive did not contain those scripts or their `.cmp` reference outputs. Obtain them from your course/Nand2Tetris software distribution. Save genuine results in `Part-A-Computer/tests/`.

## 8. Evidence

Capture the actual simulator/test results. Do not create or edit screenshots to imply a test passed. Use `Documentation/VERIFICATION_STATUS.md` to track what remains.
