import { CometSynth } from './modules/synth.mjs';
import { CometRender } from './modules/render.mjs';
import { CometController } from './modules/control.mjs';

const Synth = new CometSynth();

const Controller = new CometController({
	pointer: document.querySelector('#surface'),
	on_control_start: function (control_id, osc_frequency, osc_velocity, filter_frequency) {
		Synth.add_voice(control_id, osc_frequency, osc_velocity, filter_frequency);
	},
	on_control_update: function (control_id, osc_frequency, osc_velocity, filter_frequency) {
		Synth.update_voice(control_id, osc_frequency, osc_velocity, filter_frequency);
	},
	on_control_stop: function (control_id) {
		Synth.remove_voice(control_id);
	}
});

const Render = new CometRender(document.querySelector('#surface'), Synth.nodes.analyser);
Render.resize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', function () {
	Render.resize(window.innerWidth, window.innerHeight);
});
Render.start();

// OSC

$('#osc1-type').on('change', function () {
	const value = $(this).val();
	Synth.config({ osc1: { type: value } });
});

$('#osc1-detune').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc1: { detune: value } });
});

$('#osc1-mix').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc1: { mix: value } });
});

$('#osc2-type').on('change', function () {
	const value = $(this).val();
	Synth.config({ osc2: { mix: value } });
});

$('#osc2-detune').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc2: { detune: value } });
});

$('#osc2-mix').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ osc2: { mix: value } });
});

// BQF

$('#filter-type').on('change', function () {
	const value = $(this).val();
	Synth.config({ filter: { type: value } });
	if (value === 'lowshelf' || value === 'highshelf' || value === 'peaking') {
		$('#filter-gain').parent().show();
	} else {
		$('#filter-gain').parent().hide();
	}
});

$('#filter-quality').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { Q: value } });
});

$('#filter-detune').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { detune: value } });
});

$('#filter-frequency').attr('max', Synth.context.sampleRate / 2).on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { frequency: value } });
});

$('#filter-gain').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ filter: { gain: value } });
});

// EFF

// TODO

// DCM

$('#compressor-threshold').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { threshold: value } });
});

$('#compressor-knee').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { knee: value } });
});

$('#compressor-ratio').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { ratio: value } });
});

$('#compressor-attack').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { attack: value } });
});

$('#compressor-release').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ compressor: { release: value } });
});

// ANI

$('#animation-type').on('change', function () {
	const value = $(this).val();
	Render.type = value;
	// TODO
	//cancelAnimationFrame(ANIMATION.drawLoop);
	//draw();
});

$('#animation-analyser-fft').on('change', function () {
	const value = parseInt($(this).val(), 10);
	Synth.config({ analyser: { fftSize: value } });
});

$('#animation-analyser-smoothingTimeConstant').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ analyser: { smoothingTimeConstant: value } });
});

$('#animation-analyser-minDecibels').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ analyser: { minDecibels: value } });
});

$('#animation-analyser-maxDecibels').on('input', function () {
	const value = parseFloat($(this).val());
	Synth.config({ analyser: { maxDecibels: value } });
});
