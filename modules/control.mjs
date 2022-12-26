class CometController {
	constructor(settings) {
		const t = this;
		t.on_control_start = settings.on_control_start;
		t.on_control_update = settings.on_control_update;
		t.on_control_stop = settings.on_control_stop;
		if (settings.pointer) {
			t.surface = settings.pointer;
			t.surface.addEventListener('pointerdown', function (e) {
				t.control_start('pointer', e);
			});
			t.surface.addEventListener('pointermove', function (e) {
				t.control_update('pointer', e);
			});
			t.surface.addEventListener('pointerup', function (e) {
				t.control_stop('pointer', e);
			});
			t.surface.addEventListener('pointercancel', function (e) {
				t.control_stop('pointer', e);
			});
			t.surface.addEventListener('pointerout', function (e) {
				t.control_stop('pointer', e);
			});
			t.surface.addEventListener('pointerleave', function (e) {
				t.control_stop('pointer', e);
			});
		}
	}

	control_start(type, event) {
		let control_id, osc_frequency, osc_velocity, filter_frequency;
		if (type === 'pointer') {
			if (event.originalEvent) {
				event = event.originalEvent;
			}
			control_id = event.pointerId;
			osc_frequency = t.smartOSCFrequency(event.pageX, t.surface.width);
			osc_velocity = event.pressure;
			filter_frequency = t.smartFilterFrequency(event.pageY, t.surface.height);
		}
		if (t.on_control_start) {
			t.on_control_start(control_id, osc_frequency, osc_velocity, filter_frequency);
		}
	}

	control_update(type, event) {
		let control_id, osc_frequency, osc_velocity, filter_frequency;
		if (type === 'pointer') {
			if (event.originalEvent) {
				event = event.originalEvent;
			}
			control_id = event.pointerId;
			osc_frequency = t.smartOSCFrequency(event.pageX, t.surface.width);
			osc_velocity = event.pressure;
			filter_frequency = t.smartFilterFrequency(event.pageY, t.surface.height);
		}
		if (t.on_control_update) {
			t.on_control_update(control_id, osc_frequency, osc_velocity, filter_frequency);
		}
	}

	control_stop(type, event) {
		let control_id;
		if (type === 'pointer') {
			if (event.originalEvent) {
				event = event.originalEvent;
			}
			control_id = event.pointerId;
		}
		if (t.on_control_stop) {
			t.on_control_stop(control_id);
		}
	}
}

export { CometController };
