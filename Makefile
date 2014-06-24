

all: transmit receive

clean:
	rm transmit receive *.h
transmit.h:
	makeheaders transmit.c:transmit.h
receive.h:
	makeheaders receive.c:receive.h
transmit: transmit.h
	gcc -lm -O3 transmit.c -o transmit
receive: receive.h
	gcc -lm -O3 receive.c -o receive


