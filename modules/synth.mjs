class CometSynth {
	constructor() {
		const t = this;
		t.context = new window.AudioContext();
		t.voices = new Map();
		t.waves = new Map();
		t.convolvers = new Map();

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
			compressor: {
				threshold: -24,
				knee: 30,
				ratio: 12,
				attack: 0.003,
				release: 0.25
			},
			waveshaper: {
				curve: 'none',
				oversample: 'none'
			},
			envelope: {
				attack: 0,
				release: 0
			},
			convolver: {
				type: 'none'
			},
			analyser: {
				fftSize: 512,
				smoothingTimeConstant: 0.8,
				minDecibels: -100,
				maxDecibels: -30
			}
		};

		t.nodes = {};
		t.nodes.compressor = new DynamicsCompressorNode(t.context);
		t.nodes.waveshaper = new WaveShaperNode(t.context);
		t.nodes.envelope = new GainNode(t.context);
		t.nodes.convolver = new ConvolverNode(t.context);
		t.nodes.analyser = new AnalyserNode(t.context);

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
				// FILTER
				if (settings.filter && voice.filter) {
					voice.filter.type = t.settings.filter.type;
					voice.filter.Q.value = t.settings.filter.Q;
					voice.filter.detune.value = t.settings.filter.detune;
					voice.filter.frequency.value = t.settings.filter.frequency;
					voice.filter.gain.value = t.settings.filter.gain;
				}
			});
		}

		// WAVESHAPER
		if (settings.waveshaper) {
			if (t.settings.waveshaper.curve === 'none') {
				t.nodes.compressor.connect(t.nodes.envelope);
				t.nodes.waveshaper.disconnect();
			} else if (t.settings.waveshaper.curve === 'distorsion') {
				const make_distorsion_curve = function (amount) {
					const k = typeof amount === 'number' ? amount : 50;
					const n_samples = 44100;
					const curve = new Float32Array(n_samples);
					const deg = Math.PI / 180;
					for (let i = 0; i < n_samples; ++i) {
						const x = i * 2 / n_samples - 1;
						curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
					}
					return curve;
				};
				t.nodes.waveshaper.curve = make_distorsion_curve(100);
				t.nodes.waveshaper.oversample = t.settings.waveshaper.oversample;
				t.nodes.compressor.connect(t.nodes.waveshaper);
				t.nodes.waveshaper.connect(t.nodes.envelope);
			}
		}

		// COMPRESSOR
		if (settings.compressor) {
			t.nodes.compressor.threshold.value = t.settings.compressor.threshold;
			t.nodes.compressor.knee.value = t.settings.compressor.knee;
			t.nodes.compressor.ratio.value = t.settings.compressor.ratio;
			t.nodes.compressor.attack.value = t.settings.compressor.attack;
			t.nodes.compressor.release.value = t.settings.compressor.release;
		}

		// ENVELOPE
		if (settings.envelope) {
			// TODO
			t.nodes.envelope.gain.value = 1;
		}

		// CONVOLVER
		if (settings.convolver) {
			if (t.settings.convolver.type === 'none') {
				t.nodes.envelope.connect(t.nodes.analyser);
				t.nodes.convolver.disconnect();
			} else if (t.convolvers.has(t.settings.convolver.type)) {
				t.nodes.convolver.buffer = t.convolvers.get(t.settings.convolver.type);
				t.nodes.envelope.connect(t.nodes.convolver);
				t.nodes.convolver.connect(t.nodes.analyser);
			}
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
			if (t.waves.has(settings.osc1.type)) {
				options.type = 'custom';
				options.periodicWave = t.waves.get(settings.osc1.type);
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
			if (t.waves.has(settings.osc2.type)) {
				options.periodicWave = t.waves.get(settings.osc2.type);
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

		// FILTER
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
		voice.filter.connect(t.nodes.compressor);

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

	load_wave(name, wave_table) {
		const t = this;
		const wave = new PeriodicWave(t.context, {
			real: new Float32Array(wave_table.real),
			imag: new Float32Array(wave_table.imag)
		});
		t.waves.set(name, wave);
	}

	load_convolver(name, buffer) {
		const t = this;
		t.convolvers.set(name, buffer);
	}
}

export { CometSynth };
