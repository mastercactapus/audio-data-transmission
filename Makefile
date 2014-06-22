

all: transmit receive

clean:
	rm transmit receive

transmit:
	gcc -lm -O3 transmit.c -o transmit
receive:
	gcc -lm -O3 receive.c -o receive


