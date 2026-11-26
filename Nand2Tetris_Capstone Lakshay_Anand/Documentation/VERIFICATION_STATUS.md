# Verification status — do not overstate results

## Verified in the prepared workspace

- [x] Assembler unit tests: 4/4 passed.
- [x] Add, Max, Rect and bundled Pong smoke-test assembly commands completed.
- [x] K=49 configuration and K-dependent line-numbered error feature test.
- [x] Box.asm generated for row 49, 20 rows high and 32 pixels wide.
- [x] Box.hack generated: 82 instructions.
- [x] Included Python Hack-machine demonstration drew exactly 20 × 2 screen words at row 49, left adjacent words unchanged, and cleared the rectangle after key release.

## Still required on the user's machine / official tools

- [ ] Run CPU.tst against this folder's CPU.hdl in the official Hardware Simulator.
- [ ] Run Memory.tst against this folder's Memory.hdl.
- [ ] Run ComputerAdd.tst, ComputerMax.tst and ComputerRect.tst against this folder's Computer.hdl.
- [ ] Compare official Add.asm, Max.asm, Rect.asm and Pong.asm outputs against the official assembler.
- [ ] Run this Box.hack in the official CPU Emulator and capture genuine evidence.
- [ ] Complete the report with the full roll number if required, real test outcomes and screenshots.
- [ ] Push the required `capstone/` directory into the existing lab repository.

The supplied archive did not contain the official `.tst` / `.cmp` files. No official HDL pass result or official CPU Emulator screenshot is claimed here.
