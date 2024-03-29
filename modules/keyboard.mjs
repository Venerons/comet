class CometKeyboardController {
	#on_start;
	#on_stop;
	constructor(options) {
		const t = this;
		t.#on_start = options.on_start;
		t.#on_stop = options.on_stop;
		const keys = new Set();
		document.addEventListener(
			'keydown',
			(e) => {
				if (e.isComposing || e.keyCode === 229) {
					return;
				}
				const key = e.code; // e.key is layout-dependant
				if (!keys.has(key)) {
					keys.add(key);
					t.start(key);
				}
			},
			false
		);
		document.addEventListener(
			'keyup',
			(e) => {
				if (e.isComposing || e.keyCode === 229) {
					return;
				}
				const key = e.code; // e.key is layout-dependant
				if (keys.has(key)) {
					keys.delete(key);
					t.stop(key);
				}
			},
			false
		);
	}

	start(key) {
		const t = this;
		if (t.#on_start) {
			const control_id = `key_${key}`;
			const piano_key = CometKeyboardController.key_map[key];
			if (!piano_key) {
				return;
			}
			const osc_frequency = CometKeyboardController.piano_keys[piano_key.toString()];
			const osc_velocity = 0.5;
			t.#on_start(control_id, osc_frequency, osc_velocity);
		}
	}

	stop(key) {
		const t = this;
		if (t.#on_stop) {
			t.#on_stop(`key_${key}`);
		}
	}

	static key_map = {
		KeyA: 40,
		KeyW: 41,
		KeyS: 42,
		KeyE: 43,
		KeyD: 44,
		KeyF: 45,
		KeyT: 46,
		KeyG: 47,
		KeyY: 48,
		KeyH: 49,
		KeyU: 50,
		KeyJ: 51,
		KeyK: 52,
		KeyO: 53,
		KeyL: 54,
		KeyP: 55
	};

	static piano_keys = {
		1: 27.5,
		2: 29.13524,
		3: 30.86771,
		4: 32.7032,
		5: 34.64783,
		6: 36.7081,
		7: 38.89087,
		8: 41.20344,
		9: 43.65353,
		10: 46.2493,
		11: 48.99943,
		12: 51.91309,
		13: 55,
		14: 58.27047,
		15: 61.73541,
		16: 65.40639,
		17: 69.29566,
		18: 73.41619,
		19: 77.78175,
		20: 82.40689,
		21: 87.30706,
		22: 92.49861,
		23: 97.99886,
		24: 103.8262,
		25: 110,
		26: 116.5409,
		27: 123.4708,
		28: 130.8128,
		29: 138.5913,
		30: 146.8324,
		31: 155.5635,
		32: 164.8138,
		33: 174.6141,
		34: 184.9972,
		35: 195.9977,
		36: 207.6523,
		37: 220,
		38: 233.0819,
		39: 246.9417,
		40: 261.6256,
		41: 277.1826,
		42: 293.6648,
		43: 311.127,
		44: 329.6276,
		45: 349.2282,
		46: 369.9944,
		47: 391.9954,
		48: 415.3047,
		49: 440,
		50: 466.1638,
		51: 493.8833,
		52: 523.2511,
		53: 554.3653,
		54: 587.3295,
		55: 622.254,
		56: 659.2551,
		57: 698.4565,
		58: 739.9888,
		59: 783.9909,
		60: 830.6094,
		61: 880,
		62: 932.3275,
		63: 987.7666,
		64: 1046.502,
		65: 1108.731,
		66: 1174.659,
		67: 1244.508,
		68: 1318.51,
		69: 1396.913,
		70: 1479.978,
		71: 1567.982,
		72: 1661.219,
		73: 1760,
		74: 1864.655,
		75: 1975.533,
		76: 2093.005,
		77: 2217.461,
		78: 2349.318,
		79: 2489.016,
		80: 2637.02,
		81: 2793.826,
		82: 2959.955,
		83: 3135.963,
		84: 3322.438,
		85: 3520,
		86: 3729.31,
		87: 3951.066,
		88: 4186.009,
		89: 16.3516,
		90: 17.32391,
		91: 18.35405,
		92: 19.44544,
		93: 20.60172,
		94: 21.82676,
		95: 23.12465,
		96: 24.49971,
		97: 25.95654,
		98: 4434.922,
		99: 4698.636,
		100: 4978.032,
		101: 5274.041,
		102: 5587.652,
		103: 5919.911,
		104: 6271.927,
		105: 6644.875,
		106: 7040,
		107: 7458.62,
		108: 7902.133
	};
}

export { CometKeyboardController };
