import { getHandlePermisions } from './permissions.ts';

const IDB_DATABASE = '0ae297cf-5989-46b8-adc9-dbb7f5806087';
const IDB_VERSION = 1;
const IDB_STORE = 'handles';

export function checkPickersAvailability() {
	const isOpenPickerAvailable = 'showOpenFilePicker' in window;
	const isSavePickerAvailable = 'showSaveFilePicker' in window;
	const isDirectoryPickerAvailable = 'showDirectoryPicker' in window;

	return {
		openFile: isOpenPickerAvailable,
		saveFile: isSavePickerAvailable,
		dir: isDirectoryPickerAvailable,
		all: isOpenPickerAvailable && isSavePickerAvailable && isDirectoryPickerAvailable
	};
}

export async function getUserOpenFileHandle(options: OpenFilePickerOptions = {}, permissions: FileSystemPermissionMode = 'read') {
	try {
		const [handle] = await window.showOpenFilePicker(options);

		if (!handle) {
			return undefined;
		}

		await getHandlePermisions(handle, permissions);

		return handle;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return undefined;
		}

		throw error;
	}
}

export async function getUserSaveFileHandle(options: SaveFilePickerOptions = {}) {
	try {
		const handle = await window.showSaveFilePicker(options);

		await getHandlePermisions(handle, 'readwrite');

		return handle;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return undefined;
		}

		throw error;
	}
}

export async function getUserDirHandle(options: DirectoryPickerOptions = {}, permissions: FileSystemPermissionMode = 'readwrite') {
	try {
		const handle = await window.showDirectoryPicker(options);

		await getHandlePermisions(handle, permissions);

		return handle;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return undefined;
		}

		throw error;
	}
}

export async function saveHandle(id: string, handle: FileSystemHandle) {
	return new Promise<void>((resolve, reject) => {
		// oxlint-disable typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
		const openRequest = indexedDB.open(IDB_DATABASE, IDB_VERSION);

		openRequest.addEventListener('upgradeneeded', (event) => {
			const idb = (event.target as IDBOpenDBRequest).result;

			if (!idb.objectStoreNames.contains(IDB_STORE)) {
				idb.createObjectStore(IDB_STORE);
			}
		});

		openRequest.addEventListener('success', (event) => {
			const idb = (event.target as IDBOpenDBRequest).result;
			const transaction = idb.transaction(IDB_STORE, 'readwrite');
			const store = transaction.objectStore(IDB_STORE);
			const putRequest = store.put(handle, id);

			putRequest.addEventListener('success', () => resolve());
			putRequest.addEventListener('error', () => reject(putRequest.error ?? new Error('Failed to save handle on IndexedDB')));
		});

		openRequest.addEventListener('error', () => reject(openRequest.error ?? new Error('Failed to open IndexedDB')));
		// oxlint-enable typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
	});
}

export async function getHandle(id: string) {
	return new Promise<FileSystemHandle | undefined>((resolve, reject) => {
		// oxlint-disable typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
		const openRequest = indexedDB.open(IDB_DATABASE, IDB_VERSION);

		openRequest.addEventListener('upgradeneeded', (event) => {
			const idb = (event.target as IDBOpenDBRequest).result;

			if (!idb.objectStoreNames.contains(IDB_STORE)) {
				idb.createObjectStore(IDB_STORE);
			}
		});

		openRequest.addEventListener('success', (event) => {
			const idb = (event.target as IDBOpenDBRequest).result;
			const transaction = idb.transaction(IDB_STORE, 'readonly');
			const store = transaction.objectStore(IDB_STORE);
			const getRequest = store.get(id);

			getRequest.addEventListener('success', () => resolve(getRequest.result as FileSystemHandle | undefined));
			getRequest.addEventListener('error', () => reject(getRequest.error ?? new Error('Failed to get handle from IndexedDB')));
		});

		openRequest.addEventListener('error', () => reject(openRequest.error ?? new Error('Failed to open IndexedDB')));
		// oxlint-enable typescript/consistent-type-assertions, typescript/no-unsafe-type-assertion
	});
}
