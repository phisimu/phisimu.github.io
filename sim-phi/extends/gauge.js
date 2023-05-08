export default hook.define({
	name: 'Gauge',
	description: 'Apply gauge',
	contents: [{
		type: 'config',
		meta: ['启用风暴收集条', callback]
	}]
});
/**
 * @param {HTMLInputElement} checkbox
 * @param {HTMLDivElement} container
 */
function callback(checkbox, container) {
	const status = hook.status;
	checkbox.addEventListener('change', function() {
		if (!this.checked) {
			hook.now.delete('gauge');
			hook.after.delete('gauge');
		} else {
			hook.now.set('gauge', calcGauge);
			hook.after.set('gauge', drawGauge);
		}
	});
	status.reg('enableGauge', checkbox);
}
const flags = [null, 0, 0, 0, 0, 0, 0, 0];
let factor = 0;
let lastTime = 0;

function initGauge() {
	const chart = hook.app.chart;
	gauge.reset();
	const factor = calcGaugeFactor(chart.numOfNotes, hook.stat.level >= 16);
	gauge.speedInit = -factor * chart.numOfNotes / (hook.app.bgMusic.duration + 0.5);
	console.log('initGauge');
	flags[0] = chart;
	for (let i = 1; i < 8; i++) flags[i] = hook.stat.noteRank[i];
	return factor;
}

function calcGauge(time) {
	if (flags[0] !== hook.app.chart) factor = initGauge();
	const { stat } = hook;
	const { noteRank } = stat;
	if (noteRank[6] > flags[6]) gauge.speed2 -= 18;
	// if (noteRank[7] > flags[7]) gauge.speed += 0;
	if (noteRank[5] > flags[5]) gauge.speed += factor * (noteRank[5] - flags[5]);
	if (noteRank[4] > flags[4]) gauge.speed += factor * (noteRank[4] - flags[4]) * 2;
	if (noteRank[1] > flags[1]) gauge.speed += factor * (noteRank[1] - flags[1]);
	// if (noteRank[3] > flags[3]) gauge.speed += 0;
	if (noteRank[2] > flags[2]) gauge.speed2 -= 18;
	for (let i = 1; i < 8; i++) flags[i] = hook.stat.noteRank[i];
	gauge.tick(time - lastTime);
	lastTime = time;
}

function drawGauge() {
	const { stat } = hook;
	const gaugeValue = gauge.value / 100;
	drawGaugeBar('#3f3b71', 1); //v
	drawGaugeBar('#ea4cd6', gaugeValue); //s
}

function drawGaugeBar(c, p) {
	const { app: { ctxos, canvasos, lineScale } } = hook;
	ctxos.fillStyle = c;
	ctxos.fillRect(canvasos.width / 2 - lineScale * 6 * clip(p), lineScale * 0.2, lineScale * 12 * clip(p), lineScale * 0.2);
}

function clip(num) {
	if (num < 0) return 0;
	if (num > 1) return 1;
	return num;
}

function calcGaugeFactor(numOfNotes, isHard) {
	let speed = 0;
	if (numOfNotes < 400) speed = 80 / numOfNotes + 0.2;
	else if (numOfNotes < 600) speed = 32 / numOfNotes + 0.2;
	else speed = 96 / numOfNotes + 0.08;
	if (isHard) speed *= 0.8;
	return speed;
}
const gauge = {
	value: 100,
	speedInit: 0,
	speed: 0,
	speed2: 0,
	factor: 0.5,
	factor2: Math.SQRT1_2,
	dead: false,
	tick(deltaTime) {
		if (this.dead) return;
		this.value += this.speedInit * deltaTime;
		this.value += this.speed * (1 - this.factor ** deltaTime);
		this.value += this.speed2 * (1 - this.factor2 ** deltaTime);
		this.value = Math.min(100, this.value);
		if (this.value <= 0) this.dead = true;
		this.speed *= this.factor ** deltaTime;
		this.speed2 *= this.factor2 ** deltaTime;
	},
	reset() {
		this.value = 100;
		this.speedInit = 0;
		this.speed = 0;
		this.speed2 = 0;
		this.factor = 0.5;
		this.factor2 = Math.SQRT1_2;
		this.dead = false;
	}
};
hook.gauge = gauge;
//a={a:100,v:0,p:0.2};setInterval(()=>{a.a+=a.v*a.p;a.v*=(1-a.p);console.log(a.a)},100);