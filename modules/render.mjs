class CometRender {
	constructor(canvas, analyzer_node) {
		const t = this;
		t.running = false;
		t.node = analyzer_node;
		t.type = 'spectrum_1';
		t.paper = new Palette(canvas);
		t.hue = 0;
		t.pointers = new Map();
	}

	start() {
		const t = this;
		t.running = true;
		t.frame_request = requestAnimationFrame(function (timestamp) { t.render(timestamp); });
	}

	stop() {
		this.running = false;
		cancelAnimationFrame(this.frame_request);
		delete this.frame_request;
	}

	resize(w, h) {
		this.paper.size(w, h);
	}

	add_pointer(e) {
		const t = this;
		if (!t.pointers.has(e.pointerId)) {
			t.pointers.set(e.pointerId, e);
		}
	}

	update_pointer(e) {
		const t = this;
		if (t.pointers.has(e.pointerId)) {
			t.pointers.set(e.pointerId, e);
		}
	}

	remove_pointer(e) {
		const t = this;
		if (t.pointers.has(e.pointerId)) {
			t.pointers.delete(e.pointerId, e);
		}
	}

	render(timestamp) {
		const t = this;
		if (!t.running) {
			return;
		}
		t.paper.clear();
		if (t.type === 'spectrum_1') {
			const array = new Uint8Array(t.node.frequencyBinCount);
			t.node.getByteFrequencyData(array);
			const degIncrement = 360 / array.length;
			const centerX = t.paper.width / 2;
			const centerY = t.paper.height / 2;
			const circleR = 80;
			const maxLength = circleR * 3;
			for (let i = 0; i < array.length; ++i) {
				const angle = ((i * degIncrement) * Math.PI) / 180;
				const preX = Math.cos(angle);
				const preY = Math.sin(angle);
				const barValue = (array[i] * maxLength / 512) + circleR;
				t.paper.line({
					x1: centerX + preX * circleR,
					y1: centerY + preY * circleR,
					x2: centerX + preX * barValue,
					y2: centerY + preY * barValue,
					stroke: `hsl(${i * 360 / array.length}, 100%, 50%)`,
					join: 'miter',
					thickness: 1
				});
			}
		} else if (t.type === 'spectrum_2') {
			const array = new Uint8Array(t.node.frequencyBinCount);
			t.node.getByteFrequencyData(array);
			const degIncrement = 360 / array.length;
			const centerX = t.paper.width / 2;
			const centerY = t.paper.height / 2;
			const circleR = 240;
			const maxLength = circleR;
			for (let i = 0; i < array.length; ++i) {
				const angle = ((i * degIncrement) * Math.PI) / 180;
				const preX = Math.cos(angle);
				const preY = Math.sin(angle);
				const barValue = -(array[i] * maxLength / 512) + circleR;
				t.paper.line({
					x1: centerX + preX * circleR,
					y1: centerY + preY * circleR,
					x2: centerX + preX * barValue,
					y2: centerY + preY * barValue,
					stroke: `hsl(${i * 360 / array.length}, 100%, 50%)`,
					join: 'miter',
					thickness: 1
				});
			}
		} else if (t.type === 'spectrum_3') {
			const array = new Uint8Array(t.node.frequencyBinCount);
			t.node.getByteFrequencyData(array);
			const gap = t.paper.width / (array.length * 2);
			const max_height = t.paper.height / 4 * 3;
			for (let i = 0; i < array.length; ++i) {
				const newy = t.paper.height - (max_height * array[i] / 256);
				t.paper.rect({
					x: i * (gap * 2),
					y: newy,
					width: gap,
					height: t.paper.height,
					fill: `hsl(${i * 360 / array.length}, 100%, 50%)`
				});
			}
		} else if (t.type === 'waveshape_1' || t.type === 'waveshape_2') {
			const array = new Uint8Array(t.node.frequencyBinCount);
			t.node.getByteTimeDomainData(array);
			t.hue = t.hue + 0.5 > 360 ? 0 : t.hue + 0.5;
			if (t.type === 'waveshape_1') {
				t.paper.style({ stroke: `hsl(${t.hue}, 100%, 50%)`, thickness: 5 });
			} else if (t.type === 'waveshape_2') {
				t.paper.style({ fill: `hsl(${t.hue}, 100%, 50%)`, thickness: 5 });
			}
			t.paper.context.beginPath();
			const sliceWidth = t.paper.width / array.length;
			let x = 0;
			for (let i = 0; i < array.length; ++i) {
				const y = (array[i] / 128) * t.paper.height / 2;
				if (i === 0) {
					t.paper.context.moveTo(x, y);
				} else {
					t.paper.context.lineTo(x, y);
				}
				x += sliceWidth;
			}
			if (t.type === 'waveshape_1') {
				t.paper.context.stroke();
			} else if (t.type === 'waveshape_2') {
				t.paper.context.lineTo(t.paper.width, t.paper.height);
				t.paper.context.lineTo(0, t.paper.height);
				t.paper.context.fill();
			}
		} else if (t.type === 'pointers') {
			t.hue = t.hue + 0.5 > 360 ? 0 : t.hue + 0.5;
			t.pointers.forEach(function (e) {
				t.paper.circle({
					x: e.pageX,
					y: e.pageY,
					r: 100,
					stroke: `hsl(${t.hue}, 100%, 50%)`,
					thickness: 5
				});
			});
		}
		if (t.running) {
			t.frame_request = requestAnimationFrame(function (timestamp) { t.render(timestamp); });
		}
	}
}

export { CometRender };
