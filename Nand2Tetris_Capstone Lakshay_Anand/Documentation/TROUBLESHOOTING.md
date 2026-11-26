# Troubleshooting

- **`python` not found on macOS:** use `python3`; check with `python3 --version`.
- **Assembler invalid computation:** check the Hack `comp` mnemonic against the standard Hack instruction table.
- **Wrong personal geometry:** verify `Part-B-Assembler/config.json` contains `"K": 49`, then regenerate and reassemble `Box.asm`.
- **Wrong box location:** first screen word is `16384 + 32*K`; for K=49 it is 17952.
- **Python demo does not react to keys:** click inside the Tkinter window, then hold/release a key. Tkinter must be available in the Python installation.
- **Hardware Simulator reports bus-width mismatch:** check the width of each connected bus and use the appropriate HDL slice, e.g. `PC.out[0..14]` for a 15-bit PC output.
- **Hardware Simulator reports missing chip:** ensure the official simulator is using the `Part-A-Computer` directory and that the required built-in/lab chips are available.
- **Official test script missing:** obtain the authentic `.tst` and `.cmp` files from the course distribution. Do not substitute invented tests or screenshots.
