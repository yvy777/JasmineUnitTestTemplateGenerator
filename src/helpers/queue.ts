export class Queue<T> {
	_store: T[] = [];
	push(val: T): void {
		this._store.push(val);
	}
	pop(): T | undefined {
		return this._store.shift();
	}
	count(): number {
		return this._store.length;
	}
}