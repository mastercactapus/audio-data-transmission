#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#include "transmit.h"

#define SAMPLE_RATE 44100.0d
#define AMP 0.8d
#define FREQ 440.0d



int main() {
	int c;
	while ((c = getchar()) != EOF) {
		gen_byte(FREQ, 8, c);
	}

	return 0;
}

void gen_byte(double frequency, double bitrate, char value) {
	double interval = 1000 / bitrate;
	int i;
	int bit;
	
	double pending_interval;
	int pending_value;
	
	pending_interval = interval;
	pending_value = 1;

	for (i=0; i < 8; i++) {
		bit = ((value >> i) & 0x01);
		
		if (bit == pending_value) {
			pending_interval += interval;
		} else {
			tone(FREQ, pending_interval, pending_value * AMP);
			pending_interval = interval;
			pending_value = bit;
		}
		
	}
	
	if (pending_value == 0) {
		tone(FREQ, pending_interval + interval, 0);
	} else {
		tone(FREQ, pending_interval, AMP);
		tone(FREQ, interval, 0);
	}
	
}

void generate_tone(double frequency, double amplitude, float *buffer, unsigned int length) {
	unsigned int i;
	for (i=0; i < length; i++ ) {
		double step = (i % (unsigned int)SAMPLE_RATE) / SAMPLE_RATE;
		
		buffer[i] = sin(M_PI * 2 * frequency * step) * amplitude;
	}
	
	//we should stop on the last sample before crossing 0
	//this can probably be calculated, but were going with the
	//draw then erase method for now
	
	i = length - 1;
	if (buffer[i] == 0.0f) return;
	int end = buffer[length - 1] > 0.0f;
	
	for (i = length - 1; ((buffer[i-1] > 0.0f) == end) && i > 0; i--) {
		buffer[i] = 0.0f;
	}
	
	
	//fade-in fade-out
	double fade_sample_calc = SAMPLE_RATE / 1000 * 15;
	unsigned int fade_samples = (unsigned int)fade_sample_calc; //10 msec
	for (i=1; i <= fade_samples; i++) {
		double multiplier = (double)i / fade_sample_calc;
		buffer[i] *= multiplier;
		buffer[length - i] *= multiplier;
	}
}

void tone(double frequency, double milliseconds, double amplitude) {
	//calculate number of samples
	unsigned int length = (unsigned int)(SAMPLE_RATE * milliseconds / 1000);

	//output buffer
	float *output = (float*) calloc(length, sizeof(float));
	
	generate_tone(frequency, amplitude, output, length);

	fwrite(output, sizeof(float), length, stdout);
	
	free(output);
}
