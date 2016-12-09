// Copyright (c) 2014-2016 Daniele Veneroni.
// Released under GPLv3 License. See LICENSE.md for further information.
'use strict';

// ##############################################
// # SPLASH SCREEN                              #
// ##############################################

$('#splash-screen').delay(2000).fadeOut();
$('#module-info').delay(8000).fadeOut();

// ##############################################
// # SIDEBAR                                    #
// ##############################################

$('.sidebar button').on('click', function () {
	var $module = $('#module-' + $(this).data('module'));
	if ($module.is(':visible')) {
		$module.hide();
	} else {
		$('.module').hide();
		$module.show();
	}
});

// ##############################################
// # SYNTH                                      #
// ##############################################

var SYNTH = {
	nodes: {},
	voices: new Map(),
	context: new (window.AudioContext || window.webkitAudioContext)(),
	presets: [],
	settings: {
		osc1: {
			type: 'sawtooth',
			detune: 0,
			mix: 1
		},
		osc2: {
			type: 'none',
			detune: 0,
			mix: 1
		},
		filter: {
			type: 'lowpass',
			detune: 0,
			frequency: 0, // si mette a SYNTH.context.sampleRate / 2 dopo averlo creato
			quality: 0,
			gain: 0
		},
		effect: {
			type: 'none',
			buffer: 256
		},
		compressor: {
			threshold: -24,
			knee: 30,
			ratio: 12,
			attack: 0.003,
			release: 0.25
		},
		master: {
			volume: 1,
			pan: 0
		},
		animation: {
			type: 'spectrum-round',
			fftSize: 512,
			smoothingTimeConstant: 0.8,
			minDecibels: -100,
			maxDecibels: -30
		}
	},
	setupSettings: function (settings) {
		if (settings) {
			SYNTH.settings = $.extend(true, SYNTH.settings, settings);
		}
		settings = SYNTH.settings;
		console.log('setupSettings', settings);
		var nodes = SYNTH.nodes;

		// OSCILLATOR 1
		$('#osc1-type').val(settings.osc1.type).trigger('change');
		$('#osc1-detune').val(settings.osc1.detune).trigger('input');
		$('#osc1-mix').val(settings.osc1.mix).trigger('input');

		// OSCILLATOR 1
		$('#osc2-type').val(settings.osc2.type).trigger('change');
		$('#osc2-detune').val(settings.osc2.detune).trigger('input');
		$('#osc2-mix').val(settings.osc2.mix).trigger('input');

		// SHARED BIQUAD FILTER
		nodes.sharedFilter.type = settings.filter.type;
		nodes.sharedFilter.detune.value = settings.filter.detune;
		nodes.sharedFilter.frequency.value = Math.min(settings.filter.frequency, SYNTH.context.sampleRate / 2);
		nodes.sharedFilter.Q.value = settings.filter.quality;
		nodes.sharedFilter.gain.value = settings.filter.gain;

		$('#filter-type').val(settings.filter.type).trigger('change');
		$('#filter-detune').val(settings.filter.detune).trigger('input');
		$('#filter-frequency').val(settings.filter.frequency).trigger('input');
		$('#filter-quality').val(settings.filter.quality).trigger('input');
		$('#filter-gain').val(settings.filter.gain).trigger('input');

		// BLENDER
		nodes.blender.gain.value = 1;

		// EFFECT - TODO effects settings
		$('#effect-buffer').val(settings.effect.buffer);
		$('#effect-type').val(settings.effect.type).trigger('change');

		// DYNAMICS COMPRESSOR
		nodes.compressor.threshold.value = settings.compressor.threshold;
		nodes.compressor.knee.value = settings.compressor.knee;
		nodes.compressor.ratio.value = settings.compressor.ratio;
		nodes.compressor.attack.value = settings.compressor.attack;
		nodes.compressor.release.value = settings.compressor.release;

		$('#compressor-threshold').val(settings.compressor.threshold).trigger('input');
		$('#compressor-knee').val(settings.compressor.knee).trigger('input');
		$('#compressor-ratio').val(settings.compressor.ratio).trigger('input');
		$('#compressor-attack').val(settings.compressor.attack).trigger('input');
		$('#compressor-release').val(settings.compressor.release).trigger('input');

		// STEREO PANNER
		if (SYNTH.context.createStereoPanner) {
			nodes.panner.pan.value = settings.master.pan;
		}

		$('#master-pan').val(settings.master.pan).trigger('input');

		// MASTER
		nodes.master.gain.value = settings.master.volume;

		$('#master-volume').val(settings.master.volume).trigger('input');

		// ANALYSER
		nodes.analyser.fftSize = settings.animation.fftSize;
		nodes.analyser.smoothingTimeConstant = settings.animation.smoothingTimeConstant;
		nodes.analyser.minDecibels = settings.animation.minDecibels;
		nodes.analyser.maxDecibels = settings.animation.maxDecibels;

		$('#animation-type').val(settings.animation.type);
		$('#animation-analyser-fft').val(settings.animation.fftSize).trigger('change');
		$('#animation-analyser-smoothingTimeConstant').val(settings.animation.smoothingTimeConstant).trigger('input');
		$('#animation-analyser-minDecibels').val(settings.animation.minDecibels).trigger('input');
		$('#animation-analyser-maxDecibels').val(settings.animation.maxDecibels).trigger('input');
	},
	addVoice: function (id, frequency, velocity, filterFrequency) {
		//console.log('addVoice', id, frequency, velocity, filterFrequency);
		var settings = SYNTH.settings;

		// OSCILLATOR 1

		var osc1 = SYNTH.context.createOscillator();
		if (SYNTH.wavetables[settings.osc1.type]) {
			osc1.setPeriodicWave(SYNTH.wavetables[settings.osc1.type].wave);
		} else {
			osc1.type = settings.osc1.type;
		}
		osc1.frequency.value = frequency;
		osc1.detune.value = settings.osc1.detune;
		osc1.start(0);
		var mix1 = SYNTH.context.createGain();
		mix1.gain.value = settings.osc1.mix;

		// OSCILLATOR 2

		var osc2, mix2;
		if (settings.osc2.type !== 'none') {
			osc2 = SYNTH.context.createOscillator();
			if (SYNTH.wavetables[settings.osc2.type]) {
				osc2.setPeriodicWave(SYNTH.wavetables[settings.osc2.type].wave);
			} else {
				osc2.type = settings.osc2.type;
			}
			osc2.frequency.value = frequency;
			osc2.detune.value = settings.osc2.detune;
			osc2.start(0);

			mix2 = SYNTH.context.createGain();
			mix2.gain.value = settings.osc2.mix;
		}

		// VELOCITY GAIN

		var velocityGain = SYNTH.context.createGain();
		velocityGain.gain.value = velocity;

		// BIQUAD FILTER

		var filter = null;
		if (id.indexOf('keyboard') === -1) {
			// NOT A KEYBOARD TRIGGERED VOICE
			filter = SYNTH.context.createBiquadFilter();
			filter.type = settings.filter.type;
			filter.detune.value = settings.filter.detune;
			filter.frequency.value = Math.min(filterFrequency || settings.filter.frequency, SYNTH.context.sampleRate / 2);
			filter.Q.value = settings.filter.quality;
			filter.gain.value = settings.filter.gain;
		}

		// CONNECTIONS

		osc1.connect(mix1);
		mix1.connect(velocityGain);

		if (settings.osc2.type !== 'none') {
			osc2.connect(mix2);
			mix2.connect(velocityGain);
		}

		if (id.indexOf('keyboard') === -1) {
			// NOT A KEYBOARD TRIGGERED VOICE
			velocityGain.connect(filter);
			filter.connect(SYNTH.nodes.blender);
		} else {
			velocityGain.connect(SYNTH.nodes.sharedFilter);
		}

		if (SYNTH.voices.has(id)) {
			SYNTH.removeVoice(id);
		}
		SYNTH.voices.set(id, {
			id: id,
			osc1: { osc: osc1, mix: mix1 },
			osc2: settings.osc2.type !== 'none' ? { osc: osc2, mix: mix2 } : null,
			velocity: velocityGain,
			filter: filter // if keyboard triggered, is null
		});
	},
	updateVoice: function (id, frequency, velocity, filterFrequency) {
		//console.log('updateVoice', id, frequency, velocity, filterFrequency);
		if (SYNTH.voices.has(id)) {
			var sound = SYNTH.voices.get(id);
			sound.osc1.osc.frequency.value = frequency;
			if (sound.osc2 !== null) {
				sound.osc2.osc.frequency.value = frequency;
			}
			if (velocity !== null) {
				sound.velocity.gain.value = velocity;
			}
			if (sound.filter !== null && filterFrequency !== null) {
				sound.filter.frequency.value = filterFrequency;
			}
		}
	},
	removeVoice: function (id) {
		//console.log('removeVoice', id);
		if (SYNTH.voices.has(id)) {
			var sound = SYNTH.voices.get(id);
			sound.osc1.osc.stop(0);
			sound.osc1.osc.disconnect();
			sound.osc1.mix.disconnect();
			if (sound.osc2 !== null) {
				sound.osc2.osc.stop(0);
				sound.osc2.osc.disconnect();
				sound.osc2.mix.disconnect();
			}
			sound.velocity.disconnect();
			if (sound.filter !== null) {
				sound.filter.disconnect();
			}
			SYNTH.voices.delete(id);
		}
	}
};

SYNTH.nodes.sharedFilter = SYNTH.context.createBiquadFilter();
SYNTH.nodes.blender = SYNTH.context.createGain();
SYNTH.nodes.compressor = SYNTH.context.createDynamicsCompressor();
if (SYNTH.context.createStereoPanner) {
	SYNTH.nodes.panner = SYNTH.context.createStereoPanner();
}
SYNTH.nodes.master = SYNTH.context.createGain();
SYNTH.nodes.analyser = SYNTH.context.createAnalyser();

SYNTH.nodes.sharedFilter.connect(SYNTH.nodes.blender);
SYNTH.nodes.blender.connect(SYNTH.nodes.compressor);
if (SYNTH.context.createStereoPanner) {
	SYNTH.nodes.compressor.connect(SYNTH.nodes.panner);
	SYNTH.nodes.panner.connect(SYNTH.nodes.master);
} else {
	SYNTH.nodes.compressor.connect(SYNTH.nodes.master);
}
SYNTH.nodes.master.connect(SYNTH.nodes.analyser);
SYNTH.nodes.analyser.connect(SYNTH.context.destination);

SYNTH.settings.filter.frequency = SYNTH.context.sampleRate / 2;
SYNTH.setupSettings();

// ##############################################
// # OSCILLATORS CONTROLS                       #
// ##############################################

// http://www.sitepoint.com/using-fourier-transforms-web-audio-api/
// http://opendoctype.com/Tutorials/Web_Audio_API/Part_3_-_Wavetables
// https://chromium.googlecode.com/svn/trunk/samples/audio/wave-tables/

/*

// VOLUME ENVELOPE

var attack = 2,
    decay = 0.5,
    sustain = 0.8,
    release = 1;
 
var now = SYNTH.context.currentTime;
 
// Attack
velocity.gain.setValueAtTime(0, now);
velocity.gain.linearRampToValueAtTime(this.maxLevel, now + attack);
 
// Decay
velocity.gain.setTargetAtTime(sustain, now, attack + decay);
 
 
var now = SYNTH.context.currentTime;
 
// Release
velocity.gain.setTargetAtTime(0, now, release); // oppure release / 10


var rangeToFrequency = function (baseFrequency, range) {
	var frequency = baseFrequency;

	switch (range) {
		case '2':
			frequency = baseFrequency * 4;
			break;
		case '4':
			frequency = baseFrequency * 2;
			break;
		case '16':
			frequency = baseFrequency / 2;
			break;
		case '32':
			frequency = baseFrequency / 4;
			break;
		case '64':
			frequency = baseFrequency / 8;
			break;
		default:
			break;
	};

	return frequency;
};

*/

SYNTH.wavetables = {
	"horn": {
		"real": [0, 0.4, 0.4, 1, 1, 1, 0.3, 0.7, 0.6, 0.5, 0.9, 0.8],
		"imag": null
	}
};

(function () {
	for (var tableName in SYNTH.wavetables) {
		if (SYNTH.wavetables.hasOwnProperty(tableName)) {
			var table = SYNTH.wavetables[tableName];
			table.real = new Float32Array(table.real);
			table.imag = table.imag !== null ? new Float32Array(table.imag) : new Float32Array(table.real.length);
			table.wave = SYNTH.context.createPeriodicWave(table.real, table.imag);
		}
	}
})();

$('#osc1-type').on('change', function () {
	SYNTH.settings.osc1.type = $(this).val();
	SYNTH.voices.forEach(function (sound, id) {
		SYNTH.removeVoice(sound.id);
	});
});

$('#osc1-detune').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.osc1.detune = value;
	SYNTH.voices.forEach(function (sound, id) {
		sound.osc1.osc.detune.value = value;
	});
});

$('#osc1-mix').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.osc1.mix = value;
	SYNTH.voices.forEach(function (sound, id) {
		sound.osc1.mix.gain.value = value;
	});
});

$('#osc2-type').on('change', function () {
	SYNTH.settings.osc2.type = $(this).val();
	SYNTH.voices.forEach(function (sound, id) {
		SYNTH.removeVoice(sound.id);
	});
});

$('#osc2-detune').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.osc2.detune = value;
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.osc2 !== null) {
			sound.osc2.osc.detune.value = value;
		}
	});
});

$('#osc2-mix').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.osc2.mix = value;
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.osc2 !== null) {
			sound.osc2.mix.gain.value = value;
		}
	});
});

// ##############################################
// # BIQUAD FILTER CONTROLS                     #
// ##############################################

$('#filter-type').on('change', function () {
	SYNTH.settings.filter.type = $(this).val();
	SYNTH.nodes.sharedFilter.type = $(this).val();
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.filter !== null) {
			sound.filter.type = $(this).val();
		}
	});
});

$('#filter-detune').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.filter.detune = value;
	SYNTH.nodes.sharedFilter.detune.value = value;
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.filter !== null) {
			sound.filter.detune.value = value;
		}
	});
});

$('#filter-frequency').attr('max', SYNTH.context.sampleRate / 2).on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.filter.frequency = value;
	SYNTH.nodes.sharedFilter.frequency.value = value;
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.filter !== null) {
			sound.filter.frequency.value = value;
		}
	});
});

$('#filter-quality').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.filter.quality = value;
	SYNTH.nodes.sharedFilter.Q.value = value;
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.filter !== null) {
			sound.filter.Q.value = value;
		}
	});
});

$('#filter-gain').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.filter.gain = value;
	SYNTH.nodes.sharedFilter.gain.value = value;
	SYNTH.voices.forEach(function (sound, id) {
		if (sound.filter !== null) {
			sound.filter.gain.value = value;
		}
	});
});

// ##############################################
// # EFFECT CONTROLS                            #
// ##############################################
/*

https://chromium.googlecode.com/svn/trunk/samples/audio/impulse-responses/
https://stackoverflow.com/questions/7840347/web-audio-api-waveshapernode

*/

(function () {
	SYNTH.buffers = {};

	var files = [
		{ name: 'convolver-echo',            url: 'assets/echo.wav' },
		{ name: 'convolver-hall',            url: 'assets/hall.ogg' },
		{ name: 'convolver-muffler',         url: 'assets/muffler.wav' },
		{ name: 'convolver-spring_feedback', url: 'assets/spring_feedback.wav' },
		{ name: 'convolver-telephone',       url: 'assets/telephone.wav' }
	];

	var $select = $('#effect-type');
	/*
	if (window.fetch) {
		// USING FETCH API
		files.forEach(function (file) {
			fetch(file.url).then(function(response) {
				//console.log(response.type, response.URL, response.useFinalURL, response.status, response.ok, response.statusText, response.headers, response.bodyUsed);
				if (!response.ok) {
					console.error('"' + file.name + '" network response was not ok [ status: ' + response.status + ' ' + response.statusText + ' ]');
				} else {
					response.arrayBuffer().then(function (buffer) {
						SYNTH.context.decodeAudioData(buffer).then(function (buffer) {
							SYNTH.buffers[file.name] = buffer;
							$select.find('option[value="' + file.name + '"]').prop('disabled', false);
						}).catch(function (e) {
							console.log('Error on "' + file.name + '" decodeAudioData [ERROR: ' + e.toString() + ']');
						});
					});
				}
			}).catch(function (error) {
				console.error('"' + file.name + '" network error [ message: ' + error.message + ' ]');
			});
		});
	} else {
	*/
		// USING XMLHttpRequest
		files.forEach(function (file) {
			try {
				var request = new XMLHttpRequest();
				request.onload = function (e) {
					if (request.readyState !== 4 || request.status < 200 || request.status > 299) {
						console.error('"' + file.name + '" network response was not ok [ readyState: ' + request.readyState + ' - status: ' + request.status + ' ' + request.statusText + ' ]');
					} else {
						SYNTH.context.decodeAudioData(request.response).then(function (buffer) {
							SYNTH.buffers[file.name] = buffer;
							$select.find('option[value="' + file.name + '"]').prop('disabled', false);
						}).catch(function (e) {
							console.log('Error on "' + file.name + '" decodeAudioData [ERROR: ' + e.toString() + ']');
						});
					}
				};
				request.onerror = function (e) {
					console.error('"' + file.name + '" network error', e);
				};
				request.open('GET', file.url, true);
				request.responseType = 'arraybuffer';
				request.send();
			} catch (e) {
				console.error('"' + file.name + '" execution error', e);
			}
		});
	/*
	}
	*/
	// NOISE CONVOLVER
	(function () {
		var noiseBuffer = SYNTH.context.createBuffer(2, 0.5 * SYNTH.context.sampleRate, SYNTH.context.sampleRate),
			left = noiseBuffer.getChannelData(0),
			right = noiseBuffer.getChannelData(1);
		for (var i = 0; i < noiseBuffer.length; ++i) {
			left[i] = Math.random() * 2 - 1;
			right[i] = Math.random() * 2 - 1;
		}
		SYNTH.buffers['convolver-noise'] = noiseBuffer;
		$select.find('option[value="convolver-noise"]').prop('disabled', false);
	})();
})();

$('#effect-buffer').on('change', function () {
	$('#effect-type').trigger('change');
});

$('#effect-type').on('change', function () {
	$('.effect-settings').hide();
	if (SYNTH.nodes.effect) {
		SYNTH.nodes.effect.disconnect();
		delete SYNTH.nodes.effect;
	}
	SYNTH.nodes.blender.disconnect();

	if ($(this).val() === 'filter-pinking') {
		// ##############################################
		// # PINKING FILTER by Paul Kellet              #
		// ##############################################
		var bufferSize = parseInt($('#effect-buffer').val(), 10);
		SYNTH.nodes.effect = (function () {
			var b0, b1, b2, b3, b4, b5, b6;
			b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0),
					output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < input.length; ++i) {
					b0 = 0.99886 * b0 + input[i] * 0.0555179;
					b1 = 0.99332 * b1 + input[i] * 0.0750759;
					b2 = 0.96900 * b2 + input[i] * 0.1538520;
					b3 = 0.86650 * b3 + input[i] * 0.3104856;
					b4 = 0.55000 * b4 + input[i] * 0.5329522;
					b5 = -0.7616 * b5 - input[i] * 0.0168980;
					output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + input[i] * 0.5362;
					output[i] *= 0.11; // (roughly) compensate for gain
					b6 = input[i] * 0.115926;
				}
			};
			return node;
		})();
	} else if ($(this).val() === 'filter-moog') {
		// ##############################################
		// # MOOG FILTER                                #
		// ##############################################
		$('#moogfilter-settings').show();
		var bufferSize = parseInt($('#effect-buffer').val(), 10);
		SYNTH.nodes.effect = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			var in1, in2, in3, in4, out1, out2, out3, out4;
			in1 = in2 = in3 = in4 = out1 = out2 = out3 = out4 = 0.0;
			node.cutoff = 0.065; // between 0.0 and 1.0
			node.resonance = 3.99; // between 0.0 and 4.0
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0),
					output = e.outputBuffer.getChannelData(0),
					f = node.cutoff * 1.16,
					fb = node.resonance * (1.0 - 0.15 * f * f);
				for (var i = 0; i < input.length; ++i) {
					input[i] -= out4 * fb;
					input[i] *= 0.35013 * (f * f) * (f * f);
					out1 = input[i] + 0.3 * in1 + (1 - f) * out1; // Pole 1
					in1 = input[i];
					out2 = out1 + 0.3 * in2 + (1 - f) * out2; // Pole 2
					in2 = out1;
					out3 = out2 + 0.3 * in3 + (1 - f) * out3; // Pole 3
					in3 = out2;
					out4 = out3 + 0.3 * in4 + (1 - f) * out4; // Pole 4
					in4 = out3;
					output[i] = out4;
				}
			};
			return node;
		})();
		$('#moogfilter-cutoff, #moogfilter-resonance').trigger('input');
	} else if ($(this).val() === 'filter-bitcrusher') {
		// ##############################################
		// # BITCRUSHER                                 #
		// ##############################################
		$('#bitcrusher-settings').show();
		var bufferSize = parseInt($('#effect-buffer').val(), 10);
		SYNTH.nodes.effect = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.bits = 4; // between 1 and 16
			node.normfreq = 0.1; // between 0.0 and 1.0
			var step = Math.pow(1/2, node.bits),
				phaser = 0,
				last = 0;
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0),
					output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < input.length; ++i) {
					phaser += node.normfreq;
					if (phaser >= 1.0) {
						phaser -= 1.0;
						last = step * Math.floor(input[i] / step + 0.5);
					}
					output[i] = last;
				}
			};
			return node;
		})();
		$('#bitcrusher-bits, #bitcrusher-normfreq').trigger('input');
	} else if ($(this).val() === 'filter-whitenoiser') {
		// ##############################################
		// # WHITE NOISER                               #
		// ##############################################
		var bufferSize = parseInt($('#effect-buffer').val(), 10);
		SYNTH.nodes.effect = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0),
					output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < input.length; ++i) {
					output[i] = input[i] + ((Math.random() * 2 - 1) * 0.2); // "* 0.2" is optional
				}
			};
			return node;
		})();
	} else if ($(this).val() === 'filter-pinknoiser') {
		// ##############################################
		// # PINK NOISER by Paul Kellet                 #
		// ##############################################
		var bufferSize = parseInt($('#effect-buffer').val(), 10);
		SYNTH.nodes.effect = (function () {
			var b0, b1, b2, b3, b4, b5, b6;
			b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1);
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0),
					output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < input.length; ++i) {
					var white = input[i] + (Math.random() * 2 - 1);
					b0 = 0.99886 * b0 + white * 0.0555179;
					b1 = 0.99332 * b1 + white * 0.0750759;
					b2 = 0.96900 * b2 + white * 0.1538520;
					b3 = 0.86650 * b3 + white * 0.3104856;
					b4 = 0.55000 * b4 + white * 0.5329522;
					b5 = -0.7616 * b5 - white * 0.0168980;
					output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
					output[i] *= 0.11; // (roughly) compensate for gain
					b6 = white * 0.115926;
				}
			};
			return node;
		})();
	} else if ($(this).val() === 'filter-brownnoiser') {
		// ##############################################
		// # BROWN NOISER                               #
		// ##############################################
		var bufferSize = parseInt($('#effect-buffer').val(), 10);
		SYNTH.nodes.effect = (function () {
			var node = SYNTH.context.createScriptProcessor(bufferSize, 1, 1),
				lastOut = 0.0;
			node.onaudioprocess = function (e) {
				var input = e.inputBuffer.getChannelData(0),
					output = e.outputBuffer.getChannelData(0);
				for (var i = 0; i < input.length; ++i) {
					var white = input[i] + (Math.random() * 2 - 1);
					output[i] = (lastOut + (0.02 * white)) / 1.02;
					lastOut = output[i];
					output[i] *= 3.5; // (roughly) compensate for gain
				}
			};
			return node;
		})();
	} else if ($(this).val().indexOf('convolver') !== -1) {
		// ##############################################
		// # CONVOLVERS                                 #
		// ##############################################
		var convolverType = $(this).val();
		if (SYNTH.buffers[convolverType]) {
			SYNTH.nodes.effect = (function () {
				var node = SYNTH.context.createConvolver();
				//node.normalize = true; // default
				node.buffer = SYNTH.buffers[convolverType];
				return node;
			})();
		}
	} else if ($(this).val() === 'waveshaper-distorsion') {
		// ##############################################
		// # DISTORSION                                 #
		// ##############################################
		SYNTH.nodes.effect = (function () {
			var node = SYNTH.context.createWaveShaper();
			var makeDistorsionCurve = function (amount) {
				var k = typeof amount === 'number' ? amount : 50,
					n_samples = 44100,
					curve = new Float32Array(n_samples),
					deg = Math.PI / 180;
				for (var i = 0; i < n_samples; ++i) {
					var x = i * 2 / n_samples - 1;
					curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
				}
				return curve;
			};
			node.curve = makeDistorsionCurve(100);
			node.oversample = '4x'; // 'none', '2x', '4x'
			return node;
		})();
	} else if ($(this).val() === 'delay-feedback') {
		// ##############################################
		// # FEEDBACK DELAY                             #
		// ##############################################
		SYNTH.nodes.effect = (function () {
			var node = SYNTH.context.createDelay(5.0); // max delayTime in seconds
			node.delayTime.value = 1/1000*100; // expressed in seconds
			var feedback = SYNTH.context.createGain();
			feedback.gain.value = 0.3;
			node.connect(feedback);
			feedback.connect(node);
			return node;
		})();
	}

	if (SYNTH.nodes.effect) {
		SYNTH.nodes.blender.connect(SYNTH.nodes.effect);
		SYNTH.nodes.effect.connect(SYNTH.nodes.compressor);
	} else {
		SYNTH.nodes.blender.connect(SYNTH.nodes.compressor);
	}
});

$('#moogfilter-cutoff').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.nodes.effect.cutoff = value;
});

$('#moogfilter-resonance').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.nodes.effect.resonance = value;
});

$('#bitcrusher-bits').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.nodes.effect.bits = value;
});

$('#bitcrusher-normfreq').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.nodes.effect.normfreq = value;
});

// ##############################################
// # DYNAMICS COMPRESSOR                        #
// ##############################################

$('#compressor-threshold').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.compressor.threshold = value;
	SYNTH.nodes.compressor.threshold.value = value;
});

$('#compressor-knee').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.compressor.knee = value;
	SYNTH.nodes.compressor.knee.value = value;
});

$('#compressor-ratio').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.compressor.ratio = value;
	SYNTH.nodes.compressor.ratio.value = value;
});

$('#compressor-attack').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.compressor.attack = value;
	SYNTH.nodes.compressor.attack.value = value;
});

$('#compressor-release').on('input', function () {
	var value = parseFloat($(this).val());
	SYNTH.settings.compressor.release = value;
	SYNTH.nodes.compressor.release.value = value;
});

// ##############################################
// # MASTER CONTROLS                            #
// ##############################################

if (SYNTH.context.createStereoPanner) {

	$('#master-volume').on('input', function () {
		var value = parseFloat($(this).val());
		SYNTH.settings.master.volume = value;
		SYNTH.nodes.master.gain.value = value;
	});

	$('#master-pan').on('input', function () {
		var value = parseFloat($(this).val());
		SYNTH.settings.master.pan = value;
		SYNTH.nodes.panner.pan.value = value;
	});

} else {
	$('#master-pan').parent().hide();
}

// ##############################################
// # ANIMATION CONTROLS                         #
// ##############################################

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

var paper = new Palette('surface');

window.ANIMATION = {
	dataArray: new Uint8Array(SYNTH.nodes.analyser.frequencyBinCount),
	drawLoop: null,

	hue: 0,
	maxSpectrumHeight: paper.height / 4 * 3
};

function adaptScreen() {
	paper.height = Math.max(document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
	paper.width = Math.max(document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth);
	paper.size(paper.width, paper.height);
	ANIMATION.maxSpectrumHeight = paper.height / 4 * 3;
}

$(window).on('resize', adaptScreen).trigger('resize');

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API

function draw() {
	var animationType = SYNTH.settings.animation.type;
	//console.log('draw', animationType);
	if (animationType === 'none') {
		cancelAnimationFrame(ANIMATION.drawLoop);
		paper.clear();
		return;
	}
	ANIMATION.drawLoop = requestAnimationFrame(draw);
	var array = ANIMATION.dataArray;
	if (animationType === 'spectrum-linear') {
		// ##############################################
		// # SPECTRUM LINEAR                            #
		// ##############################################
		SYNTH.nodes.analyser.getByteFrequencyData(ANIMATION.dataArray);
		paper.clear();
		var gap = paper.width / (array.length * 2);
		for (var i = 0; i < array.length; ++i) {
			var newy = paper.height - (ANIMATION.maxSpectrumHeight * array[i] / 256);
			paper.rect({
				x: i * (gap * 2),
				y: newy,
				width: gap,
				height: paper.height,
				fill: 'hsl(' + (i * 360 / array.length) + ', 100%, 50%)'
			});
		}
	} else if (animationType === 'spectrum-round') {
		// ##############################################
		// # SPECTRUM ROUND                             #
		// ##############################################
		SYNTH.nodes.analyser.getByteFrequencyData(ANIMATION.dataArray);
		var degIncrement = 360 / array.length,
			centerX = window.innerWidth / 2,
			centerY = window.innerHeight / 2,
			circleR = 80,
			maxLength = circleR * 3; //window.innerWidth < window.innerHeight ? window.innerWidth / 2 - circleR * 2: window.innerHeight / 2 - circleR * 2;

		paper.clear();

		for (var i = 0; i < array.length; ++i) {
			var angle = ((i * degIncrement) * Math.PI) / 180,
				preX = Math.cos(angle),
				preY = Math.sin(angle),
				x = centerX + preX * circleR,
				y = centerY + preY * circleR,
				barValue = (array[i] * maxLength / 512) + circleR,
				dx = centerX + preX * barValue,
				dy = centerY + preY * barValue;
			paper.line({
				x1: x,
				y1: y,
				x2: dx,
				y2: dy,
				stroke: 'hsl(' + (i * 360 / array.length) + ', 100%, 50%)',
				join: 'miter',
				thickness: 1
			});
		}
	} else if (animationType === 'spectrum-roundinset') {
		// ##############################################
		// # SPECTRUM ROUND INSET                       #
		// ##############################################
		SYNTH.nodes.analyser.getByteFrequencyData(ANIMATION.dataArray);
		var degIncrement = 360 / array.length,
			centerX = window.innerWidth / 2,
			centerY = window.innerHeight / 2,
			circleR = 240,
			maxLength = circleR;

		paper.clear();

		for (var i = 0; i < array.length; ++i) {
			var angle = ((i * degIncrement) * Math.PI) / 180,
				preX = Math.cos(angle),
				preY = Math.sin(angle),
				x = centerX + preX * circleR,
				y = centerY + preY * circleR,
				barValue = -(array[i] * maxLength / 512) + circleR,
				dx = centerX + preX * barValue,
				dy = centerY + preY * barValue;
			paper.line({
				x1: x,
				y1: y,
				x2: dx,
				y2: dy,
				stroke: 'hsl(' + (i * 360 / array.length) + ', 100%, 50%)',
				join: 'miter',
				thickness: 1
			});
		}
	} else if (animationType === 'oscilloscope-stroked') {
		// ##############################################
		// # OSCILLOSCOPE STROKED                       #
		// ##############################################
		SYNTH.nodes.analyser.getByteTimeDomainData(ANIMATION.dataArray);
		paper.clear();
		ANIMATION.hue = ANIMATION.hue + 0.5 > 360 ? 0 : ANIMATION.hue + 0.5;
		paper.context.strokeStyle = 'hsl(' + ANIMATION.hue + ', 50%, 50%)';
		paper.context.lineWidth = 15;
		paper.context.beginPath();
		var sliceWidth = paper.width * 1.0 / array.length,
			x = 0;
		for (var i = 0; i < array.length; ++i) {
			var v = array[i] / 128.0,
				y = v * paper.height / 2;
			if (i === 0) {
				paper.context.moveTo(x, y);
			} else {
				paper.context.lineTo(x, y);
			}
			x += sliceWidth;
		}
		paper.context.stroke();
	} else if (animationType === 'oscilloscope-filled') {
		// ##############################################
		// # OSCILLOSCOPE FILLED                        #
		// ##############################################
		SYNTH.nodes.analyser.getByteTimeDomainData(ANIMATION.dataArray);
		paper.clear();
		paper.context.lineWidth = 15;
		ANIMATION.hue = ANIMATION.hue + 0.5 > 360 ? 0 : ANIMATION.hue + 0.5;
		paper.context.fillStyle = 'hsl(' + ANIMATION.hue + ', 50%, 50%)';
		paper.context.beginPath();
		var sliceWidth = paper.width * 1.0 / array.length,
			x = 0;
		for (var i = 0; i < array.length; ++i) {
			var v = array[i] / 128.0,
				y = v * paper.height / 2;
			if (i === 0) {
				paper.context.moveTo(x, y);
			} else {
				paper.context.lineTo(x, y);
			}
			x += sliceWidth;
		}
		paper.context.lineTo(paper.width, paper.height);
		paper.context.lineTo(0, paper.height);
		paper.context.fill();
	} else if (animationType === 'blackboard') {
		// ##############################################
		// # BLACKBOARD                                 #
		// ##############################################
		paper.clear();
		points.forEach(function (point, key) {
			paper.circle({
				x: point.x,
				y: point.y,
				r: 50,
				fill: point.color,
				shadow: '0 0 20 ' + point.color
			});
		});
	}
}

$('#animation-type').on('change', function () {
	SYNTH.settings.animation.type = $(this).val();
	cancelAnimationFrame(ANIMATION.drawLoop);
	draw();
}).trigger('change');

$('#animation-analyser-fft').on('change', function () {
	SYNTH.nodes.analyser.fftSize = parseInt($(this).val(), 10);
	ANIMATION.dataArray = new Uint8Array(SYNTH.nodes.analyser.frequencyBinCount);
	$('#animation-type').trigger('change');
});

$('#animation-analyser-smoothingTimeConstant').on('input', function () {
	var value = parseFloat($(this).val());
	//console.log('smoothingTimeConstant', 'input', value);
	SYNTH.nodes.analyser.smoothingTimeConstant = value;
});

$('#animation-analyser-minDecibels').on('input', function () {
	var value = parseFloat($(this).val());
	//console.log('minDecibels', 'input', value);
	SYNTH.nodes.analyser.minDecibels = value;
});

$('#animation-analyser-maxDecibels').on('input', function () {
	var value = parseFloat($(this).val());
	//console.log('maxDecibels', 'input', value);
	SYNTH.nodes.analyser.maxDecibels = value;
});

// ##############################################
// # PRESET CONTROLS                            #
// ##############################################

[
	{
		"name": "Default"
	},
	{
		"name": "Absolute Leader",
		"osc1": { "type": "horn", "detune": -5, "mix": 0.68 },
		"osc2": { "type": "sawtooth", "detune": -1200, "mix": 0.55 },
		"animation": { "type": "oscilloscope-stroked" }
	},
	{
		"name": "Buzzer",
		"osc1": { "type": "sawtooth", "detune": 0, "mix": 1 },
		"osc2": { "type": "sawtooth", "detune": -1200, "mix": 0.5 },
		"filter": { "type": "lowpass", "detune": 0, "frequency": 3000, "quality": 26, "gain": 0 }
	},
	{
		"name": "ChipChip",
		"osc1": { "type": "square", "detune": 464, "mix": 1 },
		"filter": { "type": "highpass", "detune": 0, "frequency": 5000, "quality": 30, "gain": 0 }
	},
	{
		"name": "Classic Electric Bass",
		"osc1": { "type": "sine", "detune": 0, "mix": 1 },
		"osc2": { "type": "sine", "detune": 1200, "mix": 1 }
	},
	{
		"name": "Organth",
		"osc1": { "type": "sawtooth", "detune": -456, "mix": 1 },
		"filter": { "type": "highpass", "detune": 0, "frequency": 1716, "quality": 9.6, "gain": 18 }
	}
].forEach(function (preset, index) {
	var tmpSettings = $.extend(true, { id: index }, SYNTH.settings);
	SYNTH.presets.push($.extend(true, tmpSettings, preset));
});

$('#preset-id').on('change', function () {
	var presetID = parseInt($(this).val(), 10);
	for (var i = 0; i < SYNTH.presets.length; ++i) {
		if (presetID === SYNTH.presets[i].id) {
			SYNTH.setupSettings(SYNTH.presets[i]);
			break;
		}
	}
}).on('update', function (e) {
	var $select = $(this),
		precedentValue = $select.val() !== null ? $select.val() : 0;
	$select.empty();
	SYNTH.presets.forEach(function (preset) {
		$select.append('<option value="' + preset.id + '">' + preset.name + '</option>');
	});
	$select.val(e.toBeSelected !== undefined ? e.toBeSelected : precedentValue).trigger('change');
}).trigger('update');

$('#preset-save').on('click', function () {
	var name = prompt('Preset name');
	if (name) {
		var tmpSettings = $.extend(true, {}, SYNTH.settings),
			preset = $.extend(true, tmpSettings, {
				id: Date.now(),
				name: name
			});
		SYNTH.presets.push(preset);
		$('#preset-id').trigger({ type: 'update', toBeSelected: preset.id });
		/*
		localforage.setItem('presets', SYNTH.presets, function (error, value) {
			if (error) {
				console.error(error);
			} else {
				//console.log('Presets saved.');
				$('#preset-id').trigger('update');
			}
		});
		*/
	}
});

/*
$('#preset-export').on('click', function () {
	var presetID = parseInt($('#preset-id').val(), 10);
	SYNTH.presets.forEach(function (preset) {
		if (presetID === preset.id) {
			alert(JSON.stringify(preset));
		}
	});
});
*/
/*
localforage.getItem('presets', function (error, value) {
	if (error) {
		console.error(error);
	}
	if (value) {
		SYNTH.presets = value;
		$('#preset-id').trigger('update');
	}
	if (!error && !value) {
		localforage.setItem('presets', SYNTH.presets, function (error, value) {
			if (error) {
				console.error(error);
			} else {
				$('#preset-id').trigger('update');
				//console.log('Presets saved.');
			}
		});
	}
});
*/

// ##############################################
// # KEYBOARD                                   #
// ##############################################

(function () {
	function connectKeyboard(startNote) {
		var keyboardElement = document.getElementById('keyboard');
		if (keyboardElement) {
			keyboardElement.remove();
		}
		keyboardElement = document.createElement('div');
		keyboardElement.hidden = true;
		keyboardElement.setAttribute('id', 'keyboard');
		document.body.appendChild(keyboardElement);

		var keyboard = new QwertyHancock({
			id: 'keyboard',
			width: window.innerWidth,
			height: window.innerHeight / 2,
			octaves: 2,
			startNote: startNote,
			whiteKeyColour: '#E7ECEE',
			blackKeyColour: '#1F2022',
			activeColour: '#46C891',
			borderColour: 'black',
			keyboardLayout: 'en'
		});

		keyboard.keyDown = function (note, frequency) {
			SYNTH.addVoice('keyboard-' + note, frequency, 0.5);
		};

		keyboard.keyUp = function (note, frequency) {
			SYNTH.removeVoice('keyboard-' + note);
		};

		return keyboard;
	}

	connectKeyboard('C4');
})();

/*

// Z	-> Octave Down
// X	-> Octave Up

var keyboardFirstNote = 4;
$(window).on('keydown', function (event) {
	if (event.keyCode === 90) {
		// PRESSED Z
		keyboardFirstNote--;
		if (keyboardFirstNote < 0) {
			keyboardFirstNote = 0;
		}
		connectKeyboard('C' + keyboardFirstNote);
	} else if (event.keyCode === 88) {
		// PRESSED X
		keyboardFirstNote++;
		if (keyboardFirstNote > 9) {
			keyboardFirstNote = 9;
		}
		connectKeyboard('C' + keyboardFirstNote);
	}
});
*/

// ##############################################
// # POINTER                                    #
// ##############################################
/*

POINTER

pointerenter	-> ???
pointerover		-> ???
pointerdown		-> add sound
pointermove		-> update sound
pointerup		-> remove sound
pointercancel	-> remove sound
pointerout		-> remove sound
pointerleave	-> remove sound

pointerType		-> ???
pointerId		-> sound ID
isPrimary		-> ???
width			-> graphic effect
height			-> graphic effect
pressure		-> velocity
tiltX			-> graphic effect / pitch bend
tiltY			-> graphic effect / pitch bend
button			-> ???
buttons			-> ???
clientX			-> ???
clientY			-> ???
pageX			-> OSC frequency
pageY			-> Filter frequency

---

MOUSE

mousedown		-> add sound
mousemove		-> update sound
mouseup			-> remove sound
wheel			-> pitch bend
right click		-> ???

---

TOUCH

touchstart		-> add sound
touchmove		-> update sound
touchend		-> remove sound

*/

var points = new Map();
/*
var dumbOSCFrequency = function (mouseX, mouseMaxW) {
	var minValue = 27.5,
		maxValue = 2000;
	return ((mouseX / mouseMaxW) * maxValue) + minValue;
};
var dumbFilterFrequency = function (mouseY, mouseMaxH) {
	var minValue = 27.5,
		maxValue = SYNTH.context.sampleRate / 2;
	return ((mouseY / mouseMaxH) * maxValue) + minValue;
};
*/
var smartOSCFrequency = function (mouseX, mouseMaxW) {
	var minValue = 27.5,
		maxValue = 2000, //4186.01,
		range = mouseX * 1.0 / mouseMaxW,
		numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2,
		multiplier = Math.pow(2, numberOfOctaves * (range - 1.0)),
		frequency = maxValue * multiplier;
	return frequency;
};
var smartFilterFrequency = function (mouseY, mouseMaxH) {
	var minValue = 27.5,
		maxValue = SYNTH.context.sampleRate / 2,
		range = 1.0 - (mouseY * 1.0 / mouseMaxH),
		numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2,
		multiplier = Math.pow(2, numberOfOctaves * (range - 1.0)),
		filterFrequency = maxValue * multiplier;
	return filterFrequency;
};

$('#surface')
	.on('pointerenter pointerover', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}
	})
	.on('pointerdown', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}

		SYNTH.addVoice('pointer-' + e.pointerId, smartOSCFrequency(e.pageX, paper.width), e.pressure, smartFilterFrequency(e.pageY, paper.height));

		if (!points.has(e.pointerId)) {
			var colors = [ '#D34D2E', '#FF9900', '#F3CF3A', '#44DE43', '#3DC186', '#37BBBA', '#4DC3FA', '#B158B6', '#FB6368', '#F23A65' ];
			points.set(e.pointerId, {
				id: e.pointerId,
				x: e.pageX,
				y: e.pageY,
				color: colors[Math.floor(Math.random() * colors.length)]
			});
		}
	})
	.on('pointermove', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}
		if (SYNTH.voices.has('pointer-' + e.pointerId)) {

			SYNTH.updateVoice('pointer-' + e.pointerId, smartOSCFrequency(e.pageX, paper.width), null, smartFilterFrequency(e.pageY, paper.height));

			if (points.has(e.pointerId)) {
				var point = points.get(e.pointerId);
				point.x = e.pageX;
				point.y = e.pageY;
			}
		}
	})
	.on('pointerup pointercancel pointerout pointerleave', function (e) {
		if (e.originalEvent) {
			e = e.originalEvent;
		}

		SYNTH.removeVoice('pointer-' + e.pointerId);

		if (points.has(e.pointerId)) {
			points.delete(e.pointerId);
		}
	});

// ##############################################
// # MIDI                                       #
// ##############################################

// https://webaudio.github.io/web-midi-api/

if (!navigator.requestMIDIAccess) {
	$('#button-midi').remove();
} else {
	$('#button-midi').on('click', function () {
		// use navigator.requestMIDIAccess({ sysex: true }) for system exlusive access
		navigator.requestMIDIAccess().then(function (midiAccess) {
			console.log('MIDI ready!', midiAccess);

			/*
			for (var entry of midiAccess.inputs) {
				var input = entry[1];
				console.log('Input',
					'\n\tid: ', input.id,
					'\n\ttype: ', input.type,
					'\n\tame: ', input.name,
					'\n\tmanufacturer: ', input.manufacturer,
					'\n\tversion: ', input.version);
			}

			for (var entry of midiAccess.outputs) {
				var output = entry[1];
				console.log('Output',
					'\n\tid: ', output.id,
					'\n\ttype: ', output.type,
					'\n\tame: ', output.name,
					'\n\tmanufacturer: ', output.manufacturer,
					'\n\tversion: ', output.version);
			}
			*/

			var count = 0;
			midiAccess.inputs.forEach(function (input) {
				input.onmidimessage = function (event) {
					/*
					var data = [];
					for (var i = 0; i < event.data.length; ++i) {
						data.push('0x' + event.data[i].toString(16));
					}
					console.log('MIDI Message',
						'\n\ttimestamp: ', event.timestamp,
						'\n\tbytes length: ', event.data.length,
						'\n\tdata: ', '[' + data.join(', ') + ']');
					*/
					var command = event.data[0] & 0xf0, // Mask off the lower nibble (MIDI channel, which we don't care about)
						note = event.data[1],
						velocity = event.data[2],
						frequency = Math.pow(2, (note - 69) / 12) * 440;
					if (command === 0x90 && velocity !== 0) {
						SYNTH.addVoice('midi-' + note, frequency, velocity / 127);
					} else if (command === 0x80 || velocity === 0) {
						SYNTH.removeVoice('midi-' + note);
					}
				};
			});

			if (count > 0) {
				alert('MIDI connection ready!');
			} else {
				alert('No MIDI input detected!');
			}
		}, function (message) {
			console.log('Failed to get MIDI access', message);
			alert('Failed to get MIDI access\n\n' + message);
		});
	});
}

// ##############################################
// # FIXS & UTILITIES                           #
// ##############################################

// DISABLE iOS BOUNCE
$(document).on('touchmove', function (e) {
	e.preventDefault();
});

// VISIBILITY API - remove all voices when page is no longer visible
$(document).on('visibilitychange mozvisibilitychange msvisibilitychange webkitvisibilitychange', function (e) {
	//console.log(e.type, document.hidden, document.mozHidden, document.msHidden, document.webkitHidden);
	if (document.hidden || document.mozHidden || document.msHidden || document.webkitHidden) {
		SYNTH.voices.forEach(function (sound, id) {
			SYNTH.removeVoice(sound.id);
		});
	}
});

/*

// MICROPHONE ##########

document.getElementById('microphone').addEventListener('click', function () {
	MICROPHONE_ENABLED = !MICROPHONE_ENABLED;
	if (MICROPHONE_ENABLED) {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		navigator.getUserMedia({ audio: true }, function (stream) {
			synth.microphone = synth.context.createMediaStreamSource(stream);
			synth.microphone.connect(synth.volume);
			document.getElementById('microphone').classList.remove('red');
			document.getElementById('microphone').classList.add('green');
		}, function (error) {
			MICROPHONE_ENABLED = false;
			alert('Error on getUserMedia [ERROR CODE: ' + error.code);
			throw new Error('Error on getUserMedia [ERROR CODE: ', error.code);
		});
	} else {
		synth.microphone.disconnect();
		synth.microphone = null;
		document.getElementById('microphone').classList.remove('green');
		document.getElementById('microphone').classList.add('red');
	}
}, false);

// LOOP ##########

document.getElementById('loop').addEventListener('click', function () {
	LOOP_ENABLED = !LOOP_ENABLED;
	if (LOOP_ENABLED) {
		var url = prompt('Insert Resource URL', 'http://');
		if (url) {
			document.getElementById('loop').textContent = 'Loading...';
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.responseType = 'arraybuffer';
			request.onload = function() {
				synth.context.decodeAudioData(request.response, function (buffer) {
					if (synth.loop !== null) {
						synth.loop.stop(0);
						synth.loop.disconnect();
						synth.loop = null;
					}
					synth.loop = synth.context.createBufferSource();
					synth.loop.buffer = buffer;
					synth.loop.loop = true;
					synth.loop.connect(synth.volume);
					synth.loop.start(synth.context.currentTime);
					document.getElementById('loop').classList.remove('red');
					document.getElementById('loop').classList.add('green');
					document.getElementById('loop').innerHTML = '<i class="fa fa-file-audio-o">';
				}, function () {
					document.getElementById('loop').innerHTML = '<i class="fa fa-file-audio-o">';
					alert('Error on "' + url + '" decodeAudioData: decoding failed.');
				});
			};
			request.onerror = function() {
				document.getElementById('loop').innerHTML = '<i class="fa fa-file-audio-o">';
				alert('Error retrieving "' + url + '" XMLHttpRequest: request failed.');
			};
			request.send();
		}
	} else {
		synth.loop.disconnect();
		synth.loop = null;
		document.getElementById('loop').classList.remove('green');
		document.getElementById('loop').classList.add('red');
	}
}, false);

*/