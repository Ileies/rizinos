// Definition der erlaubten Types
export type ClipboardType = 'unknown' | 'text' | 'image' | 'json' | 'file';

// Basisinterface für Clipboard-Einträge
export interface ClipboardEntry<T = unknown> {
	type: ClipboardType;
	data: T;
}

// Stack-Interface
interface Stack<T> {
	readonly size: number;

	push(item: T): void;

	pop(): T | undefined;

	peek(): T | undefined;
}

/**
 * Singleton ClipboardHistory, implementiert als Stack mit Navigationsfunktionen
 * und Unterstützung für verschiedene Datentypen
 */
export class ClipboardHistory implements Stack<ClipboardEntry> {
	private static readonly MAX_ITEMS = 16;
	private static instance: ClipboardHistory | null = null;

	private stack: ClipboardEntry[] = [];
	private pointer = -1;

	// Private Konstruktor für Singleton-Pattern
	private constructor() {
		return;
	}

	get size(): number {
		return this.stack.length;
	}

	/**
	 * Gibt das aktuelle Element zurück
	 */
	get current(): ClipboardEntry | undefined {
		return this.peek();
	}

	/**
	 * Gibt den Typ des aktuellen Elements zurück
	 */
	get type(): ClipboardType | undefined {
		return this.current?.type;
	}

	/**
	 * Gibt die Daten des aktuellen Elements zurück
	 */
	get data(): unknown {
		return this.current?.data;
	}

	/**
	 * Gibt die einzige Instanz der ClipboardHistory zurück
	 */
	public static getInstance(): ClipboardHistory {
		if (!ClipboardHistory.instance) {
			ClipboardHistory.instance = new ClipboardHistory();
		}
		return ClipboardHistory.instance;
	}

	// Stack-Interface Implementierung
	push(entry: ClipboardEntry): void {
		// Limit Stack-Größe
		if (this.stack.length >= ClipboardHistory.MAX_ITEMS) {
			this.stack.shift();
		}

		// Alles nach dem aktuellen Pointer abschneiden, wenn wir
		// innerhalb der Geschichte navigiert haben
		if (this.pointer !== -1 && this.pointer < this.stack.length - 1) {
			this.stack = this.stack.slice(0, this.pointer + 1);
		}

		this.stack.push(entry);
		this.pointer = this.stack.length - 1;
	}

	pop(): ClipboardEntry | undefined {
		if (this.stack.length === 0) return undefined;

		const item = this.stack.pop();
		this.pointer = Math.max(-1, this.stack.length - 1);
		return item;
	}

	peek(): ClipboardEntry | undefined {
		if (this.pointer < 0 || this.stack.length === 0) return undefined;
		return this.stack[this.pointer];
	}

	// Navigation methods
	previous(): boolean {
		if (this.pointer > 0) {
			this.pointer--;
			return true;
		}
		return false;
	}

	next(): boolean {
		if (this.pointer < this.stack.length - 1) {
			this.pointer++;
			return true;
		}
		return false;
	}

	/**
	 * Fügt Daten zum Clipboard hinzu und bestimmt automatisch den Typ
	 * @param data Die zu speichernden Daten
	 * @param type Der explizite MIME-Type (optional)
	 */
	add<T>(data: T, type?: ClipboardType): void {
		// Typ automatisch bestimmen, wenn nicht explizit angegeben
		let determinedType: ClipboardType;

		if (type) {
			determinedType = type;
		} else {
			// Automatische Typbestimmung basierend auf dem Datentyp
			if (data === null) {
				determinedType = 'null';
			} else if (typeof data === 'string') {
				determinedType = 'text';
			} else if (typeof data === 'object') {
				if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
					determinedType = 'unknown';
				} else if (data instanceof Blob) {
					determinedType = data.type || 'unknown';
				} else if (data instanceof File) {
					determinedType = data.type || 'unknown';
				} else if (data instanceof ReadableStream) {
					determinedType = 'application/stream';
				} else if (Array.isArray(data)) {
					determinedType = 'application/json+array';
				} else {
					determinedType = 'application/json+object';
				}
			} else if (typeof data === 'number') {
				determinedType = 'text/plain+number';
			} else if (typeof data === 'boolean') {
				determinedType = 'text/plain+boolean';
			} else {
				determinedType = `unknown/${typeof data}`;
			}
		}

		// Eintrag erstellen und hinzufügen
		const entry: ClipboardEntry<T> = {
			type: determinedType,
			data
		};

		this.push(entry);
	}

	/**
	 * Gibt alle Daten eines bestimmten Typs zurück
	 * @param type Der gesuchte MIME-Type
	 */
	getAllByType(type: ClipboardType): ClipboardEntry[] {
		return this.stack.filter(entry => entry.type === type);
	}

	/**
	 * Prüft, ob der aktuelle Eintrag einen bestimmten Typ hat
	 * @param type Der zu prüfende Typ
	 */
	hasType(type: ClipboardType): boolean {
		return this.current?.type === type;
	}

	/**
	 * Gibt das aktuelle Element mit typisierten Daten zurück
	 * @template T Der erwartete Datentyp
	 */
	getCurrentAs<T>(): T | undefined {
		return this.current?.data as T | undefined;
	}

	/**
	 * Löscht alle Einträge aus der Historie
	 */
	clear(): void {
		this.stack = [];
		this.pointer = -1;
	}

	/**
	 * Implementiert das Iterator-Protokoll für die ClipboardHistory
	 */
	[Symbol.iterator](): Iterator<ClipboardEntry> {
		return this.stack[Symbol.iterator]();
	}

	/**
	 * Gibt alle Einträge als Array zurück
	 */
	toArray(): ClipboardEntry[] {
		return this.stack;
	}
}

/**
 * Convenience-Funktion, um das globale Clipboard zu erhalten
 */
export function getClipboard(): ClipboardHistory {
	return ClipboardHistory.getInstance();
}

// Beispielverwendung:
// const clipboard = getClipboard();
// clipboard.add("Hello, world!", "text/plain");
// clipboard.add({ name: "John", age: 30 });
// clipboard.add(new Uint8Array([1, 2, 3]));
// 
// if (clipboard.hasType("text/plain")) {
//   const text = clipboard.getCurrentAs<string>();
//   console.log(text); // "Hello, world!"
// }