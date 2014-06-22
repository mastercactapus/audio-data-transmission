var fs = require("fs");

var sampleRate = 44100;

function genSine(frequency, msecs, amplitude) {
	var samples = (sampleRate * msecs / 1000) | 0;
	var bufferSize = samples * 2;

	var buffer = new Buffer(bufferSize, "binary");
	for (var i = 0; i < samples; i++) {
		var sampleStep = (i % sampleRate) / sampleRate;
		var val = Math.sin(2 * Math.PI * frequency * sampleStep) * 32768 * amplitude;

		if (val > 32768) val = 32767;
		if (val < -32768) val = -32768;
		buffer.writeInt16LE(val|0, i*2);
	}
	return buffer;
}
function genByte(val) {
	var bufs = [];
	bufs.push(genSine(440, 100, 1));
	bufs.push(genSine(440, 100, 0));
	
	for (var i=0;i<8;i++) {
		var bit = 1 << i;
		if ((val & bit) != 0) {
			bufs.push(genSine(440, 100, 1));
		} else {
			bufs.push(genSine(440, 100, 0));
		}
	}
	
	bufs.push(genSine(440, 100, 1));
	bufs.push(genSine(440, 200, 0));
	
	return Buffer.concat(bufs);
}
function genMessage(buf) {
	var bufs = [];
	for (var i=0; i<buf.length;i++) {
		bufs.push(genByte(buf[i]));
	}
	return Buffer.concat(bufs);
}

function compareSine(buffer, frequency){
	var len = buffer.length / 2 / sampleRate * 1000;
	var perfectMax = genSine(frequency, len, 1);
	var maxVol = avgVolume(perfectMax);
	var bufVol = avgVolume(buffer);
	console.log("buffer volume",bufVol);
	
	var perfect = genSine(frequency, len, bufVol/maxVol);
	
	var toCheck = (sampleRate / frequency) | 0;
	
	var best = Infinity;
	
	for (var i = 0; i < toCheck; i++) {
		var sumDiff = compareWaves(buffer, perfect, i);
		if (sumDiff < best) best = sumDiff;
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

function avgVolume(sample) {
	var sum = 0;
	for (var i =0; i<sample.length-1; i+=2) {
			sum += Math.abs(sample.readInt16LE(i));
	}
	
	return (sum / (sample.length / 2)) / 32768;
}


var chunkSize = 2205;

function readIn(size) {
	var buf = new Buffer(size);
	var read = 0;
	while(true) {
		try {
			while (read < size) {
				read += fs.readSync(process.stdin.fd, buf, read, size-read);
			}
			return buf;
		} catch(err) {
		}
	}
}

if (process.argv[2] === "write") {
	process.stdin.on("data", function(data){
		process.stdout.write(genMessage(data));
	});
	return;
} else if (process.argv[2] === "read") {
	//process.stdin.resume();
	
	while (true) {
		var read = readIn(chunkSize);
		var vol = avgVolume(read);
		if (vol > 0.1) {
			console.log("start bit");
			readIn(chunkSize*4);
			read = readIn(chunkSize);
			vol = avgVolume(read);
			console.log(vol);
			if (vol > 0.1) {
				console.log("transmission error1");
				continue; //error
			}
			
			var byte = 0;
			for (var i=0; i < 8; i++) {
				readIn(chunkSize*3);
				read = readIn(chunkSize);

				var bit = avgVolume(read) > 0.1;
				console.log("bit" + i,bit);
				
				byte = byte | ( (bit?1:0) << i );
				
			}
			
			read = readIn(chunkSize);
			vol = avgVolume(read);

			if (vol > 0.1) {
				console.log("transmission error2");
				continue; //error
			}
			
			readIn(chunkSize*3);
			read = readIn(chunkSize);
			vol = avgVolume(read);

			if (vol <= 0.1) {
				console.log("transmission error3");
				continue; //error
			}
			
			//read = null;
			//while (!read) read = process.stdin.read(chunkSize);
			
			process.stdout.write("GOT: " + String.fromCharCode(byte) + "\n");
		}
	}

} else {
	console.log("invalid");
	return;
}

var helloWorld = genMessage(new Buffer("Hello world!"));

var samples = sampleRate / 1000 * 25 | 0;
console.log(samples);
for (var i=0;i<helloWorld.length;i+=samples){
	var slice = helloWorld.slice(i*2,(i+samples)*2);
	console.log(avgVolume(slice));
}

fs.writeFileSync("helloWorld.raw", helloWorld);
