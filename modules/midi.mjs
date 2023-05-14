class CometMIDIController {
	#on_start;
	#on_stop;
	constructor(options) {
		const t = this;
		t.#on_start = options.on_start;
		t.#on_stop = options.on_stop;
		if (!navigator.requestMIDIAccess) {
			console.error('MIDI not supported');
			return;
		}
		navigator.requestMIDIAccess().then(
			(midiAccess) => {
				console.log('MIDI ready!', midiAccess);
				for (const entry of midiAccess.inputs) {
					const input = entry[1];
					// prettier-ignore
					console.log('Input',
						'\n\tid:', input.id,
						'\n\ttype:', input.type,
						'\n\tname:', input.name,
						'\n\tmanufacturer:', input.manufacturer,
						'\n\tversion:', input.version);
				}
				for (const entry of midiAccess.outputs) {
					const output = entry[1];
					// prettier-ignore
					console.log('Output',
						'\n\tid:', output.id,
						'\n\ttype:', output.type,
						'\n\tname:', output.name,
						'\n\tmanufacturer:', output.manufacturer,
						'\n\tversion:', output.version);
				}
				midiAccess.inputs.forEach((input) => {
					input.onmidimessage = (event) => {
						/*
						const data = [];
						for (let i = 0; i < event.data.length; ++i) {
							data.push('0x' + event.data[i].toString(16));
						}
						console.log('MIDI Message',
							'\n\ttimestamp:', event.timestamp,
							'\n\tbytes length:', event.data.length,
							'\n\tdata:', `[${data.join(', ')}]`);
						*/
						const command = event.data[0] & 0xf0; // Mask off the lower nibble (MIDI channel, which we don't care about)
						const note = event.data[1];
						const velocity = event.data[2] / 127;
						const frequency = Math.pow(2, (note - 69) / 12) * 440;
						if (command === 0x90 && velocity !== 0) {
							t.start(note, frequency, velocity);
						} else if (command === 0x80 || velocity === 0) {
							t.stop(note);
						}
					};
				});
			},
			(message) => {
				console.error('Failed to get MIDI access', message);
			}
		);
	}

	start(note, frequency, velocity) {
		const t = this;
		if (t.#on_start) {
			const control_id = `midi_${note}`;
			const osc_frequency = frequency;
			const osc_velocity = velocity;
			t.#on_start(control_id, osc_frequency, osc_velocity);
		}
	}

	stop(note) {
		const t = this;
		if (t.#on_stop) {
			t.#on_stop(`midi_${note}`);
		}
	}
}

export { CometMIDIController };
