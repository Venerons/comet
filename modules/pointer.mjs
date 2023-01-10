class CometPointerController {
	#surface;
	#on_start;
	#on_update;
	#on_stop;
	constructor(options) {
		const t = this;
		t.#surface = options.surface;
		t.#on_start = options.on_start;
		t.#on_update = options.on_update;
		t.#on_stop = options.on_stop;
		const pointers = new Set();
		t.surface.addEventListener('pointerdown', function (e) {
			if (!pointers.has(e.pointerId)) {
				pointers.add(e.pointerId);
				t.start(e);
			}
		});
		t.surface.addEventListener('pointermove', function (e) {
			if (pointers.has(e.pointerId)) {
				t.update(e);
			}
		});
		t.surface.addEventListener('pointerup', function (e) {
			if (pointers.has(e.pointerId)) {
				pointers.delete(e.pointerId);
				t.stop(e);
			}
		});
		t.surface.addEventListener('pointercancel', function (e) {
			if (pointers.has(e.pointerId)) {
				pointers.delete(e.pointerId);
				t.stop(e);
			}
		});
		t.surface.addEventListener('pointerout', function (e) {
			if (pointers.has(e.pointerId)) {
				pointers.delete(e.pointerId);
				t.stop(e);
			}
		});
		t.surface.addEventListener('pointerleave', function (e) {
			if (pointers.has(e.pointerId)) {
				pointers.delete(e.pointerId);
				t.stop(e);
			}
		});
	}

	start(e) {
		const t = this;
		if (t.#on_start) {
			const control_id = `pointer_${e.pointerId}`;
			const osc_frequency = CometPointerController.smart_osc_frequency(e.pageX, t.surface.width);
			const osc_velocity = e.pressure;
			const filter_frequency = CometPointerController.smart_filter_frequency(e.pageY, t.surface.height);
			t.#on_start(control_id, osc_frequency, osc_velocity, filter_frequency);
		}
	}

	update(e) {
		const t = this;
		if (t.#on_update) {
			const control_id = `pointer_${e.pointerId}`;
			const osc_frequency = CometPointerController.smart_osc_frequency(e.pageX, t.surface.width);
			const osc_velocity = e.pressure;
			const filter_frequency = CometPointerController.smart_filter_frequency(e.pageY, t.surface.height);
			t.#on_update(control_id, osc_frequency, osc_velocity, filter_frequency);
		}
	}

	stop(e) {
		const t = this;
		if (t.#on_stop) {
			t.#on_stop(`pointer_${e.pointerId}`);
		}
	}

	/*
	static standard_osc_frequency(mouseX, mouseMaxW) {
		const minValue = 27.5;
		const maxValue = 2000; // 4186.01
		return ((mouseX / mouseMaxW) * maxValue) + minValue;
	}

	static standard_filter_frequency(mouseY, mouseMaxH) {
		const minValue = 27.5;
		const maxValue = 24000; // Synth.context.sampleRate / 2
		return ((mouseY / mouseMaxH) * maxValue) + minValue;
	}
	*/

	static smart_osc_frequency(mouseX, mouseMaxW) {
		const minValue = 27.5;
		const maxValue = 2000; // 4186.01
		const range = mouseX * 1.0 / mouseMaxW;
		const numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
		const multiplier = Math.pow(2, numberOfOctaves * (range - 1.0));
		return maxValue * multiplier;
	}

	static smart_filter_frequency(mouseY, mouseMaxH) {
		const minValue = 27.5;
		const maxValue = 24000; // Synth.context.sampleRate / 2
		const range = 1.0 - (mouseY * 1.0 / mouseMaxH);
		const numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
		const multiplier = Math.pow(2, numberOfOctaves * (range - 1.0));
		return maxValue * multiplier;
	}
}

export { CometPointerController };
