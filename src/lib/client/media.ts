export async function getVideo(constraints: MediaStreamConstraints = {
	video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { min: 30 } },
	audio: true
}): Promise<MediaRecorder> {
	try {
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		const recorder = new MediaRecorder(stream);
		recorder.start();
		return recorder;
	} catch (error) {
		console.error('Error getting video stream:', error);
		throw error;
	}
}

export async function getScreen(): Promise<MediaRecorder> {
	try {
		const stream = await navigator.mediaDevices.getDisplayMedia({
			audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
			video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 40 } }
		});
		const recorder = new MediaRecorder(stream);
		recorder.start();
		return recorder;
	} catch (error) {
		console.error('Error getting screen stream:', error);
		throw error;
	}
}

export function saveRecord(recorder: MediaRecorder): Promise<string> {
	return new Promise((resolve, reject) => {
		recorder.ondataavailable = e => {
			resolve(URL.createObjectURL(new Blob([e.data], { type: 'video/webm' })));
		};
		recorder.onerror = reject;
	});
}

export function takePicture(videoElement: HTMLVideoElement): string | null {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) return null;
	canvas.width = videoElement.width;
	canvas.height = videoElement.height;
	context.drawImage(videoElement, 0, 0, videoElement.width, videoElement.height);
	return canvas.toDataURL('image/png');
}

export function snapshot(videoElement: HTMLVideoElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): string {
	canvas.width = videoElement.videoWidth;
	canvas.height = videoElement.videoHeight;
	context.drawImage(videoElement, 0, 0);
	return canvas.toDataURL('image/png');
}