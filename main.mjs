import { CometSynth } from './modules/synth.mjs';
import { CometRender } from './modules/render.mjs';
import { CometPointerController } from './modules/pointer.mjs';
import { CometKeyboardController } from './modules/keyboard.mjs';
import { CometMIDIController } from './modules/midi.mjs';

const Synth = new CometSynth();

// load wavetables
(function () {
	const $optgroup1 = $('#osc1-type').find('optgroup[label="Periodic Waves"]');
	const $optgroup2 = $('#osc2-type').find('optgroup[label="Periodic Waves"]');
	[      
		{ label: 'Boh',            name: 'boh',             url: 'waves/boh.json' },
		{ label: 'Horn',           name: 'horn',            url: 'waves/horn.json' },
		{ label: 'Noise',          name: 'noise',           url: 'waves/noise.json' },
		{ label: 'Pulse',          name: 'pulse',           url: 'waves/pulse.json' },
		{ label: 'Saw',            name: 'custom_saw',      url: 'waves/saw.json' },
		{ label: 'Square',         name: 'custom_square',   url: 'waves/square.json' },
		{ label: 'Triangle',       name: 'custom_triangle', url: 'waves/triangle.json' },
		{ label: 'Warm Saw',       name: 'warm_saw',        url: 'waves/warm_saw.json' },
		{ label: 'Warm Triangle',  name: 'warm_triangle',   url: 'waves/warm_triangle.json' },
		{ label: 'Warm Square',    name: 'warm_square',     url: 'waves/warm_square.json' },
		{ label: 'Dropped Saw',    name: 'dropped_saw',     url: 'waves/dropped_saw.json' },
		{ label: 'Dropped Square', name: 'dropped_square',  url: 'waves/dropped_square.json' },
		{ label: 'TB303 Square',   name: 'tb303_square',    url: 'waves/tb303_square.json' },
		{ label: 'Celeste',        name: 'celeste',         url: 'waves/celeste.json' }
	].forEach(function (file) {
		const $option1 = $(`<option value="${file.name}" disabled>${file.label}</option>`);
		const $option2 = $(`<option value="${file.name}" disabled>${file.label}</option>`);
		$optgroup1.append($option1);
		$optgroup2.append($option2);
		fetch(file.url)
			.then(function (response) {
				if (!response.ok) {
					throw new Error('Network response was not OK');
				}
				return response.json();
			}).then(function (data) {
				Synth.load_wave(file.name, data);
				$option1.prop('disabled', false);
				$option2.prop('disabled', false);
			}).catch(function (e) {
				console.error(`Failed wave loading ${file.name}: ${e.toString()}`);
			});
	});
})();

// load convolvers
(function () {
	const noise_buffer = Synth.context.createBuffer(2, 0.5 * Synth.context.sampleRate, Synth.context.sampleRate);
	const left = noise_buffer.getChannelData(0);
	const right = noise_buffer.getChannelData(1);
	for (let i = 0; i < noise_buffer.length; ++i) {
		left[i] = Math.random() * 2 - 1;
		right[i] = Math.random() * 2 - 1;
	}
	const $select = $('#convolver-type');
	[
		{ label: 'Noise',           name: 'noise',     buffer: noise_buffer },
		{ label: 'Hall',            name: 'hall',      url: 'convolvers/hall.ogg' },
		{ label: 'Telephone',       name: 'telephone', url: 'convolvers/telephone.wav' },
		{ label: 'Muffler',         name: 'muffler',   url: 'convolvers/muffler.wav' },
		{ label: 'Spring Feedback', name: 'spring',    url: 'convolvers/spring_feedback.wav' },
		{ label: 'Echo',            name: 'echo',      url: 'convolvers/echo.wav' }
	].forEach(function (file) {
		const $option = $(`<option value="${file.name}" disabled>${file.label}</option>`);
		$select.append($option);
		if (file.buffer) {
			Synth.load_convolver(file.name, file.buffer);
			$option.prop('disabled', false);
		} else if (file.url) {
			fetch(file.url)
				.then(function (response) {
					if (!response.ok) {
						throw new Error('Network response was not OK');
					}
					return response.arrayBuffer();
				}).then(function (data) {
					return Synth.context.decodeAudioData(data);
				}).then(function (buffer) {
					Synth.load_convolver(file.name, buffer);
					$option.prop('disabled', false);
				}).catch(function (e) {
					console.error(`Failed convolver loading ${file.name}: ${e.toString()}`);
				});
		}
	});
})();

const PointerController = new CometPointerController({
	surface: document.querySelector('#surface'),
	on_start: function (control_id, osc_frequency, osc_velocity, filter_frequency) {
		Synth.add_voice(control_id, osc_frequency, osc_velocity, filter_frequency);
	},
	on_update: function (control_id, osc_frequency, osc_velocity, filter_frequency) {
		Synth.update_voice(control_id, osc_frequency, osc_velocity, filter_frequency);
	},
	on_stop: function (control_id) {
		Synth.remove_voice(control_id);
	}
});

const KeyboardController = new CometKeyboardController({
	on_start: function (control_id, osc_frequency, osc_velocity) {
		Synth.add_voice(control_id, osc_frequency, osc_velocity);
	},
	on_stop: function (control_id) {
		Synth.remove_voice(control_id);
	}
});

const MIDIController = new CometMIDIController({
	on_start: function (control_id, osc_frequency, osc_velocity) {
		Synth.add_voice(control_id, osc_frequency, osc_velocity);
	},
	on_stop: function (control_id) {
		Synth.remove_voice(control_id);
	}
});

const Render = new CometRender(document.querySelector('#surface'), Synth.nodes.analyser);
Render.resize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', function () {
	Render.resize(window.innerWidth, window.innerHeight);
});
Render.start();

$('.splash').delay(2000).fadeOut();
$('#module-info').delay(8000).fadeOut();
$('.aside').on('click', '.button', function () {
	const $this = $(this);
	const module_id = $this.attr('data-module');
	const $module = $(`#module-${module_id}`);
	$('.aside > .button').removeClass('active');
	if ($module.is(':visible')) {
		$module.hide();
	} else {
		$this.addClass('active');
		$('.module').hide();
		$module.show();
	}
});

// OSC

$('#osc1-type').val(Synth.settings.osc1.type).on('change', function () {
	const value = $(this).val();
	Synth.config({ osc1: { type: value } });
});

$('#osc1-detune').val(Synth.settings.osc1.detune).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc1: { detune: value } });
});

$('#osc1-mix').val(Synth.settings.osc1.mix).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc1: { mix: value } });
});

$('#osc2-type').val(Synth.settings.osc2.type).on('change', function () {
	const value = $(this).val();
	Synth.config({ osc2: { type: value } });
});

$('#osc2-detune').val(Synth.settings.osc2.detune).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc2: { detune: value } });
});

$('#osc2-mix').val(Synth.settings.osc2.mix).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc2: { mix: value } });
});

// FILTER

$('#filter-type').val(Synth.settings.filter.type).on('change', function () {
	const value = $(this).val();
	Synth.config({ filter: { type: value } });
	if (value === 'lowshelf' || value === 'highshelf' || value === 'peaking') {
		$('#filter-gain').parent().show();
	} else {
		$('#filter-gain').parent().hide();
	}
}).trigger('change');

$('#filter-quality').val(Synth.settings.filter.Q).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { Q: value } });
});

$('#filter-detune').val(Synth.settings.filter.detune).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { detune: value } });
});

$('#filter-frequency').attr('max', Synth.context.sampleRate / 2).val(Synth.settings.filter.frequency).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { frequency: value } });
});

$('#filter-gain').val(Synth.settings.filter.gain).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { gain: value } });
});

// COMPRESSOR

$('#compressor-threshold').val(Synth.settings.compressor.threshold).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { threshold: value } });
});

$('#compressor-knee').val(Synth.settings.compressor.knee).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { knee: value } });
});

$('#compressor-ratio').val(Synth.settings.compressor.ratio).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { ratio: value } });
});

$('#compressor-attack').val(Synth.settings.compressor.attack).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { attack: value } });
});

$('#compressor-release').val(Synth.settings.compressor.release).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { release: value } });
});

// WAVESHAPER

$('#waveshaper-curve').val(Synth.settings.waveshaper.curve).on('change', function () {
	const value = $(this).val();
	Synth.config({ waveshaper: { curve: value } });
});

$('#waveshaper-oversample').val(Synth.settings.waveshaper.oversample).on('change', function () {
	const value = $(this).val();
	Synth.config({ waveshaper: { oversample: value } });
});

// ENVELOPE

$('#envelope-attack').val(Synth.settings.envelope.attack).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ envelope: { attack: value } });
});

$('#envelope-release').val(Synth.settings.envelope.release).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ envelope: { release: value } });
});

// CONVOLVER

$('#convolver-type').val(Synth.settings.convolver.type).on('change', function () {
	const value = $(this).val();
	Synth.config({ convolver: { type: value } });
});

// ANALYSER

$('#analyser-type').val(Render.type).on('change', function () {
	const value = $(this).val();
	Render.type = value;
});

$('#analyser-fftSize').val(Synth.settings.analyser.fftSize).on('change', function () {
	const value = parseInt($(this).val(), 10);
	Synth.config({ analyser: { fftSize: value } });
});

$('#analyser-smoothingTimeConstant').val(Synth.settings.analyser.smoothingTimeConstant).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ analyser: { smoothingTimeConstant: value } });
});

$('#analyser-minDecibels').val(Synth.settings.analyser.minDecibels).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ analyser: { minDecibels: value } });
});

$('#analyser-maxDecibels').val(Synth.settings.analyser.maxDecibels).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ analyser: { maxDecibels: value } });
});
