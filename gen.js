var fs = require("fs");

var sampleRate = 44100;

function genSine(frequency, msecs, amplitude) {
	var samples = (sampleRate * msecs / 1000) | 0;
	var bufferSize = samples * 2;

	var buffer = new Buffer(bufferSize);
	for (var i = 0; i < samples; i++) {
		var sampleStep = (i % sampleRate) / sampleRate;
		var val = Math.sin(2 * Math.PI * frequency * sampleStep) * 32768 * amplitude;

		if (val > 32768) val = 32767;
		if (val < -32768) val = -32768;
		buffer.writeInt16LE(val|0, i*2);
	}
	return buffer;
}

function compareSine(buffer, frequency){
	var len = buffer.length / 2 / sampleRate * 1000;
	var perfect = genSine(frequency, len, 1);
	
	var toCheck = (sampleRate / frequency) | 0;
	
	var best = Infinity;
	
	for (var i = 0; i < toCheck; i++) {
		var sumDiff = compareWaves(buffer, perfect, i);
		if (sumDiff < best) best = sumDiff);
	}
	
	return best;
}

function compareWaves(sample, control, offset) {
	var sum = 0;
	for (var samplePos = offset*2, controlPos = 0; samplePos < sample.length; samplePos += 2, controlPos += 2) {
		sum += Math.abs(sample.readInt16LE(samplePos) - control.readInt16LE(controlPos));
	}
	return sum;
}

var audio = genSine(440, 2000, 1);
fs.writeFileSync("pulse.s16le.pcm", audio);

