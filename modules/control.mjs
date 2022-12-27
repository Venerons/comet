class CometController {
	constructor(settings) {
		const t = this;
		t.on_control_start = settings.on_control_start;
		t.on_control_update = settings.on_control_update;
		t.on_control_stop = settings.on_control_stop;
		if (settings.pointer) {
			t.surface = settings.pointer;
			t.pointers = new Set();
			t.surface.addEventListener('pointerdown', function (e) {
				if (!t.pointers.has(e.pointerId)) {
					t.pointers.add(e.pointerId);
					t.control_start('pointer', e);
				}
			});
			t.surface.addEventListener('pointermove', function (e) {
				if (t.pointers.has(e.pointerId)) {
					t.control_update('pointer', e);
				}
			});
			t.surface.addEventListener('pointerup', function (e) {
				if (t.pointers.has(e.pointerId)) {
					t.pointers.delete(e.pointerId);
					t.control_stop('pointer', e);
				}
			});
			t.surface.addEventListener('pointercancel', function (e) {
				if (t.pointers.has(e.pointerId)) {
					t.pointers.delete(e.pointerId);
					t.control_stop('pointer', e);
				}
			});
			t.surface.addEventListener('pointerout', function (e) {
				if (t.pointers.has(e.pointerId)) {
					t.pointers.delete(e.pointerId);
					t.control_stop('pointer', e);
				}
			});
			t.surface.addEventListener('pointerleave', function (e) {
				if (t.pointers.has(e.pointerId)) {
					t.pointers.delete(e.pointerId);
					t.control_stop('pointer', e);
				}
			});
		}
		if (settings.keyboard) {
			t.keys = new Set();
			document.addEventListener('keydown', function (e) {
				if (e.isComposing || e.keyCode === 229) {
					return;
				}
				if (!t.keys.has(e.key)) {
					t.keys.add(e.key);
					t.control_start('key', { key: e.key });
				}
			}, false);
			document.addEventListener('keyup', function (e) {
				if (e.isComposing || e.keyCode === 229) {
					return;
				}
				if (t.keys.has(e.key)) {
					t.keys.delete(e.key);
					t.control_stop('key', { key: e.key });
				}
			}, false);
			t.key_map = {
				a: 40,
				w: 41,
				s: 42,
				e: 43,
				d: 44,
				f: 45,
				t: 46,
				g: 47,
				y: 48,
				h: 49,
				u: 50,
				j: 51,
				k: 52,
				o: 53,
				l: 54,
				p: 55
			};
			t.piano_keys = {
				"1": 27.5,
				"2": 29.13524,
				"3": 30.86771,
				"4": 32.7032,
				"5": 34.64783,
				"6": 36.7081,
				"7": 38.89087,
				"8": 41.20344,
				"9": 43.65353,
				"10": 46.2493,
				"11": 48.99943,
				"12": 51.91309,
				"13": 55,
				"14": 58.27047,
				"15": 61.73541,
				"16": 65.40639,
				"17": 69.29566,
				"18": 73.41619,
				"19": 77.78175,
				"20": 82.40689,
				"21": 87.30706,
				"22": 92.49861,
				"23": 97.99886,
				"24": 103.8262,
				"25": 110,
				"26": 116.5409,
				"27": 123.4708,
				"28": 130.8128,
				"29": 138.5913,
				"30": 146.8324,
				"31": 155.5635,
				"32": 164.8138,
				"33": 174.6141,
				"34": 184.9972,
				"35": 195.9977,
				"36": 207.6523,
				"37": 220,
				"38": 233.0819,
				"39": 246.9417,
				"40": 261.6256,
				"41": 277.1826,
				"42": 293.6648,
				"43": 311.127,
				"44": 329.6276,
				"45": 349.2282,
				"46": 369.9944,
				"47": 391.9954,
				"48": 415.3047,
				"49": 440,
				"50": 466.1638,
				"51": 493.8833,
				"52": 523.2511,
				"53": 554.3653,
				"54": 587.3295,
				"55": 622.254,
				"56": 659.2551,
				"57": 698.4565,
				"58": 739.9888,
				"59": 783.9909,
				"60": 830.6094,
				"61": 880,
				"62": 932.3275,
				"63": 987.7666,
				"64": 1046.502,
				"65": 1108.731,
				"66": 1174.659,
				"67": 1244.508,
				"68": 1318.51,
				"69": 1396.913,
				"70": 1479.978,
				"71": 1567.982,
				"72": 1661.219,
				"73": 1760,
				"74": 1864.655,
				"75": 1975.533,
				"76": 2093.005,
				"77": 2217.461,
				"78": 2349.318,
				"79": 2489.016,
				"80": 2637.02,
				"81": 2793.826,
				"82": 2959.955,
				"83": 3135.963,
				"84": 3322.438,
				"85": 3520,
				"86": 3729.31,
				"87": 3951.066,
				"88": 4186.009,
				"89": 16.3516,
				"90": 17.32391,
				"91": 18.35405,
				"92": 19.44544,
				"93": 20.60172,
				"94": 21.82676,
				"95": 23.12465,
				"96": 24.49971,
				"97": 25.95654,
				"98": 4434.922,
				"99": 4698.636,
				"100": 4978.032,
				"101": 5274.041,
				"102": 5587.652,
				"103": 5919.911,
				"104": 6271.927,
				"105": 6644.875,
				"106": 7040,
				"107": 7458.62,
				"108": 7902.133
			};
		}
		if (settings.midi && navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then(function (midiAccess) {
				/*
				console.log('MIDI ready!', midiAccess);
				for (const entry of midiAccess.inputs) {
					const input = entry[1];
					console.log('Input',
						'\n\tid: ', input.id,
						'\n\ttype: ', input.type,
						'\n\tname: ', input.name,
						'\n\tmanufacturer: ', input.manufacturer,
						'\n\tversion: ', input.version);
				}
				for (const entry of midiAccess.outputs) {
					const output = entry[1];
					console.log('Output',
						'\n\tid: ', output.id,
						'\n\ttype: ', output.type,
						'\n\tname: ', output.name,
						'\n\tmanufacturer: ', output.manufacturer,
						'\n\tversion: ', output.version);
				}
				*/
				midiAccess.inputs.forEach(function (input) {
					input.onmidimessage = function (event) {
						/*
						const data = [];
						for (let i = 0; i < event.data.length; ++i) {
							data.push('0x' + event.data[i].toString(16));
						}
						console.log('MIDI Message',
							'\n\ttimestamp: ', event.timestamp,
							'\n\tbytes length: ', event.data.length,
							'\n\tdata: ', '[' + data.join(', ') + ']');
						*/
						const command = event.data[0] & 0xf0; // Mask off the lower nibble (MIDI channel, which we don't care about)
						const note = event.data[1];
						const velocity = event.data[2];
						const frequency = Math.pow(2, (note - 69) / 12) * 440;
						if (command === 0x90 && velocity !== 0) {
							t.control_start('midi', { note, frequency, velocity: velocity / 127 });
						} else if (command === 0x80 || velocity === 0) {
							t.control_stop('midi', { note });
						}
					};
				});
			}, function (message) {
				console.error('Failed to get MIDI access', message);
			});
		}
	}

	control_start(type, e) {
		const t = this;
		let control_id, osc_frequency, osc_velocity, filter_frequency;
		if (type === 'pointer') {
			control_id = `pointer_${e.pointerId}`;
			osc_frequency = t.smart_osc_frequency(e.pageX, t.surface.width);
			osc_velocity = e.pressure;
			filter_frequency = t.smart_filter_frequency(e.pageY, t.surface.height);
		} else if (type === 'key') {
			control_id = `key_${e.key}`;
			const piano_key = t.key_map[e.key.toLowerCase()];
			if (!piano_key) {
				return;
			}
			osc_frequency = t.piano_keys[piano_key.toString()];
			osc_velocity = 0.5;
			filter_frequency = null;
		} else if (type === 'midi') {
			control_id = `midi_${e.note}`;
			osc_frequency = e.frequency;
			osc_velocity = e.velocity;
			filter_frequency = null;
		}
		if (t.on_control_start) {
			t.on_control_start(control_id, osc_frequency, osc_velocity, filter_frequency);
		}
	}

	control_update(type, e) {
		const t = this;
		let control_id, osc_frequency, osc_velocity, filter_frequency;
		if (type === 'pointer') {
			control_id = `pointer_${e.pointerId}`;
			osc_frequency = t.smart_osc_frequency(e.pageX, t.surface.width);
			osc_velocity = e.pressure;
			filter_frequency = t.smart_filter_frequency(e.pageY, t.surface.height);
		} else if (type === 'key') {
			// nothing
		} else if (type === 'midi') {
			// nothing
		}
		if (t.on_control_update) {
			t.on_control_update(control_id, osc_frequency, osc_velocity, filter_frequency);
		}
	}

	control_stop(type, e) {
		const t = this;
		let control_id;
		if (type === 'pointer') {
			control_id = `pointer_${e.pointerId}`;
		} else if (type === 'key') {
			control_id = `key_${e.key}`;
		} else if (type === 'midi') {
			control_id = `midi_${e.note}`;
		}
		if (t.on_control_stop) {
			t.on_control_stop(control_id);
		}
	}

	/*
	standard_osc_frequency(mouseX, mouseMaxW) {
		const minValue = 27.5;
		const maxValue = 2000; // 4186.01
		return ((mouseX / mouseMaxW) * maxValue) + minValue;
	}

	standard_filter_frequency(mouseY, mouseMaxH) {
		const minValue = 27.5;
		const maxValue = 24000; // Synth.context.sampleRate / 2
		return ((mouseY / mouseMaxH) * maxValue) + minValue;
	}
	*/

	smart_osc_frequency(mouseX, mouseMaxW) {
		const minValue = 27.5;
		const maxValue = 2000; // 4186.01
		const range = mouseX * 1.0 / mouseMaxW;
		const numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
		const multiplier = Math.pow(2, numberOfOctaves * (range - 1.0));
		return maxValue * multiplier;
	}

	smart_filter_frequency(mouseY, mouseMaxH) {
		const minValue = 27.5;
		const maxValue = 24000; // Synth.context.sampleRate / 2
		const range = 1.0 - (mouseY * 1.0 / mouseMaxH);
		const numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
		const multiplier = Math.pow(2, numberOfOctaves * (range - 1.0));
		return maxValue * multiplier;
	}
}

export { CometController };
