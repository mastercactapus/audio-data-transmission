Requirements
------
install `makeheaders` from the aur
run `make` to build

Usage
-----
pipe into the `transmit` program, raw pcm `float32le` comes out
pipe the output into `paplay` (or the `play` script) to listen

Example
-----

```bash
echo "Hello world!" | ./transmit | ./play
```

