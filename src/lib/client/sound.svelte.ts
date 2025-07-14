import os from '$lib/os.svelte';

const context = new AudioContext();

export default class Sound {
	private url: string;
	private buffer: AudioBuffer | null = null;
	private sources: AudioBufferSourceNode[] = [];

	private constructor(url: string) {
		this.url = url;
	}

	static load(url: string) {
		const sound = new Sound(url);
		if (sound.buffer) return Promise.resolve(sound.buffer);
		return new Promise((resolve, reject) => {
			fetch(sound.url, {
				method: 'GET',
				headers: { 'Content-Type': 'audio/mpeg' }
			}).then(response => response.arrayBuffer()).then(async buffer => {
				sound.buffer = await context.decodeAudioData(buffer);
				resolve(sound);
			}).catch(err => {
				console.log('Sound fetch error:', err);
				reject(err);
			});
		});
	}

	play(volume = 1, time = 0) {
		if (!this.buffer) return;
		const source = context.createBufferSource();
		source.buffer = this.buffer;
		const insertedAt = this.sources.push(source) - 1;
		source.onended = () => {
			source.stop(0);
			this.sources.splice(insertedAt, 1);
		};
		const gainNode = context.createGain();
		gainNode.gain.value = os.isMuted ? 0 : volume * os.volume;
		source.connect(gainNode).connect(context.destination);
		source.start(time);
	}

	stop() {
		this.sources.forEach((source) => {
			source.stop(0);
		});
		this.sources = [];
	}
}
