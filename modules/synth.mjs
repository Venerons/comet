class CometSynth {
	constructor() {
		const t = this;
		t.context = new window.AudioContext();
		t.voices = new Map();

		t.wavetables = {
			horn: {
				real: new Float32Array([0, 0.4, 0.4, 1, 1, 1, 0.3, 0.7, 0.6, 0.5, 0.9, 0.8]),
				imag: new Float32Array(12)
			}
		};
		Object.keys(t.wavetables).forEach(function (name) {
			const table = t.wavetables[name];
			table.wave = new PeriodicWave(t.context, { real: table.real, imag: table.imag });
		});

		t.settings = {};
		t.default_settings = {
			osc1: {
				type: 'sawtooth',
				frequency: 440,
				detune: 0,
				mix: 1
			},
			osc2: {
				type: 'none',
				frequency: 440,
				detune: 0,
				mix: 1
			},
			filter: {
				type: 'lowpass',
				Q: 1,
				detune: 0,
				frequency: t.context.sampleRate / 2, // 350
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
			analyser: {
				fftSize: 512,
				smoothingTimeConstant: 0.8,
				minDecibels: -100,
				maxDecibels: -30
			}
		};

		t.nodes = {};
		t.nodes.effect = new GainNode(t.context);
		t.nodes.compressor = new DynamicsCompressorNode(t.context);
		t.nodes.analyser = new AnalyserNode(t.context);

		t.nodes.effect.connect(t.nodes.compressor);
		t.nodes.compressor.connect(t.nodes.analyser);
		t.nodes.analyser.connect(t.context.destination);

		t.config(t.default_settings);
	}

	config(settings) {
		const t = this;
		Object.entries(settings).forEach(function ([category_key, category_settings]) {
			if (!t.settings[category_key]) {
				t.settings[category_key] = {};
			}
			Object.entries(category_settings).forEach(function ([setting_key, value]) {
				t.settings[category_key][setting_key] = value;
			});
		});

		if (settings.osc1 || settings.osc2 || settings.filter) {
			t.voices.forEach(function (voice) {
				// OSC 1
				if (settings.osc1 && voice.osc1) {
					voice.osc1.detune.value = t.settings.osc1.detune;
					voice.mix1.gain.value = t.settings.osc1.mix;
				}
				// OSC 2
				if (settings.osc2 && voice.osc2) {
					voice.osc2.detune.value = t.settings.osc2.detune;
					voice.mix2.gain.value = t.settings.osc2.mix;
				}
				// BIQUAD FILTER
				if (settings.filter && voice.filter) {
					voice.osc2.detune.value = t.settings.osc2.detune;
					voice.filter.type = t.settings.filter.type;
					voice.filter.Q.value = t.settings.filter.Q;
					voice.filter.detune.value = t.settings.filter.detune;
					voice.filter.frequency.value = t.settings.filter.frequency;
					voice.filter.gain.value = t.settings.filter.gain;
				}
			});
		}

		// EFFECT
		if (settings.effect) {
			// TODO
		}

		// DYNAMICS COMPRESSOR
		if (settings.compressor) {
			t.nodes.compressor.threshold.value = t.settings.compressor.threshold;
			t.nodes.compressor.knee.value = t.settings.compressor.knee;
			t.nodes.compressor.ratio.value = t.settings.compressor.ratio;
			t.nodes.compressor.attack.value = t.settings.compressor.attack;
			t.nodes.compressor.release.value = t.settings.compressor.release;
		}

		// ANALYSER
		if (settings.analyser) {
			t.nodes.analyser.fftSize = t.settings.analyser.fftSize;
			t.nodes.analyser.smoothingTimeConstant = t.settings.analyser.smoothingTimeConstant;
			t.nodes.analyser.minDecibels = t.settings.analyser.minDecibels;
			t.nodes.analyser.maxDecibels = t.settings.analyser.maxDecibels;
		}
	}

	add_voice(voice_id, frequency, velocity, filter_frequency) {
		const t = this;
		const settings = t.settings;
		const voice = {
			id: voice_id || Date.now()
		};

		// OSCILLATOR 1
		if (settings.osc1.type !== 'none') {
			const options = {};
			if (t.wavetables[settings.osc1.type]) {
				options.periodicWave = t.wavetables[settings.osc1.type].wave;
			} else {
				options.type = settings.osc1.type;
			}
			options.frequency = frequency || settings.osc1.frequency;
			options.detune = settings.osc1.detune;
			voice.osc1 = new OscillatorNode(t.context, options);
			voice.osc1.start(0);
			voice.mix1 = new GainNode(t.context, { gain: settings.osc1.mix });
		}

		// OSCILLATOR 2
		if (settings.osc2.type !== 'none') {
			const options = {};
			if (t.wavetables[settings.osc2.type]) {
				options.periodicWave = t.wavetables[settings.osc2.type].wave;
			} else {
				options.type = settings.osc2.type;
			}
			options.frequency = frequency || settings.osc2.frequency;
			options.detune = settings.osc2.detune;
			voice.osc2 = new OscillatorNode(t.context, options);
			voice.osc2.start(0);
			voice.mix2 = new GainNode(t.context, { gain: settings.osc2.mix });
		}

		// VELOCITY GAIN
		voice.velocity = new GainNode(t.context, { gain: velocity || 1 });

		// BIQUAD FILTER
		voice.filter = new BiquadFilterNode(t.context, {
			type: settings.filter.type,
			Q: settings.filter.Q,
			detune: settings.filter.detune,
			frequency: Math.min(filter_frequency || settings.filter.frequency, t.context.sampleRate / 2),
			gain: settings.filter.gain
		});

		// CONNECTIONS
		if (voice.osc1) {
			voice.osc1.connect(voice.mix1);
			voice.mix1.connect(voice.velocity);
		}
		if (voice.osc2) {
			voice.osc2.connect(voice.mix2);
			voice.mix2.connect(voice.velocity);
		}
		voice.velocity.connect(voice.filter);
		voice.filter.connect(t.nodes.effect);

		// COLLECTION
		if (t.voices.has(voice.id)) {
			t.remove_voice(voice.id);
		}
		t.voices.set(voice.id, voice);
		return voice.id;
	}

	update_voice(voice_id, frequency, velocity, filter_frequency) {
		const t = this;
		if (t.voices.has(voice_id)) {
			const voice = t.voices.get(voice_id);
			if (frequency !== null && frequency !== undefined) {
				if (voice.osc1) {
					voice.osc1.frequency.value = frequency;
				}
				if (voice.osc2) {
					voice.osc2.frequency.value = frequency;
				}
			}
			if (velocity !== null && velocity !== undefined) {
				voice.velocity.gain.value = velocity;
			}
			if (filter_frequency !== null && filter_frequency !== undefined) {
				voice.filter.frequency.value = Math.min(filter_frequency, t.context.sampleRate / 2);
			}
		}
	}

	remove_voice(voice_id) {
		const t = this;
		if (t.voices.has(voice_id)) {
			const voice = t.voices.get(voice_id);
			if (voice.osc1) {
				voice.osc1.stop(0);
				voice.osc1.disconnect();
				voice.mix1.disconnect();
			}
			if (voice.osc2) {
				voice.osc2.stop(0);
				voice.osc2.disconnect();
				voice.mix2.disconnect();
			}
			voice.velocity.disconnect();
			voice.filter.disconnect();
			t.voices.delete(voice_id);
		}
	}
}

export { CometSynth };
